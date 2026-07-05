<?php
// backend/api/hr.php

if (!isset($db) || !isset($route) || !isset($user)) {
    exit('Direct access not allowed');
}

$action = str_replace('/api/hr/', '', $route);
$company_id = $user['company_id'];

function hrResponse($code, $data) {
    http_response_code($code);
    echo json_encode($data);
    exit();
}

if ($action === 'dashboard') {
    // HR Dashboard metrics
    try {
        $empCount = $db->prepare("SELECT COUNT(*) FROM employees WHERE company_id = ? AND status = 'Active'");
        $empCount->execute([$company_id]);
        $totalEmployees = $empCount->fetchColumn();

        $todayDate = date('Y-m-d');
        $attCount = $db->prepare("SELECT COUNT(*) FROM attendance a JOIN employees e ON a.employee_id = e.id WHERE e.company_id = ? AND a.date = ?");
        $attCount->execute([$company_id, $todayDate]);
        $presentToday = $attCount->fetchColumn();

        $leaveCount = $db->prepare("SELECT COUNT(*) FROM leave_requests lr JOIN employees e ON lr.employee_id = e.id WHERE e.company_id = ? AND lr.status = 'Pending'");
        $leaveCount->execute([$company_id]);
        $pendingLeaves = $leaveCount->fetchColumn();

        // Recent logs
        $logsStmt = $db->prepare("SELECT a.*, u.name as employee_name, e.employee_code 
                                  FROM attendance a 
                                  JOIN employees e ON a.employee_id = e.id 
                                  JOIN users u ON e.user_id = u.id 
                                  WHERE e.company_id = ? 
                                  ORDER BY a.id DESC LIMIT 5");
        $logsStmt->execute([$company_id]);
        $recentAttendance = $logsStmt->fetchAll();

        hrResponse(200, [
            'metrics' => [
                'total_employees' => (int)$totalEmployees,
                'present_today' => (int)$presentToday,
                'absent_today' => (int)($totalEmployees - $presentToday),
                'pending_leaves' => (int)$pendingLeaves
            ],
            'recent_attendance' => $recentAttendance
        ]);
    } catch (Exception $e) {
        hrResponse(500, ['error' => 'Failed to load dashboard metrics', 'details' => $e->getMessage()]);
    }
}

elseif ($action === 'employees') {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Fetch all employees
        $stmt = $db->prepare("SELECT e.*, u.name, u.email, u.avatar, d.name as department_name, ds.name as designation_name, b.name as branch_name
                              FROM employees e
                              JOIN users u ON e.user_id = u.id
                              LEFT JOIN departments d ON e.department_id = d.id
                              LEFT JOIN designations ds ON e.designation_id = ds.id
                              LEFT JOIN branches b ON e.branch_id = b.id
                              WHERE e.company_id = ? ORDER BY e.id DESC");
        $stmt->execute([$company_id]);
        $employees = $stmt->fetchAll();
        hrResponse(200, ['employees' => $employees]);
    } 
    
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Onboard an employee
        $email = $input['email'] ?? '';
        $name = $input['name'] ?? '';
        $password = $input['password'] ?? 'emp123'; // Default password
        $employee_code = $input['employee_code'] ?? '';
        $department_id = $input['department_id'] ?? null;
        $designation_id = $input['designation_id'] ?? null;
        $branch_id = $input['branch_id'] ?? null;
        $monthly_salary = $input['monthly_salary'] ?? 50000.00;
        $phone = $input['phone'] ?? '';

        if (empty($email) || empty($name) || empty($employee_code)) {
            hrResponse(400, ['error' => 'Email, Name, and Employee Code are required']);
        }

        try {
            $db->beginTransaction();

            // 1. Create User
            $passHash = password_hash($password, PASSWORD_DEFAULT);
            $userStmt = $db->prepare("INSERT INTO users (email, password_hash, role, name) VALUES (?, ?, 'employee', ?)");
            $userStmt->execute([$email, $passHash, $name]);
            $userId = $db->lastInsertId();

            // 2. Create Employee
            $empStmt = $db->prepare("INSERT INTO employees (user_id, company_id, branch_id, department_id, designation_id, employee_code, date_of_joining, monthly_salary, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $empStmt->execute([$userId, $company_id, $branch_id, $department_id, $designation_id, $employee_code, date('Y-m-d H:i:s'), $monthly_salary, $phone]);
            $empId = $db->lastInsertId();

            // 3. Setup default leave balances
            $ltStmt = $db->prepare("SELECT id, total_days FROM leave_types WHERE company_id = ?");
            $ltStmt->execute([$company_id]);
            $leaveTypes = $ltStmt->fetchAll();
            
            $balStmt = $db->prepare("INSERT INTO leave_balances (employee_id, leave_type_id, allocated, used, pending) VALUES (?, ?, ?, 0, 0)");
            foreach ($leaveTypes as $lt) {
                $balStmt->execute([$empId, $lt['id'], $lt['total_days']]);
            }

            $db->commit();
            hrResponse(201, ['message' => 'Employee onboarded successfully', 'employee_id' => $empId]);
        } catch (Exception $e) {
            $db->rollBack();
            hrResponse(500, ['error' => 'Onboarding failed', 'details' => $e->getMessage()]);
        }
    }
}

elseif ($action === 'leaves') {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Fetch all leave applications
        $stmt = $db->prepare("SELECT lr.*, u.name as employee_name, e.employee_code, lt.name as leave_type_name
                              FROM leave_requests lr
                              JOIN employees e ON lr.employee_id = e.id
                              JOIN users u ON e.user_id = u.id
                              JOIN leave_types lt ON lr.leave_type_id = lt.id
                              WHERE e.company_id = ? ORDER BY lr.id DESC");
        $stmt->execute([$company_id]);
        $leaves = $stmt->fetchAll();
        hrResponse(200, ['leaves' => $leaves]);
    }
    
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Approve / Reject Leave
        $leave_id = $input['leave_id'] ?? null;
        $status = $input['status'] ?? ''; // Approved or Rejected

        if (!$leave_id || !in_array($status, ['Approved', 'Rejected'])) {
            hrResponse(400, ['error' => 'Leave ID and valid status are required']);
        }

        try {
            $db->beginTransaction();

            $stmt = $db->prepare("UPDATE leave_requests SET status = ?, approved_by = ? WHERE id = ?");
            $stmt->execute([$status, $user['id'], $leave_id]);

            // If approved, deduct from leave balance
            if ($status === 'Approved') {
                $getLeave = $db->prepare("SELECT employee_id, leave_type_id, start_date, end_date FROM leave_requests WHERE id = ?");
                $getLeave->execute([$leave_id]);
                $req = $getLeave->fetch();

                if ($req) {
                    $start = new DateTime($req['start_date']);
                    $end = new DateTime($req['end_date']);
                    $days = $start->diff($end)->days + 1;

                    $deductStmt = $db->prepare("UPDATE leave_balances SET used = used + ?, pending = CASE WHEN pending >= ? THEN pending - ? ELSE 0 END 
                                                WHERE employee_id = ? AND leave_type_id = ?");
                    $deductStmt->execute([$days, $days, $days, $req['employee_id'], $req['leave_type_id']]);
                }
            }

            $db->commit();
            hrResponse(200, ['message' => 'Leave request ' . strtolower($status)]);
        } catch (Exception $e) {
            $db->rollBack();
            hrResponse(500, ['error' => 'Failed to update leave request', 'details' => $e->getMessage()]);
        }
    }
}

elseif ($action === 'departments') {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $stmt = $db->prepare("SELECT * FROM departments WHERE company_id = ?");
        $stmt->execute([$company_id]);
        hrResponse(200, ['departments' => $stmt->fetchAll()]);
    }
    
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $name = $input['name'] ?? '';
        $code = $input['code'] ?? '';

        if (empty($name)) {
            hrResponse(400, ['error' => 'Department Name is required']);
        }

        $stmt = $db->prepare("INSERT INTO departments (company_id, name, code) VALUES (?, ?, ?)");
        $stmt->execute([$company_id, $name, $code]);
        hrResponse(201, ['message' => 'Department created', 'id' => $db->lastInsertId()]);
    }
}

