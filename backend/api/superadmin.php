<?php
// backend/api/superadmin.php

if (!isset($db) || !isset($route) || !isset($user)) {
    exit('Direct access not allowed');
}

$action = str_replace('/api/superadmin/', '', $route);

function jsonResponse($code, $data) {
    http_response_code($code);
    echo json_encode($data);
    exit();
}

function logAuditEvent($db, $userId, $action, $details) {
    $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown Device';
    
    $execUser = null;
    if ($userId) {
        $stmt = $db->prepare("SELECT name, role FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $execUser = $stmt->fetch();
    }
    $execName = $execUser ? $execUser['name'] : 'System';
    $execRole = $execUser ? $execUser['role'] : 'System';
    
    if (is_array($details)) {
        $details['user_name'] = $execName;
        $details['role'] = $execRole;
        $details['ip_address'] = $ip;
        $details['device'] = $userAgent;
        $details_str = json_encode($details);
    } else {
        $details_str = json_encode([
            'message' => $details,
            'user_name' => $execName,
            'role' => $execRole,
            'ip_address' => $ip,
            'device' => $userAgent
        ]);
    }
    
    $stmt = $db->prepare("INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)");
    $stmt->execute([$userId, $action, $details_str]);
}

if ($action === 'dashboard') {
    // Platform analytics for Super Admin
    try {
        $companiesCount = $db->query("SELECT COUNT(*) FROM companies")->fetchColumn();
        $usersCount = $db->query("SELECT COUNT(*) FROM users WHERE role = 'employee'")->fetchColumn();
        $plansCount = $db->query("SELECT COUNT(*) FROM plans")->fetchColumn();
        $totalRevenue = $db->query("SELECT SUM(amount) FROM payments WHERE status = 'Completed'")->fetchColumn() ?? 0.00;
        
        // Fetch revenue history for charts (mock/sample aggregations)
        $revenueHistory = [
            ['month' => 'Jan', 'revenue' => 12500],
            ['month' => 'Feb', 'revenue' => 15000],
            ['month' => 'Mar', 'revenue' => 18200],
            ['month' => 'Apr', 'revenue' => 22000],
            ['month' => 'May', 'revenue' => 26400],
            ['month' => 'Jun', 'revenue' => 31000]
        ];

        // Fetch recent active companies
        $recentCompanies = $db->query("SELECT * FROM companies ORDER BY id DESC LIMIT 5")->fetchAll();

        jsonResponse(200, [
            'metrics' => [
                'total_companies' => (int)$companiesCount,
                'total_employees' => (int)$usersCount,
                'total_plans' => (int)$plansCount,
                'total_revenue' => (float)$totalRevenue
            ],
            'revenue_history' => $revenueHistory,
            'recent_companies' => $recentCompanies
        ]);
    } catch (Exception $e) {
        jsonResponse(500, ['error' => 'Failed to load superadmin stats', 'details' => $e->getMessage()]);
    }
}

elseif ($action === 'companies') {
    // List or toggle status of companies
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $companies = $db->query("
            SELECT c.*, u.name as assigned_ca_name, u.email as assigned_ca_email, u.id as assigned_ca_id, cp.firm_name as assigned_ca_firm
            FROM companies c
            LEFT JOIN company_assignments ca ON c.id = ca.company_id
            LEFT JOIN users u ON ca.user_id = u.id
            LEFT JOIN ca_profiles cp ON u.id = cp.user_id
            ORDER BY c.id DESC
        ")->fetchAll();
        jsonResponse(200, ['companies' => $companies]);
    }
    
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $company_id = $input['company_id'] ?? null;

        if (!$company_id) {
            jsonResponse(400, ['error' => 'Company ID is required']);
        }

        if (isset($input['plan_name'])) {
            $plan_name = $input['plan_name'];
            $subscription_end = $input['subscription_end'] ?? null;
            $service_type = $input['service_type'] ?? null;
            
            if ($subscription_end && $service_type) {
                $stmt = $db->prepare("UPDATE companies SET plan_name = ?, subscription_end = ?, service_type = ? WHERE id = ?");
                $stmt->execute([$plan_name, $subscription_end, $service_type, $company_id]);
            } elseif ($subscription_end) {
                $stmt = $db->prepare("UPDATE companies SET plan_name = ?, subscription_end = ? WHERE id = ?");
                $stmt->execute([$plan_name, $subscription_end, $company_id]);
            } elseif ($service_type) {
                $stmt = $db->prepare("UPDATE companies SET plan_name = ?, service_type = ? WHERE id = ?");
                $stmt->execute([$plan_name, $service_type, $company_id]);
            } else {
                $stmt = $db->prepare("UPDATE companies SET plan_name = ? WHERE id = ?");
                $stmt->execute([$plan_name, $company_id]);
            }
            jsonResponse(200, ['message' => 'Subscription details updated successfully']);
        } else {
            $status = $input['status'] ?? 'Active'; // Active or Suspended
            $stmt = $db->prepare("UPDATE companies SET status = ? WHERE id = ?");
            $stmt->execute([$status, $company_id]);
            jsonResponse(200, ['message' => 'Company status updated to ' . $status]);
        }
    }
}

