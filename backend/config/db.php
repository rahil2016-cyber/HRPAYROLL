<?php
// backend/config/db.php

class Database {
    private static $conn = null;

    public static function getConnection() {
        if (self::$conn !== null) {
            return self::$conn;
        }

        // Default MySQL settings
        $host = '127.0.0.1';
        $db_name = 'hr_payroll';
        $username = 'root';
        $password = '';
        $port = '3306';

        try {
            // Attempt MySQL connection
            $dsn = "mysql:host={$host};port={$port};dbname={$db_name};charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            self::$conn = new PDO($dsn, $username, $password, $options);
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
