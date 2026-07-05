<?php
// backend/api/employee.php

if (!isset($db) || !isset($route) || !isset($user)) {
    exit('Direct access not allowed');
}

$action = str_replace('/api/employee/', '', $route);
$employee_id = $user['employee_id'];
$company_id = $user['company_id'];

function empResponse($code, $data) {
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

if ($action === 'dashboard') {
    try {
        // 1. Fetch Today's Attendance
        $today = date('Y-m-d');
        $attStmt = $db->prepare("SELECT * FROM attendance WHERE employee_id = ? AND date = ?");
        $attStmt->execute([$employee_id, $today]);
        $attendanceToday = $attStmt->fetch();

        // 2. Fetch Leave Balances
        $balStmt = $db->prepare("SELECT lb.*, lt.name as leave_type_name 
                                 FROM leave_balances lb 
                                 JOIN leave_types lt ON lb.leave_type_id = lt.id 
                                 WHERE lb.employee_id = ?");
        $balStmt->execute([$employee_id]);
        $balances = $balStmt->fetchAll();

        // 3. Fetch Recent Announcements
        $annStmt = $db->prepare("SELECT * FROM announcements WHERE company_id = ? AND (target_role = 'All' OR target_role = 'Employee') ORDER BY id DESC LIMIT 5");
        $annStmt->execute([$company_id]);
        $announcements = $annStmt->fetchAll();

        // 4. Fetch Branch Geofence Config for GPS check-in helper
        $branchStmt = $db->prepare("SELECT b.* FROM branches b JOIN employees e ON e.branch_id = b.id WHERE e.id = ?");
        $branchStmt->execute([$employee_id]);
        $branch = $branchStmt->fetch();

        empResponse(200, [
            'attendance_today' => $attendanceToday,
            'leave_balances' => $balances,
            'announcements' => $announcements,
            'geofence_branch' => $branch
        ]);
    } catch (Exception $e) {
        empResponse(500, ['error' => 'Failed to load employee dashboard', 'details' => $e->getMessage()]);
    }
}

elseif ($action === 'attendance/clock-in') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        empResponse(405, ['error' => 'Method not allowed']);
    }

    $latitude = (float)($input['latitude'] ?? 0);
    $longitude = (float)($input['longitude'] ?? 0);
    $is_wfh = (int)($input['is_wfh'] ?? 0);

    $today = date('Y-m-d');

    // Check if already checked in
    $checkStmt = $db->prepare("SELECT id FROM attendance WHERE employee_id = ? AND date = ?");
    $checkStmt->execute([$employee_id, $today]);
    if ($checkStmt->fetch()) {
        empResponse(400, ['error' => 'Already clocked in today']);
    }

    // Geofence check if not WFH
    if ($is_wfh === 0) {
        $branchStmt = $db->prepare("SELECT b.* FROM branches b JOIN employees e ON e.branch_id = b.id WHERE e.id = ?");
        $branchStmt->execute([$employee_id]);
        $branch = $branchStmt->fetch();

        if ($branch) {
            $distance = calculateDistance($latitude, $longitude, (float)$branch['latitude'], (float)$branch['longitude']);
            if ($distance > (int)$branch['radius_meters']) {
                empResponse(400, [
                    'error' => 'Geofencing verification failed: You are outside the permitted office radius.',
                    'distance_meters' => round($distance, 1),
                    'required_radius' => $branch['radius_meters']
                ]);
            }
        } else {
            empResponse(400, ['error' => 'No branch geofencing parameters configured for your employee profile']);
        }
    }

    // Create log
    $stmt = $db->prepare("INSERT INTO attendance (employee_id, date, clock_in, clock_in_lat, clock_in_lng, status, is_wfh) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $time = date('H:i');
    
    // Determine status (Late if checkin after 09:15)
    $status = 'Present';
    if (strtotime($time) > strtotime('09:15')) {
        $status = 'Late';
    }

    $stmt->execute([
        $employee_id,
        $today,
        $time,
        $latitude,
        $longitude,
        $status,
        $is_wfh
    ]);

    // Insert into logs
    $logStmt = $db->prepare("INSERT INTO attendance_logs (employee_id, log_type, latitude, longitude, device_info) VALUES (?, 'IN', ?, ?, ?)");
    $logStmt->execute([$employee_id, $latitude, $longitude, $_SERVER['HTTP_USER_AGENT'] ?? 'Web Browser']);

    empResponse(201, [
        'message' => 'Clock-in recorded successfully',
        'clock_in_time' => $time,
        'status' => $status
    ]);
}

elseif ($action === 'attendance/clock-out') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        empResponse(405, ['error' => 'Method not allowed']);
    }

    $latitude = (float)($input['latitude'] ?? 0);
    $longitude = (float)($input['longitude'] ?? 0);
    $today = date('Y-m-d');

    // Fetch existing attendance entry
    $checkStmt = $db->prepare("SELECT id, clock_in FROM attendance WHERE employee_id = ? AND date = ?");
    $checkStmt->execute([$employee_id, $today]);
    $att = $checkStmt->fetch();

    if (!$att) {
        empResponse(400, ['error' => 'You must clock in first before clocking out']);
    }

    $time = date('H:i');
    $stmt = $db->prepare("UPDATE attendance SET clock_out = ?, clock_out_lat = ?, clock_out_lng = ? WHERE id = ?");
    $stmt->execute([$time, $latitude, $longitude, $att['id']]);

    // Insert into logs
    $logStmt = $db->prepare("INSERT INTO attendance_logs (employee_id, log_type, latitude, longitude, device_info) VALUES (?, 'OUT', ?, ?, ?)");
    $logStmt->execute([$employee_id, $latitude, $longitude, $_SERVER['HTTP_USER_AGENT'] ?? 'Web Browser']);

    empResponse(200, [
        'message' => 'Clock-out recorded successfully',
        'clock_out_time' => $time
    ]);
}

