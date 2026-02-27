<?php
require_once "helpers.php";
require_once "db.php";

require_method("POST");
$data = read_json();

$id = (int)($data["id"] ?? 0);

if ($id <= 0) {
  http_response_code(400);
  echo json_encode(["error" => "Invalid employee ID"]);
  exit;
}

$stmt = $conn->prepare("DELETE FROM employees WHERE id=?");
$stmt->bind_param("i", $id);
$stmt->execute();

echo json_encode(["ok" => true]);