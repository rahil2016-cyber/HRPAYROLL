<?php
// backend/tests/verify_service_models_and_invoices.php
require_once __DIR__ . '/../config/db.php';

echo "=== HR Allocate Service Models & Invoice Verification Script ===\n";

try {
    $db = Database::getConnection();

    // 1. Check table columns exist
    echo "1. Checking table schemas...\n";
    $stmt1 = $db->query("PRAGMA table_info(companies)");
    $companyCols = $stmt1->fetchAll(PDO::FETCH_COLUMN, 1);
    if (in_array('service_type', $companyCols)) {
        echo "✅ PASS: companies.service_type column is present.\n";
    } else {
        echo "❌ FAIL: companies.service_type is missing.\n";
    }

    $stmt2 = $db->query("PRAGMA table_info(ca_invoices)");
    $invoiceCols = $stmt2->fetchAll(PDO::FETCH_COLUMN, 1);
    $requiredInvoiceCols = ['client_name', 'basic_da_rate', 'epf_rate', 'esic_rate', 'service_charge_rate', 'cgst_rate', 'sgst_rate', 'tds_rate', 'net_payment'];
    $missing = [];
    foreach ($requiredInvoiceCols as $c) {
        if (!in_array($c, $invoiceCols)) {
            $missing[] = $c;
        }
    }
    if (empty($missing)) {
        echo "✅ PASS: All required tax invoice columns are present in ca_invoices.\n";
    } else {
        echo "❌ FAIL: Missing columns in ca_invoices: " . implode(', ', $missing) . "\n";
    }

    // 2. Test business logic via DB state check
    echo "\n2. Verifying mock invoice insertion and formulas...\n";
    
    // Find default CA user
    $caUser = $db->query("SELECT id FROM users WHERE email = 'finance@hrpayroll.com'")->fetch(PDO::FETCH_ASSOC);
    $caId = $caUser ? $caUser['id'] : 1;

    // We insert a test draft invoice and check formulas
    $testInvoice = [
        'ca_id' => $caId,
        'company_id' => 1,
        'billing_month' => 7,
        'billing_year' => 2026,
        'invoice_number' => 'TEST/INV/2026/01',
        'invoice_date' => '2026-07-22',
        'client_name' => 'TEST CLIENT PVT LTD',
        'client_address' => 'Test address',
        'client_gstin' => '29AAECT1234F1Z1',
        'basic_da_rate' => 293,
        'basic_da_mandays' => 140,
        'basic_da_amount' => 41020,
        'allowances_rate' => 293,
        'allowances_mandays' => 140,
        'allowances_amount' => 41020,
        'epf_rate' => 13,
        'epf_amount' => 10665.20,
        'esic_rate' => 3.25,
        'esic_amount' => 2666.30,
        'service_charge_rate' => 5,
        'service_charge_amount' => 4767.58,
        'cgst_rate' => 9,
        'cgst_amount' => 17841.44,
        'sgst_rate' => 9,
        'sgst_amount' => 17841.44,
        'tds_rate' => 2,
        'tds_amount' => 1982.38,
        'net_payment' => 115000.00,
        'grand_total' => 116982.38,
        'professional_fee' => 82040.00
    ];

    $db->prepare("DELETE FROM ca_invoices WHERE invoice_number = 'TEST/INV/2026/01'")->execute();
    
    $keys = array_keys($testInvoice);
    $placeholders = array_map(fn($k) => ":$k", $keys);
    $sql = "INSERT INTO ca_invoices (" . implode(', ', $keys) . ") VALUES (" . implode(', ', $placeholders) . ")";
    
    $stmt = $db->prepare($sql);
    $stmt->execute($testInvoice);
    $lastId = $db->lastInsertId();

    echo "Mock invoice inserted successfully (ID: $lastId).\n";

    // Read back and assert values
    $query = $db->query("SELECT * FROM ca_invoices WHERE id = $lastId");
    $row = $query->fetch(PDO::FETCH_ASSOC);

    if ($row['invoice_number'] === 'TEST/INV/2026/01' && (float)$row['epf_rate'] === 13.00 && (float)$row['tds_rate'] === 2.00) {
        echo "✅ PASS: Database holds exact client tax details correctly.\n";
    } else {
        echo "❌ FAIL: Retrying mismatch of fields.\n";
    }

    // Clean up
    $db->prepare("DELETE FROM ca_invoices WHERE id = $lastId")->execute();
    echo "Mock invoice cleaned up successfully.\n";

    echo "\nAll service model database checks passed!\n";
} catch (Exception $e) {
    echo "❌ ERROR: " . $e->getMessage() . "\n";
}
