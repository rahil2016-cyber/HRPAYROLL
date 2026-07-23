<?php
// backend/config/db.php

require_once dirname(__DIR__) . '/helpers/env.php';

class Database {
    private static $conn = null;

    public static function getConnection() {
        if (self::$conn !== null) {
            return self::$conn;
        }

        // Default MySQL settings
        $host = env('DB_HOST', '127.0.0.1');
        $db_name = env('DB_DATABASE', 'hr_payroll');
        $username = env('DB_USERNAME', 'root');
        $password = env('DB_PASSWORD', '');
        $port = env('DB_PORT', '3306');

        try {
            // Attempt MySQL connection
            $dsn = "mysql:host={$host};port={$port};dbname={$db_name};charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            self::$conn = new PDO($dsn, $username, $password, $options);
            try {
                self::$conn->exec("ALTER TABLE payslips ADD COLUMN overtime_pay DECIMAL(10,2) DEFAULT 0.00");
            } catch (PDOException $alterEx) {
                // Column might already exist, ignore
            }
            try {
                self::$conn->exec("ALTER TABLE attendance ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
            } catch (PDOException $ex) {
                // ignore if already exists
            }
            $empCols = [
                'medical_allowance' => 'DECIMAL(10,2) DEFAULT 0.00',
                'employer_pf' => 'DECIMAL(10,2) DEFAULT 0.00',
                'employer_esi' => 'DECIMAL(10,2) DEFAULT 0.00',
                'gratuity' => 'DECIMAL(10,2) DEFAULT 0.00',
                'insurance' => 'DECIMAL(10,2) DEFAULT 0.00',
                'bonus' => 'DECIMAL(10,2) DEFAULT 0.00',
                'lwf' => 'DECIMAL(10,2) DEFAULT 0.00'
            ];
            foreach ($empCols as $col => $def) {
                try {
                    self::$conn->exec("ALTER TABLE employees ADD COLUMN {$col} {$def}");
                } catch (PDOException $ex) {
                    // ignore if already exists
                }
            }
            try {
                self::$conn->exec("ALTER TABLE companies ADD COLUMN onboarding_completed INT DEFAULT 0");
            } catch (PDOException $ex) {
                // ignore if already exists
            }
            try {
                self::$conn->exec("ALTER TABLE companies ADD COLUMN service_type VARCHAR(50) DEFAULT 'CompletePayroll'");
            } catch (PDOException $ex) {
                // ignore if already exists
            }
            return self::$conn;
        } catch (PDOException $e) {
            // If MySQL fails, fallback to local SQLite database in the backend directory
            $dbDir = dirname(__DIR__);
            $sqlitePath = $dbDir . DIRECTORY_SEPARATOR . 'database.sqlite';
            
            try {
                $dsn = "sqlite:" . $sqlitePath;
                $options = [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                ];
                self::$conn = new PDO($dsn, null, null, $options);
                
                // Enable foreign key support in SQLite
                self::$conn->exec('PRAGMA foreign_keys = ON;');

                // Run migration to add overtime_pay column
                try {
                    self::$conn->exec("ALTER TABLE payslips ADD COLUMN overtime_pay REAL DEFAULT 0.00");
                } catch (PDOException $alterEx) {
                    // Column might already exist, ignore
                }
                try {
                    self::$conn->exec("ALTER TABLE attendance ADD COLUMN updated_at DATETIME");
                } catch (PDOException $ex) {
                    // ignore if already exists
                }

                $empCols = [
                    'medical_allowance' => 'REAL DEFAULT 0.00',
                    'employer_pf' => 'REAL DEFAULT 0.00',
                    'employer_esi' => 'REAL DEFAULT 0.00',
                    'gratuity' => 'REAL DEFAULT 0.00',
                    'insurance' => 'REAL DEFAULT 0.00',
                    'bonus' => 'REAL DEFAULT 0.00',
                    'lwf' => 'REAL DEFAULT 0.00'
                ];
                foreach ($empCols as $col => $def) {
                    try {
                        self::$conn->exec("ALTER TABLE employees ADD COLUMN {$col} {$def}");
                    } catch (PDOException $ex) {
                        // ignore if already exists
                    }
                }
                try {
                    self::$conn->exec("ALTER TABLE companies ADD COLUMN onboarding_completed INT DEFAULT 0");
                } catch (PDOException $ex) {
                    // ignore if already exists
                }
                try {
                    self::$conn->exec("ALTER TABLE companies ADD COLUMN service_type VARCHAR(50) DEFAULT 'CompletePayroll'");
                } catch (PDOException $ex) {
                    // ignore if already exists
                }

                return self::$conn;
            } catch (PDOException $sqliteEx) {
                // Return json error if both fail
                header('Content-Type: application/json');
                http_response_code(500);
                echo json_encode([
                    'error' => 'Database connection failed',
                    'details' => $sqliteEx->getMessage()
                ]);
                exit();
            }
        }
    }
}
