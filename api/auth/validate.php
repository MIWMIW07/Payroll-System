<?php
// api/auth/validate.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

require_once __DIR__ . '/../models/Database.php';

$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

if (empty($authHeader)) {
    http_response_code(401);
    echo json_encode(['error' => 'No token provided', 'valid' => false]);
    exit;
}

$token = str_replace('Bearer ', '', $authHeader);

$db = new Database();
$session = $db->validateToken($token);

if ($session) {
    echo json_encode([
        'valid' => true,
        'user' => [
            'id' => $session['user_id'],
            'username' => $session['username'],
            'full_name' => $session['full_name'],
            'role' => $session['role'],
            'email' => $session['email']
        ],
        'expires_at' => $session['expires_at']
    ]);
} else {
    http_response_code(401);
    echo json_encode(['valid' => false, 'error' => 'Invalid or expired token']);
}
?>