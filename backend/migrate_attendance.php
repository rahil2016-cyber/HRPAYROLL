<?php
// backend/migrate_attendance.php
require_once __DIR__ . '/config/db.php';

try {
    $db = Database::getConnection();
    $driver = $db->getAttribute(PDO::ATTR_DRIVER_NAME);
    echo "Running Attendance Module migration. Driver: " . strtoupper($driver) . "\n";

    // 1. Recreate attendance_logs table (since it's an operational logging table, it's safer to recreate it)
    $pk = ($driver === 'sqlite') ? "INTEGER PRIMARY KEY AUTOINCREMENT" : "INT AUTO_INCREMENT PRIMARY KEY";
    $decimal = ($driver === 'sqlite') ? "REAL" : "DECIMAL(10,2)";
    $text = ($driver === 'sqlite') ? "TEXT" : "TEXT";
    $dateTimeNow = ($driver === 'sqlite') ? "CURRENT_TIMESTAMP" : "CURRENT_TIMESTAMP";

    $db->exec("DROP TABLE IF EXISTS attendance_logs");
    $db->exec("CREATE TABLE attendance_logs (
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
    )");
    echo "Recreated table 'attendance_logs' successfully.\n";

    // 2. Add columns to 'attendance' table dynamically (catching exceptions if columns already exist)
    $columnsToAdd = [
        'company_id' => 'INT NOT NULL DEFAULT 1',
        'branch_id' => 'INT DEFAULT 1',
        'clock_in_photo' => 'VARCHAR(255) NULL',
        'clock_out_photo' => 'VARCHAR(255) NULL',
        'clock_in_distance' => "$decimal NULL",
        'clock_out_distance' => "$decimal NULL",
        'clock_in_gps_accuracy' => "$decimal NULL",
        'clock_out_gps_accuracy' => "$decimal NULL",
        'clock_in_browser' => 'VARCHAR(100) NULL',
        'clock_in_os' => 'VARCHAR(100) NULL',
        'clock_in_device' => 'VARCHAR(150) NULL',
        'clock_in_ip' => 'VARCHAR(45) NULL',
        'clock_in_network' => 'VARCHAR(50) NULL',
        'clock_in_battery' => "$decimal NULL",
        'clock_in_face_score' => "$decimal NULL",
        'clock_in_face_verified' => 'INT DEFAULT 0',
        'clock_in_liveness_score' => "$decimal NULL",
        'clock_in_liveness_verified' => 'INT DEFAULT 0',
        'clock_in_gps_verified' => 'INT DEFAULT 0',
        'clock_out_browser' => 'VARCHAR(100) NULL',
        'clock_out_os' => 'VARCHAR(100) NULL',
        'clock_out_device' => 'VARCHAR(150) NULL',
        'clock_out_ip' => 'VARCHAR(45) NULL',
        'clock_out_network' => 'VARCHAR(50) NULL',
        'clock_out_battery' => "$decimal NULL",
        'clock_out_face_score' => "$decimal NULL",
        'clock_out_face_verified' => 'INT DEFAULT 0',
        'clock_out_liveness_score' => "$decimal NULL",
        'clock_out_liveness_verified' => 'INT DEFAULT 0',
        'clock_out_gps_verified' => 'INT DEFAULT 0',
        'updated_at' => "TIMESTAMP DEFAULT $dateTimeNow"
    ];

    foreach ($columnsToAdd as $colName => $colDef) {
        try {
            $db->exec("ALTER TABLE attendance ADD COLUMN {$colName} {$colDef}");
            echo "Added column '{$colName}' to 'attendance' table.\n";
        } catch (PDOException $e) {
            // SQLite or MySQL may throw an exception if column already exists
            echo "Column '{$colName}' already exists or failed to add: " . $e->getMessage() . "\n";
        }
    }

    echo "Migration completed successfully!\n";
} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
