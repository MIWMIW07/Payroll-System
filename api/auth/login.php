<?php
// api/auth/login.php (UPDATED with Session Token)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

require_once __DIR__ . '/../models/Database.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$username = $data['username'] ?? '';
$password = $data['password'] ?? '';

if (!$username || !$password) {
    http_response_code(400);
    echo json_encode(['error' => 'Username and password required']);
    exit;
}

$db = new Database();
$db->initializeTables();

// Get user from database
$user = $db->getUserByUsername($username);

if ($user && password_verify($password, $user['password_hash'])) {
    if ($user['status'] !== 'Active') {
        http_response_code(403);
        echo json_encode(['error' => 'Account is inactive']);
        exit;
    }
    
    // ============================================
    // GENERATE SESSION TOKEN
    // ============================================
    $token = bin2hex(random_bytes(32));  // 64-character token
    $expires_at = date('Y-m-d H:i:s', strtotime('+8 hours'));  // 8 hours expiry
    
    // Store session in database
    $ip_address = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? null;
    $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? null;
    
    $db->createSession($user['id'], $token, $expires_at, $ip_address, $user_agent);
    
    // Return token and user data (without password)
    unset($user['password_hash']);
    
    echo json_encode([
        'success' => true,
        'token' => $token,
        'expires_at' => $expires_at,
        'user' => [
            'id' => $user['id'],
            'username' => $user['username'],
            'full_name' => $user['full_name'],
            'role' => $user['role'],
            'email' => $user['email']
        ]
    ]);
} else {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid username or password']);
}
?>