<?php
// backend/setup.php
require_once __DIR__ . '/config/db.php';

try {
    $db = Database::getConnection();
    $driver = $db->getAttribute(PDO::ATTR_DRIVER_NAME);
    echo "Initializing database. Driver: " . strtoupper($driver) . "\n";

    // Setup helper for auto-increment and types
    $pk = ($driver === 'sqlite') ? "INTEGER PRIMARY KEY AUTOINCREMENT" : "INT AUTO_INCREMENT PRIMARY KEY";
    $text = ($driver === 'sqlite') ? "TEXT" : "TEXT";
    $decimal = ($driver === 'sqlite') ? "REAL" : "DECIMAL(10,2)";
    $dateTimeNow = ($driver === 'sqlite') ? "CURRENT_TIMESTAMP" : "CURRENT_TIMESTAMP";
    $dateTimeType = ($driver === 'sqlite') ? "TEXT" : "DATETIME";

    // Table lists
    $queries = [];

    // 1. Companies
    $queries[] = "CREATE TABLE IF NOT EXISTS companies (
        id $pk,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(20) UNIQUE NOT NULL,
        logo VARCHAR(255),
        status VARCHAR(20) DEFAULT 'Active', -- Active, Suspended
        plan_name VARCHAR(50) DEFAULT 'Trial',
        subscription_end $dateTimeType,
        service_type VARCHAR(50) DEFAULT 'CompletePayroll',
        created_at TIMESTAMP DEFAULT $dateTimeNow
    )";

    // 2. Company Settings
    $queries[] = "CREATE TABLE IF NOT EXISTS company_settings (
        id $pk,
        company_id INT NOT NULL,
        setting_key VARCHAR(50) NOT NULL,
        setting_value $text,
        updated_at TIMESTAMP DEFAULT $dateTimeNow
    )";

    // 3. Branches
    $queries[] = "CREATE TABLE IF NOT EXISTS branches (
        id $pk,
        company_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        address VARCHAR(255),
        latitude $decimal,
        longitude $decimal,
        radius_meters INT DEFAULT 150,
        created_at TIMESTAMP DEFAULT $dateTimeNow
    )";

    // 4. Departments
    $queries[] = "CREATE TABLE IF NOT EXISTS departments (
        id $pk,
        company_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(20),
        created_at TIMESTAMP DEFAULT $dateTimeNow
    )";

    // 5. Designations
    $queries[] = "CREATE TABLE IF NOT EXISTS designations (
        id $pk,
        company_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT $dateTimeNow
    )";

    // 6. Users
    $queries[] = "CREATE TABLE IF NOT EXISTS users (
        id $pk,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL, -- superadmin, hr, finance, employee
        name VARCHAR(100) NOT NULL,
        avatar VARCHAR(255),
        status VARCHAR(20) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT $dateTimeNow
    )";

    // 7. Roles
    $queries[] = "CREATE TABLE IF NOT EXISTS roles (
        id $pk,
        company_id INT, -- NULL for global roles
        name VARCHAR(50) NOT NULL,
        description VARCHAR(255),
        created_at TIMESTAMP DEFAULT $dateTimeNow
    )";

    // 8. Permissions
    $queries[] = "CREATE TABLE IF NOT EXISTS permissions (
        id $pk,
        name VARCHAR(50) UNIQUE NOT NULL,
        description VARCHAR(255)
    )";

    // 9. Role Permissions
    $queries[] = "CREATE TABLE IF NOT EXISTS role_permissions (
        role_id INT NOT NULL,
        permission_id INT NOT NULL,
        PRIMARY KEY (role_id, permission_id)
    )";

    // 10. User Permissions
    $queries[] = "CREATE TABLE IF NOT EXISTS user_permissions (
        user_id INT NOT NULL,
        permission_id INT NOT NULL,
        PRIMARY KEY (user_id, permission_id)
    )";

    // 11. Employees
    $queries[] = "CREATE TABLE IF NOT EXISTS employees (
        id $pk,
        user_id INT NOT NULL,
        company_id INT NOT NULL,
        branch_id INT,
        department_id INT,
        designation_id INT,
        employee_code VARCHAR(20) UNIQUE NOT NULL,
        date_of_joining $dateTimeType,
        monthly_salary $decimal DEFAULT 0.00,
        phone VARCHAR(20),
        status VARCHAR(20) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT $dateTimeNow
    )";

    // 12. Employee Documents
    $queries[] = "CREATE TABLE IF NOT EXISTS employee_documents (
        id $pk,
        employee_id INT NOT NULL,
        doc_type VARCHAR(50) NOT NULL, -- PAN, Aadhaar, Passport, offer_letter, resume, etc.
        doc_number VARCHAR(100),
        file_path VARCHAR(255),
        uploaded_at TIMESTAMP DEFAULT $dateTimeNow
    )";

    // 13. Employee Family
    $queries[] = "CREATE TABLE IF NOT EXISTS employee_family (
        id $pk,
        employee_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        relationship VARCHAR(50) NOT NULL,
        phone VARCHAR(20)
    )";

    // 14. Employee Bank
    $queries[] = "CREATE TABLE IF NOT EXISTS employee_bank (
        id $pk,
        employee_id INT NOT NULL,
        bank_name VARCHAR(100) NOT NULL,
        account_number VARCHAR(50) NOT NULL,
        ifsc_code VARCHAR(20) NOT NULL
    )";

    // 15. Employee Emergency
    $queries[] = "CREATE TABLE IF NOT EXISTS employee_emergency (
        id $pk,
        employee_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        relationship VARCHAR(50) NOT NULL,
        phone VARCHAR(20) NOT NULL
    )";

    // 16. Attendance
    $queries[] = "CREATE TABLE IF NOT EXISTS attendance (
        id $pk,
        employee_id INT NOT NULL,
        company_id INT NOT NULL,
        branch_id INT,
        date $dateTimeType NOT NULL,
        clock_in VARCHAR(10),
        clock_out VARCHAR(10),
        clock_in_photo VARCHAR(255),
        clock_out_photo VARCHAR(255),
        clock_in_lat $decimal,
        clock_in_lng $decimal,
        clock_out_lat $decimal,
        clock_out_lng $decimal,
        clock_in_distance $decimal,
        clock_out_distance $decimal,
        clock_in_gps_accuracy $decimal,
        clock_out_gps_accuracy $decimal,
        clock_in_browser VARCHAR(100),
        clock_in_os VARCHAR(100),
        clock_in_device VARCHAR(150),
        clock_in_ip VARCHAR(45),
        clock_in_network VARCHAR(50),
        clock_in_battery $decimal,
        clock_in_face_score $decimal,
        clock_in_face_verified INT DEFAULT 0,
        clock_in_liveness_score $decimal,
        clock_in_liveness_verified INT DEFAULT 0,
        clock_in_gps_verified INT DEFAULT 0,
        clock_out_browser VARCHAR(100),
        clock_out_os VARCHAR(100),
        clock_out_device VARCHAR(150),
        clock_out_ip VARCHAR(45),
        clock_out_network VARCHAR(50),
        clock_out_battery $decimal,
        clock_out_face_score $decimal,
        clock_out_face_verified INT DEFAULT 0,
        clock_out_liveness_score $decimal,
        clock_out_liveness_verified INT DEFAULT 0,
        clock_out_gps_verified INT DEFAULT 0,
        status VARCHAR(20) DEFAULT 'Present', -- Present, Absent, Late, Half-day
        is_wfh INT DEFAULT 0,
        overtime_minutes INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT $dateTimeNow,
        updated_at TIMESTAMP DEFAULT $dateTimeNow
    )";

    // 17. Attendance Logs
    $queries[] = "CREATE TABLE IF NOT EXISTS attendance_logs (
        id $pk,
        attendance_id INT,
        employee_id INT NOT NULL,
        action VARCHAR(20) NOT NULL, -- Check In, Check Out
        timestamp TIMESTAMP DEFAULT $dateTimeNow,
        latitude $decimal,
        longitude $decimal,
        distance $decimal,
        browser VARCHAR(100),
        device VARCHAR(150),
        ip_address VARCHAR(45),
        photo VARCHAR(255),
        status VARCHAR(20),
        remarks $text
    )";

    // 18. Attendance Regularization
    $queries[] = "CREATE TABLE IF NOT EXISTS attendance_regularization (
        id $pk,
        attendance_id INT NOT NULL,
        requested_clock_in VARCHAR(10),
        requested_clock_out VARCHAR(10),
        reason $text,
        status VARCHAR(20) DEFAULT 'Pending', -- Pending, Approved, Rejected
        approved_by INT,
        created_at TIMESTAMP DEFAULT $dateTimeNow
    )";

    // 19. Leave Types
    $queries[] = "CREATE TABLE IF NOT EXISTS leave_types (
        id $pk,
        company_id INT NOT NULL,
        name VARCHAR(50) NOT NULL, -- Casual, Sick, Earned, Comp-off
        total_days INT NOT NULL,
        created_at TIMESTAMP DEFAULT $dateTimeNow
    )";

    // 20. Leave Balances
    $queries[] = "CREATE TABLE IF NOT EXISTS leave_balances (
        id $pk,
        employee_id INT NOT NULL,
        leave_type_id INT NOT NULL,
        allocated INT NOT NULL,
        used INT DEFAULT 0,
        pending INT DEFAULT 0
    )";

    // 21. Leave Requests
    $queries[] = "CREATE TABLE IF NOT EXISTS leave_requests (
        id $pk,
        employee_id INT NOT NULL,
        leave_type_id INT NOT NULL,
        start_date $dateTimeType NOT NULL,
        end_date $dateTimeType NOT NULL,
        reason $text,
        status VARCHAR(20) DEFAULT 'Pending', -- Pending, Approved, Rejected
        approved_by INT,
        created_at TIMESTAMP DEFAULT $dateTimeNow
    )";

    // 22. Payroll Cycles
    $queries[] = "CREATE TABLE IF NOT EXISTS payroll_cycles (
        id $pk,
        company_id INT NOT NULL,
        month INT NOT NULL,
        year INT NOT NULL,
        status VARCHAR(20) DEFAULT 'Draft', -- Draft, Processing, Locked, Approved, Paid
        processed_at $dateTimeType,
        processed_by INT
    )";

    // 23. Salary Components
    $queries[] = "CREATE TABLE IF NOT EXISTS salary_components (
        id $pk,
        company_id INT NOT NULL,
        name VARCHAR(50) NOT NULL, -- Basic, HRA, Convenyance, PF, ESI, TDS, PT
        type VARCHAR(20) NOT NULL, -- Earning, Deduction
        percentage $decimal DEFAULT 0, -- percent of basic or gross
        is_fixed INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT $dateTimeNow
    )";

    // 24. Salary Templates
    $queries[] = "CREATE TABLE IF NOT EXISTS salary_templates (
        id $pk,
        company_id INT NOT NULL,
        name VARCHAR(50) NOT NULL,
        description VARCHAR(255)
    )";

    // 25. Salary History
    $queries[] = "CREATE TABLE IF NOT EXISTS salary_history (
        id $pk,
        employee_id INT NOT NULL,
        monthly_salary $decimal NOT NULL,
        effective_date $dateTimeType NOT NULL,
        created_at TIMESTAMP DEFAULT $dateTimeNow
    )";

    // 26. Payslips
    $queries[] = "CREATE TABLE IF NOT EXISTS payslips (
        id $pk,
        payroll_cycle_id INT NOT NULL,
        employee_id INT NOT NULL,
        gross_salary $decimal NOT NULL,
        basic $decimal NOT NULL,
        hra $decimal NOT NULL,
        allowances $decimal NOT NULL,
        pf $decimal DEFAULT 0,
        esi $decimal DEFAULT 0,
        tds $decimal DEFAULT 0,
        other_deductions $decimal DEFAULT 0,
        net_salary $decimal NOT NULL,
        status VARCHAR(20) DEFAULT 'Unpaid', -- Unpaid, Paid
        created_at TIMESTAMP DEFAULT $dateTimeNow
    )";

    // 27. Loans
    $queries[] = "CREATE TABLE IF NOT EXISTS loans (
        id $pk,
        employee_id INT NOT NULL,
        amount $decimal NOT NULL,
        repayment_months INT NOT NULL,
        monthly_emi $decimal NOT NULL,
        purpose $text,
        status VARCHAR(20) DEFAULT 'Pending', -- Pending, Approved, Rejected, Active, Paid
        created_at TIMESTAMP DEFAULT $dateTimeNow
    )";

    // 28. Advances
    $queries[] = "CREATE TABLE IF NOT EXISTS advances (
        id $pk,
        employee_id INT NOT NULL,
        amount $decimal NOT NULL,
        deduction_month INT NOT NULL,
        deduction_year INT NOT NULL,
        reason $text,
        status VARCHAR(20) DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT $dateTimeNow
    )";

    // 29. Bonuses
    $queries[] = "CREATE TABLE IF NOT EXISTS bonuses (
        id $pk,
        employee_id INT NOT NULL,
        amount $decimal NOT NULL,
        bonus_month INT NOT NULL,
        bonus_year INT NOT NULL,
        description VARCHAR(255),
        created_at TIMESTAMP DEFAULT $dateTimeNow
    )";

    // 30. Allowances
    $queries[] = "CREATE TABLE IF NOT EXISTS allowances (
        id $pk,
        employee_id INT NOT NULL,
        name VARCHAR(50) NOT NULL,
        amount $decimal NOT NULL,
        allowance_month INT NOT NULL,
        allowance_year INT NOT NULL
    )";

    // 31. Deductions
    $queries[] = "CREATE TABLE IF NOT EXISTS deductions (
        id $pk,
        employee_id INT NOT NULL,
        name VARCHAR(50) NOT NULL,
        amount $decimal NOT NULL,
        deduction_month INT NOT NULL,
        deduction_year INT NOT NULL
    )";

    // 32. Expenses
    $queries[] = "CREATE TABLE IF NOT EXISTS expenses (
        id $pk,
        employee_id INT NOT NULL,
        title VARCHAR(100) NOT NULL,
        category VARCHAR(50) NOT NULL,
        amount $decimal NOT NULL,
        bill_path VARCHAR(255),
        status VARCHAR(20) DEFAULT 'Pending', -- Pending, Approved, Rejected
        approved_by INT,
        created_at TIMESTAMP DEFAULT $dateTimeNow
    )";

    // 33. Assets
    $queries[] = "CREATE TABLE IF NOT EXISTS assets (
        id $pk,
        company_id INT NOT NULL,
        asset_name VARCHAR(100) NOT NULL,
        asset_code VARCHAR(50) UNIQUE NOT NULL,
        category VARCHAR(50) NOT NULL, -- Laptop, Mobile, Access Card
        value $decimal DEFAULT 0.00,
        status VARCHAR(20) DEFAULT 'Available', -- Available, Allocated, Repair, Scrapped
        created_at TIMESTAMP DEFAULT $dateTimeNow
    )";

    // 34. Asset Assignments
    $queries[] = "CREATE TABLE IF NOT EXISTS asset_assignments (
        id $pk,
        asset_id INT NOT NULL,
        employee_id INT NOT NULL,
        assigned_date $dateTimeType NOT NULL,
        returned_date $dateTimeType,
        notes $text,
        created_at TIMESTAMP DEFAULT $dateTimeNow
    )";

    // 35. Announcements
    $queries[] = "CREATE TABLE IF NOT EXISTS announcements (
        id $pk,
        company_id INT NOT NULL,
        title VARCHAR(150) NOT NULL,
        content $text NOT NULL,
        target_role VARCHAR(20) DEFAULT 'All', -- All, Employee, HR, Finance
        created_at TIMESTAMP DEFAULT $dateTimeNow
    )";

    // 36. Notifications
    $queries[] = "CREATE TABLE IF NOT EXISTS notifications (
        id $pk,
        user_id INT NOT NULL,
        title VARCHAR(100) NOT NULL,
        message $text NOT NULL,
        is_read INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT $dateTimeNow
    )";

    // 37. Recruitment
    $queries[] = "CREATE TABLE IF NOT EXISTS recruitment (
        id $pk,
        company_id INT NOT NULL,
        job_title VARCHAR(100) NOT NULL,
        department_id INT,
        description $text,
        status VARCHAR(20) DEFAULT 'Open', -- Open, Closed
        created_at TIMESTAMP DEFAULT $dateTimeNow
    )";

    // 38. Candidates
    $queries[] = "CREATE TABLE IF NOT EXISTS candidates (
        id $pk,
        recruitment_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        resume_path VARCHAR(255),
        status VARCHAR(50) DEFAULT 'Applied', -- Applied, Interviewing, Offered, Rejected, Hired
        created_at TIMESTAMP DEFAULT $dateTimeNow
    )";

    // 39. Interviews
    $queries[] = "CREATE TABLE IF NOT EXISTS interviews (
        id $pk,
        candidate_id INT NOT NULL,
        interview_date $dateTimeType NOT NULL,
        interviewer VARCHAR(100) NOT NULL,
        feedback $text,
        status VARCHAR(50) DEFAULT 'Scheduled' -- Scheduled, Completed, Cancelled
    )";

    // 40. Performance Reviews
    $queries[] = "CREATE TABLE IF NOT EXISTS performance_reviews (
        id $pk,
        employee_id INT NOT NULL,
        reviewer_id INT NOT NULL,
        review_period VARCHAR(50) NOT NULL,
        kpi_rating $decimal,
        okr_progress $decimal,
        comments $text,
        created_at TIMESTAMP DEFAULT $dateTimeNow
    )";

    // 41. Goals
    $queries[] = "CREATE TABLE IF NOT EXISTS goals (
        id $pk,
        employee_id INT NOT NULL,
        title VARCHAR(150) NOT NULL,
        description $text,
        target_date $dateTimeType,
        progress INT DEFAULT 0, -- 0 to 100
        status VARCHAR(20) DEFAULT 'Not Started' -- Not Started, In Progress, Completed
    )";

    // 42. Training
    $queries[] = "CREATE TABLE IF NOT EXISTS training (
        id $pk,
        company_id INT NOT NULL,
        course_name VARCHAR(150) NOT NULL,
        description $text,
        duration_hours INT,
        status VARCHAR(20) DEFAULT 'Planned'
    )";

    // 43. Tickets (Support Tickets)
    $queries[] = "CREATE TABLE IF NOT EXISTS tickets (
        id $pk,
        company_id INT NOT NULL,
        user_id INT NOT NULL,
        subject VARCHAR(150) NOT NULL,
        description $text NOT NULL,
        status VARCHAR(20) DEFAULT 'Open', -- Open, In Progress, Resolved, Closed
        priority VARCHAR(20) DEFAULT 'Medium', -- Low, Medium, High
        created_at TIMESTAMP DEFAULT $dateTimeNow
    )";

    // 44. Subscriptions
    $queries[] = "CREATE TABLE IF NOT EXISTS subscriptions (
        id $pk,
        company_id INT NOT NULL,
        plan_id INT NOT NULL,
        price $decimal NOT NULL,
        status VARCHAR(20) DEFAULT 'Active', -- Active, Expired, Suspended
        start_date $dateTimeType,
        end_date $dateTimeType,
        created_at TIMESTAMP DEFAULT $dateTimeNow
    )";

    // 45. Plans
    $queries[] = "CREATE TABLE IF NOT EXISTS plans (
        id $pk,
        name VARCHAR(50) NOT NULL,
        price $decimal NOT NULL,
        max_employees INT NOT NULL,
        features $text
    )";

    // 46. Payments
    $queries[] = "CREATE TABLE IF NOT EXISTS payments (
        id $pk,
        subscription_id INT NOT NULL,
        amount $decimal NOT NULL,
        payment_method VARCHAR(50),
        transaction_id VARCHAR(100),
        status VARCHAR(20) DEFAULT 'Completed',
        created_at TIMESTAMP DEFAULT $dateTimeNow
    )";

    // 47. Invoices
    $queries[] = "CREATE TABLE IF NOT EXISTS invoices (
        id $pk,
        company_id INT NOT NULL,
        payment_id INT,
        invoice_number VARCHAR(50) UNIQUE NOT NULL,
        amount $decimal NOT NULL,
        due_date $dateTimeType,
        status VARCHAR(20) DEFAULT 'Paid',
        created_at TIMESTAMP DEFAULT $dateTimeNow
    )";

    // 48. Coupon Codes
    $queries[] = "CREATE TABLE IF NOT EXISTS coupon_codes (
        id $pk,
        code VARCHAR(20) UNIQUE NOT NULL,
        discount_percent INT NOT NULL,
        valid_until $dateTimeType,
        status VARCHAR(20) DEFAULT 'Active'
    )";

    // 49. Audit Logs
    $queries[] = "CREATE TABLE IF NOT EXISTS audit_logs (
        id $pk,
        user_id INT,
        action VARCHAR(100) NOT NULL,
        details $text,
        created_at TIMESTAMP DEFAULT $dateTimeNow
    )";

    // 50. Activity Logs
    $queries[] = "CREATE TABLE IF NOT EXISTS activity_logs (
        id $pk,
        user_id INT,
        module VARCHAR(50) NOT NULL,
        action VARCHAR(100) NOT NULL,
        details $text,
        created_at TIMESTAMP DEFAULT $dateTimeNow
    )";

    // 51. API Keys
    $queries[] = "CREATE TABLE IF NOT EXISTS api_keys (
        id $pk,
        company_id INT NOT NULL,
        api_key VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(50),
        status VARCHAR(20) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT $dateTimeNow
    )";

    // 52. Settings (Global platform settings)
    $queries[] = "CREATE TABLE IF NOT EXISTS settings (
        id $pk,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value $text
    )";

    // Run table creations
    foreach ($queries as $q) {
        $db->exec($q);
    }
    echo "All tables created successfully.\n";

    // ---------------- SEED DATA ----------------
    // Add default Plans if empty
    $planCount = $db->query("SELECT COUNT(*) FROM plans")->fetchColumn();
    if ($planCount == 0) {
        $stmt = $db->prepare("INSERT INTO plans (name, price, max_employees, features) VALUES (?, ?, ?, ?)");
        $stmt->execute(['Standard Trial', 0.00, 10, 'Basic employee dashboard, clock-in, simple payroll']);
        $stmt->execute(['Premium Growth', 149.00, 100, 'Geofencing check-in, full payroll, leaves workflow, asset register']);
        $stmt->execute(['Enterprise Suite', 499.00, 9999, 'Custom geofence verification, unlimited documents, premium analytics, dedicated support']);
        echo "Default plans seeded.\n";
    }

    // Add default settings if empty
    $settingsCount = $db->query("SELECT COUNT(*) FROM settings")->fetchColumn();
    if ($settingsCount == 0) {
        $stmt = $db->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)");
        $stmt->execute(['app_name', 'HR Allocate']);
        $stmt->execute(['maintenance_mode', 'false']);
        $stmt->execute(['enable_coupons', 'true']);
        echo "Global settings seeded.\n";
    }

    // Add demo company if empty
    $companyCount = $db->query("SELECT COUNT(*) FROM companies")->fetchColumn();
    if ($companyCount == 0) {
        $stmt = $db->prepare("INSERT INTO companies (name, code, status, plan_name, subscription_end) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute(['HR Allocate Demo Corp', 'DEMO', 'Active', 'Premium Growth', date('Y-m-d H:i:s', time() + 30 * 86400)]);
        $companyId = $db->lastInsertId();

        // Add a branch for Geofencing
        $stmt = $db->prepare("INSERT INTO branches (company_id, name, address, latitude, longitude, radius_meters) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$companyId, 'Main Head Office', '45 Enterprise Way, Tech Hub', 12.9716, 77.5946, 200]); // Demo location (Bengaluru center)
        $branchId = $db->lastInsertId();

        // Add default Departments
        $stmt = $db->prepare("INSERT INTO departments (company_id, name, code) VALUES (?, ?, ?)");
        $stmt->execute([$companyId, 'Engineering', 'ENG']);
        $deptEngId = $db->lastInsertId();
        $stmt->execute([$companyId, 'Human Resources', 'HR']);
        $deptHrId = $db->lastInsertId();
        $stmt->execute([$companyId, 'Finance', 'FIN']);
        $deptFinId = $db->lastInsertId();

        // Add default Designations
        $stmt = $db->prepare("INSERT INTO designations (company_id, name) VALUES (?, ?)");
        $stmt->execute([$companyId, 'Senior Software Engineer']);
        $desEngId = $db->lastInsertId();
        $stmt->execute([$companyId, 'HR Executive']);
        $desHrId = $db->lastInsertId();
        $stmt->execute([$companyId, 'Financial Officer']);
        $desFinId = $db->lastInsertId();

        // Add default Leave Types
        $stmt = $db->prepare("INSERT INTO leave_types (company_id, name, total_days) VALUES (?, ?, ?)");
        $stmt->execute([$companyId, 'Sick Leave', 12]);
        $sickLeaveId = $db->lastInsertId();
        $stmt->execute([$companyId, 'Casual Leave', 12]);
        $casualLeaveId = $db->lastInsertId();
        $stmt->execute([$companyId, 'Earned Leave', 15]);
        $earnedLeaveId = $db->lastInsertId();

        echo "Demo Company structure, Branch, Departments, Designations, and Leave types seeded.\n";
    } else {
        $companyId = 1;
        $branchId = 1;
        $deptEngId = 1;
        $deptHrId = 2;
        $deptFinId = 3;
        $desEngId = 1;
        $desHrId = 2;
        $desFinId = 3;
        $sickLeaveId = 1;
        $casualLeaveId = 2;
        $earnedLeaveId = 3;
    }

    // Add default users and employees if empty
    $userCount = $db->query("SELECT COUNT(*) FROM users")->fetchColumn();
    if ($userCount == 0) {
        $stmt = $db->prepare("INSERT INTO users (email, password_hash, role, name) VALUES (?, ?, ?, ?)");
        
        // Passwords hashed with standard password_hash
        $adminPass = password_hash('admin123', PASSWORD_DEFAULT);
        $hrPass = password_hash('hr123', PASSWORD_DEFAULT);
        $finPass = password_hash('finance123', PASSWORD_DEFAULT);
        $empPass = password_hash('emp123', PASSWORD_DEFAULT);

        // 1. Super Admin
        $stmt->execute(['superadmin@hrallocate.com', $adminPass, 'superadmin', 'Super Admin Manager']);
        
        // 2. HR Manager
        $stmt->execute(['hr@hrallocate.com', $hrPass, 'hr', 'John Doe (HR Manager)']);
        $hrUserId = $db->lastInsertId();
        
        // 3. Finance Manager
        $stmt->execute(['finance@hrallocate.com', $finPass, 'finance', 'Sarah CA (Finance Specialist)']);
        $finUserId = $db->lastInsertId();

        // 4. Regular Employee
        $stmt->execute(['employee@hrallocate.com', $empPass, 'employee', 'Alex Mercer (Developer)']);
        $empUserId = $db->lastInsertId();

        // Create entries in employee table
        $empStmt = $db->prepare("INSERT INTO employees (user_id, company_id, branch_id, department_id, designation_id, employee_code, date_of_joining, monthly_salary, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        
        $empStmt->execute([$hrUserId, $companyId, $branchId, $deptHrId, $desHrId, 'EMP001', '2025-01-10 00:00:00', 85000.00, '+1555001']);
        $hrEmpId = $db->lastInsertId();

        $empStmt->execute([$finUserId, $companyId, $branchId, $deptFinId, $desFinId, 'EMP002', '2025-02-15 00:00:00', 90000.00, '+1555002']);
        $finEmpId = $db->lastInsertId();

        $empStmt->execute([$empUserId, $companyId, $branchId, $deptEngId, $desEngId, 'EMP003', '2025-03-01 00:00:00', 65000.00, '+1555003']);
        $empEmpId = $db->lastInsertId();

        // Seed leave balances for employee
        $balStmt = $db->prepare("INSERT INTO leave_balances (employee_id, leave_type_id, allocated, used, pending) VALUES (?, ?, ?, ?, ?)");
        $balStmt->execute([$empEmpId, $sickLeaveId, 12, 2, 0]);
        $balStmt->execute([$empEmpId, $casualLeaveId, 12, 1, 1]);
        $balStmt->execute([$empEmpId, $earnedLeaveId, 15, 0, 0]);

        // Seed some demo announcements
        $announceStmt = $db->prepare("INSERT INTO announcements (company_id, title, content, target_role) VALUES (?, ?, ?, ?)");
        $announceStmt->execute([$companyId, 'Quarterly HR Review 2026', 'Please ensure your review goals are updated by this Friday in your portals.', 'All']);
        $announceStmt->execute([$companyId, 'Updated Geofencing Policies', 'GPS clock-in is now set to 200m radius around head office.', 'Employee']);

        // Seed some demo attendance
        $attStmt = $db->prepare("INSERT INTO attendance (employee_id, company_id, date, clock_in, clock_out, clock_in_lat, clock_in_lng, status, is_wfh) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $attStmt->execute([$empEmpId, $companyId, date('Y-m-d', strtotime('-1 day')), '09:05', '18:10', 12.9716, 77.5946, 'Present', 0]);
        $attStmt->execute([$empEmpId, $companyId, date('Y-m-d', strtotime('-2 days')), '09:12', '18:05', 12.9715, 77.5947, 'Present', 0]);

        echo "Users, Employees, Leave Balances, Announcements, and Attendance seeded successfully.\n";
    }

    echo "Setup database successful.\n";
} catch (PDOException $e) {
    echo "Setup failed: " . $e->getMessage() . "\n";
    exit(1);
}
