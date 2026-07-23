<?php
require_once __DIR__ . '/config/db.php';
try {
    $db = Database::getConnection();
    $cols = $db->query("PRAGMA table_info(employees)")->fetchAll(PDO::FETCH_COLUMN, 1);
    echo "Columns in employees table:\n";
    print_r($cols);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
