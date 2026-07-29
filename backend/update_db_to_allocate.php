<?php
// backend/update_db_to_allocate.php

require_once __DIR__ . '/config/db.php';

try {
    $db = Database::getConnection();
    
    // Update emails in users table to use @hrallocate.com instead of @hrpayroll.com
    $stmt = $db->query("UPDATE users SET email = REPLACE(email, '@hrpayroll.com', '@hrallocate.com')");
    $affected = $stmt->rowCount();
    
    echo "Database updated successfully! Changed {$affected} email records from @hrpayroll.com to @hrallocate.com.\n";
    echo "You can now log in using the new emails.\n";
} catch (Exception $e) {
    echo "Error updating database: " . $e->getMessage() . "\n";
}