elseif ($action === 'companies/create') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        jsonResponse(405, ['error' => 'Method not allowed']);
    }

    $name = $input['name'] ?? '';
    $code = $input['code'] ?? '';
    $hr_name = $input['hr_name'] ?? '';
    $hr_email = $input['hr_email'] ?? '';
    $hr_password = $input['hr_password'] ?? '';

    if (empty($name) || empty($code) || empty($hr_name) || empty($hr_email) || empty($hr_password)) {
        jsonResponse(400, ['error' => 'All fields (Company Name, Code, HR Name, Email, Password) are required']);
    }

    // Check unique company code
    $codeCheck = $db->prepare("SELECT COUNT(*) FROM companies WHERE code = ?");
    $codeCheck->execute([$code]);
    if ($codeCheck->fetchColumn() > 0) {
        jsonResponse(400, ['error' => 'Company code must be unique']);
    }

    // Check unique email
    $emailCheck = $db->prepare("SELECT COUNT(*) FROM users WHERE email = ?");
    $emailCheck->execute([$hr_email]);
    if ($emailCheck->fetchColumn() > 0) {
        jsonResponse(400, ['error' => 'HR email is already registered']);
    }

    try {
        $db->beginTransaction();

        $service_type = $input['service_type'] ?? 'CompletePayroll';

        // 1. Create Company
        $cStmt = $db->prepare("INSERT INTO companies (name, code, status, plan_name, subscription_end, service_type) VALUES (?, ?, 'Active', 'Premium Growth', ?, ?)");
        $cStmt->execute([$name, $code, date('Y-m-d H:i:s', time() + 365 * 86400), $service_type]);
        $companyId = $db->lastInsertId();

        // 2. Create Default Branch
        $bStmt = $db->prepare("INSERT INTO branches (company_id, name, address, latitude, longitude, radius_meters) VALUES (?, 'Main Branch', 'Corporate Center', 12.9716, 77.5946, 200)");
        $bStmt->execute([$companyId]);
        $branchId = $db->lastInsertId();

        // 3. Create Default Department & Designation
        $dStmt = $db->prepare("INSERT INTO departments (company_id, name, code) VALUES (?, 'Management', 'MGMT')");
        $dStmt->execute([$companyId]);
        $deptId = $db->lastInsertId();

        $desStmt = $db->prepare("INSERT INTO designations (company_id, name) VALUES (?, 'HR Manager')");
        $desStmt->execute([$companyId]);
        $designationId = $db->lastInsertId();

        // 4. Create HR User
        $passHash = password_hash($hr_password, PASSWORD_DEFAULT);
        $userStmt = $db->prepare("INSERT INTO users (email, password_hash, role, name) VALUES (?, ?, 'hr', ?)");
        $userStmt->execute([$hr_email, $passHash, $hr_name]);
        $userId = $db->lastInsertId();

        // 5. Create HR Employee record
        $empStmt = $db->prepare("INSERT INTO employees (user_id, company_id, branch_id, department_id, designation_id, employee_code, date_of_joining, monthly_salary) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $empStmt->execute([$userId, $companyId, $branchId, $deptId, $designationId, 'HR' . rand(1000, 9999), date('Y-m-d H:i:s'), 80000.00]);

        // 6. Setup default leave types for company
        $ltStmt = $db->prepare("INSERT INTO leave_types (company_id, name, total_days) VALUES (?, 'Sick Leave', 12)");
        $ltStmt->execute([$companyId]);
        $ltStmt = $db->prepare("INSERT INTO leave_types (company_id, name, total_days) VALUES (?, 'Casual Leave', 12)");
        $ltStmt->execute([$companyId]);

        $db->commit();
        jsonResponse(201, ['message' => 'Company and HR User registered successfully']);
    } catch (Exception $e) {
        $db->rollBack();
        jsonResponse(500, ['error' => 'Failed to create company and HR user', 'details' => $e->getMessage()]);
    }
}

