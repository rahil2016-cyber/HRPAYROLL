<?php
// backend/cron_birthday.php
require_once __DIR__ . '/config/db.php';

try {
    $db = Database::getConnection();
    $today = date('m-d');
    echo "=== Starting Birthday Notification Cron (" . date('Y-m-d H:i:s') . ") ===\n";

    // Query active employees whose birthday is today
    // Handles SQLite date formats (YYYY-MM-DD)
    $stmt = $db->prepare("
        SELECT e.id as employee_id, e.employee_code, u.name as employee_name, e.date_of_birth, e.company_id
        FROM employees e
        JOIN users u ON e.user_id = u.id
        WHERE u.role != 'hr' 
          AND e.date_of_birth IS NOT NULL 
          AND e.date_of_birth != ''
          AND strftime('%m-%d', e.date_of_birth) = ?
    ");
    $stmt->execute([$today]);
    $birthdayEmployees = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($birthdayEmployees)) {
        echo "No employee birthdays detected for today ($today).\n";
        exit(0);
    }

    echo "Found " . count($birthdayEmployees) . " employee birthday(s) today.\n";

    foreach ($birthdayEmployees as $emp) {
        $companyId = $emp['company_id'];
        $empName = $emp['employee_name'];
        $empCode = $emp['employee_code'];

        // Find HR Admins for this company
        $hrStmt = $db->prepare("
            SELECT u.email, u.name
            FROM users u
            JOIN company_assignments ca ON u.id = ca.user_id
            WHERE ca.company_id = ? AND u.role = 'hr'
        ");
        $hrStmt->execute([$companyId]);
        $hrAdmins = $hrStmt->fetchAll(PDO::FETCH_ASSOC);

        if (empty($hrAdmins)) {
            echo "No HR Admin found for Company ID: $companyId (Employee: $empName)\n";
            continue;
        }

        foreach ($hrAdmins as $hr) {
            $hrEmail = $hr['email'];
            $hrName = $hr['name'];

            $subject = "🎈 Birthday Alert: " . $empName . " (" . $empCode . ") has a birthday today!";
            $msg = "Dear " . $hrName . ",\n\n";
            $msg .= "This is a friendly reminder that your employee, " . $empName . " (ID: " . $empCode . "), is celebrating their birthday today (" . $emp['date_of_birth'] . ")!\n\n";
            $msg .= "Don't forget to send them birthday wishes.\n\n";
            $msg .= "Best regards,\nHR Allocate Notifications";

            $headers = "From: notifications@hrallocate.in\r\n";
            $headers .= "Reply-To: notifications@hrallocate.in\r\n";
            $headers .= "X-Mailer: PHP/" . phpversion();

            if (@mail($hrEmail, $subject, $msg, $headers)) {
                echo "✅ Notification email sent to HR ($hrEmail) for employee $empName ($empCode).\n";
            } else {
                echo "❌ Failed to send notification email to HR ($hrEmail) for employee $empName ($empCode).\n";
            }
        }
    }
    echo "=== Birthday Notification Cron Finished ===\n";
} catch (Exception $e) {
    echo "❌ Error in Birthday Notification Cron: " . $e->getMessage() . "\n";
}
