<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: text/html; charset=UTF-8");

// 1. Ihuza na MySQL (Ugomba kuba ufite database yitwa 'eshulii tv')
$conn = new mysqli("localhost", "root", "");

if ($conn->connect_error) {
    die("<h2 style='color:red'>Connection failed: " . $conn->connect_error . "</h2>");
}

// 2. Kora Database niba idahari
$sql = "CREATE DATABASE IF NOT EXISTS `eshulii tv` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";
if ($conn->query($sql) === TRUE) {
    echo "Database 'eshulii tv' created or already exists.<br>";
}

$conn->select_db("eshulii tv");

// 3. Kora Table y'abakoresha (Users)
$table_users = "CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'student') DEFAULT 'student',
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)";

if ($conn->query($table_users) === TRUE) {
    echo "Table 'users' created successfully.<br>";
}

// 4. Kora Table y'amatariki (Settings)
$table_settings = "CREATE TABLE IF NOT EXISTS settings (
    setting_key VARCHAR(50) PRIMARY KEY,
    setting_value VARCHAR(255) NOT NULL
)";

if ($conn->query($table_settings) === TRUE) {
    echo "Table 'settings' created successfully.<br>";
}

// 5. Kora Table y'amasomo ya Video (Lessons)
$table_lessons = "CREATE TABLE IF NOT EXISTS lessons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    video_url VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)";

if ($conn->query($table_lessons) === TRUE) {
    echo "Table 'lessons' created successfully.<br>";
}

// 6. Shyiramo Admin wa mbere (Username: admin, Password: admin123)
$check_admin = $conn->query("SELECT id FROM users WHERE username = 'admin'");
if ($check_admin->num_rows == 0) {
    $sql_admin = "INSERT INTO users (full_name, username, email, password, role) 
                 VALUES ('System Admin', 'admin', 'admin@eshuli.rw', 'admin123', 'admin')";
    $conn->query($sql_admin);
    echo "<b>Default Admin created!</b> (User: admin, Pass: admin123)<br>";
}

// 7. Shyiramo amatariki ya default niba adahari
$check_settings = $conn->query("SELECT setting_key FROM settings");
if ($check_settings->num_rows == 0) {
    $today = date('Y-m-d');
    $next_month = date('Y-m-d', strtotime('+30 days'));
    $conn->query("INSERT INTO settings (setting_key, setting_value) VALUES ('reg_start_date', '$today')");
    $conn->query("INSERT INTO settings (setting_key, setting_value) VALUES ('reg_end_date', '$next_month')");
    echo "Default registration settings inserted.<br>";
}

echo "<br><h2 style='color:green'>DATABASE SETUP COMPLETE!</h2>";
echo "<p>You can now log in as admin or register as a student.</p>";
echo "<a href='index.html' style='padding: 10px 20px; background: #A3E635; color: black; text-decoration: none; border-radius: 5px; font-weight: bold;'>Go to Website</a>";

$conn->close();
?>