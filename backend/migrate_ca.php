<?php
// backend/migrate_ca.php
require_once __DIR__ . '/config/db.php';

try {
    $db = Database::getConnection();
    $driver = $db->getAttribute(PDO::ATTR_DRIVER_NAME);
    echo "Running CA Module migration. Driver: " . strtoupper($driver) . "\n";

    $pk = ($driver === 'sqlite') ? "INTEGER PRIMARY KEY AUTOINCREMENT" : "INT AUTO_INCREMENT PRIMARY KEY";
    $decimal = ($driver === 'sqlite') ? "REAL" : "DECIMAL(10,2)";
    $text = ($driver === 'sqlite') ? "TEXT" : "TEXT";
    $dateTimeNow = ($driver === 'sqlite') ? "CURRENT_TIMESTAMP" : "CURRENT_TIMESTAMP";

    // 1. Create ca_profiles
    $db->exec("CREATE TABLE IF NOT EXISTS ca_profiles (
        id $pk,
        user_id INT UNIQUE NOT NULL,
        firm_name VARCHAR(150),
        registration_number VARCHAR(100),
        gst_number VARCHAR(15),
        pan_number VARCHAR(10),
        mobile_number VARCHAR(20),
        address $text,
        bank_name VARCHAR(100),
        account_number VARCHAR(50),
        ifsc_code VARCHAR(20),
        upi_id VARCHAR(100),
        digital_signature $text,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )");
    echo "Table 'ca_profiles' created or verified.\n";

    // 2. Create company_assignments
    $db->exec("CREATE TABLE IF NOT EXISTS company_assignments (
        id $pk,
        company_id INT UNIQUE NOT NULL,
        user_id INT NOT NULL,
        assigned_at TIMESTAMP DEFAULT $dateTimeNow,
        assigned_by INT NOT NULL,
        status VARCHAR(20) DEFAULT 'Active',
        FOREIGN KEY(company_id) REFERENCES companies(id) ON DELETE CASCADE,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(assigned_by) REFERENCES users(id) ON DELETE CASCADE
    )");
    echo "Table 'company_assignments' created or verified.\n";

    // 3. Create ca_invoices
    $db->exec("CREATE TABLE IF NOT EXISTS ca_invoices (
        id $pk,
        invoice_number VARCHAR(50) UNIQUE NOT NULL,
        ca_id INT NOT NULL,
        company_id INT NOT NULL,
        billing_month INT NOT NULL,
        billing_year INT NOT NULL,
        invoice_date DATE NOT NULL,
        professional_fee $decimal NOT NULL,
        gst_amount $decimal DEFAULT 0.00,
        additional_charges $decimal DEFAULT 0.00,
        discount $decimal DEFAULT 0.00,
        grand_total $decimal NOT NULL,
        payment_details $text,
        digital_signature $text,
        client_name VARCHAR(255) NULL,
        client_address $text NULL,
        client_gstin VARCHAR(50) NULL,
        basic_da_rate $decimal DEFAULT 0.00,
        basic_da_mandays $decimal DEFAULT 0.00,
        basic_da_amount $decimal DEFAULT 0.00,
        allowances_rate $decimal DEFAULT 0.00,
        allowances_mandays $decimal DEFAULT 0.00,
        allowances_amount $decimal DEFAULT 0.00,
        epf_rate $decimal DEFAULT 13.00,
        epf_amount $decimal DEFAULT 0.00,
        esic_rate $decimal DEFAULT 3.25,
        esic_amount $decimal DEFAULT 0.00,
        service_charge_rate $decimal DEFAULT 5.00,
        service_charge_amount $decimal DEFAULT 0.00,
        cgst_rate $decimal DEFAULT 9.00,
        cgst_amount $decimal DEFAULT 0.00,
        sgst_rate $decimal DEFAULT 9.00,
        sgst_amount $decimal DEFAULT 0.00,
        tds_rate $decimal DEFAULT 2.00,
        tds_amount $decimal DEFAULT 0.00,
        net_payment $decimal DEFAULT 0.00,
        bank_name VARCHAR(100) NULL,
        bank_account_number VARCHAR(100) NULL,
        bank_account_type VARCHAR(50) NULL,
        bank_branch VARCHAR(100) NULL,
        bank_ifsc VARCHAR(50) NULL,
        company_gstin VARCHAR(50) NULL,
        company_pan VARCHAR(50) NULL,
        company_esi VARCHAR(50) NULL,
        company_epf VARCHAR(50) NULL,
        created_at TIMESTAMP DEFAULT $dateTimeNow,
        FOREIGN KEY(ca_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(company_id) REFERENCES companies(id) ON DELETE CASCADE
    )");
    echo "Table 'ca_invoices' created or verified.\n";

    // 4. Create ca_invoice_items
    $db->exec("CREATE TABLE IF NOT EXISTS ca_invoice_items (
        id $pk,
        invoice_id INT NOT NULL,
        description $text NOT NULL,
        amount $decimal NOT NULL,
        FOREIGN KEY(invoice_id) REFERENCES ca_invoices(id) ON DELETE CASCADE
    )");
    echo "Table 'ca_invoice_items' created or verified.\n";

    // 5. Add ca_id to platform invoices table (if driver allows and column doesn't exist)
    try {
        $db->exec("ALTER TABLE invoices ADD COLUMN ca_id INT NULL");
        echo "Column 'ca_id' added to 'invoices' table.\n";
    } catch (PDOException $e) {
        echo "Column 'ca_id' already exists in 'invoices' or could not be added: " . $e->getMessage() . "\n";
    }

    // 6. Ensure default CA user (finance@hrpayroll.com) has a ca_profile and a default assignment to company 1
    $caUser = $db->query("SELECT id FROM users WHERE email = 'finance@hrpayroll.com'")->fetch();
    if ($caUser) {
        $caId = $caUser['id'];
        
        // Ensure profile exists
        $profileExists = $db->query("SELECT id FROM ca_profiles WHERE user_id = $caId")->fetch();
        if (!$profileExists) {
            $stmt = $db->prepare("INSERT INTO ca_profiles (user_id, firm_name, mobile_number, address) VALUES (?, ?, ?, ?)");
            $stmt->execute([$caId, 'Apex Tax & Advisory Partners', '+919999988888', '402 Financial Plaza, New Delhi']);
            echo "Default CA profile seeded for finance@hrpayroll.com.\n";
        }

        // Ensure assignment to company 1 exists
        $assignExists = $db->query("SELECT id FROM company_assignments WHERE company_id = 1")->fetch();
        if (!$assignExists) {
            $superUser = $db->query("SELECT id FROM users WHERE role = 'superadmin' LIMIT 1")->fetch();
            $adminId = $superUser ? $superUser['id'] : 1;
            
            $stmt = $db->prepare("INSERT INTO company_assignments (company_id, user_id, assigned_by) VALUES (?, ?, ?)");
            $stmt->execute([1, $caId, $adminId]);
            echo "Default assignment seeded: CA finance@hrpayroll.com assigned to Company 1.\n";
        }
    }

    echo "CA Migration completed successfully!\n";
} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
