<?php
// backend/migrate_service_type_and_invoice_fields.php
require_once __DIR__ . '/config/db.php';

try {
    $db = Database::getConnection();
    $driver = $db->getAttribute(PDO::ATTR_DRIVER_NAME);
    echo "Running Company Service Type and Invoice Fields migration. Driver: " . strtoupper($driver) . "\n";

    // 1. Alter companies table
    try {
        $db->exec("ALTER TABLE companies ADD COLUMN service_type VARCHAR(50) DEFAULT 'CompletePayroll'");
        echo "Column 'service_type' added to 'companies' table successfully.\n";
    } catch (PDOException $e) {
        echo "Column 'service_type' already exists or could not be added: " . $e->getMessage() . "\n";
    }

    // 2. Alter ca_invoices table to add detailed tax invoice fields
    $invoiceCols = [
        'client_name' => 'VARCHAR(255) NULL',
        'client_address' => 'TEXT NULL',
        'client_gstin' => 'VARCHAR(50) NULL',
        'basic_da_rate' => 'DECIMAL(10,2) DEFAULT 0.00',
        'basic_da_mandays' => 'DECIMAL(10,2) DEFAULT 0.00',
        'basic_da_amount' => 'DECIMAL(10,2) DEFAULT 0.00',
        'allowances_rate' => 'DECIMAL(10,2) DEFAULT 0.00',
        'allowances_mandays' => 'DECIMAL(10,2) DEFAULT 0.00',
        'allowances_amount' => 'DECIMAL(10,2) DEFAULT 0.00',
        'epf_rate' => 'DECIMAL(10,2) DEFAULT 13.00',
        'epf_amount' => 'DECIMAL(10,2) DEFAULT 0.00',
        'esic_rate' => 'DECIMAL(10,2) DEFAULT 3.25',
        'esic_amount' => 'DECIMAL(10,2) DEFAULT 0.00',
        'service_charge_rate' => 'DECIMAL(10,2) DEFAULT 5.00',
        'service_charge_amount' => 'DECIMAL(10,2) DEFAULT 0.00',
        'cgst_rate' => 'DECIMAL(10,2) DEFAULT 9.00',
        'cgst_amount' => 'DECIMAL(10,2) DEFAULT 0.00',
        'sgst_rate' => 'DECIMAL(10,2) DEFAULT 9.00',
        'sgst_amount' => 'DECIMAL(10,2) DEFAULT 0.00',
        'tds_rate' => 'DECIMAL(10,2) DEFAULT 2.00',
        'tds_amount' => 'DECIMAL(10,2) DEFAULT 0.00',
        'net_payment' => 'DECIMAL(10,2) DEFAULT 0.00',
        'bank_name' => 'VARCHAR(100) NULL',
        'bank_account_number' => 'VARCHAR(100) NULL',
        'bank_account_type' => 'VARCHAR(50) NULL',
        'bank_branch' => 'VARCHAR(100) NULL',
        'bank_ifsc' => 'VARCHAR(50) NULL',
        'company_gstin' => 'VARCHAR(50) NULL',
        'company_pan' => 'VARCHAR(50) NULL',
        'company_esi' => 'VARCHAR(50) NULL',
        'company_epf' => 'VARCHAR(50) NULL'
    ];

    foreach ($invoiceCols as $col => $def) {
        $sqlite_def = $def;
        if ($driver === 'sqlite') {
            if (strpos($def, 'DECIMAL') !== false) {
                $sqlite_def = str_replace(['DECIMAL(10,2)', 'DECIMAL(5,2)'], 'REAL', $def);
            }
        }
        try {
            $db->exec("ALTER TABLE ca_invoices ADD COLUMN {$col} {$sqlite_def}");
            echo "Column '{$col}' added to 'ca_invoices' successfully.\n";
        } catch (PDOException $e) {
            echo "Column '{$col}' already exists or could not be added: " . $e->getMessage() . "\n";
        }
    }

    echo "Migration completed successfully!\n";
} catch (Exception $e) {
    echo "Migration script failed: " . $e->getMessage() . "\n";
    exit(1);
}
