<?php
// backend/api/attendance.php

if (!isset($db) || !isset($route) || !isset($user)) {
    exit('Direct access not allowed');
}

require_once __DIR__ . '/../services/FaceVerificationService.php';
require_once __DIR__ . '/../services/LivenessDetectionService.php';

$action = str_replace('/api/attendance/', '', $route);
$employee_id = $user['employee_id'];

function apiResponse($code, $data) {
    http_response_code($code);
    echo json_encode($data);
    exit();
}

// Distance helper using Haversine formula
function calculateDistance($lat1, $lon1, $lat2, $lon2) {
    $earthRadius = 6371000; // in meters
    $dLat = deg2rad($lat2 - $lat1);
    $dLon = deg2rad($lon2 - $lon1);

    $a = sin($dLat / 2) * sin($dLat / 2) +
         cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
         sin($dLon / 2) * sin($dLon / 2);
    $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
    
    return $earthRadius * $c; // distance in meters
}

// Image compression and save helper
function saveAndCompressPhoto($photoInput, $employee_id, $actionType) {
    $uploadDir = __DIR__ . '/../uploads/attendance/';
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    $fileName = $actionType . '_' . $employee_id . '_' . time() . '_' . bin2hex(random_bytes(4)) . '.jpg';
    $targetPath = $uploadDir . $fileName;

    // Check if base64 or file upload
    $tempFile = null;
    if (strpos($photoInput, 'data:image') === 0) {
        // Base64 format
        $dataParts = explode(',', $photoInput);
        if (count($dataParts) < 2) {
            return false;
        }
        $decodedData = base64_decode($dataParts[1]);
        if ($decodedData === false) {
            return false;
        }
        $tempFile = tempnam(sys_get_temp_dir(), 'att_photo');
        file_put_contents($tempFile, $decodedData);
    } else {
        // Assume file upload via multipart/form-data
        if (!isset($_FILES['photo']) || $_FILES['photo']['error'] !== UPLOAD_ERR_OK) {
            return false;
        }
        $tempFile = $_FILES['photo']['tmp_name'];
    }

    // Validate image mime-type
    $imageInfo = @getimagesize($tempFile);
    if ($imageInfo === false) {
        if ($tempFile && file_exists($tempFile) && strpos($photoInput, 'data:image') === 0) {
            unlink($tempFile);
        }
        return false;
    }

    $allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!in_array($imageInfo['mime'], $allowedMimeTypes)) {
        if ($tempFile && file_exists($tempFile) && strpos($photoInput, 'data:image') === 0) {
            unlink($tempFile);
        }
        return false;
    }

    // Try GD image compression
    $compressed = false;
    if (extension_loaded('gd')) {
        try {
            if ($imageInfo['mime'] === 'image/png') {
                $srcImage = @imagecreatefrompng($tempFile);
            } else {
                $srcImage = @imagecreatefromjpeg($tempFile);
            }

            if ($srcImage) {
                // Compress and convert to JPEG
                $compressed = @imagejpeg($srcImage, $targetPath, 75);
                imagedestroy($srcImage);
            }
        } catch (Exception $e) {
            $compressed = false;
        }
    }

    // Fallback if GD is disabled or failed
    if (!$compressed) {
        if (strpos($photoInput, 'data:image') === 0) {
            $compressed = copy($tempFile, $targetPath);
        } else {
            $compressed = move_uploaded_file($tempFile, $targetPath);
        }
    }

    // Clean up base64 temp file
    if ($tempFile && file_exists($tempFile) && strpos($photoInput, 'data:image') === 0) {
        unlink($tempFile);
    }

    return $compressed ? 'uploads/attendance/' . $fileName : false;
}

// -------------------------------------------------------------
// GET /api/attendance/today
// -------------------------------------------------------------
if ($action === 'today') {
    try {
        $today = date('Y-m-d');
        $stmt = $db->prepare("SELECT * FROM attendance WHERE employee_id = ? AND date = ?");
        $stmt->execute([$employee_id, $today]);
        $record = $stmt->fetch();
        apiResponse(200, ['attendance' => $record ? $record : null]);
    } catch (Exception $e) {
        apiResponse(500, ['error' => 'Failed to retrieve today\'s attendance status', 'details' => $e->getMessage()]);
    }
}