elseif ($action === 'leaves') {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $stmt = $db->prepare("SELECT lr.*, lt.name as leave_type_name 
                              FROM leave_requests lr 
                              JOIN leave_types lt ON lr.leave_type_id = lt.id 
                              WHERE lr.employee_id = ? ORDER BY lr.id DESC");
        $stmt->execute([$employee_id]);
        empResponse(200, ['leaves' => $stmt->fetchAll()]);
    }
    
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Apply for leave
        $leave_type_id = $input['leave_type_id'] ?? null;
        $start_date = $input['start_date'] ?? '';
        $end_date = $input['end_date'] ?? '';
        $reason = $input['reason'] ?? '';

        if (!$leave_type_id || empty($start_date) || empty($end_date)) {
            empResponse(400, ['error' => 'Leave Type, Start Date, and End Date are required']);
        }

        try {
            $db->beginTransaction();

            // Calculate duration
            $start = new DateTime($start_date);
            $end = new DateTime($end_date);
            $days = $start->diff($end)->days + 1;

            // Check if user has sufficient leave balance
            $balStmt = $db->prepare("SELECT allocated, used, pending FROM leave_balances WHERE employee_id = ? AND leave_type_id = ?");
            $balStmt->execute([$employee_id, $leave_type_id]);
            $balance = $balStmt->fetch();

            if (!$balance || ($balance['allocated'] - $balance['used'] - $balance['pending']) < $days) {
                empResponse(400, ['error' => 'Insufficient leave balance for requested days']);
            }

            // Create leave request
            $stmt = $db->prepare("INSERT INTO leave_requests (employee_id, leave_type_id, start_date, end_date, reason, status) VALUES (?, ?, ?, ?, ?, 'Pending')");
            $stmt->execute([$employee_id, $leave_type_id, $start_date, $end_date, $reason]);

            // Update pending balance
            $upStmt = $db->prepare("UPDATE leave_balances SET pending = pending + ? WHERE employee_id = ? AND leave_type_id = ?");
            $upStmt->execute([$days, $employee_id, $leave_type_id]);

            $db->commit();
            empResponse(201, ['message' => 'Leave request submitted successfully']);
        } catch (Exception $e) {
            $db->rollBack();
            empResponse(500, ['error' => 'Leave application failed', 'details' => $e->getMessage()]);
        }
    }
}

elseif ($action === 'payslips') {
    $stmt = $db->prepare("SELECT p.*, pc.month, pc.year,
                                 e.employee_code, e.date_of_joining,
                                 u.name as employee_name,
                                 d.name as department_name, ds.name as designation_name,
                                 b.name as branch_name, b.address as branch_address,
                                 c.name as company_name, c.code as company_code,
                                 eb.bank_name, eb.account_number as bank_account, eb.ifsc_code
                          FROM payslips p 
                          JOIN payroll_cycles pc ON p.payroll_cycle_id = pc.id 
                          JOIN employees e ON p.employee_id = e.id
                          JOIN users u ON e.user_id = u.id
                          LEFT JOIN departments d ON e.department_id = d.id
                          LEFT JOIN designations ds ON e.designation_id = ds.id
                          LEFT JOIN branches b ON e.branch_id = b.id
                          LEFT JOIN companies c ON e.company_id = c.id
                          LEFT JOIN employee_bank eb ON e.id = eb.employee_id
                          WHERE p.employee_id = ? ORDER BY pc.year DESC, pc.month DESC");
    $stmt->execute([$employee_id]);
    empResponse(200, ['payslips' => $stmt->fetchAll()]);
}

elseif ($action === 'expenses') {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $title = $input['title'] ?? '';
        $category = $input['category'] ?? '';
        $amount = (float)($input['amount'] ?? 0);
        $bill_path = $input['bill_path'] ?? '';

        if (empty($title) || empty($category) || $amount <= 0) {
            empResponse(400, ['error' => 'Title, Category, and positive amount are required']);
        }

        $stmt = $db->prepare("INSERT INTO expenses (employee_id, title, category, amount, bill_path, status) VALUES (?, ?, ?, ?, ?, 'Pending')");
        $stmt->execute([$employee_id, $title, $category, $amount, $bill_path]);
        empResponse(201, ['message' => 'Expense reimbursement claim submitted successfully']);
    }
}

elseif ($action === 'profile') {
    // Detailed profile details
    $stmt = $db->prepare("SELECT e.*, u.name, u.email, d.name as department_name, ds.name as designation_name, b.name as branch_name 
                          FROM employees e 
                          JOIN users u ON e.user_id = u.id 
                          LEFT JOIN departments d ON e.department_id = d.id 
                          LEFT JOIN designations ds ON e.designation_id = ds.id 
                          LEFT JOIN branches b ON e.branch_id = b.id 
                          WHERE e.id = ?");
    $stmt->execute([$employee_id]);
    $empDetails = $stmt->fetch();

    if (!$empDetails) {
        empResponse(404, ['error' => 'Employee profile not found']);
    }

    // Get banking
    $bankStmt = $db->prepare("SELECT * FROM employee_bank WHERE employee_id = ?");
    $bankStmt->execute([$employee_id]);
    $bank = $bankStmt->fetch();

    // Get emergency contacts
    $emergStmt = $db->prepare("SELECT * FROM employee_emergency WHERE employee_id = ?");
    $emergStmt->execute([$employee_id]);
    $emergency = $emergStmt->fetchAll();

    empResponse(200, [
        'employee' => $empDetails,
        'bank' => $bank,
        'emergency' => $emergency
    ]);
}

else {
    empResponse(404, ['error' => 'Employee endpoint not found']);
}
