<?php
require_once "helpers.php";
require_once "db.php";

require_method("POST");
$data = read_json();

$full_name = trim($data["full_name"] ?? "");
$position = trim($data["position"] ?? "");
$type = $data["employment_type"] ?? "Regular";
$salary = (float)($data["base_salary"] ?? 0);
$email = trim($data["email"] ?? "");

if ($full_name === "" || $position === "") {
  http_response_code(400);
  echo json_encode(["error" => "Missing required fields"]);
  exit;
}

$stmt = $conn->prepare("
  INSERT INTO employees 
  (full_name, position, employment_type, base_salary, email)
  VALUES (?, ?, ?, ?, ?)
");

$stmt->bind_param("sssds", $full_name, $position, $type, $salary, $email);
$stmt->execute();

echo json_encode(["ok" => true]);