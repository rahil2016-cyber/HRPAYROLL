<?php
// backend/api/biometric.php
// Public API Endpoint for Biometric Machine Integrations (e.g., ZKTeco, Matrix, Essl)
header('Content-Type: application/json');

if (!isset($db) || !isset($route)) {
    exit('Direct access not allowed');
}

// 1. Authenticate using Custom Header X-API-Key
$apiKey = $_SERVER['HTTP_X_API_KEY'] ?? $_SERVER['HTTP_X_API_KEY'] ?? null;
if (!$apiKey) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized: API Key is required in X-API-Key header']);
    exit;
}

try {
    $stmt = $db->prepare("SELECT company_id FROM api_keys WHERE api_key = ? AND status = 'Active'");
    $stmt->execute([$apiKey]);
    $keyInfo = $stmt->fetch();
    
    if (!$keyInfo) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized: Invalid or inactive API Key']);
        exit;
    }
    
    $companyId = $keyInfo['company_id'];
    
    // 2. Decode POST payload
    $input = json_decode(file_get_contents('php://input'), true);
    if (empty($input)) {
        http_response_code(400);
        echo json_encode(['error' => 'Bad Request: Missing payload data']);
        exit;
    }
    
    // Support both single logs and batch logs
    $logs = isset($input['employee_code']) ? [$input] : $input;
    $successCount = 0;
    $errors = [];
    
    foreach ($logs as $index => $log) {
        $empCode = $log['employee_code'] ?? null;
        $timestampStr = $log['timestamp'] ?? null; // Format: "YYYY-MM-DD HH:MM:SS"
        $direction = $log['type'] ?? 'check_in';   // 'check_in' or 'check_out'
        
        if (!$empCode || !$timestampStr) {
            $errors[] = "Index {$index}: employee_code and timestamp are required.";
            continue;
        }
        
        // Find employee ID mapping
        $empStmt = $db->prepare("SELECT id FROM employees WHERE employee_code = ? AND company_id = ?");
        $empStmt->execute([$empCode, $companyId]);
        $empId = $empStmt->fetchColumn();
        
        if (!$empId) {
            $errors[] = "Index {$index}: Employee with code '{$empCode}' not found in this company.";
            continue;
        }
        
        // Parse date and time
        $timestamp = strtotime($timestampStr);
        if (!$timestamp) {
            $errors[] = "Index {$index}: Invalid timestamp format '{$timestampStr}'. Use YYYY-MM-DD HH:MM:SS.";
            continue;
        }
        
        $date = date('Y-m-d', $timestamp);
        $time = date('H:i', $timestamp);
        
        // Check if attendance record exists for this employee on this date
        $attCheck = $db->prepare("SELECT id, clock_in, clock_out FROM attendance WHERE employee_id = ? AND date = ?");
        $attCheck->execute([$empId, $date]);
        $existing = $attCheck->fetch();
        
        if ($existing) {
            // Update existing record
            if ($direction === 'check_in') {
                $upStmt = $db->prepare("UPDATE attendance SET clock_in = ?, status = 'Present' WHERE id = ?");
                $upStmt->execute([$time, $existing['id']]);
            } else {
                $upStmt = $db->prepare("UPDATE attendance SET clock_out = ? WHERE id = ?");
                $upStmt->execute([$time, $existing['id']]);
            }
        } else {
            // Create new record
            if ($direction === 'check_in') {
                $insStmt = $db->prepare("INSERT INTO attendance (employee_id, company_id, date, clock_in, status, is_wfh) VALUES (?, ?, ?, ?, 'Present', 0)");
                $insStmt->execute([$empId, $companyId, $date, $time]);
            } else {
                $insStmt = $db->prepare("INSERT INTO attendance (employee_id, company_id, date, clock_out, status, is_wfh) VALUES (?, ?, ?, ?, 'Present', 0)");
                $insStmt->execute([$empId, $companyId, $date, $time]);
            }
        }
        $successCount++;
    }
    
    // Return result
    http_response_code(200);
    echo json_encode([
        'message' => 'Biometric attendance data synced successfully',
        'processed_records' => $successCount,
        'errors' => $errors
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error during biometric sync', 'details' => $e->getMessage()]);
}
