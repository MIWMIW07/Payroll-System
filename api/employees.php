<?php
// api/employees.php (Protected endpoint)

require_once __DIR__ . '/core/bootstrap.php';
require_once __DIR__ . '/middleware/auth.php';

require_auth();
$user = $_SESSION['user'];

// Only superadmin and accountant can modify employees (POST/PUT/DELETE)
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    requireRole(['superadmin', 'accountant']);
}

// Load SecureDatabase model
require_once __DIR__ . '/models/SecureDatabase.php';

try {
    $db = new SecureDatabase();
    
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            $employees = $db->getAllEmployees();
            echo json_encode($employees ?: []);
            break;
        
        case 'POST':
            $data = json_decode(file_get_contents("php://input"), true);
            
            // Build insert query with all fields
            $fields = [];
            $values = [];
            $params = [];
            
            $allowedFields = [
                'full_name', 'email', 'phone', 'birth_date', 'position', 'department',
                'employment_type', 'hire_date', 'status', 'base_salary', 'hourly_rate',
                'admin_pay_rate', 'assignment', 'rate_shs', 'rate_college', 'rate_admin',
                'rate_guard', 'rate_sa', 'subjects_shs', 'subjects_college', 'admin_position',
                'sss', 'philhealth', 'pagibig', 'tin', 'emergency_name', 'emergency_relation', 'emergency_phone'
            ];
            
            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $fields[] = $field;
                    $values[] = ":$field";
                    $params[$field] = is_array($data[$field]) ? json_encode($data[$field]) : $data[$field];
                }
            }
            
            $sql = "INSERT INTO employees (" . implode(', ', $fields) . ") VALUES (" . implode(', ', $values) . ") RETURNING id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $id = $stmt->fetchColumn();
            
            echo json_encode(['success' => true, 'id' => $id]);
            break;
        
        case 'PUT':
            $data = json_decode(file_get_contents("php://input"), true);
            if (!isset($data['id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Employee ID required']);
                break;
            }
            $result = $db->updateEmployee((int)$data['id'], $data);
            echo json_encode(['success' => true]);
            break;
        
        case 'DELETE':
            $id = $_GET['id'] ?? null;
            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'Employee ID required']);
                break;
            }
            $result = $db->deleteEmployee((int)$id);
            echo json_encode(['success' => true, 'deleted' => $result]);
            break;
        
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Throwable $t) {
    http_response_code(500);
    echo json_encode(['error' => 'Unexpected error: ' . $t->getMessage()]);
}
