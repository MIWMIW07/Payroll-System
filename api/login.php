<?php
require_once "helpers.php";
require_once "db.php";

require_method("POST");
$data = read_json();

$username = trim($data["username"] ?? "");
$password = (string)($data["password"] ?? "");

if ($username === "" || $password === "") {
  http_response_code(400);
  echo json_encode(["error" => "Missing username/password"]);
  exit;
}

$stmt = $conn->prepare("SELECT id, username, password_hash, role, status FROM users WHERE username=? LIMIT 1");
$stmt->bind_param("s", $username);
$stmt->execute();
$res = $stmt->get_result();

if ($res->num_rows === 0) {
  http_response_code(401);
  echo json_encode(["error" => "Invalid login"]);
  exit;
}

$user = $res->fetch_assoc();

if ($user["status"] !== "Active") {
  http_response_code(403);
  echo json_encode(["error" => "User not active"]);
  exit;
}

if (!password_verify($password, $user["password_hash"])) {
  http_response_code(401);
  echo json_encode(["error" => "Invalid login"]);
  exit;
}

echo json_encode([
  "ok" => true,
  "user" => [
    "id" => (int)$user["id"],
    "username" => $user["username"],
    "role" => $user["role"]
  ]
]);