elseif ($action === 'plans') {
    // Subscriptions Plan management
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $plans = $db->query("SELECT * FROM plans")->fetchAll();
        jsonResponse(200, ['plans' => $plans]);
    }
    
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $name = $input['name'] ?? '';
        $price = $input['price'] ?? 0.00;
        $max_employees = $input['max_employees'] ?? 100;
        $features = $input['features'] ?? '';

        if (empty($name)) {
            jsonResponse(400, ['error' => 'Plan Name is required']);
        }

        $stmt = $db->prepare("INSERT INTO plans (name, price, max_employees, features) VALUES (?, ?, ?, ?)");
        $stmt->execute([$name, $price, $max_employees, $features]);

        jsonResponse(201, ['message' => 'Plan created successfully', 'plan_id' => $db->lastInsertId()]);
    }
}

elseif ($action === 'tickets') {
    // Support tickets across the tenant system
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $tickets = $db->query("SELECT t.*, c.name as company_name, u.name as user_name FROM tickets t JOIN companies c ON t.company_id = c.id JOIN users u ON t.user_id = u.id ORDER BY t.id DESC")->fetchAll();
        jsonResponse(200, ['tickets' => $tickets]);
    } 
    
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $ticket_id = $input['ticket_id'] ?? null;
        $status = $input['status'] ?? 'Resolved';

        if (!$ticket_id) {
            jsonResponse(400, ['error' => 'Ticket ID is required']);
        }

        $stmt = $db->prepare("UPDATE tickets SET status = ? WHERE id = ?");
        $stmt->execute([$status, $ticket_id]);

        jsonResponse(200, ['message' => 'Ticket status updated to ' . $status]);
    }
}

