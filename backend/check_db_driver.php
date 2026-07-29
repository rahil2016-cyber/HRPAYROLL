<?php
// backend/check_db_driver.php
require_once __DIR__ . '/config/db.php';

try {
    $db = Database::getConnection();
    $driver = $db->getAttribute(PDO::ATTR_DRIVER_NAME);
    echo "STATUS: Database Driver is: " . strtoupper($driver) . "\n";
    
    if ($driver === 'mysql') {
        echo "STATUS: Connected to MySQL host: " . env('DB_HOST') . ", DB: " . env('DB_NAME') . "\n";
        // Check if users table exists in MySQL
        $tables = $db->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
        echo "STATUS: Existing Tables in MySQL: " . implode(', ', $tables) . "\n";
    } else {
        echo "STATUS: Connected to SQLite file: " . dirname(__DIR__) . DIRECTORY_SEPARATOR . 'database.sqlite' . "\n";
        // Check if users table exists in SQLite
        $tables = $db->query("SELECT name FROM sqlite_master WHERE type='table'")->fetchAll(PDO::FETCH_COLUMN);
        echo "STATUS: Existing Tables in SQLite: " . implode(', ', $tables) . "\n";
    }
} catch (Exception $e) {
    echo "ERROR connecting to database: " . $e->getMessage() . "\n";
}