elseif ($action === 'designations') {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $stmt = $db->prepare("SELECT * FROM designations WHERE company_id = ?");
        $stmt->execute([$company_id]);
        hrResponse(200, ['designations' => $stmt->fetchAll()]);
    }
    
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $name = $input['name'] ?? '';

        if (empty($name)) {
            hrResponse(400, ['error' => 'Designation Name is required']);
        }

        $stmt = $db->prepare("INSERT INTO designations (company_id, name) VALUES (?, ?)");
        $stmt->execute([$company_id, $name]);
        hrResponse(201, ['message' => 'Designation created', 'id' => $db->lastInsertId()]);
    }
}

elseif ($action === 'branches') {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $stmt = $db->prepare("SELECT * FROM branches WHERE company_id = ?");
        $stmt->execute([$company_id]);
        hrResponse(200, ['branches' => $stmt->fetchAll()]);
    }
}

elseif ($action === 'announcements') {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $title = $input['title'] ?? '';
        $content = $input['content'] ?? '';
        $target = $input['target_role'] ?? 'All';

        if (empty($title) || empty($content)) {
            hrResponse(400, ['error' => 'Title and content are required']);
        }

        $stmt = $db->prepare("INSERT INTO announcements (company_id, title, content, target_role) VALUES (?, ?, ?, ?)");
        $stmt->execute([$company_id, $title, $content, $target]);
        hrResponse(201, ['message' => 'Announcement posted successfully']);
    }
}

else {
    hrResponse(404, ['error' => 'HR endpoint not found']);
}