elseif ($action === 'cas') {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        jsonResponse(405, ['error' => 'Method not allowed']);
    }

    try {
        $stmt = $db->query("
            SELECT u.id, u.email, u.name, u.status, u.created_at,
                   cp.firm_name, cp.registration_number, cp.gst_number, cp.pan_number, 
                   cp.mobile_number, cp.address, cp.bank_name, cp.account_number, 
                   cp.ifsc_code, cp.upi_id, cp.digital_signature
            FROM users u
            LEFT JOIN ca_profiles cp ON u.id = cp.user_id
            WHERE u.role = 'finance'
            ORDER BY u.id DESC
        ");
        $cas = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($cas as &$ca) {
            $caId = $ca['id'];
            
            // Assigned companies
            $compStmt = $db->prepare("
                SELECT c.id, c.name, c.code, c.status
                FROM company_assignments ca
                JOIN companies c ON ca.company_id = c.id
                WHERE ca.user_id = ?
            ");
            $compStmt->execute([$caId]);
            $ca['assigned_companies'] = $compStmt->fetchAll(PDO::FETCH_ASSOC);
            $ca['total_assigned_companies'] = count($ca['assigned_companies']);

            // Invoice stats
            $invStats = $db->prepare("
                SELECT COUNT(*) as count, SUM(grand_total) as revenue 
                FROM ca_invoices 
                WHERE ca_id = ?
            ");
            $invStats->execute([$caId]);
            $stats = $invStats->fetch();
            $ca['total_invoices_count'] = (int)$stats['count'];
            $ca['total_invoice_revenue'] = (float)($stats['revenue'] ?? 0.00);
        }

        jsonResponse(200, ['cas' => $cas]);
    } catch (Exception $e) {
        jsonResponse(500, ['error' => 'Failed to retrieve CAs', 'details' => $e->getMessage()]);
    }
}

elseif ($action === 'cas/create') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        jsonResponse(405, ['error' => 'Method not allowed']);
    }

    $email = $input['email'] ?? '';
    $password = $input['password'] ?? '';
    $name = $input['name'] ?? '';
    $firm_name = $input['firm_name'] ?? '';
    $mobile_number = $input['mobile_number'] ?? '';
    $address = $input['address'] ?? '';
    $registration_number = $input['registration_number'] ?? null;
    $gst_number = $input['gst_number'] ?? null;
    $pan_number = $input['pan_number'] ?? null;
    $bank_name = $input['bank_name'] ?? null;
    $account_number = $input['account_number'] ?? null;
    $ifsc_code = $input['ifsc_code'] ?? null;
    $upi_id = $input['upi_id'] ?? null;
    $digital_signature = $input['digital_signature'] ?? null;

    if (empty($email) || empty($password) || empty($name)) {
        jsonResponse(400, ['error' => 'Email, Password and Name are required']);
    }

    $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        jsonResponse(400, ['error' => 'Email address is already in use']);
    }

    try {
        $db->beginTransaction();

        $passHash = password_hash($password, PASSWORD_DEFAULT);
        $userStmt = $db->prepare("INSERT INTO users (email, password_hash, role, name, status) VALUES (?, ?, 'finance', ?, 'Active')");
        $userStmt->execute([$email, $passHash, $name]);
        $newUserId = $db->lastInsertId();

        $profileStmt = $db->prepare("
            INSERT INTO ca_profiles (
                user_id, firm_name, registration_number, gst_number, pan_number, 
                mobile_number, address, bank_name, account_number, ifsc_code, upi_id, digital_signature
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $profileStmt->execute([
            $newUserId, $firm_name, $registration_number, $gst_number, $pan_number,
            $mobile_number, $address, $bank_name, $account_number, $ifsc_code, $upi_id, $digital_signature
        ]);

        logAuditEvent($db, $user['id'], 'CA Account Created', [
            'ca_name' => $name,
            'ca_email' => $email,
            'firm_name' => $firm_name
        ]);

        $db->commit();
        jsonResponse(201, ['message' => 'CA/Finance profile created successfully', 'ca_id' => $newUserId]);
    } catch (Exception $e) {
        $db->rollBack();
        jsonResponse(500, ['error' => 'Failed to create CA profile', 'details' => $e->getMessage()]);
    }
}

elseif ($action === 'cas/update') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        jsonResponse(405, ['error' => 'Method not allowed']);
    }

    $ca_id = $input['ca_id'] ?? null;
    $name = $input['name'] ?? '';
    $firm_name = $input['firm_name'] ?? '';
    $mobile_number = $input['mobile_number'] ?? '';
    $address = $input['address'] ?? '';
    $registration_number = $input['registration_number'] ?? null;
    $gst_number = $input['gst_number'] ?? null;
    $pan_number = $input['pan_number'] ?? null;
    $bank_name = $input['bank_name'] ?? null;
    $account_number = $input['account_number'] ?? null;
    $ifsc_code = $input['ifsc_code'] ?? null;
    $upi_id = $input['upi_id'] ?? null;
    $digital_signature = $input['digital_signature'] ?? null;
    $status = $input['status'] ?? 'Active';

    if (!$ca_id || empty($name)) {
        jsonResponse(400, ['error' => 'CA User ID and Name are required']);
    }

    try {
        $db->beginTransaction();

        $stmt = $db->prepare("UPDATE users SET name = ?, status = ? WHERE id = ? AND role = 'finance'");
        $stmt->execute([$name, $status, $ca_id]);

        $profileCheck = $db->prepare("SELECT id FROM ca_profiles WHERE user_id = ?");
        $profileCheck->execute([$ca_id]);
        if ($profileCheck->fetch()) {
            $profileStmt = $db->prepare("
                UPDATE ca_profiles SET 
                    firm_name = ?, registration_number = ?, gst_number = ?, pan_number = ?, 
                    mobile_number = ?, address = ?, bank_name = ?, account_number = ?, 
                    ifsc_code = ?, upi_id = ?, digital_signature = ?
                WHERE user_id = ?
            ");
            $profileStmt->execute([
                $firm_name, $registration_number, $gst_number, $pan_number,
                $mobile_number, $address, $bank_name, $account_number,
                $ifsc_code, $upi_id, $digital_signature, $ca_id
            ]);
        } else {
            $profileStmt = $db->prepare("
                INSERT INTO ca_profiles (
                    user_id, firm_name, registration_number, gst_number, pan_number, 
                    mobile_number, address, bank_name, account_number, ifsc_code, upi_id, digital_signature
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $profileStmt->execute([
                $ca_id, $firm_name, $registration_number, $gst_number, $pan_number,
                $mobile_number, $address, $bank_name, $account_number, $ifsc_code, $upi_id, $digital_signature
            ]);
        }

        logAuditEvent($db, $user['id'], 'CA Profile Updated', [
            'ca_id' => $ca_id,
            'ca_name' => $name,
            'status' => $status
        ]);

        $db->commit();
        jsonResponse(200, ['message' => 'CA profile updated successfully']);
    } catch (Exception $e) {
        $db->rollBack();
        jsonResponse(500, ['error' => 'Failed to update CA profile', 'details' => $e->getMessage()]);
    }
}

elseif ($action === 'cas/status') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        jsonResponse(405, ['error' => 'Method not allowed']);
    }

    $ca_id = $input['ca_id'] ?? null;
    $status = $input['status'] ?? '';

    if (!$ca_id || !in_array($status, ['Active', 'Inactive'])) {
        jsonResponse(400, ['error' => 'Valid CA ID and status (Active/Inactive) are required']);
    }

    try {
        $stmt = $db->prepare("UPDATE users SET status = ? WHERE id = ? AND role = 'finance'");
        $stmt->execute([$status, $ca_id]);

        $caName = $db->query("SELECT name FROM users WHERE id = " . (int)$ca_id)->fetchColumn();

        logAuditEvent($db, $user['id'], 'CA Status Changed', [
            'ca_id' => $ca_id,
            'ca_name' => $caName,
            'status' => $status
        ]);

        jsonResponse(200, ['message' => 'CA account status updated to ' . $status]);
    } catch (Exception $e) {
        jsonResponse(500, ['error' => 'Failed to update status', 'details' => $e->getMessage()]);
    }
}

