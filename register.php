
<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Yakira amakuru avuye muri React App
$data = json_decode(file_get_contents("php://input"));

if (!$data) {
    echo json_encode(["error" => "No data received"]);
    exit;
}

// Ihuza na MySQL (localhost, user: root, password: empty, db: eshulii tv)
$conn = new mysqli("localhost", "root", "", "eshulii tv");

if ($conn->connect_error) {
    die(json_encode(["error" => "Connection failed: " . $conn->connect_error]));
}

// Igenzura niba username cyangwa email bisanzwe bihari
$check = $conn->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
$username = $data->username ?? $data->email; // Use email as username if not provided
$check->bind_param("ss", $username, $data->email);
$check->execute();
if ($check->get_result()->num_rows > 0) {
    echo json_encode(["error" => "Username or Email already exists"]);
    exit;
}

// attendance_type field handling
$attendance_type = $data->attendance_type ?? 'online';

// Ijyana amakuru muri table ya 'users' (Added attendance_type column)
$sql = "INSERT INTO users (full_name, username, email, password, is_active, role, attendance_type) VALUES (?, ?, ?, ?, 1, 'student', ?)";
$stmt = $conn->prepare($sql);
$password = $data->password ?? 'student123';
$stmt->bind_param("sssss", $data->full_name, $username, $data->email, $password, $attendance_type);

if ($stmt->execute()) {
    echo json_encode(["message" => "Registration successful!", "attendance" => $attendance_type]);
} else {
    http_response_code(500);
    echo json_encode(["error" => "MySQL Error: " . $conn->error]);
}

$stmt->close();
$conn->close();
?>
