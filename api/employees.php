<?php
// api/employees.php (Protected endpoint)

require_once __DIR__ . '/core/bootstrap.php';
require_once __DIR__ . '/middleware/auth.php';

require_auth();

// Only superadmin and accountant can modify employees
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    requireRole(['superadmin', 'accountant']);
}

header('Content-Type: application/json');

function toPostgresTextArray($value): string {
    if (!is_array($value)) {
        $value = [$value];
    }

    $items = array_values(array_filter($value, static function($item) {
        return $item !== null && trim((string)$item) !== '';
    }));

    if (empty($items)) {
        return '{}';
    }

    $escaped = array_map(static function($item) {
        $text = str_replace(['\\', '"'], ['\\\\', '\\"'], (string)$item);
        return '"' . $text . '"';
    }, $items);

    return '{' . implode(',', $escaped) . '}';
}

try {
    $pdo = bootstrapGetPdo('require');
    
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            $stmt = $pdo->query("SELECT * FROM employees ORDER BY id DESC");
            $employees = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($employees ?: []);
            break;
        
        case 'POST':
            // Get raw input and decode
            $rawInput = file_get_contents("php://input");
            error_log("EMPLOYEE POST - Raw input: " . $rawInput);
            
            $data = json_decode($rawInput, true);
            
            if (!$data) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid JSON data received', 'raw' => $rawInput]);
                break;
            }
            
            error_log("EMPLOYEE POST - Decoded data: " . print_r($data, true));
            
            // Validate required fields
            if (empty($data['full_name'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Full name is required']);
                break;
            }
            
            // Prepare insert statement with all possible fields
            $allowedFields = [
                'full_name', 'email', 'phone', 'birth_date', 'position', 'department',
                'employment_type', 'hire_date', 'status', 'base_salary', 'hourly_rate',
                'admin_pay_rate', 'assignment', 'rate_shs', 'rate_college', 'rate_admin',
                'rate_guard', 'rate_sa', 'subjects_shs', 'subjects_college', 'admin_position',
                'sss', 'philhealth', 'pagibig', 'tin', 'emergency_name', 'emergency_relation', 
                'emergency_phone', 'hours_worked', 'days_worked'
            ];
            
            $fields = [];
            $placeholders = [];
            $params = [];
            
            foreach ($allowedFields as $field) {
                if (isset($data[$field]) && $data[$field] !== '' && $data[$field] !== null) {
                    $fields[] = $field;
                    $placeholders[] = ":$field";
                    
                    if (in_array($field, ['subjects_shs', 'subjects_college'], true)) {
                        $params[$field] = toPostgresTextArray($data[$field]);
                    } elseif (is_array($data[$field])) {
                        $params[$field] = json_encode($data[$field]);
                    } else {
                        $params[$field] = $data[$field];
                    }
                }
            }
            
            // Add created_at and updated_at
            $fields[] = 'created_at';
            $placeholders[] = 'NOW()';
            $fields[] = 'updated_at';
            $placeholders[] = 'NOW()';
            
            if (empty($fields)) {
                http_response_code(400);
                echo json_encode(['error' => 'No valid fields to insert']);
                break;
            }
            
            $sql = "INSERT INTO employees (" . implode(', ', $fields) . ") 
                    VALUES (" . implode(', ', $placeholders) . ") 
                    RETURNING id";
            
            error_log("EMPLOYEE POST - SQL: " . $sql);
            error_log("EMPLOYEE POST - Params: " . print_r($params, true));
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $newId = $stmt->fetchColumn();
            
            echo json_encode([
                'success' => true, 
                'id' => $newId,
                'message' => 'Employee added successfully'
            ]);
            break;
        
        case 'PUT':
            $data = json_decode(file_get_contents("php://input"), true);
            if (empty($data['id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Employee ID required']);
                break;
            }
            
            // Build update query dynamically
            $allowedFields = [
                'full_name', 'position', 'department', 'employment_type', 'base_salary',
                'hourly_rate', 'admin_pay_rate', 'email', 'phone', 'birth_date', 'hire_date',
                'status', 'assignment', 'rate_shs', 'rate_college', 'rate_admin',
                'rate_guard', 'rate_sa', 'subjects_shs', 'subjects_college',
                'sss', 'philhealth', 'pagibig', 'tin', 'emergency_name', 
                'emergency_relation', 'emergency_phone'
            ];
            
            $updates = [];
            $params = [];
            
            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $updates[] = "$field = :$field";
                    if (in_array($field, ['subjects_shs', 'subjects_college'], true)) {
                        $params[$field] = toPostgresTextArray($data[$field]);
                    } elseif (is_array($data[$field])) {
                        $params[$field] = json_encode($data[$field]);
                    } else {
                        $params[$field] = $data[$field];
                    }
                }
            }
            
            if (empty($updates)) {
                http_response_code(400);
                echo json_encode(['error' => 'No fields to update']);
                break;
            }
            
            $updates[] = "updated_at = NOW()";
            $params['id'] = $data['id'];
            
            $sql = "UPDATE employees SET " . implode(', ', $updates) . " WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            
            echo json_encode(['success' => true, 'message' => 'Employee updated']);
            break;
        
        case 'DELETE':
            $id = $_GET['id'] ?? null;
            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'Employee ID required']);
                break;
            }
            
            $stmt = $pdo->prepare("DELETE FROM employees WHERE id = :id");
            $stmt->execute([':id' => $id]);
            
            echo json_encode(['success' => true, 'message' => 'Employee deleted']);
            break;
        
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }
    
} catch (PDOException $e) {
    error_log("EMPLOYEES API ERROR: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    error_log("EMPLOYEES API ERROR: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
?>
