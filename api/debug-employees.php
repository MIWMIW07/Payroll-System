<?php
// api/debug-employees.php - Debug employee creation
require_once __DIR__ . '/core/bootstrap.php';
require_once __DIR__ . '/middleware/auth.php';

require_auth();

header('Content-Type: application/json');

// Get the raw input
$input = file_get_contents("php://input");
$data = json_decode($input, true);

error_log("EMPLOYEE DEBUG - Input: " . $input);

try {
    $pdo = bootstrapGetPdo('require');
    
    // Check table structure
    $stmt = $pdo->query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'employees' ORDER BY ordinal_position");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => false,
        'debug' => true,
        'received_data' => $data,
        'table_columns' => $columns,
        'error' => null
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'debug' => true,
        'error' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
}
?>