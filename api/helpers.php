<?php
// api/helpers.php
header("Content-Type: application/json");

// If you ever open frontend from file:// (not recommended), CORS helps.
// When using http://localhost/... it’s same-origin anyway.
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
  exit;
}

function read_json() {
  $raw = file_get_contents("php://input");
  $data = json_decode($raw, true);
  return is_array($data) ? $data : [];
}

function require_method($method) {
  if ($_SERVER["REQUEST_METHOD"] !== $method) {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
    exit;
  }
}