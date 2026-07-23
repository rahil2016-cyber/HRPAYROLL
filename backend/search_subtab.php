<?php
$content = file_get_contents('frontend/src/pages/HRDashboard.jsx');
$lines = explode("\n", $content);
foreach ($lines as $i => $line) {
    if (strpos($line, 'activeSubTab') !== false || strpos($line, 'setActiveSubTab') !== false) {
        echo ($i + 1) . ": " . trim($line) . "\n";
    }
}
