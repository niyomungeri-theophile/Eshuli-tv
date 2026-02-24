<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

$conn = new mysqli("localhost", "root", "", "eshulii tv");

if ($conn->connect_error) {
    http_response_code(500);
    die(json_encode(["error" => "Connection failed"]));
}

$title = $_POST['title'] ?? 'Untitled Lesson';
$description = $_POST['description'] ?? '';

if (isset($_FILES['video'])) {
    $video = $_FILES['video'];
    $target_dir = "uploads/videos/";
    
    // Create directory if not exists
    if (!file_exists($target_dir)) {
        mkdir($target_dir, 0777, true);
    }

    $file_extension = pathinfo($video["name"], PATHINFO_EXTENSION);
    $new_filename = uniqid() . '.' . $file_extension;
    $target_file = $target_dir . $new_filename;

    if (move_uploaded_file($video["tmp_name"], $target_file)) {
        $stmt = $conn->prepare("INSERT INTO lessons (title, video_url, description) VALUES (?, ?, ?)");
        $video_url = "http://localhost/eshuli-technology-ltd/" . $target_file;
        $stmt->bind_param("sss", $title, $video_url, $description);
        
        if ($stmt->execute()) {
            echo json_encode(["message" => "Lesson uploaded successfully", "url" => $video_url]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => "Database error: " . $conn->error]);
        }
        $stmt->close();
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Failed to move uploaded file."]);
    }
} else {
    http_response_code(400);
    echo json_encode(["error" => "No video file provided."]);
}

$conn->close();
?>