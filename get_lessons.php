<?php
require_once 'config.php';

$sql = "SELECT * FROM lessons ORDER BY created_at DESC";
$result = $conn->query($sql);

$lessons = [];
if ($result) {
    while($row = $result->fetch_assoc()) {
        $lessons[] = $row;
    }
}

echo json_encode($lessons);
$conn->close();
?>