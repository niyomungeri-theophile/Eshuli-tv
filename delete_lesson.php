<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->id)) {
    http_response_code(400);
    echo json_encode(["error" => "No lesson ID provided"]);
    exit;
}

$conn = new mysqli("localhost", "root", "", "eshulii tv");

if ($conn->connect_error) {
    http_response_code(500);
    die(json_encode(["error" => "Connection failed"]));
}

$stmt = $conn->prepare("DELETE FROM lessons WHERE id = ?");
$stmt->bind_param("i", $data->id);

if ($stmt->execute()) {
    echo json_encode(["message" => "Lesson deleted successfully"]);
} else {
    http_response_code(500);
    echo json_encode(["error" => "Failed to delete: " . $conn->error]);
}

$stmt->close();
$conn->close();
?>