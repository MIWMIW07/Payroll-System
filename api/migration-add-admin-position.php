<?php
// api/migration-add-admin-position.php
// Run once, then DELETE this file

require_once __DIR__ . '/core/bootstrap.php';

header('Content-Type: text/html');

echo "<h1>Adding Missing Columns</h1>";

try {
    $pdo = bootstrapGetPdo('require');
    
    // Check if column exists and add if not
    $stmt = $pdo->query("
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'employees' AND column_name = 'admin_position'
    ");
    
    if (!$stmt->fetch()) {
        $pdo->exec("ALTER TABLE employees ADD COLUMN admin_position VARCHAR(100)");
        echo "<p style='color:green'>✓ Added column: admin_position</p>";
    } else {
        echo "<p>✓ Column admin_position already exists</p>";
    }
    
    // Add other missing columns
    $columnsToAdd = [
        'hours_worked' => 'DECIMAL(8,2) DEFAULT 0',
        'days_worked' => 'INT DEFAULT 0'
    ];
    
    foreach ($columnsToAdd as $col => $type) {
        $stmt = $pdo->query("
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'employees' AND column_name = '$col'
        ");
        
        if (!$stmt->fetch()) {
            $pdo->exec("ALTER TABLE employees ADD COLUMN $col $type");
            echo "<p style='color:green'>✓ Added column: $col</p>";
        } else {
            echo "<p>✓ Column $col already exists</p>";
        }
    }
    
    echo "<h2 style='color:green'>Migration completed successfully!</h2>";
    echo "<p style='color:red'>⚠️ DELETE this file now: api/migration-add-admin-position.php</p>";
    
} catch (PDOException $e) {
    echo "<p style='color:red'>❌ Error: " . $e->getMessage() . "</p>";
}
?>