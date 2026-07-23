<?php
require_once 'config/db.php';
try {
    $db = Database::getConnection();
    $stmt = $db->query("SELECT id, name, email, role, password_hash FROM users ORDER BY id");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $passwords = ['admin123', 'hr123', 'finance123', 'employee123', 'Thinkzeel@123', 'thinkzeel', 'kakoon123', 'rahil123', 'password', 'test123', '123456', 'Admin@123'];
    
    foreach ($users as $user) {
        echo "User: {$user['email']} ({$user['role']})\n";
        $found = false;
        foreach ($passwords as $pw) {
            if (password_verify($pw, $user['password_hash'])) {
                echo "  Password: {$pw}\n";
                $found = true;
                break;
            }
        }
        if (!$found) echo "  Password: (unknown)\n";
    }
} catch (Exception $e) {
    echo $e->getMessage();
}
