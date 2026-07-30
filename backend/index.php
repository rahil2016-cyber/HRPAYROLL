<?php
// backend/index.php

// 1. Include CORS and database config
require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/helpers/jwt.php';

// Set response content type to JSON
header('Content-Type: application/json');

// Parse raw JSON request bodies
$input = json_decode(file_get_contents('php://input'), true) ?? [];

// Resolve the route (supports both clean paths or query params)
$request_uri = $_SERVER['REQUEST_URI'];
// Remove query string if using path info
if (false !== $pos = strpos($request_uri, '?')) {
    $request_uri = substr($request_uri, 0, $pos);
}

// Strip leading subdirectory if running from a nested path
$script_name = dirname($_SERVER['SCRIPT_NAME']);
if ($script_name !== '/' && strpos($request_uri, $script_name) === 0) {
    $request_uri = substr($request_uri, strlen($script_name));
}

// Fallback to route query parameter if available
$route = $_GET['route'] ?? $request_uri;
$route = '/' . ltrim($route, '/');

// Authenticate via JWT if Authorization header is set
$user = null;
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? '';

if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $token = $matches[1];
    $decoded = JWT::verify($token);
    if ($decoded) {
        $user = $decoded;
    }
}

// Global DB Connection available for all routes
try {
    $db = Database::getConnection();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed', 'details' => $e->getMessage()]);
    exit();
}

// Global IP-Based Rate Limiter (Max 100 requests per minute)
try {
    $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    $now = time();
    $window = 60; // 60 seconds
    
    // Create rate_limits table if not exists
    $db->exec("CREATE TABLE IF NOT EXISTS rate_limits (ip TEXT, endpoint TEXT, timestamp INTEGER)");
    
    // Clean up expired logs older than 1 minute
    $delLimiter = $db->prepare("DELETE FROM rate_limits WHERE timestamp < ?");
    $delLimiter->execute([$now - $window]);
    
    // Count requests from this IP in the last minute
    $countLimiter = $db->prepare("SELECT COUNT(*) FROM rate_limits WHERE ip = ?");
    $countLimiter->execute([$ip]);
    $requestCount = $countLimiter->fetchColumn();
    
    if ($requestCount > 120) { // Allow up to 120 requests per minute
        http_response_code(429);
        header('Retry-After: 60');
        echo json_encode([
            'error' => 'Too Many Requests',
            'message' => 'Rate limit exceeded. Please try again after 60 seconds.'
        ]);
        exit();
    }
    
    // Record this request
    $insLimiter = $db->prepare("INSERT INTO rate_limits (ip, endpoint, timestamp) VALUES (?, ?, ?)");
    $insLimiter->execute([$ip, $route, $now]);
} catch (Exception $limiterEx) {
    // Fail-safe: do not block API calls if SQLite gets locked temporarily
}

// Routing Logic
if (strpos($route, '/api/auth') === 0) {
    require_once __DIR__ . '/api/auth.php';
} elseif (strpos($route, '/api/biometric') === 0) {
    require_once __DIR__ . '/api/biometric.php';
} elseif (strpos($route, '/api/superadmin') === 0) {
    if (!$user || $user['role'] !== 'superadmin') {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden: Super Admin access required']);
        exit();
    }
    require_once __DIR__ . '/api/superadmin.php';
} elseif (strpos($route, '/api/hr') === 0) {
    if (!$user || ($user['role'] !== 'hr' && $user['role'] !== 'superadmin')) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden: HR access required']);
        exit();
    }
    require_once __DIR__ . '/api/hr.php';
} elseif (strpos($route, '/api/finance') === 0) {
    if (!$user || ($user['role'] !== 'finance' && $user['role'] !== 'superadmin')) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden: Finance access required']);
        exit();
    }
    require_once __DIR__ . '/api/finance.php';
} elseif (strpos($route, '/api/attendance') === 0) {
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized: Log in required']);
        exit();
    }
    require_once __DIR__ . '/api/attendance.php';
} elseif (strpos($route, '/api/employee') === 0) {
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized: Log in required']);
        exit();
    }
    require_once __DIR__ . '/api/employee.php';
} elseif (strpos($route, '/api/documents') === 0) {
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized: Log in required']);
        exit();
    }
    require_once __DIR__ . '/api/documents.php';
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Endpoint not found', 'requested_route' => $route]);
}
