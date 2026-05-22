<?php
require_once __DIR__ . '/core/bootstrap.php';

header("Content-Type: application/json");

$databaseUrl = getenv('DATABASE_URL');

if (!$databaseUrl) {
    echo json_encode(['ok' => false, 'error' => 'DATABASE_URL not set']);
    exit;
}

$db = parse_url($databaseUrl);
$host = $db['host'] ?? null;
$port = $db['port'] ?? '5432';
$dbname = ltrim($db['path'] ?? '', '/');
$user = $db['user'] ?? null;

try {
    $pdo = bootstrapGetPdo('require');

    $stmt = $pdo->query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);

    $required = [
        'users', 'sessions', 'employees', 'attendance', 'attendance_periods',
        'attendance_eda', 'attendance_shs_loading', 'attendance_college_loading',
        'attendance_shs_dtr', 'attendance_college_dtr', 'attendance_admin_pay',
        'attendance_guard', 'attendance_sa', 'payroll', 'notifications', 'period_settings'
    ];

    $missing = array_values(array_diff($required, $tables));

    echo json_encode([
        'ok' => true,
        'database' => [
            'host' => $host,
            'port' => $port,
            'dbname' => $dbname,
            'user' => $user,
        ],
        'table_count' => count($tables),
        'missing_required_tables' => $missing,
    ]);
} catch (Throwable $e) {
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}

