<?php
// backend/api/documents.php

if (!isset($db) || !isset($route) || !isset($user)) {
    exit('Direct access not allowed');
}

$action = str_replace('/api/documents/', '', $route);

function docResponse($code, $data) {
    http_response_code($code);
    echo json_encode($data);
    exit();
}

if ($action === 'download') {
    $file_path = $_GET['file_path'] ?? '';
    if (empty($file_path)) {
        docResponse(400, ['error' => 'File path is required']);
    }

    // Standardize file path to prevent directory traversal
    $real_file_path = realpath(__DIR__ . '/../' . $file_path);
    $base_upload_dir = realpath(__DIR__ . '/../uploads');

    if ($real_file_path === false || strpos($real_file_path, $base_upload_dir) !== 0) {
        docResponse(400, ['error' => 'Invalid file path: Directory traversal blocked']);
    }

    if (!file_exists($real_file_path)) {
        docResponse(404, ['error' => 'File not found on storage']);
    }

    // Log the file download in audit logs
    $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown Device';
    
    // Find if this is an employee document to perform RBAC checks
    $stmt = $db->prepare("SELECT * FROM employee_documents WHERE file_path = ?");
    $stmt->execute([$file_path]);
    $doc = $stmt->fetch();

    if ($doc) {
        $emp_id = $doc['employee_id'];
        
        $empStmt = $db->prepare("SELECT company_id, user_id FROM employees WHERE id = ?");
        $empStmt->execute([$emp_id]);
        $emp = $empStmt->fetch();
        
        if ($emp) {
            $emp_company_id = $emp['company_id'];
            $emp_user_id = $emp['user_id'];
            
            // Perform RBAC checks
            if ($user['role'] === 'superadmin') {
                // Allowed
            } elseif ($user['role'] === 'hr') {
                if ((int)$emp_company_id !== (int)$user['company_id']) {
                    docResponse(403, ['error' => 'Forbidden: You do not have permission to view documents for this company\'s employees.']);
                }
            } elseif ($user['role'] === 'finance') {
                $checkStmt = $db->prepare("SELECT id FROM company_assignments WHERE company_id = ? AND user_id = ?");
                $checkStmt->execute([$emp_company_id, $user['id']]);
                if (!$checkStmt->fetch()) {
                    docResponse(403, ['error' => 'Forbidden: You are not assigned to this company.']);
                }
            } elseif ($user['role'] === 'employee') {
                if ((int)$user['id'] !== (int)$emp_user_id) {
                    docResponse(403, ['error' => 'Forbidden: You can only view your own documents.']);
                }
            } else {
                docResponse(403, ['error' => 'Forbidden: Unknown role access denied.']);
            }
        } else {
            if ($user['role'] !== 'superadmin') {
                docResponse(403, ['error' => 'Forbidden: Admin access required.']);
            }
        }
    }

    // Log download action
    $logDetails = json_encode([
        'file_path' => $file_path,
        'user_name' => $user['name'] ?? 'Unknown',
        'role' => $user['role'] ?? 'Unknown',
        'ip_address' => $ip,
        'device' => $userAgent
    ]);
    $logStmt = $db->prepare("INSERT INTO audit_logs (user_id, action, details) VALUES (?, 'Document Downloaded', ?)");
    $logStmt->execute([$user['id'], $logDetails]);

    // Serve file securely
    $mime = mime_content_type($real_file_path);
    if (!$mime) {
        $mime = 'application/octet-stream';
    }

    // Set download headers
    header("Content-Description: File Transfer");
    header("Content-Type: " . $mime);
    header("Content-Disposition: attachment; filename=\"" . basename($real_file_path) . "\"");
    header("Content-Transfer-Encoding: binary");
    header("Expires: 0");
    header("Cache-Control: must-revalidate");
    header("Pragma: public");
    header("Content-Length: " . filesize($real_file_path));

    // Clear output buffer and stream file
    ob_clean();
    flush();
    readfile($real_file_path);
    exit();
} else {
    docResponse(404, ['error' => 'Endpoint not found']);
}
