<?php
// backend/test_login.php
require_once __DIR__ . '/config/db.php';

try {
    $db = Database::getConnection();
    $email = 'superadmin@hrallocate.com';
    $password = 'admin123';
    
    $stmt = $db->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $userRecord = $stmt->fetch();
    
    if (!$userRecord) {
        echo "STATUS: User 'superadmin@hrallocate.com' not found in database.\n\n";
        
        // Dump existing users for diagnostics
        $users = $db->query("SELECT id, email, role, status FROM users")->fetchAll();
        echo "Current users in database:\n";
        print_r($users);
        exit;
    }
    
    echo "STATUS: Found user: " . $userRecord['email'] . "\n";
    echo "STATUS: Role: " . $userRecord['role'] . "\n";
    echo "STATUS: Status: " . $userRecord['status'] . "\n";
    
    if (password_verify($password, $userRecord['password_hash'])) {
        echo "STATUS: Password verification SUCCESS!\n";
    } else {
        echo "STATUS: Password verification FAILED (Incorrect Password Hash).\n";
    }
} catch (Exception $e) {
    echo "DATABASE ERROR: " . $e->getMessage() . "\n";
}
