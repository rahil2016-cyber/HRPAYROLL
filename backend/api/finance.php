<?php
// backend/api/finance.php

if (!isset($db) || !isset($route) || !isset($user)) {
    exit('Direct access not allowed');
}

$action = str_replace('/api/finance/', '', $route);

function finResponse($code, $data) {
    http_response_code($code);
    echo json_encode($data);
    exit();
}

function logCAAuditEvent($db, $userId, $action, $details) {
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

// 2. Determine company context and enforce restricted CA access
$assignedCompanyIds = [];
if ($user['role'] === 'finance') {
    $stmt = $db->prepare("SELECT company_id FROM company_assignments WHERE user_id = ?");
    $stmt->execute([$user['id']]);
    $assignedCompanyIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
}

$req_company_id = $_GET['company_id'] ?? $input['company_id'] ?? null;
if ($req_company_id !== null) {
    $company_id = (int)$req_company_id;
    if ($user['role'] === 'finance' && !in_array($company_id, $assignedCompanyIds)) {
        finResponse(403, ['error' => 'Forbidden: You do not have access to this company.']);
    }
} else {
    if ($user['role'] === 'finance') {
        $company_id = !empty($assignedCompanyIds) ? (int)$assignedCompanyIds[0] : 0;
    } else {
        $company_id = $user['company_id'] ?? 0;
    }
}

if ($action === 'dashboard') {
    try {
        if ($user['role'] === 'finance' && $req_company_id === null) {
            $companies_list = [];
            $total_employees = 0;
            $payroll_pending = 0;
            $compliance_pending = 0;

            $stmt = $db->prepare("
                SELECT c.id, c.name, c.code, c.status
                FROM company_assignments ca
                JOIN companies c ON ca.company_id = c.id
                WHERE ca.user_id = ?
            ");
            $stmt->execute([$user['id']]);
            $assignedCompanies = $stmt->fetchAll();

            foreach ($assignedCompanies as $comp) {
                $compId = $comp['id'];

                $empCountStmt = $db->prepare("SELECT COUNT(*) FROM employees WHERE company_id = ? AND status = 'Active'");
                $empCountStmt->execute([$compId]);
                $empCount = (int)$empCountStmt->fetchColumn();
                $total_employees += $empCount;

                $payStmt = $db->prepare("SELECT status, month, year FROM payroll_cycles WHERE company_id = ? ORDER BY id DESC LIMIT 1");
                $payStmt->execute([$compId]);
                $latestPay = $payStmt->fetch();

                $payroll_status = 'Pending';
                if ($latestPay) {
                    if ($latestPay['status'] === 'Paid' && $latestPay['month'] == date('m') && $latestPay['year'] == date('Y')) {
                        $payroll_status = 'Paid';
                    } else {
                        $payroll_status = $latestPay['status'];
                        $payroll_pending++;
                    }
                } else {
                    $payroll_pending++;
                }

                $settingsCheck = $db->prepare("SELECT COUNT(*) FROM company_settings WHERE company_id = ?");
                $settingsCheck->execute([$compId]);
                $settingsCount = (int)$settingsCheck->fetchColumn();
                $compliance_status = $settingsCount > 0 ? 'Active' : 'Pending';
                if ($compliance_status === 'Pending') {
                    $compliance_pending++;
                }

                $invStmt = $db->prepare("SELECT invoice_date, invoice_number FROM ca_invoices WHERE ca_id = ? AND company_id = ? ORDER BY id DESC LIMIT 1");
                $invStmt->execute([$user['id'], $compId]);
                $lastInv = $invStmt->fetch();

                $companies_list[] = [
                    'id' => $compId,
                    'name' => $comp['name'],
                    'code' => $comp['code'],
                    'employees_count' => $empCount,
                    'payroll_status' => $payroll_status,
                    'pf_status' => 'Active',
                    'esi_status' => 'Active',
                    'last_invoice_date' => $lastInv ? $lastInv['invoice_date'] : null,
                    'last_invoice_number' => $lastInv ? $lastInv['invoice_number'] : null
                ];
            }

            $curMonth = (int)date('m');
            $curYear = (int)date('Y');
            $revStmt = $db->prepare("SELECT SUM(grand_total) FROM ca_invoices WHERE ca_id = ? AND billing_month = ? AND billing_year = ?");
            $revStmt->execute([$user['id'], $curMonth, $curYear]);
            $monthlyRevenue = (float)($revStmt->fetchColumn() ?? 0.00);

            $recentInvStmt = $db->prepare("
                SELECT i.*, c.name as company_name 
                FROM ca_invoices i 
                JOIN companies c ON i.company_id = c.id 
                WHERE i.ca_id = ? 
                ORDER BY i.id DESC LIMIT 5
            ");
            $recentInvStmt->execute([$user['id']]);
            $recentInvoices = $recentInvStmt->fetchAll();

            finResponse(200, [
                'is_multi_company' => true,
                'total_assigned_companies' => count($assignedCompanies),
                'total_employees' => $total_employees,
                'payroll_pending_count' => $payroll_pending,
                'compliance_pending_count' => $compliance_pending,
                'monthly_revenue' => $monthlyRevenue,
                'companies' => $companies_list,
                'recent_invoices' => $recentInvoices
            ]);
        } else {
            $cycleStmt = $db->prepare("SELECT * FROM payroll_cycles WHERE company_id = ? ORDER BY id DESC LIMIT 1");
            $cycleStmt->execute([$company_id]);
            $latestCycle = $cycleStmt->fetch();

            $expStmt = $db->prepare("SELECT COUNT(*) FROM expenses ex JOIN employees e ON ex.employee_id = e.id WHERE e.company_id = ? AND ex.status = 'Pending'");
            $expStmt->execute([$company_id]);
            $pendingExpenses = $expStmt->fetchColumn();

            $cost = 0.00;
            if ($latestCycle) {
                $costStmt = $db->prepare("SELECT SUM(net_salary) FROM payslips WHERE payroll_cycle_id = ?");
                $costStmt->execute([$latestCycle['id']]);
                $cost = $costStmt->fetchColumn() ?? 0.00;
            }

            finResponse(200, [
                'is_multi_company' => false,
                'latest_cycle' => $latestCycle,
                'pending_expenses' => (int)$pendingExpenses,
                'last_payroll_cost' => (float)$cost
            ]);
        }
    } catch (Exception $e) {
        finResponse(500, ['error' => 'Failed to load finance stats', 'details' => $e->getMessage()]);
    }
}

elseif ($action === 'cycles') {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $stmt = $db->prepare("SELECT * FROM payroll_cycles WHERE company_id = ? ORDER BY id DESC");
        $stmt->execute([$company_id]);
        finResponse(200, ['cycles' => $stmt->fetchAll()]);
    }
    
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Run Payroll Cycle
        $month = (int)($input['month'] ?? date('m'));
        $year = (int)($input['year'] ?? date('Y'));

        if (empty($month) || empty($year)) {
            finResponse(400, ['error' => 'Month and Year are required']);
        }

        try {
            $db->beginTransaction();

            // Check if cycle already exists
            $checkStmt = $db->prepare("SELECT id FROM payroll_cycles WHERE company_id = ? AND month = ? AND year = ?");
            $checkStmt->execute([$company_id, $month, $year]);
            if ($checkStmt->fetch()) {
                finResponse(400, ['error' => "Payroll for {$month}/{$year} has already been initiated or processed"]);
            }

            // 1. Create Cycle
            $cycleStmt = $db->prepare("INSERT INTO payroll_cycles (company_id, month, year, status, processed_at, processed_by) VALUES (?, ?, ?, 'Draft', ?, ?)");
            $cycleStmt->execute([$company_id, $month, $year, date('Y-m-d H:i:s'), $user['id']]);
            $cycleId = $db->lastInsertId();

            // 2. Fetch all employees in this company with full salary components
            $empStmt = $db->prepare("SELECT id, monthly_salary, annual_ctc, basic, hra, conveyance_allowance, medical_allowance, fixed_allowance, employer_pf, employer_esi, gratuity, insurance, bonus, lwf FROM employees WHERE company_id = ? AND status = 'Active'");
            $empStmt->execute([$company_id]);
            $employees = $empStmt->fetchAll();
            $total_employees = count($employees);
 
            // 3. Process each employee's payslip
            $payslipStmt = $db->prepare("INSERT INTO payslips (payroll_cycle_id, employee_id, gross_salary, basic, hra, allowances, pf, esi, tds, other_deductions, net_salary, overtime_pay, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Unpaid')");
            
            foreach ($employees as $emp) {
                $gross = (float)$emp['monthly_salary']; // Gross Salary
                
                // Calculate Overtime (OT) Pay
                $monthStr = str_pad($month, 2, '0', STR_PAD_LEFT);
                $datePattern = "{$year}-{$monthStr}-%";
                $otStmt = $db->prepare("SELECT SUM(overtime_minutes) FROM attendance WHERE employee_id = ? AND date LIKE ?");
                $otStmt->execute([$emp['id'], $datePattern]);
                $otMinutes = (int)($otStmt->fetchColumn() ?? 0);
                
                $baseOtRatePerMin = 5.00; // Base OT rate of 5 rupees per minute
                $otRatePerMin = $baseOtRatePerMin * $total_employees; // multiplied based on number of employees
                $otPay = $otMinutes * $otRatePerMin;
                
                // Calculate components from database
                $basic = (float)$emp['basic'] / 12;
                $hra = (float)$emp['hra'] / 12;
                $allowances = ((float)$emp['conveyance_allowance'] + (float)$emp['medical_allowance'] + (float)$emp['fixed_allowance']) / 12;
                
                // Deductions
                $pf = $basic * 0.12;   // 12% PF on Basic
                $esi = ($gross < 21000) ? ($gross * 0.0075) : 0.00; // 0.75% ESI if Gross < 21k
                $tds = ($gross > 50000) ? ($gross * 0.05) : 0.00;   // 5% TDS for monthly salaries above 50k
                
                // Standard Professional Tax (PT)
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
            finResponse(201, ['message' => "Payroll cycle for {$month}/{$year} processed as Draft", 'cycle_id' => $cycleId]);
        } catch (Exception $e) {
            $db->rollBack();
            finResponse(500, ['error' => 'Payroll execution failed', 'details' => $e->getMessage()]);
        }
    }
}

elseif ($action === 'cycles/lock') {
    $cycle_id = $input['cycle_id'] ?? null;
    $status = $input['status'] ?? 'Paid'; // Locked or Paid

    if (!$cycle_id) {
        finResponse(400, ['error' => 'Cycle ID is required']);
    }

    $stmt = $db->prepare("UPDATE payroll_cycles SET status = ? WHERE id = ? AND company_id = ?");
    $stmt->execute([$status, $cycle_id, $company_id]);

    // Also update payslips status if status is Paid
    if ($status === 'Paid') {
        $payStmt = $db->prepare("UPDATE payslips SET status = 'Paid' WHERE payroll_cycle_id = ?");
        $payStmt->execute([$cycle_id]);
    }

    finResponse(200, ['message' => "Payroll cycle status updated to " . $status]);
}

elseif ($action === 'payslips') {
    $cycle_id = $_GET['cycle_id'] ?? null;
    if (!$cycle_id) {
        finResponse(400, ['error' => 'Cycle ID is required']);
    }

    $stmt = $db->prepare("SELECT p.*, u.name as employee_name, e.employee_code,
                                 e.date_of_joining, d.name as department_name, ds.name as designation_name,
                                 b.name as branch_name, b.address as branch_address,
                                 c.name as company_name, c.code as company_code,
                                 eb.bank_name, eb.account_number as bank_account, eb.ifsc_code
                          FROM payslips p
                          JOIN employees e ON p.employee_id = e.id
                          JOIN users u ON e.user_id = u.id
                          LEFT JOIN departments d ON e.department_id = d.id
                          LEFT JOIN designations ds ON e.designation_id = ds.id
                          LEFT JOIN branches b ON e.branch_id = b.id
                          LEFT JOIN companies c ON e.company_id = c.id
                          LEFT JOIN employee_bank eb ON e.id = eb.employee_id
                          WHERE p.payroll_cycle_id = ?");
    $stmt->execute([$cycle_id]);
    finResponse(200, ['payslips' => $stmt->fetchAll()]);
}

elseif ($action === 'expenses') {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $stmt = $db->prepare("SELECT ex.*, u.name as employee_name, e.employee_code 
                              FROM expenses ex
                              JOIN employees e ON ex.employee_id = e.id
                              JOIN users u ON e.user_id = u.id
                              WHERE e.company_id = ? ORDER BY ex.id DESC");
        $stmt->execute([$company_id]);
        finResponse(200, ['expenses' => $stmt->fetchAll()]);
    } 
    
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $expense_id = $input['expense_id'] ?? null;
        $status = $input['status'] ?? ''; // Approved or Rejected

        if (!$expense_id || !in_array($status, ['Approved', 'Rejected'])) {
            finResponse(400, ['error' => 'Expense ID and valid status are required']);
        }

        $stmt = $db->prepare("UPDATE expenses SET status = ?, approved_by = ? WHERE id = ?");
        $stmt->execute([$status, $user['id'], $expense_id]);
        finResponse(200, ['message' => 'Expense reimbursement ' . strtolower($status)]);
    }
}

elseif ($action === 'company-details') {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        finResponse(405, ['error' => 'Method not allowed']);
    }
    
    $comp_id = $_GET['company_id'] ?? null;
    if (!$comp_id) {
        finResponse(400, ['error' => 'Company ID is required']);
    }
    
    if ($user['role'] === 'finance' && !in_array($comp_id, $assignedCompanyIds)) {
        finResponse(403, ['error' => 'Forbidden: You do not have access to this company']);
    }

    try {
        // 1. Company Info
        $compStmt = $db->prepare("SELECT * FROM companies WHERE id = ?");
        $compStmt->execute([$comp_id]);
        $companyInfo = $compStmt->fetch();
        
        if (!$companyInfo) {
            finResponse(404, ['error' => 'Company not found']);
        }

        $setStmt = $db->prepare("SELECT setting_key, setting_value FROM company_settings WHERE company_id = ?");
        $setStmt->execute([$comp_id]);
        $settings = $setStmt->fetchAll(PDO::FETCH_KEY_PAIR);
        
        $companyInfo['gst_number'] = $settings['gst_number'] ?? 'GST-MOCK-12345';
        $companyInfo['pan_number'] = $settings['pan_number'] ?? 'PAN-MOCK-123';
        
        $contactStmt = $db->prepare("
            SELECT u.name, u.email, e.phone 
            FROM users u 
            JOIN employees e ON u.id = e.user_id 
            WHERE e.company_id = ? AND u.role = 'hr' 
            LIMIT 1
        ");
        $contactStmt->execute([$comp_id]);
        $contact = $contactStmt->fetch();
        
        $companyInfo['contact_person'] = $contact ? $contact['name'] : 'N/A';
        $companyInfo['contact_email'] = $contact ? $contact['email'] : 'N/A';
        $companyInfo['contact_phone'] = $contact ? $contact['phone'] : 'N/A';

        // 2. Employee Info
        $empStmt = $db->prepare("
            SELECT e.id, e.employee_code, u.name, d.name as department_name, 
                   ds.name as designation_name, e.monthly_salary, e.basic, e.hra, 
                   (e.fixed_allowance + e.conveyance_allowance + e.medical_allowance) as allowances,
                   e.monthly_salary as gross_salary
            FROM employees e
            JOIN users u ON e.user_id = u.id
            LEFT JOIN departments d ON e.department_id = d.id
            LEFT JOIN designations ds ON e.designation_id = ds.id
            WHERE e.company_id = ? AND e.status = 'Active'
        ");
        $empStmt->execute([$comp_id]);
        $employees = $empStmt->fetchAll();
        
        foreach ($employees as &$emp) {
            $gross = (float)$emp['gross_salary'];
            $basic = (float)$emp['basic'] / 12;
            $pf = $basic * 0.12;
            $esi = ($gross < 21000) ? ($gross * 0.0075) : 0.00;
            $tds = ($gross > 50000) ? ($gross * 0.05) : 0.00;
            $pt = ($gross > 15000) ? 200.00 : 0.00;
            $emp['net_salary'] = $gross - ($pf + $esi + $tds + $pt);
        }

        // 3. Payroll Info (latest runs)
        $payStmt = $db->prepare("SELECT * FROM payroll_cycles WHERE company_id = ? ORDER BY year DESC, month DESC LIMIT 12");
        $payStmt->execute([$comp_id]);
        $payrollHistory = $payStmt->fetchAll();

        // 3b. Employee Documents
        $docsStmt = $db->prepare("
            SELECT ed.*, u.name as employee_name
            FROM employee_documents ed
            JOIN employees e ON ed.employee_id = e.id
            JOIN users u ON e.user_id = u.id
            WHERE e.company_id = ?
        ");
        $docsStmt->execute([$comp_id]);
        $documents = $docsStmt->fetchAll();

        // 4. Statutory details
        $statutorySummary = [
            'pf_enabled' => isset($settings['pf_enabled']) ? $settings['pf_enabled'] : 'true',
            'esi_enabled' => isset($settings['esi_enabled']) ? $settings['esi_enabled'] : 'true',
            'professional_tax' => 'Standard slab rates (up to ₹200/month)',
            'tds_rate' => '5% for gross monthly salary > ₹50,000',
            'lwf' => 'Standard state labour welfare fund deductions'
        ];

        finResponse(200, [
            'company' => $companyInfo,
            'employees' => $employees,
            'total_employees' => count($employees),
            'payroll' => $payrollHistory,
            'statutory' => $statutorySummary,
            'documents' => $documents
        ]);
    } catch (Exception $e) {
        finResponse(500, ['error' => 'Failed to fetch company details', 'details' => $e->getMessage()]);
    }
}

elseif ($action === 'invoices') {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        try {
            $filter_company = $_GET['filter_company'] ?? null;
            $filter_month = $_GET['filter_month'] ?? null;
            $filter_year = $_GET['filter_year'] ?? null;
            $search_number = $_GET['search_number'] ?? null;

            $query = "
                SELECT i.*, c.name as company_name, c.code as company_code
                FROM ca_invoices i
                JOIN companies c ON i.company_id = c.id
                WHERE i.ca_id = ?
            ";
            $params = [$user['id']];

            if ($filter_company) {
                $query .= " AND i.company_id = ?";
                $params[] = $filter_company;
            }
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
            $invoices = $stmt->fetchAll();

            finResponse(200, ['invoices' => $invoices]);
        } catch (Exception $e) {
            finResponse(500, ['error' => 'Failed to fetch invoices', 'details' => $e->getMessage()]);
        }
    }
}

elseif ($action === 'invoices/create') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        finResponse(405, ['error' => 'Method not allowed']);
    }

    $comp_id = $input['company_id'] ?? null;
    $billing_month = (int)($input['billing_month'] ?? date('m'));
    $billing_year = (int)($input['billing_year'] ?? date('Y'));
    
    // Detailed TAX INVOICE fields
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

    if (!$comp_id) {
        finResponse(400, ['error' => 'Company ID is required']);
    }

    if (!in_array($comp_id, $assignedCompanyIds)) {
        finResponse(403, ['error' => 'Forbidden: You do not have access to this company']);
    }

    try {
        $db->beginTransaction();

        $invoice_number = $invoice_number_input ?: ("INV-TAX-" . str_pad($user['id'], 3, '0', STR_PAD_LEFT) . "-" . str_pad($comp_id, 3, '0', STR_PAD_LEFT) . "-" . time());

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
            $invoice_number, $user['id'], $comp_id, $billing_month, $billing_year,
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

        $compName = $db->query("SELECT name FROM companies WHERE id = " . (int)$comp_id)->fetchColumn();
        logCAAuditEvent($db, $user['id'], 'Invoice Generated', [
            'invoice_number' => $invoice_number,
            'company_name' => $compName,
            'amount' => $net_payment
        ]);

        $db->commit();
        finResponse(201, ['message' => 'Invoice generated successfully', 'invoice_id' => $invoice_id, 'invoice_number' => $invoice_number]);
    } catch (Exception $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        finResponse(500, ['error' => 'Failed to generate invoice', 'details' => $e->getMessage()]);
    }
}

elseif ($action === 'invoices/update') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        finResponse(405, ['error' => 'Method not allowed']);
    }

    $id = $input['id'] ?? null;
    if (!$id) {
        finResponse(400, ['error' => 'Invoice ID is required']);
    }

    try {
        $chk = $db->prepare("SELECT ca_id, company_id FROM ca_invoices WHERE id = ?");
        $chk->execute([$id]);
        $inv = $chk->fetch();
        if (!$inv) {
            finResponse(404, ['error' => 'Invoice not found']);
        }

        if ($inv['ca_id'] !== $user['id'] && !in_array($inv['company_id'], $assignedCompanyIds)) {
            finResponse(403, ['error' => 'Forbidden: You do not have access to edit this invoice']);
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

        $compName = $db->query("SELECT name FROM companies WHERE id = " . (int)$inv['company_id'])->fetchColumn();
        logCAAuditEvent($db, $user['id'], 'Invoice Updated', [
            'invoice_number' => $invoice_number_input,
            'company_name' => $compName,
            'amount' => $net_payment
        ]);

        $db->commit();
        finResponse(200, ['message' => 'Invoice updated successfully']);
    } catch (Exception $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        finResponse(500, ['error' => 'Failed to update invoice', 'details' => $e->getMessage()]);
    }
}

