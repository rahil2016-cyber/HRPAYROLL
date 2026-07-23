<?php
// backend/seed_payslip_for_rahil.php
require_once __DIR__ . '/config/db.php';

try {
    $db = Database::getConnection();

    // 1. Locate the user "MOHAMMED SAB RAHIL"
    echo "Locating user...\n";
    $user = $db->query("SELECT * FROM users WHERE name LIKE '%MOHAMMED%' OR email = 'MOHAMMED@GMAIL.COM'")->fetch(PDO::FETCH_ASSOC);
    if (!$user) {
        throw new Exception("User MOHAMMED SAB RAHIL not found in database.");
    }
    $userId = $user['id'];
    echo "Found User ID: $userId (Name: {$user['name']}, Email: {$user['email']})\n";

    // 2. Locate their Employee profile
    $employee = $db->query("SELECT * FROM employees WHERE user_id = $userId")->fetch(PDO::FETCH_ASSOC);
    if (!$employee) {
        // If not found, let's create a mock employee record for them
        echo "Employee profile not found. Seeding mock employee profile...\n";
        $companyId = $db->query("SELECT id FROM companies LIMIT 1")->fetchColumn() ?: 1;
        $branchId = $db->query("SELECT id FROM branches LIMIT 1")->fetchColumn() ?: 1;
        $deptId = $db->query("SELECT id FROM departments LIMIT 1")->fetchColumn() ?: 1;
        $desId = $db->query("SELECT id FROM designations LIMIT 1")->fetchColumn() ?: 1;
        
        $stmt = $db->prepare("INSERT INTO employees (user_id, company_id, branch_id, department_id, designation_id, employee_code, date_of_joining, monthly_salary, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$userId, $companyId, $branchId, $deptId, $desId, 'EMP_RAHIL_001', '2025-01-01 00:00:00', 75000.00, '+919876543210']);
        $employeeId = $db->lastInsertId();
        $company_id = $companyId;
        $monthly_salary = 75000.00;
    } else {
        $employeeId = $employee['id'];
        $company_id = $employee['company_id'];
        $monthly_salary = floatval($employee['monthly_salary']) ?: 75000.00;
        echo "Found Employee ID: $employeeId (Company ID: $company_id, Salary: $monthly_salary)\n";
    }

    // 3. Create or find a Payroll Cycle for July 2026
    $month = 7;
    $year = 2026;
    $cycle = $db->query("SELECT * FROM payroll_cycles WHERE company_id = $company_id AND month = $month AND year = $year")->fetch(PDO::FETCH_ASSOC);
    if (!$cycle) {
        echo "Seeding new locked/paid payroll cycle for $month/$year...\n";
        $stmt = $db->prepare("INSERT INTO payroll_cycles (company_id, month, year, status, processed_at, processed_by) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$company_id, $month, $year, 'Paid', date('Y-m-d H:i:s'), 1]);
        $cycleId = $db->lastInsertId();
    } else {
        $cycleId = $cycle['id'];
        // Ensure status is set to Paid
        $db->exec("UPDATE payroll_cycles SET status = 'Paid' WHERE id = $cycleId");
        echo "Found existing cycle ID: $cycleId. Forced status to 'Paid'.\n";
    }

    // 4. Calculate Payslip Values based on salary
    // Basic: 50%, HRA: 25%, Allowances: 25%
    $basic = $monthly_salary * 0.50;
    $hra = $monthly_salary * 0.25;
    $allowances = $monthly_salary * 0.25;

    // Deductions
    $pf = $basic * 0.12; // 12% of basic
    $esi = ($monthly_salary < 21000) ? ($monthly_salary * 0.0075) : 0.00; // 0.75% of gross
    $tds = ($monthly_salary > 50000) ? ($monthly_salary * 0.05) : 0.00; // 5% of gross
    $other_deductions = 0.00;

    $total_deductions = $pf + $esi + $tds + $other_deductions;
    $net_salary = $monthly_salary - $total_deductions;

    // Clean any existing payslip for this cycle
    $db->prepare("DELETE FROM payslips WHERE payroll_cycle_id = ? AND employee_id = ?")->execute([$cycleId, $employeeId]);

    // Insert new payslip
    echo "Inserting detailed payslip...\n";
    $stmt = $db->prepare("INSERT INTO payslips (payroll_cycle_id, employee_id, gross_salary, basic, hra, allowances, pf, esi, tds, other_deductions, net_salary, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $cycleId,
        $employeeId,
        $monthly_salary,
        $basic,
        $hra,
        $allowances,
        $pf,
        $esi,
        $tds,
        $other_deductions,
        $net_salary,
        'Paid'
    ]);

    echo "✅ SUCCESS: Mock payslip seeded successfully for July 2026!\n";
} catch (Exception $e) {
    echo "❌ ERROR: " . $e->getMessage() . "\n";
}
