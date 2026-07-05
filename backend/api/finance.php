<?php
// backend/api/finance.php

if (!isset($db) || !isset($route) || !isset($user)) {
    exit('Direct access not allowed');
}

$action = str_replace('/api/finance/', '', $route);
$company_id = $user['company_id'];

function finResponse($code, $data) {
    http_response_code($code);
    echo json_encode($data);
    exit();
}

if ($action === 'dashboard') {
    // Finance dashboard summaries
    try {
        // Active payroll cycle status
        $cycleStmt = $db->prepare("SELECT * FROM payroll_cycles WHERE company_id = ? ORDER BY id DESC LIMIT 1");
        $cycleStmt->execute([$company_id]);
        $latestCycle = $cycleStmt->fetch();

        // Pending expenses
        $expStmt = $db->prepare("SELECT COUNT(*) FROM expenses ex JOIN employees e ON ex.employee_id = e.id WHERE e.company_id = ? AND ex.status = 'Pending'");
        $expStmt->execute([$company_id]);
        $pendingExpenses = $expStmt->fetchColumn();

        // Total processing cost (sum of payslips in last cycle)
        $cost = 0.00;
        if ($latestCycle) {
            $costStmt = $db->prepare("SELECT SUM(net_salary) FROM payslips WHERE payroll_cycle_id = ?");
            $costStmt->execute([$latestCycle['id']]);
            $cost = $costStmt->fetchColumn() ?? 0.00;
        }

        finResponse(200, [
            'latest_cycle' => $latestCycle,
            'pending_expenses' => (int)$pendingExpenses,
            'last_payroll_cost' => (float)$cost
        ]);
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

            // 2. Fetch all employees in this company
            $empStmt = $db->prepare("SELECT id, monthly_salary FROM employees WHERE company_id = ? AND status = 'Active'");
            $empStmt->execute([$company_id]);
            $employees = $empStmt->fetchAll();

            // 3. Process each employee's payslip
            $payslipStmt = $db->prepare("INSERT INTO payslips (payroll_cycle_id, employee_id, gross_salary, basic, hra, allowances, pf, esi, tds, other_deductions, net_salary, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Unpaid')");
            
            foreach ($employees as $emp) {
                $gross = (float)$emp['monthly_salary'];
                
                // Calculate components
                $basic = $gross * 0.50; // 50% basic
                $hra = $gross * 0.25;   // 25% HRA
                $allowances = $gross * 0.25; // 25% Conveyance / special allowances
                
                // Deductions
                $pf = $basic * 0.12;   // 12% PF on basic
                $esi = ($gross < 21000) ? ($gross * 0.0075) : 0.00; // 0.75% ESI if salary < 21k
                $tds = ($gross > 50000) ? ($gross * 0.05) : 0.00;   // 5% TDS for monthly salaries above 50k
                $other = 0.00;
                
                $totalDeductions = $pf + $esi + $tds + $other;
                $net = $gross - $totalDeductions;

                $payslipStmt->execute([
                    $cycleId,
                    $emp['id'],
                    $gross,
                    $basic,
                    $hra,
                    $allowances,
                    $pf,
                    $esi,
                    $tds,
                    $other,
                    $net
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

else {
    finResponse(404, ['error' => 'Finance endpoint not found']);
}