// -------------------------------------------------------------
// GET /api/attendance/history
// -------------------------------------------------------------
elseif ($action === 'history') {
    try {
        // Return logs from the past 30 days
        $stmt = $db->prepare("SELECT * FROM attendance WHERE employee_id = ? ORDER BY date DESC LIMIT 30");
        $stmt->execute([$employee_id]);
        $history = $stmt->fetchAll();
        apiResponse(200, ['history' => $history]);
    } catch (Exception $e) {
        apiResponse(500, ['error' => 'Failed to retrieve attendance history', 'details' => $e->getMessage()]);
    }
}

// -------------------------------------------------------------
// POST /api/attendance/checkin
// -------------------------------------------------------------
elseif ($action === 'checkin') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        apiResponse(405, ['error' => 'Method not allowed']);
    }

    // Parse input (supports both application/json and multipart/form-data)
    $inputData = json_decode(file_get_contents('php://input'), true) ?? [];
    $photoInput = $inputData['photo'] ?? $_POST['photo'] ?? '';
    $latitude = (float)($inputData['latitude'] ?? $_POST['latitude'] ?? 0);
    $longitude = (float)($inputData['longitude'] ?? $_POST['longitude'] ?? 0);
    $accuracy = (float)($inputData['gps_accuracy'] ?? $_POST['gps_accuracy'] ?? 0);
    $is_wfh = (int)($inputData['is_wfh'] ?? $_POST['is_wfh'] ?? 0);

    // Client metadata
    $browser = $inputData['browser'] ?? $_POST['browser'] ?? 'Unknown Browser';
    $os = $inputData['operating_system'] ?? $_POST['operating_system'] ?? 'Unknown OS';
    $device = $inputData['device_name'] ?? $_POST['device_name'] ?? 'Unknown Device';
    $network = $inputData['network_type'] ?? $_POST['network_type'] ?? 'Unknown Network';
    $battery = isset($inputData['battery_level']) ? (float)$inputData['battery_level'] : (isset($_POST['battery_level']) ? (float)$_POST['battery_level'] : null);
    $ip_address = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';

    if (empty($photoInput) && (!isset($_FILES['photo']))) {
        apiResponse(400, ['error' => 'Live selfie photo capture is required.']);
    }

    try {
        $today = date('Y-m-d');

        // Prevent duplicate check-in
        $dupCheck = $db->prepare("SELECT id FROM attendance WHERE employee_id = ? AND date = ?");
        $dupCheck->execute([$employee_id, $today]);
        if ($dupCheck->fetch()) {
            apiResponse(400, ['error' => 'You have already checked in today.']);
        }

        // Fetch Employee branch and company info
        $empQuery = $db->prepare("SELECT branch_id, company_id FROM employees WHERE id = ?");
        $empQuery->execute([$employee_id]);
        $empInfo = $empQuery->fetch();
        if (!$empInfo) {
            apiResponse(404, ['error' => 'Employee profile not found.']);
        }
        $company_id = $empInfo['company_id'];
        $branch_id = $empInfo['branch_id'];

        // Geofencing verification
        $distance = 0.0;
        $gps_verified = 0;
        if ($is_wfh === 0) {
            if (!$branch_id) {
                apiResponse(400, ['error' => 'No branch geofence configured for your profile.']);
            }
            $branchQuery = $db->prepare("SELECT latitude, longitude, radius_meters FROM branches WHERE id = ?");
            $branchQuery->execute([$branch_id]);
            $branch = $branchQuery->fetch();

            if (!$branch) {
                apiResponse(400, ['error' => 'Configured office branch not found.']);
            }

            $distance = calculateDistance($latitude, $longitude, (float)$branch['latitude'], (float)$branch['longitude']);
            $allowedRadius = (int)$branch['radius_meters'];

            if ($distance > $allowedRadius) {
                // Allow check-in from any location but mark gps_verified = 0
                $gps_verified = 0;
            } else {
                $gps_verified = 1;
            }
        } else {
            // WFH bypasses radius checks
            $gps_verified = 1;
        }

        // Process and compress photo
        $photoPath = saveAndCompressPhoto($photoInput, $employee_id, 'checkin');
        if (!$photoPath) {
            apiResponse(400, ['error' => 'Invalid photo capture upload. Please capture again.']);
        }

        // Run cognitive face verification service against employee avatar (placeholder)
        // Load employee avatar if exists
        $avatarQuery = $db->prepare("SELECT u.avatar FROM employees e JOIN users u ON e.user_id = u.id WHERE e.id = ?");
        $avatarQuery->execute([$employee_id]);
        $avatar = $avatarQuery->fetchColumn();
        $referencePhoto = $avatar ? '../' . $avatar : null;

        $faceResult = FaceVerificationService::verifyFace(__DIR__ . '/../' . $photoPath, $referencePhoto);
        $livenessResult = LivenessDetectionService::detectLiveness(__DIR__ . '/../' . $photoPath);

        // Check-in status determination (Late if checkin is after 09:15)
        $time = date('H:i');
        $status = 'Present';
        if (strtotime($time) > strtotime('09:15')) {
            $status = 'Late';
        }

        // Write Check In record
        $db->beginTransaction();

        $stmt = $db->prepare("INSERT INTO attendance (
            employee_id, company_id, branch_id, date, clock_in, clock_in_photo,
            clock_in_lat, clock_in_lng, clock_in_distance, clock_in_gps_accuracy,
            clock_in_browser, clock_in_os, clock_in_device, clock_in_ip, clock_in_network, clock_in_battery,
            clock_in_face_score, clock_in_face_verified, clock_in_liveness_score, clock_in_liveness_verified,
            clock_in_gps_verified, status, is_wfh, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)");

        $stmt->execute([
            $employee_id, $company_id, $branch_id, $today, $time, $photoPath,
            $latitude, $longitude, $distance, $accuracy,
            $browser, $os, $device, $ip_address, $network, $battery,
            $faceResult['face_match_score'], (int)$faceResult['face_verified'],
            $livenessResult['liveness_score'], (int)$livenessResult['liveness_verified'],
            $gps_verified, $status, $is_wfh
        ]);

        $attendance_id = $db->lastInsertId();

        // Write Audit Log
        $logStmt = $db->prepare("INSERT INTO attendance_logs (
            attendance_id, employee_id, action, timestamp, latitude, longitude, distance,
            browser, device, ip_address, photo, status, remarks
        ) VALUES (?, ?, 'Check In', CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

        $logStmt->execute([
            $attendance_id, $employee_id, $latitude, $longitude, $distance,
            $browser, $device, $ip_address, $photoPath, $status,
            "Clock-in logged successfully with Face & GPS check."
        ]);

        $db->commit();

        apiResponse(201, [
            'message' => 'Check-in recorded successfully.',
            'clock_in_time' => $time,
            'status' => $status,
            'face_match_score' => $faceResult['face_match_score'],
            'liveness_score' => $livenessResult['liveness_score'],
            'distance_meters' => round($distance, 1)
        ]);

    } catch (Exception $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        apiResponse(500, ['error' => 'Database process failed during check-in', 'details' => $e->getMessage()]);
    }
}

