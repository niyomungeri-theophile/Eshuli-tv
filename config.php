<?php
// 1. Amakuru ya Database
$host = "localhost";
$user = "root";
$pass = ""; // Password ya XAMPP/WAMP ubusanzwe ni empty
$dbname = "eshulii tv";

// 2. Gukora connection
$conn = new mysqli($host, $user, $pass, $dbname);

// 3. Igenzura niba byanze
if ($conn->connect_error) {
    header('Content-Type: application/json');
    http_response_code(500);
    die(json_encode(["error" => "Database Connection Failed: " . $conn->connect_error]));
}

// 4. Kwemerera React (CORS)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}
?>