elseif ($action === 'cas/reset-password') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        jsonResponse(405, ['error' => 'Method not allowed']);
    }

    $ca_id = $input['ca_id'] ?? null;
    $password = $input['password'] ?? '';

    if (!$ca_id || empty($password)) {
        jsonResponse(400, ['error' => 'CA User ID and password are required']);
    }

    try {
        $passHash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $db->prepare("UPDATE users SET password_hash = ? WHERE id = ? AND role = 'finance'");
        $stmt->execute([$passHash, $ca_id]);

        $caName = $db->query("SELECT name FROM users WHERE id = " . (int)$ca_id)->fetchColumn();

        logAuditEvent($db, $user['id'], 'CA Password Reset', [
            'ca_id' => $ca_id,
            'ca_name' => $caName
        ]);

        jsonResponse(200, ['message' => 'CA password reset successfully']);
    } catch (Exception $e) {
        jsonResponse(500, ['error' => 'Failed to reset password', 'details' => $e->getMessage()]);
    }
}

elseif ($action === 'cas/delete') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        jsonResponse(405, ['error' => 'Method not allowed']);
    }

    $ca_id = $input['ca_id'] ?? null;

    if (!$ca_id) {
        jsonResponse(400, ['error' => 'CA User ID is required']);
    }

    try {
        $invCheck = $db->prepare("SELECT COUNT(*) FROM ca_invoices WHERE ca_id = ?");
        $invCheck->execute([$ca_id]);
        $invoicesCount = $invCheck->fetchColumn();

        if ($invoicesCount > 0) {
            jsonResponse(400, ['error' => 'Cannot delete CA: This CA has generated professional invoices in the system.']);
        }

        $caName = $db->query("SELECT name FROM users WHERE id = " . (int)$ca_id)->fetchColumn();

        $db->beginTransaction();
        $delAssign = $db->prepare("DELETE FROM company_assignments WHERE user_id = ?");
        $delAssign->execute([$ca_id]);

        $delUser = $db->prepare("DELETE FROM users WHERE id = ? AND role = 'finance'");
        $delUser->execute([$ca_id]);

        logAuditEvent($db, $user['id'], 'CA Account Deleted', [
            'ca_id' => $ca_id,
            'ca_name' => $caName
        ]);

        $db->commit();
        jsonResponse(200, ['message' => 'CA account deleted successfully']);
    } catch (Exception $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        jsonResponse(500, ['error' => 'Failed to delete CA', 'details' => $e->getMessage()]);
    }
}

