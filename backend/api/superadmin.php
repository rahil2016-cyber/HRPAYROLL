<?php
// backend/api/superadmin.php

if (!isset($db) || !isset($route) || !isset($user)) {
    exit('Direct access not allowed');
}

$action = str_replace('/api/superadmin/', '', $route);

function jsonResponse($code, $data) {
    http_response_code($code);
    echo json_encode($data);
    exit();
}

if ($action === 'dashboard') {
    // Platform analytics for Super Admin
    try {
        $companiesCount = $db->query("SELECT COUNT(*) FROM companies")->fetchColumn();
        $usersCount = $db->query("SELECT COUNT(*) FROM users WHERE role = 'employee'")->fetchColumn();
        $plansCount = $db->query("SELECT COUNT(*) FROM plans")->fetchColumn();
        $totalRevenue = $db->query("SELECT SUM(amount) FROM payments WHERE status = 'Completed'")->fetchColumn() ?? 0.00;
        
        // Fetch revenue history for charts (mock/sample aggregations)
        $revenueHistory = [
            ['month' => 'Jan', 'revenue' => 12500],
            ['month' => 'Feb', 'revenue' => 15000],
            ['month' => 'Mar', 'revenue' => 18200],
            ['month' => 'Apr', 'revenue' => 22000],
            ['month' => 'May', 'revenue' => 26400],
            ['month' => 'Jun', 'revenue' => 31000]
        ];

        // Fetch recent active companies
        $recentCompanies = $db->query("SELECT * FROM companies ORDER BY id DESC LIMIT 5")->fetchAll();

        jsonResponse(200, [
            'metrics' => [
                'total_companies' => (int)$companiesCount,
                'total_employees' => (int)$usersCount,
                'total_plans' => (int)$plansCount,
                'total_revenue' => (float)$totalRevenue
            ],
            'revenue_history' => $revenueHistory,
            'recent_companies' => $recentCompanies
        ]);
    } catch (Exception $e) {
        jsonResponse(500, ['error' => 'Failed to load superadmin stats', 'details' => $e->getMessage()]);
    }
}

elseif ($action === 'companies') {
    // List or toggle status of companies
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $companies = $db->query("SELECT * FROM companies ORDER BY id DESC")->fetchAll();
        jsonResponse(200, ['companies' => $companies]);
    }
    
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Toggle status
        $company_id = $input['company_id'] ?? null;
        $status = $input['status'] ?? 'Active'; // Active or Suspended

        if (!$company_id) {
            jsonResponse(400, ['error' => 'Company ID is required']);
        }

        $stmt = $db->prepare("UPDATE companies SET status = ? WHERE id = ?");
        $stmt->execute([$status, $company_id]);

        jsonResponse(200, ['message' => 'Company status updated to ' . $status]);
    }
}

elseif ($action === 'plans') {
    // Subscriptions Plan management
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $plans = $db->query("SELECT * FROM plans")->fetchAll();
        jsonResponse(200, ['plans' => $plans]);
    }
    
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $name = $input['name'] ?? '';
        $price = $input['price'] ?? 0.00;
        $max_employees = $input['max_employees'] ?? 100;
        $features = $input['features'] ?? '';

        if (empty($name)) {
            jsonResponse(400, ['error' => 'Plan Name is required']);
        }

        $stmt = $db->prepare("INSERT INTO plans (name, price, max_employees, features) VALUES (?, ?, ?, ?)");
        $stmt->execute([$name, $price, $max_employees, $features]);

        jsonResponse(201, ['message' => 'Plan created successfully', 'plan_id' => $db->lastInsertId()]);
    }
}

elseif ($action === 'tickets') {
    // Support tickets across the tenant system
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $tickets = $db->query("SELECT t.*, c.name as company_name, u.name as user_name FROM tickets t JOIN companies c ON t.company_id = c.id JOIN users u ON t.user_id = u.id ORDER BY t.id DESC")->fetchAll();
        jsonResponse(200, ['tickets' => $tickets]);
    } 
    
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $ticket_id = $input['ticket_id'] ?? null;
        $status = $input['status'] ?? 'Resolved';

        if (!$ticket_id) {
            jsonResponse(400, ['error' => 'Ticket ID is required']);
        }

        $stmt = $db->prepare("UPDATE tickets SET status = ? WHERE id = ?");
        $stmt->execute([$status, $ticket_id]);

        jsonResponse(200, ['message' => 'Ticket status updated to ' . $status]);
    }
}

else {
    jsonResponse(404, ['error' => 'Superadmin endpoint not found']);
}
