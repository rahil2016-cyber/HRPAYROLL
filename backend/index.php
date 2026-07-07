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

// Routing Logic
if (strpos($route, '/api/auth') === 0) {
    require_once __DIR__ . '/api/auth.php';
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
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Endpoint not found', 'requested_route' => $route]);
}
