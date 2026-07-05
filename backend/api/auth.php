<?php
// backend/api/auth.php

// Ensure DB and routing values are set
if (!isset($db) || !isset($route)) {
    exit('Direct access not allowed');
}

$action = str_replace('/api/auth/', '', $route);

// Helper for sending responses
function sendResponse($code, $data) {
    http_response_code($code);
    echo json_encode($data);
    exit();
}

if ($action === 'login') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendResponse(405, ['error' => 'Method not allowed']);
    }

    $email = $input['email'] ?? '';
    $password = $input['password'] ?? '';

    if (empty($email) || empty($password)) {
        sendResponse(400, ['error' => 'Email and password are required']);
    }

    $stmt = $db->prepare("SELECT * FROM users WHERE email = ? AND status = 'Active'");
    $stmt->execute([$email]);
    $userRecord = $stmt->fetch();

    if (!$userRecord || !password_verify($password, $userRecord['password_hash'])) {
        sendResponse(401, ['error' => 'Invalid email or password']);
    }

    // Get employee details if user is not superadmin
    $employeeRecord = null;
    if ($userRecord['role'] !== 'superadmin') {
        $empStmt = $db->prepare("SELECT e.*, c.name as company_name, c.code as company_code FROM employees e JOIN companies c ON e.company_id = c.id WHERE e.user_id = ?");
        $empStmt->execute([$userRecord['id']]);
        $employeeRecord = $empStmt->fetch();
    }

    // Generate JWT
    $tokenPayload = [
        'id' => $userRecord['id'],
        'email' => $userRecord['email'],
        'role' => $userRecord['role'],
        'name' => $userRecord['name'],
        'company_id' => $employeeRecord ? $employeeRecord['company_id'] : null,
        'employee_id' => $employeeRecord ? $employeeRecord['id'] : null,
        'branch_id' => $employeeRecord ? $employeeRecord['branch_id'] : null
    ];

    $token = JWT::generate($tokenPayload);

    sendResponse(200, [
        'message' => 'Login successful',
        'token' => $token,
        'user' => [
            'id' => $userRecord['id'],
            'email' => $userRecord['email'],
            'name' => $userRecord['name'],
            'role' => $userRecord['role'],
            'avatar' => $userRecord['avatar'],
            'company_name' => $employeeRecord ? $employeeRecord['company_name'] : null,
            'employee_code' => $employeeRecord ? $employeeRecord['employee_code'] : null,
            'employee_id' => $employeeRecord ? $employeeRecord['id'] : null
        ]
    ]);
}

elseif ($action === 'register-wizard') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendResponse(405, ['error' => 'Method not allowed']);
    }

    // Multi-step Registration Wizard
    // Steps parsed from input: companyInfo, branchInfo, department, designation, salarySetup, attendanceRules, leavePolicy, inviteEmployee
    $companyName = $input['companyName'] ?? '';
    $companyCode = $input['companyCode'] ?? '';
    $hrEmail = $input['hrEmail'] ?? '';
    $hrPassword = $input['hrPassword'] ?? '';
    $hrName = $input['hrName'] ?? '';
    
    if (empty($companyName) || empty($companyCode) || empty($hrEmail) || empty($hrPassword)) {
        sendResponse(400, ['error' => 'Company Name, Code, HR Email, and Password are required']);
    }

    try {
        $db->beginTransaction();

        // Step 1: Create Company
        $cStmt = $db->prepare("INSERT INTO companies (name, code, status, plan_name, subscription_end) VALUES (?, ?, 'Active', 'Standard Trial', ?)");
        $cStmt->execute([$companyName, $companyCode, date('Y-m-d H:i:s', time() + 14 * 86400)]);
        $companyId = $db->lastInsertId();

        // Step 2: Create Primary Branch
        $branchName = $input['branchName'] ?? 'Head Office';
        $branchAddress = $input['branchAddress'] ?? 'Main City Center';
        $lat = $input['latitude'] ?? 12.9716;
        $lng = $input['longitude'] ?? 77.5946;
        $radius = $input['radiusMeters'] ?? 200;

        $bStmt = $db->prepare("INSERT INTO branches (company_id, name, address, latitude, longitude, radius_meters) VALUES (?, ?, ?, ?, ?, ?)");
        $bStmt->execute([$companyId, $branchName, $branchAddress, $lat, $lng, $radius]);
        $branchId = $db->lastInsertId();

        // Step 3: Create Default Department
        $deptName = $input['departmentName'] ?? 'Operations';
        $dStmt = $db->prepare("INSERT INTO departments (company_id, name, code) VALUES (?, ?, ?)");
        $dStmt->execute([$companyId, $deptName, 'OPS']);
        $deptId = $db->lastInsertId();

        // Step 4: Create Default Designation
        $desName = $input['designationName'] ?? 'Operations Associate';
        $desStmt = $db->prepare("INSERT INTO designations (company_id, name) VALUES (?, ?)");
        $desStmt->execute([$companyId, $desName]);
        $designationId = $db->lastInsertId();

        // Step 5: Salary components default configurations
        $compStmt = $db->prepare("INSERT INTO salary_components (company_id, name, type, percentage, is_fixed) VALUES (?, ?, ?, ?, ?)");
        $compStmt->execute([$companyId, 'Basic Salary', 'Earning', 50, 0]);
        $compStmt->execute([$companyId, 'HRA', 'Earning', 25, 0]);
        $compStmt->execute([$companyId, 'Professional Tax', 'Deduction', 0, 1]);

        // Step 6: Attendance Geofence Rule
        $settingStmt = $db->prepare("INSERT INTO company_settings (company_id, setting_key, setting_value) VALUES (?, ?, ?)");
        $settingStmt->execute([$companyId, 'attendance_geofence_enabled', $input['geofenceEnabled'] ?? 'true']);

        // Step 7: Leave Policies
        $leaveStmt = $db->prepare("INSERT INTO leave_types (company_id, name, total_days) VALUES (?, 'Casual Leave', 12)");
        $leaveStmt->execute([$companyId]);

        // Step 8: Invite / Create HR Owner user account
        $hash = password_hash($hrPassword, PASSWORD_DEFAULT);
        $userStmt = $db->prepare("INSERT INTO users (email, password_hash, role, name) VALUES (?, ?, 'hr', ?)");
        $userStmt->execute([$hrEmail, $hash, $hrName]);
        $userId = $db->lastInsertId();

        // Link user to employee as HR owner
        $empStmt = $db->prepare("INSERT INTO employees (user_id, company_id, branch_id, department_id, designation_id, employee_code, date_of_joining, monthly_salary) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $empStmt->execute([$userId, $companyId, $branchId, $deptId, $designationId, 'HR001', date('Y-m-d H:i:s'), 100000.00]);

        $db->commit();

        sendResponse(201, [
            'message' => 'Company registration completed successfully',
            'company_id' => $companyId,
            'hr_account' => $hrEmail
        ]);
    } catch (Exception $ex) {
        $db->rollBack();
        sendResponse(500, ['error' => 'Registration wizard failed', 'details' => $ex->getMessage()]);
    }
}

elseif ($action === 'me') {
    if (!$user) {
        sendResponse(401, ['error' => 'Not authenticated']);
    }
    sendResponse(200, ['user' => $user]);
}

else {
    sendResponse(404, ['error' => 'Auth endpoint not found']);
}
