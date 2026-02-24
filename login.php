<?php
require_once 'config.php';

$data = json_decode(file_get_contents("php://input"));

if (!$data || !isset($data->username) || !isset($data->password)) {
    http_response_code(400);
    echo json_encode(["error" => "Missing username or password"]);
    exit;
}

$stmt = $conn->prepare("SELECT id, full_name, role FROM users WHERE username = ? AND password = ?");
$stmt->bind_param("ss", $data->username, $data->password);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $user = $result->fetch_assoc();
    echo json_encode([
        "message" => "Login successful",
        "user" => $user
    ]);
} else {
    http_response_code(401);
    echo json_encode(["error" => "Username cyangwa Password ntabwo ari byo."]);
}

$stmt->close();
$conn->close();
?>