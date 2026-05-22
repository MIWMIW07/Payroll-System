<?php
// api/users.php - User management endpoint (superadmin only)

require_once __DIR__ . '/core/bootstrap.php';
require_once __DIR__ . '/middleware/auth.php';
require_once __DIR__ . '/middleware/sanitize.php';

require_auth();

// Superadmin and accountant can manage employee-linked login accounts.
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    requireRole(['superadmin', 'accountant']);
}

require_once __DIR__ . '/models/SecureDatabase.php';

try {
    $db = new SecureDatabase();
    $db->query("ALTER TABLE users ADD COLUMN IF NOT EXISTS linked_employee INTEGER REFERENCES employees(id) ON DELETE SET NULL");
    $db->query("CREATE INDEX IF NOT EXISTS idx_users_linked_employee ON users(linked_employee)");
    
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            $id = $_GET['id'] ?? null;
            $linkedEmployee = $_GET['linked_employee'] ?? null;
            
            if ($id) {
                // Get single user
                $user = $db->getUserById($id);
                if (!$user) {
                    http_response_code(404);
                    echo json_encode(['error' => 'User not found']);
                    break;
                }
                // Remove sensitive data
                unset($user['password_hash']);
                echo json_encode($user);
            } elseif ($linkedEmployee !== null && $linkedEmployee !== '') {
                $user = $db->getUserByLinkedEmployee((int)$linkedEmployee);
                if (!$user) {
                    http_response_code(404);
                    echo json_encode(['error' => 'User not found']);
                    break;
                }
                unset($user['password_hash']);
                echo json_encode($user);
            } else {
                // Get all users
                $users = $db->getAllUsers();
                // Remove sensitive data from all users
                foreach ($users as &$user) {
                    unset($user['password_hash']);
                }
                echo json_encode($users ?: []);
            }
            break;
        
        case 'POST':
            $input = file_get_contents("php://input");
            $data = json_decode($input, true);
            
            if (!is_array($data)) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid JSON payload']);
                break;
            }

            $plainPassword = trim((string)($data['password'] ?? ''));
            $providedPasswordHash = trim((string)($data['password_hash'] ?? ''));

            if (empty($data['username']) || ($plainPassword === '' && $providedPasswordHash === '') || empty($data['role'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Missing required fields: username, password, role']);
                break;
            }

            $data['full_name'] = trim((string)($data['full_name'] ?? '')) ?: $data['username'];

            if ($plainPassword !== '') {
                $data['password_hash'] = password_hash($plainPassword, PASSWORD_BCRYPT);
            } else {
                $hashInfo = password_get_info($providedPasswordHash);
                $data['password_hash'] = $hashInfo['algo'] ? $providedPasswordHash : password_hash($providedPasswordHash, PASSWORD_BCRYPT);
            }

            unset($data['password']);
            
            $id = $db->addUser($data);
            echo json_encode(['success' => true, 'id' => $id]);
            break;
        
        case 'PUT':
            $data = json_decode(file_get_contents("php://input"), true);
            if (empty($data['id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'User ID required']);
                break;
            }
            
            $plainPassword = trim((string)($data['password'] ?? ''));
            $providedPasswordHash = trim((string)($data['password_hash'] ?? ''));

            if ($plainPassword !== '') {
                $data['password_hash'] = password_hash($plainPassword, PASSWORD_BCRYPT);
            } elseif ($providedPasswordHash !== '') {
                $hashInfo = password_get_info($providedPasswordHash);
                $data['password_hash'] = $hashInfo['algo'] ? $providedPasswordHash : password_hash($providedPasswordHash, PASSWORD_BCRYPT);
            } else {
                unset($data['password_hash']);
            }

            unset($data['password']);
            
            $db->updateUser($data);
            echo json_encode(['success' => true]);
            break;
        
        case 'DELETE':
            $id = $_GET['id'] ?? null;
            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'User ID required']);
                break;
            }
            $db->deleteUser((int)$id);
            echo json_encode(['success' => true]);
            break;
        
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>
