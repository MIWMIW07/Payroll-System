<?php

declare(strict_types=1);

require_once __DIR__ . '/../core/bootstrap.php';

require_auth();

$periodStart = $_GET['period_start'] ?? null;
$periodEnd = $_GET['period_end'] ?? null;

if (!$periodStart || !$periodEnd) {
    jsonError('Period start and end required', 400);
}

// Delegate to unified attendance router (live-synced faculty totals).
$_GET['type'] = 'faculty-merge';
require __DIR__ . '/../attendance.php';