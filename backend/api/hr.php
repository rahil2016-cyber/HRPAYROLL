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

function saveAvatarPhoto($photoBase64, $userId) {
    if (empty($photoBase64)) return null;
    if (strpos($photoBase64, 'data:image') !== 0) return null;
    
    $parts = explode(',', $photoBase64);
    if (count($parts) < 2) return null;
    
    $data = base64_decode($parts[1]);
    if ($data === false) return null;
    
    $dir = __DIR__ . '/../../uploads/avatars/';
    if (!file_exists($dir)) {
        mkdir($dir, 0777, true);
    }
    
    $fileName = 'avatar_' . $userId . '_' . time() . '.jpg';
    file_put_contents($dir . $fileName, $data);
    return 'uploads/avatars/' . $fileName;
}

function saveCompanyFile($fileBase64, $companyId, $type) {
    if (empty($fileBase64)) return null;
    if (strpos($fileBase64, 'data:') !== 0) return null;
    
    $parts = explode(',', $fileBase64);
    if (count($parts) < 2) return null;
    
    $data = base64_decode($parts[1]);
    if ($data === false) return null;
    
    $mime = explode(';', explode(':', $parts[0])[1])[0];
    $ext = 'png';
    if ($mime === 'image/jpeg' || $mime === 'image/jpg') $ext = 'jpg';
    elseif ($mime === 'image/svg+xml') $ext = 'svg';
    
    $dir = __DIR__ . '/../../uploads/company/';
    if (!file_exists($dir)) {
        mkdir($dir, 0777, true);
    }
    
    $fileName = 'company_' . $companyId . '_' . $type . '_' . time() . '.' . $ext;
    file_put_contents($dir . $fileName, $data);
    return 'uploads/company/' . $fileName;
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

        $serviceTypeStmt = $db->prepare("SELECT service_type FROM companies WHERE id = ?");
        $serviceTypeStmt->execute([$company_id]);
        $service_type = $serviceTypeStmt->fetchColumn() ?: 'CompletePayroll';

        hrResponse(200, [
            'metrics' => [
                'total_employees' => (int)$totalEmployees,
                'present_today' => (int)$presentToday,
                'absent_today' => (int)($totalEmployees - $presentToday),
                'pending_leaves' => (int)$pendingLeaves
            ],
            'recent_attendance' => $recentAttendance,
            'service_type' => $service_type
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
        // Onboard an employee with comprehensive wizard fields
        $email = $input['email'] ?? '';
        $first_name = $input['first_name'] ?? '';
        $middle_name = $input['middle_name'] ?? '';
        $last_name = $input['last_name'] ?? '';
        
        // Combine names
        $name = trim(trim($first_name . ' ' . $middle_name) . ' ' . $last_name);
        if (empty($name)) {
            $name = $input['name'] ?? ''; // fallback
        }

        // Automatically generate unique employee code
        $isUnique = false;
        while (!$isUnique) {
            $candidateCode = 'EMP' . rand(10000, 99999);
            $dupCheck = $db->prepare("SELECT COUNT(*) FROM employees WHERE employee_code = ?");
            $dupCheck->execute([$candidateCode]);
            if ($dupCheck->fetchColumn() == 0) {
                $employee_code = $candidateCode;
                $isUnique = true;
            }
        }

        // Automatically generate secure password
        $password = 'Alloc@' . rand(1000, 9999);

        $date_of_joining = $input['date_of_joining'] ?? date('Y-m-d H:i:s');
        $mobile_number = $input['mobile_number'] ?? '';
        $phone = $mobile_number ? $mobile_number : ($input['phone'] ?? '');
        
        $gender = $input['gender'] ?? '';
        $is_director = (int)($input['is_director'] ?? 0);
        $enable_portal_access = (int)($input['enable_portal_access'] ?? 1);
        
        $branch_id = !empty($input['branch_id']) ? (int)$input['branch_id'] : null;
        $department_id = !empty($input['department_id']) ? (int)$input['department_id'] : null;
        $designation_id = !empty($input['designation_id']) ? (int)$input['designation_id'] : null;

        // Salary structure details
        $annual_ctc = (float)($input['annual_ctc'] ?? 0.00);
        $basic = (float)($input['basic'] ?? 0.00);
        $hra = (float)($input['hra'] ?? 0.00);
        $fixed_allowance = (float)($input['fixed_allowance'] ?? 0.00);
        $conveyance_allowance = (float)($input['conveyance_allowance'] ?? 0.00);
        $medical_allowance = (float)($input['medical_allowance'] ?? 0.00);
        $employer_pf = (float)($input['employer_pf'] ?? 0.00);
        $employer_esi = (float)($input['employer_esi'] ?? 0.00);
        $gratuity = (float)($input['gratuity'] ?? 0.00);
        $insurance = (float)($input['insurance'] ?? 0.00);
        $bonus = (float)($input['bonus'] ?? 0.00);
        $lwf = (float)($input['lwf'] ?? 0.00);
        $other_benefits = $input['other_benefits'] ?? '';
        
        // Calculate monthly salary as Gross Monthly Salary (monthly_salary)
        $monthly_salary = ($annual_ctc > 0) ? ($input['monthly_salary'] ?? ($annual_ctc / 12)) : ($input['monthly_salary'] ?? 50000.00);

        // Personal details
        $date_of_birth = $input['date_of_birth'] ?? '';
        $age = (int)($input['age'] ?? 0);
        $father_name = $input['father_name'] ?? '';
        $pan = $input['pan'] ?? '';
        $differently_abled_type = $input['differently_abled_type'] ?? 'None';
        $personal_email = $input['personal_email'] ?? '';
        
        // Address details
        $address_line1 = $input['address_line1'] ?? '';
        $address_line2 = $input['address_line2'] ?? '';
        $city = $input['city'] ?? '';
        $state = $input['state'] ?? '';
        $pincode = $input['pincode'] ?? '';

        // Payment Details (Bank)
        $bank_name = $input['bank_name'] ?? '';
        $account_number = $input['account_number'] ?? '';
        $ifsc_code = $input['ifsc_code'] ?? '';

        if (empty($email) || empty($first_name)) {
            hrResponse(400, ['error' => 'Email and First Name are required']);
        }

        $checkUser = $db->prepare("SELECT id FROM users WHERE email = ?");
        $checkUser->execute([$email]);
        if ($checkUser->fetch()) {
            hrResponse(400, [
                'error' => 'Validation error', 
                'details' => 'An account with this email address already exists. Please use a unique email.'
            ]);
        }

        try {
            $db->beginTransaction();

            // 1. Create User
            $passHash = password_hash($password, PASSWORD_DEFAULT);
            $userStmt = $db->prepare("INSERT INTO users (email, password_hash, role, name) VALUES (?, ?, 'employee', ?)");
            $userStmt->execute([$email, $passHash, $name]);
            $userId = $db->lastInsertId();

            // 2. Create Employee
            $empQuery = "INSERT INTO employees (
                user_id, company_id, branch_id, department_id, designation_id, employee_code, date_of_joining, monthly_salary, phone,
                first_name, middle_name, last_name, gender, mobile_number, is_director, enable_portal_access,
                annual_ctc, basic, hra, fixed_allowance, conveyance_allowance, other_benefits,
                date_of_birth, age, father_name, pan, differently_abled_type, personal_email,
                address_line1, address_line2, city, state, pincode,
                medical_allowance, employer_pf, employer_esi, gratuity, insurance, bonus, lwf
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            
            $empStmt = $db->prepare($empQuery);
            $empStmt->execute([
                $userId, $company_id, $branch_id, $department_id, $designation_id, $employee_code, $date_of_joining, $monthly_salary, $phone,
                $first_name, $middle_name, $last_name, $gender, $mobile_number, $is_director, $enable_portal_access,
                $annual_ctc, $basic, $hra, $fixed_allowance, $conveyance_allowance, $other_benefits,
                $date_of_birth, $age, $father_name, $pan, $differently_abled_type, $personal_email,
                $address_line1, $address_line2, $city, $state, $pincode,
                $medical_allowance, $employer_pf, $employer_esi, $gratuity, $insurance, $bonus, $lwf
            ]);
            $empId = $db->lastInsertId();

            // 3. Create Bank details if provided
            if (!empty($bank_name) && !empty($account_number)) {
                $bankStmt = $db->prepare("INSERT INTO employee_bank (employee_id, bank_name, account_number, ifsc_code) VALUES (?, ?, ?, ?)");
                $bankStmt->execute([$empId, $bank_name, $account_number, $ifsc_code]);
            }

            // 3b. Save profile photo and emergency contact details if provided
            if (!empty($input['photo'])) {
                $avatarPath = saveAvatarPhoto($input['photo'], $userId);
                if ($avatarPath) {
                    $upStmt = $db->prepare("UPDATE users SET avatar = ? WHERE id = ?");
                    $upStmt->execute([$avatarPath, $userId]);
                }
            }

            $em_name = $input['emergency_name'] ?? '';
            $em_rel = $input['emergency_relationship'] ?? 'Parent';
            $em_phone = $input['emergency_phone'] ?? '';
            if (!empty($em_name) && !empty($em_phone)) {
                $emStmt = $db->prepare("INSERT INTO employee_emergency (employee_id, name, relationship, phone) VALUES (?, ?, ?, ?)");
                $emStmt->execute([$empId, $em_name, $em_rel, $em_phone]);
            }

            // 4. Setup default leave balances
            $ltStmt = $db->prepare("SELECT id, total_days FROM leave_types WHERE company_id = ?");
            $ltStmt->execute([$company_id]);
            $leaveTypes = $ltStmt->fetchAll();
            
            $balStmt = $db->prepare("INSERT INTO leave_balances (employee_id, leave_type_id, allocated, used, pending) VALUES (?, ?, ?, 0, 0)");
            foreach ($leaveTypes as $lt) {
                $balStmt->execute([$empId, $lt['id'], $lt['total_days']]);
            }

            $db->commit();

            // Send congratulations email with credentials
            try {
                $subject = "Successful Onboarding - HR Allocate";
                $msg = "Congrats " . $name . "!\n\n";
                $msg .= "Your onboarding has been completed successfully.\n\n";
                $msg .= "Here are your login credentials:\n";
                $msg .= "Unique Employee ID: " . $employee_code . "\n";
                $msg .= "Username/Email: " . $email . "\n";
                $msg .= "Temporary Password: " . $password . "\n\n";
                $msg .= "You can log in to your Employee Workspace now.\n\n";
                $msg .= "Best regards,\nHR Allocate Team";

                $headers = "From: hr-allocate@yourdomain.com\r\n";
                $headers .= "Reply-To: hr-allocate@yourdomain.com\r\n";
                $headers .= "X-Mailer: PHP/" . phpversion();

                @mail($email, $subject, $msg, $headers);
            } catch (Exception $mailEx) {
                // Ignore mail sending errors to prevent blocking the onboarding response
            }

            hrResponse(201, [
                'message' => 'Employee onboarded successfully via Wizard', 
                'employee_id' => $empId,
                'employee_code' => $employee_code,
                'password' => $password
            ]);
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

elseif (strpos($action, 'attendance') === 0) {
    $parts = explode('/', $action);
    if (count($parts) > 1 && is_numeric($parts[1])) {
        // GET /api/hr/attendance/{id}
        $attendance_id = (int)$parts[1];
        $stmt = $db->prepare("SELECT a.*, u.name as employee_name, u.avatar, e.employee_code,
                                     d.name as department_name, ds.name as designation_name,
                                     b.name as branch_name, b.latitude as office_lat, b.longitude as office_lng, b.radius_meters as office_radius
                              FROM attendance a
                              JOIN employees e ON a.employee_id = e.id
                              JOIN users u ON e.user_id = u.id
                              LEFT JOIN departments d ON e.department_id = d.id
                              LEFT JOIN designations ds ON e.designation_id = ds.id
                              LEFT JOIN branches b ON e.branch_id = b.id
                              WHERE a.id = ? AND e.company_id = ?");
        $stmt->execute([$attendance_id, $company_id]);
        $record = $stmt->fetch();

        if (!$record) {
            hrResponse(404, ['error' => 'Attendance record not found']);
        }

        $logStmt = $db->prepare("SELECT * FROM attendance_logs WHERE attendance_id = ? ORDER BY timestamp ASC");
        $logStmt->execute([$attendance_id]);
        $timeline = $logStmt->fetchAll();

        hrResponse(200, [
            'record' => $record,
            'timeline' => $timeline
        ]);
    } 
    elseif ($action === 'attendance/stats') {
        // GET /api/hr/attendance/stats
        try {
            $today = date('Y-m-d');
            
            // Total Active Employees
            $empCount = $db->prepare("SELECT COUNT(*) FROM employees WHERE company_id = ? AND status = 'Active'");
            $empCount->execute([$company_id]);
            $totalEmployees = (int)$empCount->fetchColumn();

            // Present Today
            $attCount = $db->prepare("SELECT COUNT(*) FROM attendance a JOIN employees e ON a.employee_id = e.id WHERE e.company_id = ? AND a.date = ?");
            $attCount->execute([$company_id, $today]);
            $presentToday = (int)$attCount->fetchColumn();

            // Late Today
            $lateCount = $db->prepare("SELECT COUNT(*) FROM attendance a JOIN employees e ON a.employee_id = e.id WHERE e.company_id = ? AND a.date = ? AND a.status = 'Late'");
            $lateCount->execute([$company_id, $today]);
            $lateToday = (int)$lateCount->fetchColumn();

            // Checked Out Today
            $coCount = $db->prepare("SELECT COUNT(*) FROM attendance a JOIN employees e ON a.employee_id = e.id WHERE e.company_id = ? AND a.date = ? AND a.clock_out IS NOT NULL AND a.clock_out != ''");
            $coCount->execute([$company_id, $today]);
            $checkedOutToday = (int)$coCount->fetchColumn();

            // WFH Today
            $wfhCount = $db->prepare("SELECT COUNT(*) FROM attendance a JOIN employees e ON a.employee_id = e.id WHERE e.company_id = ? AND a.date = ? AND a.is_wfh = 1");
            $wfhCount->execute([$company_id, $today]);
            $wfhToday = (int)$wfhCount->fetchColumn();

            // Average Working Hours Today
            $hoursQuery = $db->prepare("SELECT clock_in, clock_out FROM attendance a JOIN employees e ON a.employee_id = e.id WHERE e.company_id = ? AND a.date = ? AND a.clock_out IS NOT NULL AND a.clock_out != ''");
            $hoursQuery->execute([$company_id, $today]);
            $records = $hoursQuery->fetchAll();
            $totalMinutes = 0;
            $count = 0;
            foreach ($records as $r) {
                if (!empty($r['clock_in']) && !empty($r['clock_out'])) {
                    $in = strtotime($r['clock_in']);
                    $out = strtotime($r['clock_out']);
                    if ($out > $in) {
                        $totalMinutes += ($out - $in) / 60;
                        $count++;
                    }
                }
            }
            $avgHours = $count > 0 ? round($totalMinutes / $count / 60, 1) : 0.0;

            // 7 Days Trends
            $trends = [];
            for ($i = 6; $i >= 0; $i--) {
                $date = date('Y-m-d', strtotime("-$i days"));
                
                $stmt = $db->prepare("SELECT COUNT(*) FROM attendance a JOIN employees e ON a.employee_id = e.id WHERE e.company_id = ? AND a.date = ?");
                $stmt->execute([$company_id, $date]);
                $present = (int)$stmt->fetchColumn();

                $stmt = $db->prepare("SELECT COUNT(*) FROM attendance a JOIN employees e ON a.employee_id = e.id WHERE e.company_id = ? AND a.date = ? AND a.is_wfh = 1");
                $stmt->execute([$company_id, $date]);
                $wfh = (int)$stmt->fetchColumn();

                $stmt = $db->prepare("SELECT COUNT(*) FROM attendance a JOIN employees e ON a.employee_id = e.id WHERE e.company_id = ? AND a.date = ? AND a.status = 'Late'");
                $stmt->execute([$company_id, $date]);
                $late = (int)$stmt->fetchColumn();

                $trends[] = [
                    'date' => date('d M', strtotime($date)),
                    'present' => $present,
                    'wfh' => $wfh,
                    'late' => $late
                ];
            }

            hrResponse(200, [
                'metrics' => [
                    'total_employees' => $totalEmployees,
                    'present_today' => $presentToday,
                    'absent_today' => max(0, $totalEmployees - $presentToday),
                    'late_today' => $lateToday,
                    'checked_in_today' => $presentToday,
                    'checked_out_today' => $checkedOutToday,
                    'wfh_today' => $wfhToday,
                    'avg_working_hours' => $avgHours
                ],
                'trends' => $trends
            ]);

        } catch (Exception $e) {
            hrResponse(500, ['error' => 'Failed to retrieve metrics', 'details' => $e->getMessage()]);
        }
    }
    else {
        // GET /api/hr/attendance (list)
        $dateFilter = $_GET['date'] ?? null;
        $queryStr = "SELECT a.*, u.name as employee_name, u.avatar, e.employee_code,
                            d.name as department_name, ds.name as designation_name,
                            b.name as branch_name
                     FROM attendance a
                     JOIN employees e ON a.employee_id = e.id
                     JOIN users u ON e.user_id = u.id
                     LEFT JOIN departments d ON e.department_id = d.id
                     LEFT JOIN designations ds ON e.designation_id = ds.id
                     LEFT JOIN branches b ON e.branch_id = b.id
                     WHERE e.company_id = ?";
        
        $params = [$company_id];
        if ($dateFilter) {
            $queryStr .= " AND a.date = ?";
            $params[] = $dateFilter;
        }
        $queryStr .= " ORDER BY a.date DESC, a.clock_in DESC LIMIT 150";
        
        $stmt = $db->prepare($queryStr);
        $stmt->execute($params);
        $attendanceRecords = $stmt->fetchAll();
        
        hrResponse(200, ['attendance' => $attendanceRecords]);
    }
}

elseif ($action === 'live-attendance') {
    // GET /api/hr/live-attendance
    $today = date('Y-m-d');
    $stmt = $db->prepare("SELECT a.*, u.name as employee_name, u.avatar, e.employee_code,
                                 d.name as department_name, ds.name as designation_name,
                                 b.name as branch_name
                          FROM attendance a
                          JOIN employees e ON a.employee_id = e.id
                          JOIN users u ON e.user_id = u.id
                          LEFT JOIN departments d ON e.department_id = d.id
                          LEFT JOIN designations ds ON e.designation_id = ds.id
                          LEFT JOIN branches b ON e.branch_id = b.id
                          WHERE e.company_id = ? AND a.date = ?
                          ORDER BY a.clock_in DESC");
    $stmt->execute([$company_id, $today]);
    $liveAttendance = $stmt->fetchAll();
    
    hrResponse(200, ['live_attendance' => $liveAttendance]);
}

elseif ($action === 'company/settings') {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        hrResponse(405, ['error' => 'Method not allowed']);
    }

    try {
        $cStmt = $db->prepare("SELECT * FROM companies WHERE id = ?");
        $cStmt->execute([$company_id]);
        $company = $cStmt->fetch();

        $sStmt = $db->prepare("SELECT setting_key, setting_value FROM company_settings WHERE company_id = ?");
        $sStmt->execute([$company_id]);
        $settingsRows = $sStmt->fetchAll();
        
        $settings = [];
        foreach ($settingsRows as $row) {
            $settings[$row['setting_key']] = $row['setting_value'];
        }

        hrResponse(200, [
            'company' => $company,
            'settings' => $settings
        ]);
    } catch (Exception $e) {
        hrResponse(500, ['error' => 'Failed to fetch company settings', 'details' => $e->getMessage()]);
    }
}
elseif ($action === 'company/settings/update') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        hrResponse(405, ['error' => 'Method not allowed']);
    }

    try {
        $db->beginTransaction();

        $logoPath = null;
        if (!empty($input['company_logo']) && strpos($input['company_logo'], 'data:image') === 0) {
            $logoPath = saveCompanyFile($input['company_logo'], $company_id, 'logo');
        }
        $signaturePath = null;
        if (!empty($input['signature_image']) && strpos($input['signature_image'], 'data:image') === 0) {
            $signaturePath = saveCompanyFile($input['signature_image'], $company_id, 'signature');
        }
        $sealPath = null;
        if (!empty($input['company_seal']) && strpos($input['company_seal'], 'data:image') === 0) {
            $sealPath = saveCompanyFile($input['company_seal'], $company_id, 'seal');
        }

        $companyName = $input['company_name'] ?? '';
        if (!empty($companyName)) {
            if ($logoPath) {
                $cStmt = $db->prepare("UPDATE companies SET name = ?, logo = ? WHERE id = ?");
                $cStmt->execute([$companyName, $logoPath, $company_id]);
            } else {
                $cStmt = $db->prepare("UPDATE companies SET name = ? WHERE id = ?");
                $cStmt->execute([$companyName, $company_id]);
            }
        }

        $settings = [
            'legal_name' => $input['legal_name'] ?? '',
            'display_name' => $input['display_name'] ?? '',
            'company_type' => $input['company_type'] ?? '',
            'industry' => $input['industry'] ?? '',
            'company_size' => $input['company_size'] ?? '',
            'year_established' => $input['year_established'] ?? '',
            'website' => $input['website'] ?? '',
            'official_email' => $input['official_email'] ?? '',
            'phone_number' => $input['phone_number'] ?? '',
            'registered_address' => $input['registered_address'] ?? '',
            'corporate_address' => $input['corporate_address'] ?? '',
            'city' => $input['city'] ?? '',
            'state' => $input['state'] ?? '',
            'country' => $input['country'] ?? '',
            'pin_code' => $input['pin_code'] ?? '',
            'gst_number' => $input['gst_number'] ?? '',
            'pan_number' => $input['pan_number'] ?? '',
            'tan_number' => $input['tan_number'] ?? '',
            'cin_number' => $input['cin_number'] ?? '',
            'msme_registration' => $input['msme_registration'] ?? '',
            'professional_tax_reg' => $input['professional_tax_reg'] ?? '',
            'shop_establishment_reg' => $input['shop_establishment_reg'] ?? '',
            'labour_license_number' => $input['labour_license_number'] ?? '',
            'payroll_start_date' => $input['payroll_start_date'] ?? '',
            'salary_cycle' => $input['salary_cycle'] ?? 'Monthly',
            'salary_pay_date' => $input['salary_pay_date'] ?? '',
            'financial_year' => $input['financial_year'] ?? '',
            'currency' => $input['currency'] ?? 'INR',
            'time_zone' => $input['time_zone'] ?? 'Asia/Kolkata',
            'working_days' => $input['working_days'] ?? '',
            'weekly_off' => $input['weekly_off'] ?? '',
            'standard_working_hours' => $input['standard_working_hours'] ?? '',
            'attendance_method' => $input['attendance_method'] ?? 'GPS',
            'pf_applicable' => $input['pf_applicable'] ?? 'false',
            'pf_number' => $input['pf_number'] ?? '',
            'esi_applicable' => $input['esi_applicable'] ?? 'false',
            'esi_number' => $input['esi_number'] ?? '',
            'professional_tax_applicable' => $input['professional_tax_applicable'] ?? 'false',
            'lwf_applicable' => $input['lwf_applicable'] ?? 'false',
            'gratuity_applicable' => $input['gratuity_applicable'] ?? 'false',
            'bonus_applicable' => $input['bonus_applicable'] ?? 'false',
            'authorized_signatory_name' => $input['authorized_signatory_name'] ?? '',
            'authorized_signatory_designation' => $input['authorized_signatory_designation'] ?? '',
            'bank_name' => $input['bank_name'] ?? '',
            'bank_account_holder' => $input['bank_account_holder'] ?? '',
            'bank_account_number' => $input['bank_account_number'] ?? '',
            'bank_ifsc' => $input['bank_ifsc'] ?? '',
            'bank_branch' => $input['bank_branch'] ?? ''
        ];

        if ($signaturePath) {
            $settings['signature_image_path'] = $signaturePath;
        }
        if ($sealPath) {
            $settings['company_seal_path'] = $sealPath;
        }

        foreach ($settings as $key => $val) {
            $delStmt = $db->prepare("DELETE FROM company_settings WHERE company_id = ? AND setting_key = ?");
            $delStmt->execute([$company_id, $key]);
            
            if ($val !== null) {
                $insStmt = $db->prepare("INSERT INTO company_settings (company_id, setting_key, setting_value) VALUES (?, ?, ?)");
                $insStmt->execute([$company_id, $key, (string)$val]);
            }
        }

        $db->commit();
        hrResponse(200, ['success' => true, 'message' => 'Company settings updated successfully']);
    } catch (Exception $e) {
        $db->rollBack();
        hrResponse(500, ['error' => 'Failed to update company settings', 'details' => $e->getMessage()]);
    }
}

elseif ($action === 'onboarding/submit') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        hrResponse(405, ['error' => 'Method not allowed']);
    }

    try {
        $db->beginTransaction();

        // 1. Process Logo, Signature, Seal Base64 Uploads
        $logoPath = null;
        if (!empty($input['company_logo'])) {
            $logoPath = saveCompanyFile($input['company_logo'], $company_id, 'logo');
        }
        $signaturePath = null;
        if (!empty($input['signature_image'])) {
            $signaturePath = saveCompanyFile($input['signature_image'], $company_id, 'signature');
        }
        $sealPath = null;
        if (!empty($input['company_seal'])) {
            $sealPath = saveCompanyFile($input['company_seal'], $company_id, 'seal');
        }

        // 2. Update Companies Table
        $companyName = $input['company_name'] ?? '';
        if (empty($companyName)) {
            hrResponse(400, ['error' => 'Company Name is required']);
        }
        
        $cStmt = $db->prepare("UPDATE companies SET name = ?, logo = COALESCE(?, logo), onboarding_completed = 1 WHERE id = ?");
        $cStmt->execute([$companyName, $logoPath, $company_id]);

        // 3. Save all key-value settings to company_settings
        $settings = [
            'legal_name' => $input['legal_name'] ?? '',
            'display_name' => $input['display_name'] ?? '',
            'company_type' => $input['company_type'] ?? '',
            'industry' => $input['industry'] ?? '',
            'company_size' => $input['company_size'] ?? '',
            'year_established' => $input['year_established'] ?? '',
            'website' => $input['website'] ?? '',
            'official_email' => $input['official_email'] ?? '',
            'phone_number' => $input['phone_number'] ?? '',
            'registered_address' => $input['registered_address'] ?? '',
            'corporate_address' => $input['corporate_address'] ?? '',
            'city' => $input['city'] ?? '',
            'state' => $input['state'] ?? '',
            'country' => $input['country'] ?? '',
            'pin_code' => $input['pin_code'] ?? '',
            'gst_number' => $input['gst_number'] ?? '',
            'pan_number' => $input['pan_number'] ?? '',
            'tan_number' => $input['tan_number'] ?? '',
            'cin_number' => $input['cin_number'] ?? '',
            'msme_registration' => $input['msme_registration'] ?? '',
            'professional_tax_reg' => $input['professional_tax_reg'] ?? '',
            'shop_establishment_reg' => $input['shop_establishment_reg'] ?? '',
            'labour_license_number' => $input['labour_license_number'] ?? '',
            'payroll_start_date' => $input['payroll_start_date'] ?? '',
            'salary_cycle' => $input['salary_cycle'] ?? 'Monthly',
            'salary_pay_date' => $input['salary_pay_date'] ?? '',
            'financial_year' => $input['financial_year'] ?? '',
            'currency' => $input['currency'] ?? 'INR',
            'time_zone' => $input['time_zone'] ?? 'Asia/Kolkata',
            'working_days' => $input['working_days'] ?? '',
            'weekly_off' => $input['weekly_off'] ?? '',
            'standard_working_hours' => $input['standard_working_hours'] ?? '',
            'attendance_method' => $input['attendance_method'] ?? 'GPS',
            'pf_applicable' => $input['pf_applicable'] ?? 'false',
            'pf_number' => $input['pf_number'] ?? '',
            'esi_applicable' => $input['esi_applicable'] ?? 'false',
            'esi_number' => $input['esi_number'] ?? '',
            'professional_tax_applicable' => $input['professional_tax_applicable'] ?? 'false',
            'lwf_applicable' => $input['lwf_applicable'] ?? 'false',
            'gratuity_applicable' => $input['gratuity_applicable'] ?? 'false',
            'bonus_applicable' => $input['bonus_applicable'] ?? 'false',
            'authorized_signatory_name' => $input['authorized_signatory_name'] ?? '',
            'authorized_signatory_designation' => $input['authorized_signatory_designation'] ?? '',
            'signature_image_path' => $signaturePath,
            'company_seal_path' => $sealPath,
            'bank_name' => $input['bank_name'] ?? '',
            'bank_account_holder' => $input['bank_account_holder'] ?? '',
            'bank_account_number' => $input['bank_account_number'] ?? '',
            'bank_ifsc' => $input['bank_ifsc'] ?? '',
            'bank_branch' => $input['bank_branch'] ?? ''
        ];

        foreach ($settings as $key => $val) {
            $delStmt = $db->prepare("DELETE FROM company_settings WHERE company_id = ? AND setting_key = ?");
            $delStmt->execute([$company_id, $key]);
            
            if ($val !== null) {
                $insStmt = $db->prepare("INSERT INTO company_settings (company_id, setting_key, setting_value) VALUES (?, ?, ?)");
                $insStmt->execute([$company_id, $key, (string)$val]);
            }
        }

        // 4. Create Organization Setup (Departments, Designations, Locations)
        if (!empty($input['departments']) && is_array($input['departments'])) {
            foreach ($input['departments'] as $dept) {
                if (!empty($dept['name'])) {
                    $dStmt = $db->prepare("INSERT INTO departments (company_id, name, code) VALUES (?, ?, ?)");
                    $dStmt->execute([$company_id, $dept['name'], $dept['code'] ?? '']);
                }
            }
        }

        if (!empty($input['designations']) && is_array($input['designations'])) {
            foreach ($input['designations'] as $des) {
                if (!empty($des['name'])) {
                    $dsStmt = $db->prepare("INSERT INTO designations (company_id, name) VALUES (?, ?)");
                    $dsStmt->execute([$company_id, $des['name']]);
                }
            }
        }

        if (!empty($input['locations']) && is_array($input['locations'])) {
            foreach ($input['locations'] as $loc) {
                if (!empty($loc['name'])) {
                    $lat = (float)($loc['latitude'] ?? 12.9716);
                    $lng = (float)($loc['longitude'] ?? 77.5946);
                    $radius = (int)($loc['radius_meters'] ?? 200);
                    $lStmt = $db->prepare("INSERT INTO branches (company_id, name, address, latitude, longitude, radius_meters) VALUES (?, ?, ?, ?, ?, ?)");
                    $lStmt->execute([$company_id, $loc['name'], $loc['address'] ?? '', $lat, $lng, $radius]);
                }
            }
        }

        // 5. Update First Admin Account (Current HR User)
        $adminName = $input['admin_name'] ?? '';
        $adminEmail = trim($input['admin_email'] ?? '');
        $adminPassword = $input['admin_password'] ?? '';
        $adminMobile = $input['admin_mobile'] ?? '';

        if (!empty($adminName) || !empty($adminEmail) || !empty($adminPassword)) {
            $uQuery = "UPDATE users SET ";
            $uParams = [];
            if (!empty($adminName)) {
                $uQuery .= "name = ?, ";
                $uParams[] = $adminName;
            }
            // Only update email if it's actually different from current email
            if (!empty($adminEmail) && strtolower($adminEmail) !== strtolower($user['email'])) {
                // Check if new email is already taken by another user
                $emailCheckStmt = $db->prepare("SELECT COUNT(*) FROM users WHERE LOWER(email) = LOWER(?) AND id != ?");
                $emailCheckStmt->execute([$adminEmail, $user['id']]);
                if ($emailCheckStmt->fetchColumn() > 0) {
                    $db->rollBack();
                    hrResponse(400, ['error' => 'The email address is already in use by another account. Please use a different email.']);
                }
                $uQuery .= "email = ?, ";
                $uParams[] = $adminEmail;
            }
            if (!empty($adminPassword)) {
                $uQuery .= "password_hash = ?, ";
                $uParams[] = password_hash($adminPassword, PASSWORD_DEFAULT);
            }
            $uQuery = rtrim($uQuery, ', ');
            $uQuery .= " WHERE id = ?";
            $uParams[] = $user['id'];

            // Only run if there's something to update
            if (count($uParams) > 1) {
                $uStmt = $db->prepare($uQuery);
                $uStmt->execute($uParams);
            }
        }

        if (!empty($adminMobile)) {
            $eStmt = $db->prepare("UPDATE employees SET phone = ? WHERE user_id = ?");
            $eStmt->execute([$adminMobile, $user['id']]);
        }

        $db->commit();

        // Regenerate JWT so frontend gets updated token
        $empStmt = $db->prepare("SELECT e.*, c.name as company_name, c.code as company_code, c.onboarding_completed FROM employees e JOIN companies c ON e.company_id = c.id WHERE e.user_id = ?");
        $empStmt->execute([$user['id']]);
        $employeeRecord = $empStmt->fetch();

        $userStmt = $db->prepare("SELECT * FROM users WHERE id = ?");
        $userStmt->execute([$user['id']]);
        $userRecord = $userStmt->fetch();

        $tokenPayload = [
            'id' => $userRecord['id'],
            'email' => $userRecord['email'],
            'role' => $userRecord['role'],
            'name' => $userRecord['name'],
            'company_id' => $employeeRecord ? $employeeRecord['company_id'] : null,
            'employee_id' => $employeeRecord ? $employeeRecord['id'] : null,
            'branch_id' => $employeeRecord ? $employeeRecord['branch_id'] : null,
            'onboarding_completed' => 1
        ];

        require_once __DIR__ . '/../helpers/jwt.php';
        $token = JWT::generate($tokenPayload);

        hrResponse(200, [
            'message' => 'Company onboarding completed successfully',
            'token' => $token,
            'user' => [
                'id' => $userRecord['id'],
                'email' => $userRecord['email'],
                'name' => $userRecord['name'],
                'role' => $userRecord['role'],
                'avatar' => $userRecord['avatar'],
                'company_name' => $employeeRecord ? $employeeRecord['company_name'] : null,
                'employee_code' => $employeeRecord ? $employeeRecord['employee_code'] : null,
                'employee_id' => $employeeRecord ? $employeeRecord['id'] : null,
                'onboarding_completed' => 1
            ]
        ]);

    } catch (Exception $e) {
        $db->rollBack();
        hrResponse(500, ['error' => 'Failed to complete company onboarding', 'details' => $e->getMessage()]);
    }
}

elseif ($action === 'cycles' || $action === 'cycles/lock' || $action === 'payslips' || $action === 'invoices' || $action === 'invoices/create' || $action === 'invoices/update') {
    $serviceTypeStmt = $db->prepare("SELECT service_type FROM companies WHERE id = ?");
    $serviceTypeStmt->execute([$company_id]);
    $service_type = $serviceTypeStmt->fetchColumn() ?: 'CompletePayroll';
    
    if ($service_type !== 'PlatformServices') {
        hrResponse(403, ['error' => 'Forbidden: Payroll processing and invoicing is managed by the assigned CA/Finance administrator under your subscription.']);
    }

    if ($action === 'cycles') {
        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            try {
                $stmt = $db->prepare("SELECT * FROM payroll_cycles WHERE company_id = ? ORDER BY id DESC");
                $stmt->execute([$company_id]);
                hrResponse(200, ['cycles' => $stmt->fetchAll()]);
            } catch (Exception $e) {
                hrResponse(500, ['error' => 'Failed to fetch payroll cycles', 'details' => $e->getMessage()]);
            }
        }
        
        elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $month = (int)($input['month'] ?? date('m'));
            $year = (int)($input['year'] ?? date('Y'));

            try {
                $db->beginTransaction();

                $checkStmt = $db->prepare("SELECT id FROM payroll_cycles WHERE company_id = ? AND month = ? AND year = ?");
                $checkStmt->execute([$company_id, $month, $year]);
                if ($checkStmt->fetch()) {
                    hrResponse(400, ['error' => "Payroll for {$month}/{$year} has already been initiated or processed"]);
                }

                $cycleStmt = $db->prepare("INSERT INTO payroll_cycles (company_id, month, year, status, processed_at, processed_by) VALUES (?, ?, ?, 'Draft', ?, ?)");
                $cycleStmt->execute([$company_id, $month, $year, date('Y-m-d H:i:s'), $user['id']]);
                $cycleId = $db->lastInsertId();

                $empStmt = $db->prepare("SELECT id, monthly_salary, annual_ctc, basic, hra, conveyance_allowance, medical_allowance, fixed_allowance, employer_pf, employer_esi, gratuity, insurance, bonus, lwf FROM employees WHERE company_id = ? AND status = 'Active'");
                $empStmt->execute([$company_id]);
                $employees = $empStmt->fetchAll();
                $total_employees = count($employees);

                $payslipStmt = $db->prepare("INSERT INTO payslips (payroll_cycle_id, employee_id, gross_salary, basic, hra, allowances, pf, esi, tds, other_deductions, net_salary, overtime_pay, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Unpaid')");
                
                foreach ($employees as $emp) {
                    $gross = (float)$emp['monthly_salary'];
                    
                    $monthStr = str_pad($month, 2, '0', STR_PAD_LEFT);
                    $datePattern = "{$year}-{$monthStr}-%";
                    $otStmt = $db->prepare("SELECT SUM(overtime_minutes) FROM attendance WHERE employee_id = ? AND date LIKE ?");
                    $otStmt->execute([$emp['id'], $datePattern]);
                    $otMinutes = (int)($otStmt->fetchColumn() ?? 0);
                    
                    $baseOtRatePerMin = 5.00;
                    $otRatePerMin = $baseOtRatePerMin * $total_employees;
                    $otPay = $otMinutes * $otRatePerMin;
                    
                    $basic = (float)$emp['basic'] / 12;
                    $hra = (float)$emp['hra'] / 12;
                    $allowances = ((float)$emp['conveyance_allowance'] + (float)$emp['medical_allowance'] + (float)$emp['fixed_allowance']) / 12;
                    
                    $pf = $basic * 0.12;
                    $esi = ($gross < 21000) ? ($gross * 0.0075) : 0.00;
                    $tds = ($gross > 50000) ? ($gross * 0.05) : 0.00;
                    
                    $other = 0.00;
                    if ($gross > 15000) {
                        $other = 200.00;
                    }
                    
                    $grossWithOt = $gross + $otPay;
                    $totalDeductions = $pf + $esi + $tds + $other;
                    $net = $grossWithOt - $totalDeductions;

                    $payslipStmt->execute([
                        $cycleId,
                        $emp['id'],
                        $grossWithOt,
                        $basic,
                        $hra,
                        $allowances,
                        $pf,
                        $esi,
                        $tds,
                        $other,
                        $net,
                        $otPay
                    ]);
                }

                $db->commit();
                hrResponse(201, ['message' => "Payroll cycle for {$month}/{$year} processed as Draft", 'cycle_id' => $cycleId]);
            } catch (Exception $e) {
                if ($db->inTransaction()) {
                    $db->rollBack();
                }
                hrResponse(500, ['error' => 'Payroll execution failed', 'details' => $e->getMessage()]);
            }
        }
    }

    elseif ($action === 'cycles/lock') {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            hrResponse(405, ['error' => 'Method not allowed']);
        }
        $cycle_id = $input['cycle_id'] ?? null;
        $status = $input['status'] ?? 'Paid';

        if (!$cycle_id) {
            hrResponse(400, ['error' => 'Cycle ID is required']);
        }

        try {
            $stmt = $db->prepare("UPDATE payroll_cycles SET status = ? WHERE id = ? AND company_id = ?");
            $stmt->execute([$status, $cycle_id, $company_id]);

            if ($status === 'Paid') {
                $payStmt = $db->prepare("UPDATE payslips SET status = 'Paid' WHERE payroll_cycle_id = ?");
                $payStmt->execute([$cycle_id]);
            }
            hrResponse(200, ['message' => "Payroll cycle status updated to " . $status]);
        } catch (Exception $e) {
            hrResponse(500, ['error' => 'Failed to lock cycle', 'details' => $e->getMessage()]);
        }
    }

    elseif ($action === 'payslips') {
        $cycle_id = $_GET['cycle_id'] ?? null;
        if (!$cycle_id) {
            hrResponse(400, ['error' => 'Cycle ID is required']);
        }
        try {
            $stmt = $db->prepare("
                SELECT p.*, u.name as employee_name, e.employee_code, e.monthly_salary, 
                       p.pf as pf_deduction, p.esi as esi_deduction, p.tds as tds_deduction, p.other_deductions as professional_tax
                FROM payslips p
                JOIN employees e ON p.employee_id = e.id
                JOIN users u ON e.user_id = u.id
                WHERE p.payroll_cycle_id = ? AND e.company_id = ?
            ");
            $stmt->execute([$cycle_id, $company_id]);
            hrResponse(200, ['payslips' => $stmt->fetchAll()]);
        } catch (Exception $e) {
            hrResponse(500, ['error' => 'Failed to fetch payslips', 'details' => $e->getMessage()]);
        }
    }

    elseif ($action === 'invoices') {
        try {
            $filter_month = $_GET['filter_month'] ?? null;
            $filter_year = $_GET['filter_year'] ?? null;
            $search_number = $_GET['search_number'] ?? null;

            $query = "
                SELECT i.*, c.name as company_name, c.code as company_code
                FROM ca_invoices i
                JOIN companies c ON i.company_id = c.id
                WHERE i.company_id = ?
            ";
            $params = [$company_id];

            if ($filter_month) {
                $query .= " AND i.billing_month = ?";
                $params[] = $filter_month;
            }
            if ($filter_year) {
                $query .= " AND i.billing_year = ?";
                $params[] = $filter_year;
            }
            if ($search_number) {
                $query .= " AND i.invoice_number LIKE ?";
                $params[] = '%' . $search_number . '%';
            }

            $query .= " ORDER BY i.id DESC";

            $stmt = $db->prepare($query);
            $stmt->execute($params);
            hrResponse(200, ['invoices' => $stmt->fetchAll()]);
        } catch (Exception $e) {
            hrResponse(500, ['error' => 'Failed to fetch invoices', 'details' => $e->getMessage()]);
        }
    }

    elseif ($action === 'invoices/create') {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            hrResponse(405, ['error' => 'Method not allowed']);
        }
        
        $billing_month = (int)($input['billing_month'] ?? date('m'));
        $billing_year = (int)($input['billing_year'] ?? date('Y'));
        
        $client_name = $input['client_name'] ?? '';
        $client_address = $input['client_address'] ?? '';
        $client_gstin = $input['client_gstin'] ?? '';
        
        $basic_da_rate = (float)($input['basic_da_rate'] ?? 0.00);
        $basic_da_mandays = (float)($input['basic_da_mandays'] ?? 0.00);
        $basic_da_amount = (float)($input['basic_da_amount'] ?? 0.00);
        
        $allowances_rate = (float)($input['allowances_rate'] ?? 0.00);
        $allowances_mandays = (float)($input['allowances_mandays'] ?? 0.00);
        $allowances_amount = (float)($input['allowances_amount'] ?? 0.00);
        
        $epf_rate = (float)($input['epf_rate'] ?? 13.00);
        $epf_amount = (float)($input['epf_amount'] ?? 0.00);
        
        $esic_rate = (float)($input['esic_rate'] ?? 3.25);
        $esic_amount = (float)($input['esic_amount'] ?? 0.00);
        
        $service_charge_rate = (float)($input['service_charge_rate'] ?? 5.00);
        $service_charge_amount = (float)($input['service_charge_amount'] ?? 0.00);
        
        $cgst_rate = (float)($input['cgst_rate'] ?? 9.00);
        $cgst_amount = (float)($input['cgst_amount'] ?? 0.00);
        
        $sgst_rate = (float)($input['sgst_rate'] ?? 9.00);
        $sgst_amount = (float)($input['sgst_amount'] ?? 0.00);
        
        $tds_rate = (float)($input['tds_rate'] ?? 2.00);
        $tds_amount = (float)($input['tds_amount'] ?? 0.00);
        
        $net_payment = (float)($input['net_payment'] ?? 0.00);
        
        $bank_name = $input['bank_name'] ?? '';
        $bank_account_number = $input['bank_account_number'] ?? '';
        $bank_account_type = $input['bank_account_type'] ?? '';
        $bank_branch = $input['bank_branch'] ?? '';
        $bank_ifsc = $input['bank_ifsc'] ?? '';
        
        $company_gstin = $input['company_gstin'] ?? '';
        $company_pan = $input['company_pan'] ?? '';
        $company_esi = $input['company_esi'] ?? '';
        $company_epf = $input['company_epf'] ?? '';
        
        $invoice_date = $input['invoice_date'] ?? date('Y-m-d');
        $invoice_number_input = $input['invoice_number'] ?? '';

        $professional_fee = $basic_da_amount + $allowances_amount;
        $gst_amount = $cgst_amount + $sgst_amount;
        $grand_total = $professional_fee + $epf_amount + $esic_amount + $service_charge_amount + $gst_amount;

        try {
            $db->beginTransaction();

            $invoice_number = $invoice_number_input ?: ("INV-TAX-" . str_pad($user['id'], 3, '0', STR_PAD_LEFT) . "-" . str_pad($company_id, 3, '0', STR_PAD_LEFT) . "-" . time());

            $stmt = $db->prepare("
                INSERT INTO ca_invoices (
                    invoice_number, ca_id, company_id, billing_month, billing_year, 
                    invoice_date, professional_fee, gst_amount, additional_charges, 
                    discount, grand_total, payment_details, digital_signature,
                    client_name, client_address, client_gstin,
                    basic_da_rate, basic_da_mandays, basic_da_amount,
                    allowances_rate, allowances_mandays, allowances_amount,
                    epf_rate, epf_amount, esic_rate, esic_amount,
                    service_charge_rate, service_charge_amount,
                    cgst_rate, cgst_amount, sgst_rate, sgst_amount,
                    tds_rate, tds_amount, net_payment,
                    bank_name, bank_account_number, bank_account_type, bank_branch, bank_ifsc,
                    company_gstin, company_pan, company_esi, company_epf
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0.00, 0.00, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $invoice_number, $user['id'], $company_id, $billing_month, $billing_year,
                $invoice_date, $professional_fee, $gst_amount, $grand_total,
                $input['payment_details'] ?? '', $input['digital_signature'] ?? '',
                $client_name, $client_address, $client_gstin,
                $basic_da_rate, $basic_da_mandays, $basic_da_amount,
                $allowances_rate, $allowances_mandays, $allowances_amount,
                $epf_rate, $epf_amount, $esic_rate, $esic_amount,
                $service_charge_rate, $service_charge_amount,
                $cgst_rate, $cgst_amount, $sgst_rate, $sgst_amount,
                $tds_rate, $tds_amount, $net_payment,
                $bank_name, $bank_account_number, $bank_account_type, $bank_branch, $bank_ifsc,
                $company_gstin, $company_pan, $company_esi, $company_epf
            ]);
            $invoice_id = $db->lastInsertId();

            $db->commit();
            hrResponse(201, ['message' => 'Invoice generated successfully', 'invoice_id' => $invoice_id, 'invoice_number' => $invoice_number]);
        } catch (Exception $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            hrResponse(500, ['error' => 'Failed to generate invoice', 'details' => $e->getMessage()]);
        }
    }

    elseif ($action === 'invoices/update') {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            hrResponse(405, ['error' => 'Method not allowed']);
        }
        $id = $input['id'] ?? null;
        if (!$id) {
            hrResponse(400, ['error' => 'Invoice ID is required']);
        }

        try {
            $chk = $db->prepare("SELECT ca_id, company_id FROM ca_invoices WHERE id = ?");
            $chk->execute([$id]);
            $inv = $chk->fetch();
            if (!$inv || $inv['company_id'] !== $company_id) {
                hrResponse(404, ['error' => 'Invoice not found']);
            }

            $billing_month = (int)($input['billing_month'] ?? date('m'));
            $billing_year = (int)($input['billing_year'] ?? date('Y'));
            
            $client_name = $input['client_name'] ?? '';
            $client_address = $input['client_address'] ?? '';
            $client_gstin = $input['client_gstin'] ?? '';
            
            $basic_da_rate = (float)($input['basic_da_rate'] ?? 0.00);
            $basic_da_mandays = (float)($input['basic_da_mandays'] ?? 0.00);
            $basic_da_amount = (float)($input['basic_da_amount'] ?? 0.00);
            
            $allowances_rate = (float)($input['allowances_rate'] ?? 0.00);
            $allowances_mandays = (float)($input['allowances_mandays'] ?? 0.00);
            $allowances_amount = (float)($input['allowances_amount'] ?? 0.00);
            
            $epf_rate = (float)($input['epf_rate'] ?? 13.00);
            $epf_amount = (float)($input['epf_amount'] ?? 0.00);
            
            $esic_rate = (float)($input['esic_rate'] ?? 3.25);
            $esic_amount = (float)($input['esic_amount'] ?? 0.00);
            
            $service_charge_rate = (float)($input['service_charge_rate'] ?? 5.00);
            $service_charge_amount = (float)($input['service_charge_amount'] ?? 0.00);
            
            $cgst_rate = (float)($input['cgst_rate'] ?? 9.00);
            $cgst_amount = (float)($input['cgst_amount'] ?? 0.00);
            
            $sgst_rate = (float)($input['sgst_rate'] ?? 9.00);
            $sgst_amount = (float)($input['sgst_amount'] ?? 0.00);
            
            $tds_rate = (float)($input['tds_rate'] ?? 2.00);
            $tds_amount = (float)($input['tds_amount'] ?? 0.00);
            
            $net_payment = (float)($input['net_payment'] ?? 0.00);
            
            $bank_name = $input['bank_name'] ?? '';
            $bank_account_number = $input['bank_account_number'] ?? '';
            $bank_account_type = $input['bank_account_type'] ?? '';
            $bank_branch = $input['bank_branch'] ?? '';
            $bank_ifsc = $input['bank_ifsc'] ?? '';
            
            $company_gstin = $input['company_gstin'] ?? '';
            $company_pan = $input['company_pan'] ?? '';
            $company_esi = $input['company_esi'] ?? '';
            $company_epf = $input['company_epf'] ?? '';
            
            $invoice_date = $input['invoice_date'] ?? date('Y-m-d');
            $invoice_number_input = $input['invoice_number'] ?? '';

            $professional_fee = $basic_da_amount + $allowances_amount;
            $gst_amount = $cgst_amount + $sgst_amount;
            $grand_total = $professional_fee + $epf_amount + $esic_amount + $service_charge_amount + $gst_amount;

            $db->beginTransaction();

            $stmt = $db->prepare("
                UPDATE ca_invoices SET
                    invoice_number = ?, billing_month = ?, billing_year = ?, invoice_date = ?,
                    professional_fee = ?, gst_amount = ?, grand_total = ?,
                    payment_details = ?, digital_signature = ?,
                    client_name = ?, client_address = ?, client_gstin = ?,
                    basic_da_rate = ?, basic_da_mandays = ?, basic_da_amount = ?,
                    allowances_rate = ?, allowances_mandays = ?, allowances_amount = ?,
                    epf_rate = ?, epf_amount = ?, esic_rate = ?, esic_amount = ?,
                    service_charge_rate = ?, service_charge_amount = ?,
                    cgst_rate = ?, cgst_amount = ?, sgst_rate = ?, sgst_amount = ?,
                    tds_rate = ?, tds_amount = ?, net_payment = ?,
                    bank_name = ?, bank_account_number = ?, bank_account_type = ?, bank_branch = ?, bank_ifsc = ?,
                    company_gstin = ?, company_pan = ?, company_esi = ?, company_epf = ?
                WHERE id = ?
            ");
            $stmt->execute([
                $invoice_number_input, $billing_month, $billing_year, $invoice_date,
                $professional_fee, $gst_amount, $grand_total,
                $input['payment_details'] ?? '', $input['digital_signature'] ?? '',
                $client_name, $client_address, $client_gstin,
                $basic_da_rate, $basic_da_mandays, $basic_da_amount,
                $allowances_rate, $allowances_mandays, $allowances_amount,
                $epf_rate, $epf_amount, $esic_rate, $esic_amount,
                $service_charge_rate, $service_charge_amount,
                $cgst_rate, $cgst_amount, $sgst_rate, $sgst_amount,
                $tds_rate, $tds_amount, $net_payment,
                $bank_name, $bank_account_number, $bank_account_type, $bank_branch, $bank_ifsc,
                $company_gstin, $company_pan, $company_esi, $company_epf,
                $id
            ]);

            $db->commit();
            hrResponse(200, ['message' => 'Invoice updated successfully']);
        } catch (Exception $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            hrResponse(500, ['error' => 'Failed to update invoice', 'details' => $e->getMessage()]);
        }
    }
}

