<?php
// backend/seed_bank.php
require_once __DIR__ . '/config/db.php';

try {
    $db = Database::getConnection();
    
    // Clear and insert mock bank details
    $db->exec("DELETE FROM employee_bank");
    
    $stmt = $db->prepare("INSERT INTO employee_bank (employee_id, bank_name, account_number, ifsc_code) VALUES (?, ?, ?, ?)");
    $stmt->execute([1, 'HDFC Bank', '50100326469985', 'HDFC0000041']);
    $stmt->execute([2, 'ICICI Bank', '000401502938', 'ICIC0000004']);
    $stmt->execute([3, 'State Bank of India', '30293810293', 'SBIN0000123']);
    
    echo "Employee bank details seeded successfully!\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
