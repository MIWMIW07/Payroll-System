thios<?php
// Drop-and-reset schema for local/Render environments.
// WARNING: This will DROP ALL tables in the public schema that match the app tables.
// After dropping, it re-runs api/config/schema.sql via api/run-schema.php logic.

header('Content-Type: application/json');

require_once __DIR__ . '/config/database.php';

$response = ['steps' => []];

// If SecureDatabase is used elsewhere, but here we use the raw DatabaseConfig PDO.
$pdo = DatabaseConfig::getInstance();

// Prefer true reset: drop *all* tables in `public` schema.
// This guarantees we don't miss tables not listed in code.
try {
    // Disable FK checks then drop in any order.
    // Some Render Postgres plans don't allow changing session_replication_role.
    // If it fails, we'll continue; CASCADE drops still work.
    try {
        $pdo->exec('SET session_replication_role = replica;');
    } catch (Throwable $e) {
        $response['warnings'][] = 'Could not set session_replication_role (continuing): ' . $e->getMessage();
    }

    $tables = $pdo->query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
        ->fetchAll(PDO::FETCH_COLUMN);


    foreach ($tables as $table) {
        // Skip internal/system-ish tables if any (normally none).
        if (!$table) continue;
        $pdo->exec("DROP TABLE IF EXISTS {$table} CASCADE;");
        $response['steps'][] = "Dropped (if existed): {$table}";
    }

    $pdo->exec('SET session_replication_role = DEFAULT;');


    // Re-run schema.sql statements
    $schemaFile = __DIR__ . '/config/schema.sql';
    if (!file_exists($schemaFile)) {
        $response['error'] = 'schema.sql file not found at: ' . $schemaFile;
        echo json_encode($response, JSON_PRETTY_PRINT);
        exit;
    }

    $sql = file_get_contents($schemaFile);
    $statements = array_filter(array_map('trim', explode(';', $sql)));

    foreach ($statements as $statement) {
        if ($statement === '') continue;
        $pdo->exec($statement . ';');
    }

    // Seed defaults (users/settings are included in schema.sql, but this is harmless)
    $response['steps'][] = 'Schema re-applied.';

    $response['success'] = true;
} catch (Throwable $e) {
    $response['success'] = false;
    $response['error'] = $e->getMessage();
}

echo json_encode($response, JSON_PRETTY_PRINT);

