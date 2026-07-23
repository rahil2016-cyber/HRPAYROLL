<?php
// backend/reset_password.php
require_once __DIR__ . '/config/db.php';

try {
    $db = Database::getConnection();
    $hash = password_hash('rahil123', PASSWORD_DEFAULT);
    
    $stmt = $db->prepare("UPDATE users SET password_hash = ? WHERE email = ?");
    $stmt->execute([$hash, 'rahil2016ok@gmail.com']);
    
    echo "SUCCESS: Password for rahil2016ok@gmail.com updated to 'rahil123'\n";
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
