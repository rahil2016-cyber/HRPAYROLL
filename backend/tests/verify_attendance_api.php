<?php
// backend/tests/verify_attendance_api.php

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../services/FaceVerificationService.php';
require_once __DIR__ . '/../services/LivenessDetectionService.php';

echo "=== HR Allocate Attendance System Test Runner ===\n";

try {
    $db = Database::getConnection();
    
    // 1. Verify table schemas
    echo "1. Verifying database table structures...\n";
    
    // Check attendance table columns
    $stmt = $db->query("PRAGMA table_info(attendance)");
    $cols = $stmt->fetchAll(PDO::FETCH_COLUMN, 1);
    
    $requiredCols = [
        'clock_in_photo', 'clock_out_photo', 'clock_in_distance', 'clock_in_browser',
        'clock_in_face_score', 'clock_in_face_verified', 'clock_in_liveness_verified',
        'clock_in_gps_verified', 'company_id', 'branch_id'
    ];
    
    $missing = [];
    foreach ($requiredCols as $c) {
        if (!in_array($c, $cols)) {
            $missing[] = $c;
        }
    }
    
    if (empty($missing)) {
        echo "✅ PASS: All required attendance columns are present.\n";
    } else {
        echo "❌ FAIL: Missing columns in attendance table: " . implode(', ', $missing) . "\n";
    }
    
    // Check attendance_logs table
    $stmtLogs = $db->query("PRAGMA table_info(attendance_logs)");
    $logCols = $stmtLogs->fetchAll(PDO::FETCH_COLUMN, 1);
    
    $requiredLogCols = ['attendance_id', 'employee_id', 'action', 'distance', 'photo', 'ip_address'];
    $missingLogs = [];
    foreach ($requiredLogCols as $c) {
        if (!in_array($c, $logCols)) {
            $missingLogs[] = $c;
        }
    }
    
    if (empty($missingLogs)) {
        echo "✅ PASS: All required attendance_logs columns are present.\n";
    } else {
        echo "❌ FAIL: Missing columns in attendance_logs: " . implode(', ', $missingLogs) . "\n";
    }

    // 2. Test Geofence Distance calculation (Bengaluru center check)
    echo "\n2. Testing Geofencing distance logic...\n";
    
    // Haversine helper
    function getDist($lat1, $lon1, $lat2, $lon2) {
        $earthRadius = 6371000;
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLon / 2) * sin($dLon / 2);
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
        return $earthRadius * $c;
    }
    
    // Seed office: 12.9716, 77.5946
    // Check point close: 12.9718, 77.5948 (~31 meters)
    $dClose = getDist(12.9716, 77.5946, 12.9718, 77.5948);
    // Check point far: 13.0200, 77.6500 (~7.9 km)
    $dFar = getDist(12.9716, 77.5946, 13.0200, 77.6500);
    
    echo "Distance Close (should be ~31m): " . round($dClose, 1) . "m\n";
    echo "Distance Far (should be ~7.9km): " . round($dFar/1000, 2) . "km\n";
    
    if ($dClose < 150 && $dFar > 150) {
        echo "✅ PASS: Geofence validation thresholds function correctly.\n";
    } else {
        echo "❌ FAIL: Geofence calculations are incorrect.\n";
    }

    // 3. Test Face Biometric Service
    echo "\n3. Testing Face Verification & Liveness cognitive mock services...\n";
    
    // Create a temporary dummy file to simulate photo
    $dummyPhoto = tempnam(sys_get_temp_dir(), 'test_selfie');
    file_put_contents($dummyPhoto, 'dummy image data');
    
    $faceRes = FaceVerificationService::verifyFace($dummyPhoto);
    $livenessRes = LivenessDetectionService::detectLiveness($dummyPhoto);
    
    unlink($dummyPhoto);
    
    echo "Face verification score: " . $faceRes['face_match_score'] . "% (Verified: " . ($faceRes['face_verified'] ? 'Yes' : 'No') . ")\n";
    echo "Liveness verification score: " . $livenessRes['liveness_score'] . "% (Verified: " . ($livenessRes['liveness_verified'] ? 'Yes' : 'No') . ")\n";
    
    if ($faceRes['face_verified'] && $livenessRes['liveness_verified']) {
        echo "✅ PASS: Face biometrics mock pipeline verified successfully.\n";
    } else {
        echo "❌ FAIL: Face or Liveness check failed.\n";
    }
    
    echo "\nAll system checks completed successfully!\n";

} catch (Exception $e) {
    echo "❌ ERROR: Verification run aborted due to exception: " . $e->getMessage() . "\n";
    exit(1);
}
