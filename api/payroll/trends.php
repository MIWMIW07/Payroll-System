<?php

declare(strict_types=1);

require_once __DIR__ . '/../core/bootstrap.php';
require_once __DIR__ . '/../middleware/auth.php';

require_auth();

require_once __DIR__ . '/../models/SecureDatabase.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        jsonError('Method not allowed', 405);
    }

    $db = new SecureDatabase();
    $trends = $db->getPayrollTrends();

    echo json_encode([
        'success' => true,
        'trends' => $trends,
    ]);
} catch (Throwable $e) {
    jsonError('Failed to load payroll trends', 500, $e->getMessage());
}