elseif ($action === 'ca-partner') {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        try {
            $stmt = $db->prepare("
                SELECT u.id, u.name, u.email, u.status, cp.*
                FROM users u
                JOIN company_assignments ca ON u.id = ca.user_id
                LEFT JOIN ca_profiles cp ON u.id = cp.user_id
                WHERE ca.company_id = ? AND u.role = 'finance'
            ");
            $stmt->execute([$company_id]);
            hrResponse(200, ['ca_partners' => $stmt->fetchAll()]);
        } catch (Exception $e) {
            hrResponse(500, ['error' => 'Failed to fetch CA partners', 'details' => $e->getMessage()]);
        }
    }
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $email = $input['email'] ?? '';
        $password = $input['password'] ?? '';
        $name = $input['name'] ?? '';
        
        $firm_name = $input['firm_name'] ?? '';
        $registration_number = $input['registration_number'] ?? '';
        $gst_number = $input['gst_number'] ?? '';
        $pan_number = $input['pan_number'] ?? '';
        $mobile_number = $input['mobile_number'] ?? '';
        $address = $input['address'] ?? '';
        
        $bank_name = $input['bank_name'] ?? '';
        $account_number = $input['account_number'] ?? '';
        $ifsc_code = $input['ifsc_code'] ?? '';
        $upi_id = $input['upi_id'] ?? '';
        $digital_signature = $input['digital_signature'] ?? '';

        if (empty($email) || empty($password) || empty($name)) {
            hrResponse(400, ['error' => 'Email, Password, and Name are required']);
        }

        try {
            $db->beginTransaction();

            // Check if email already exists
            $check = $db->prepare("SELECT id FROM users WHERE email = ?");
            $check->execute([$email]);
            if ($check->fetch()) {
                hrResponse(400, ['error' => 'A user with this email address already exists']);
            }

            // Create user
            $hash = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $db->prepare("INSERT INTO users (email, password_hash, role, name, status) VALUES (?, ?, 'finance', ?, 'Active')");
            $stmt->execute([$email, $hash, $name]);
            $newUserId = $db->lastInsertId();

            // Create CA Profile
            $stmt = $db->prepare("
                INSERT INTO ca_profiles (
                    user_id, firm_name, registration_number, gst_number, pan_number, 
                    mobile_number, address, bank_name, account_number, ifsc_code, upi_id, digital_signature
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $newUserId, $firm_name, $registration_number, $gst_number, $pan_number,
                $mobile_number, $address, $bank_name, $account_number, $ifsc_code, $upi_id, $digital_signature
            ]);

            // Assign CA to Company
            $stmt = $db->prepare("INSERT INTO company_assignments (company_id, user_id, assigned_by, status) VALUES (?, ?, ?, 'Active')");
            $stmt->execute([$company_id, $newUserId, $user['id']]);

            $db->commit();
            hrResponse(201, ['message' => 'CA/Finance Partner profile created and assigned successfully']);
        } catch (Exception $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            hrResponse(500, ['error' => 'Failed to create CA partner', 'details' => $e->getMessage()]);
        }
    }
}

else {
    hrResponse(404, ['error' => 'HR endpoint not found']);
}