elseif ($action === 'companies/assign-ca') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        jsonResponse(405, ['error' => 'Method not allowed']);
    }

    $company_id = $input['company_id'] ?? null;
    $ca_id = $input['ca_id'] ?? null;

    if (!$company_id) {
        jsonResponse(400, ['error' => 'Company ID is required']);
    }

    try {
        $db->beginTransaction();

        $compStmt = $db->prepare("SELECT name, service_type FROM companies WHERE id = ?");
        $compStmt->execute([(int)$company_id]);
        $compInfo = $compStmt->fetch();
        
        if (!$compInfo) {
            jsonResponse(404, ['error' => 'Company not found']);
        }
        
        if ($compInfo['service_type'] === 'PlatformServices' && $ca_id) {
            jsonResponse(400, ['error' => 'Cannot assign CA: This company is configured for Platform Services Only (Self-Managed).']);
        }
        
        $compName = $compInfo['name'];
        $caName = null;
        if ($ca_id) {
            $caName = $db->query("SELECT name FROM users WHERE id = " . (int)$ca_id . " AND role = 'finance'")->fetchColumn();
            if (!$caName) {
                jsonResponse(400, ['error' => 'Invalid CA / Finance User ID']);
            }
        }

        $currentAssign = $db->query("
            SELECT a.*, u.name as prev_ca_name 
            FROM company_assignments a 
            LEFT JOIN users u ON a.user_id = u.id 
            WHERE a.company_id = " . (int)$company_id
        )->fetch();

        $delStmt = $db->prepare("DELETE FROM company_assignments WHERE company_id = ?");
        $delStmt->execute([$company_id]);

        if ($ca_id) {
            $insStmt = $db->prepare("INSERT INTO company_assignments (company_id, user_id, assigned_by) VALUES (?, ?, ?)");
            $insStmt->execute([$company_id, $ca_id, $user['id']]);

            if ($currentAssign) {
                logAuditEvent($db, $user['id'], 'CA Reassigned', [
                    'company_id' => $company_id,
                    'company_name' => $compName,
                    'prev_ca_name' => $currentAssign['prev_ca_name'],
                    'new_ca_name' => $caName
                ]);
            } else {
                logAuditEvent($db, $user['id'], 'CA Assigned', [
                    'company_id' => $company_id,
                    'company_name' => $compName,
                    'ca_name' => $caName
                ]);
            }
            $message = 'CA assigned successfully';
        } else {
            if ($currentAssign) {
                logAuditEvent($db, $user['id'], 'CA Assignment Removed', [
                    'company_id' => $company_id,
                    'company_name' => $compName,
                    'prev_ca_name' => $currentAssign['prev_ca_name']
                ]);
            }
            $message = 'CA assignment removed successfully';
        }

        $db->commit();
        jsonResponse(200, ['message' => $message]);
    } catch (Exception $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        jsonResponse(500, ['error' => 'Failed to assign/remove CA', 'details' => $e->getMessage()]);
    }
}