// -------------------------------------------------------------
// POST /api/attendance/checkout
// -------------------------------------------------------------
elseif ($action === 'checkout') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        apiResponse(405, ['error' => 'Method not allowed']);
    }

    $inputData = json_decode(file_get_contents('php://input'), true) ?? [];
    $photoInput = $inputData['photo'] ?? $_POST['photo'] ?? '';
    $latitude = (float)($inputData['latitude'] ?? $_POST['latitude'] ?? 0);
    $longitude = (float)($inputData['longitude'] ?? $_POST['longitude'] ?? 0);
    $accuracy = (float)($inputData['gps_accuracy'] ?? $_POST['gps_accuracy'] ?? 0);

    // Client metadata
    $browser = $inputData['browser'] ?? $_POST['browser'] ?? 'Unknown Browser';
    $os = $inputData['operating_system'] ?? $_POST['operating_system'] ?? 'Unknown OS';
    $device = $inputData['device_name'] ?? $_POST['device_name'] ?? 'Unknown Device';
    $network = $inputData['network_type'] ?? $_POST['network_type'] ?? 'Unknown Network';
    $battery = isset($inputData['battery_level']) ? (float)$inputData['battery_level'] : (isset($_POST['battery_level']) ? (float)$_POST['battery_level'] : null);
    $ip_address = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';

    if (empty($photoInput) && (!isset($_FILES['photo']))) {
        apiResponse(400, ['error' => 'Live selfie photo capture is required.']);
    }

    try {
        $today = date('Y-m-d');

        // Check if checked in today
        $attCheck = $db->prepare("SELECT * FROM attendance WHERE employee_id = ? AND date = ?");
        $attCheck->execute([$employee_id, $today]);
        $attendance = $attCheck->fetch();

        if (!$attendance) {
            apiResponse(400, ['error' => 'You must check in first before checking out.']);
        }

        if (!empty($attendance['clock_out'])) {
            apiResponse(400, ['error' => 'You have already checked out today.']);
        }

        $company_id = $attendance['company_id'];
        $branch_id = $attendance['branch_id'];
        $is_wfh = (int)$attendance['is_wfh'];

        // Geofencing verification
        $distance = 0.0;
        $gps_verified = 0;
        if ($is_wfh === 0) {
            if (!$branch_id) {
                apiResponse(400, ['error' => 'No branch geofence parameters stored in check-in session.']);
            }
            $branchQuery = $db->prepare("SELECT latitude, longitude, radius_meters FROM branches WHERE id = ?");
            $branchQuery->execute([$branch_id]);
            $branch = $branchQuery->fetch();

            if (!$branch) {
                apiResponse(400, ['error' => 'Office branch configuration not found.']);
            }

            $distance = calculateDistance($latitude, $longitude, (float)$branch['latitude'], (float)$branch['longitude']);
            $allowedRadius = (int)$branch['radius_meters'];

            if ($distance > $allowedRadius) {
                // Allow check-out from any location but mark gps_verified = 0
                $gps_verified = 0;
            } else {
                $gps_verified = 1;
            }
        } else {
            $gps_verified = 1;
        }

        // Process and compress photo
        $photoPath = saveAndCompressPhoto($photoInput, $employee_id, 'checkout');
        if (!$photoPath) {
            apiResponse(400, ['error' => 'Invalid photo capture upload. Please capture again.']);
        }

        // Run cognitive face verification service against employee avatar
        $avatarQuery = $db->prepare("SELECT u.avatar FROM employees e JOIN users u ON e.user_id = u.id WHERE e.id = ?");
        $avatarQuery->execute([$employee_id]);
        $avatar = $avatarQuery->fetchColumn();
        $referencePhoto = $avatar ? '../' . $avatar : null;

        $faceResult = FaceVerificationService::verifyFace(__DIR__ . '/../' . $photoPath, $referencePhoto);
        $livenessResult = LivenessDetectionService::detectLiveness(__DIR__ . '/../' . $photoPath);

        // Record clock-out time
        $time = date('H:i');

        // Update Record
        $db->beginTransaction();

        $stmt = $db->prepare("UPDATE attendance SET 
            clock_out = ?, clock_out_photo = ?, clock_out_lat = ?, clock_out_lng = ?,
            clock_out_distance = ?, clock_out_gps_accuracy = ?,
            clock_out_browser = ?, clock_out_os = ?, clock_out_device = ?, clock_out_ip = ?, clock_out_network = ?, clock_out_battery = ?,
            clock_out_face_score = ?, clock_out_face_verified = ?, clock_out_liveness_score = ?, clock_out_liveness_verified = ?,
            clock_out_gps_verified = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?");

        $stmt->execute([
            $time, $photoPath, $latitude, $longitude,
            $distance, $accuracy,
            $browser, $os, $device, $ip_address, $network, $battery,
            $faceResult['face_match_score'], (int)$faceResult['face_verified'],
            $livenessResult['liveness_score'], (int)$livenessResult['liveness_verified'],
            $gps_verified, $attendance['id']
        ]);

        // Write Audit Log
        $logStmt = $db->prepare("INSERT INTO attendance_logs (
            attendance_id, employee_id, action, timestamp, latitude, longitude, distance,
            browser, device, ip_address, photo, status, remarks
        ) VALUES (?, ?, 'Check Out', CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

        $logStmt->execute([
            $attendance['id'], $employee_id, $latitude, $longitude, $distance,
            $browser, $device, $ip_address, $photoPath, $attendance['status'],
            "Clock-out logged successfully with Face & GPS check."
        ]);

        $db->commit();

        apiResponse(200, [
            'message' => 'Check-out recorded successfully.',
            'clock_out_time' => $time,
            'face_match_score' => $faceResult['face_match_score'],
            'liveness_score' => $livenessResult['liveness_score'],
            'distance_meters' => round($distance, 1)
        ]);

    } catch (Exception $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        apiResponse(500, ['error' => 'Database process failed during check-out', 'details' => $e->getMessage()]);
    }
}

// Default Fallback
else {
    apiResponse(404, ['error' => 'API action not found']);
}
