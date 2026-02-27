<?php
// api/db.php
$host = "localhost";
$user = "root";
$pass = "";
$db   = "payroll_db";

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
  http_response_code(500);
  echo json_encode(["error" => "DB connection failed"]);
  exit;
}

// Always use UTF8
$conn->set_charset("utf8mb4");