<?php
// backend/migrate_employees.php
require_once __DIR__ . '/config/db.php';

try {
    $db = Database::getConnection();
    $driver = $db->getAttribute(PDO::ATTR_DRIVER_NAME);
    echo "Running Employees Table Schema Migration. Driver: " . strtoupper($driver) . "\n";

    $decimal = ($driver === 'sqlite') ? "REAL" : "DECIMAL(10,2)";
    $text = ($driver === 'sqlite') ? "TEXT" : "TEXT";

    // Detailed employee columns that might be missing
    $columnsToAdd = [
        'first_name' => 'VARCHAR(100) NULL',
        'middle_name' => 'VARCHAR(100) NULL',
        'last_name' => 'VARCHAR(100) NULL',
        'gender' => 'VARCHAR(20) NULL',
        'mobile_number' => 'VARCHAR(20) NULL',
        'is_director' => 'INT DEFAULT 0',
        'enable_portal_access' => 'INT DEFAULT 1',
        'annual_ctc' => "$decimal DEFAULT 0.00",
        'basic' => "$decimal DEFAULT 0.00",
        'hra' => "$decimal DEFAULT 0.00",
        'fixed_allowance' => "$decimal DEFAULT 0.00",
        'conveyance_allowance' => "$decimal DEFAULT 0.00",
        'other_benefits' => "$text NULL",
        'date_of_birth' => 'VARCHAR(20) NULL',
        'age' => 'INT NULL',
        'father_name' => 'VARCHAR(100) NULL',
        'pan' => 'VARCHAR(20) NULL',
        'differently_abled_type' => 'VARCHAR(50) NULL',
        'personal_email' => 'VARCHAR(100) NULL',
        'address_line1' => 'VARCHAR(255) NULL',
        'address_line2' => 'VARCHAR(255) NULL',
        'city' => 'VARCHAR(100) NULL',
        'state' => 'VARCHAR(100) NULL',
        'pincode' => 'VARCHAR(20) NULL',
        'photo' => "$text NULL",
        'emergency_name' => 'VARCHAR(100) NULL',
        'emergency_relationship' => 'VARCHAR(50) NULL',
        'emergency_phone' => 'VARCHAR(20) NULL'
    ];

    foreach ($columnsToAdd as $colName => $colDef) {
        try {
            $db->exec("ALTER TABLE employees ADD COLUMN {$colName} {$colDef}");
            echo "✅ Added column '{$colName}' to 'employees' table.\n";
        } catch (PDOException $e) {
            // Column already exists or failed to add
            echo "ℹ️ Column '{$colName}' already exists or could not be added: " . $e->getMessage() . "\n";
        }
    }

    echo "Employees Table Migration completed successfully!\n";
} catch (Exception $e) {
    echo "❌ Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