elseif ($action === 'profile') {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        try {
            $stmt = $db->prepare("
                SELECT u.name, u.email, cp.* 
                FROM users u 
                LEFT JOIN ca_profiles cp ON u.id = cp.user_id 
                WHERE u.id = ?
            ");
            $stmt->execute([$user['id']]);
            $profile = $stmt->fetch();
            finResponse(200, ['profile' => $profile]);
        } catch (Exception $e) {
            finResponse(500, ['error' => 'Failed to retrieve CA profile', 'details' => $e->getMessage()]);
        }
    }
    
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
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

        try {
            $stmt = $db->prepare("SELECT id FROM ca_profiles WHERE user_id = ?");
            $stmt->execute([$user['id']]);
            if ($stmt->fetch()) {
                $update = $db->prepare("
                    UPDATE ca_profiles SET 
                        firm_name = ?, registration_number = ?, gst_number = ?, pan_number = ?, 
                        mobile_number = ?, address = ?, bank_name = ?, account_number = ?, 
                        ifsc_code = ?, upi_id = ?, digital_signature = ?
                    WHERE user_id = ?
                ");
                $update->execute([
                    $firm_name, $registration_number, $gst_number, $pan_number,
                    $mobile_number, $address, $bank_name, $account_number,
                    $ifsc_code, $upi_id, $digital_signature, $user['id']
                ]);
            } else {
                $insert = $db->prepare("
                    INSERT INTO ca_profiles (
                        user_id, firm_name, registration_number, gst_number, pan_number, 
                        mobile_number, address, bank_name, account_number, ifsc_code, upi_id, digital_signature
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                $insert->execute([
                    $user['id'], $firm_name, $registration_number, $gst_number, $pan_number,
                    $mobile_number, $address, $bank_name, $account_number, $ifsc_code, $upi_id, $digital_signature
                ]);
            }

            logCAAuditEvent($db, $user['id'], 'Profile Updated', 'CA updated firm profile details');
            finResponse(200, ['message' => 'Profile updated successfully']);
        } catch (Exception $e) {
            finResponse(500, ['error' => 'Failed to update profile', 'details' => $e->getMessage()]);
        }
    }
}

else {
    finResponse(404, ['error' => 'Finance endpoint not found']);
}