elseif ($action === 'invoices') {
    // Allows Super Admin to view all invoices generated by all CAs
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        jsonResponse(405, ['error' => 'Method not allowed']);
    }

    try {
        $invoices = $db->query("
            SELECT i.*, c.name as company_name, c.code as company_code, u.name as ca_name, cp.firm_name as ca_firm_name
            FROM ca_invoices i
            JOIN companies c ON i.company_id = c.id
            JOIN users u ON i.ca_id = u.id
            LEFT JOIN ca_profiles cp ON u.id = cp.user_id
            ORDER BY i.id DESC
        ")->fetchAll(PDO::FETCH_ASSOC);

        jsonResponse(200, ['invoices' => $invoices]);
    } catch (Exception $e) {
        jsonResponse(500, ['error' => 'Failed to retrieve invoices', 'details' => $e->getMessage()]);
    }
}

elseif ($action === 'audit-logs') {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        jsonResponse(405, ['error' => 'Method not allowed']);
    }

    try {
        $logs = $db->query("
            SELECT l.*, u.name as executor_name 
            FROM audit_logs l 
            LEFT JOIN users u ON l.user_id = u.id 
            ORDER BY l.id DESC
        ")->fetchAll(PDO::FETCH_ASSOC);

        jsonResponse(200, ['logs' => $logs]);
    } catch (Exception $e) {
        jsonResponse(500, ['error' => 'Failed to retrieve audit logs', 'details' => $e->getMessage()]);
    }
}

elseif ($action === 'demo-requests') {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        try {
            $requests = $db->query("SELECT * FROM demo_requests ORDER BY id DESC")->fetchAll(PDO::FETCH_ASSOC);
            jsonResponse(200, ['requests' => $requests]);
        } catch (Exception $e) {
            jsonResponse(500, ['error' => 'Failed to retrieve demo requests', 'details' => $e->getMessage()]);
        }
    } elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        $id = $_GET['id'] ?? $input['id'] ?? null;
        if (!$id) {
            jsonResponse(400, ['error' => 'ID is required']);
        }
        try {
            $stmt = $db->prepare("DELETE FROM demo_requests WHERE id = ?");
            $stmt->execute([$id]);
            jsonResponse(200, ['message' => 'Demo request deleted successfully']);
        } catch (Exception $e) {
            jsonResponse(500, ['error' => 'Failed to delete demo request', 'details' => $e->getMessage()]);
        }
    } else {
        jsonResponse(405, ['error' => 'Method not allowed']);
    }
}

else {
    jsonResponse(404, ['error' => 'Superadmin endpoint not found']);
}
