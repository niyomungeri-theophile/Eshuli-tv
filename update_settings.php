<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->start_date) || !isset($data->end_date)) {
    http_response_code(400);
    echo json_encode(["error" => "Missing required dates."]);
    exit;
}

$conn = new mysqli("localhost", "root", "", "eshulii tv");

if ($conn->connect_error) {
    http_response_code(500);
    die(json_encode(["error" => "Connection failed: " . $conn->connect_error]));
}

// Update Start Date
$stmt1 = $conn->prepare("UPDATE settings SET setting_value = ? WHERE setting_key = 'reg_start_date'");
$stmt1->bind_param("s", $data->start_date);
$success1 = $stmt1->execute();

// Update End Date
$stmt2 = $conn->prepare("UPDATE settings SET setting_value = ? WHERE setting_key = 'reg_end_date'");
$stmt2->bind_param("s", $data->end_date);
$success2 = $stmt2->execute();

if ($success1 && $success2) {
    echo json_encode(["message" => "Settings updated successfully"]);
} else {
    http_response_code(500);
    echo json_encode(["error" => "Failed to update settings: " . $conn->error]);
}

$stmt1->close();
$stmt2->close();
$conn->close();
?>