<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Ihuza na MySQL
$conn = new mysqli("localhost", "root", "", "eshulii tv");

if ($conn->connect_error) {
    echo json_encode([
        "is_open" => false, 
        "start_date" => "Error", 
        "end_date" => "Error",
        "error" => "Connection failed"
    ]);
    exit;
}

$res = $conn->query("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('reg_start_date', 'reg_end_date')");
$settings = [
    'reg_start_date' => date('Y-m-d'), // Default to today
    'reg_end_date' => date('Y-m-d', strtotime('+30 days')) // Default to 1 month from now
];

if ($res && $res->num_rows > 0) {
    while($row = $res->fetch_assoc()) {
        $settings[$row['setting_key']] = $row['setting_value'];
    }
}

$now = date('Y-m-d');
$start = $settings['reg_start_date'];
$end = $settings['reg_end_date'];

$is_open = ($now >= $start && $now <= $end);

echo json_encode([
    "is_open" => $is_open,
    "start_date" => $start,
    "end_date" => $end
]);

$conn->close();
?>