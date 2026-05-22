<?php
// api/migration-add-payslip-columns.php
// Run this once: https://your-app.onrender.com/api/migration-add-payslip-columns.php
// Then DELETE this file after running

require_once __DIR__ . '/core/bootstrap.php';

header('Content-Type: text/html');

echo "<h1>Payslip Migration</h1>";

try {
    $pdo = bootstrapGetPdo('require');
    
    $queries = [
        "ALTER TABLE payroll ADD COLUMN IF NOT EXISTS overtime_pay DECIMAL(12,2) DEFAULT 0",
        "ALTER TABLE payroll ADD COLUMN IF NOT EXISTS absences INT DEFAULT 0",
        "ALTER TABLE payroll ADD COLUMN IF NOT EXISTS undertime_deduction DECIMAL(12,2) DEFAULT 0",
        "ALTER TABLE payroll ADD COLUMN IF NOT EXISTS transpo_allowance DECIMAL(12,2) DEFAULT 0",
        "ALTER TABLE employees ADD COLUMN IF NOT EXISTS hours_worked DECIMAL(8,2) DEFAULT 0",
        "ALTER TABLE employees ADD COLUMN IF NOT EXISTS days_worked INT DEFAULT 0",
        "CREATE INDEX IF NOT EXISTS idx_payroll_period_dates ON payroll(period_start, period_end)",
        "CREATE INDEX IF NOT EXISTS idx_payroll_employee_period ON payroll(employee_id, period_start, period_end)"
    ];
    
    foreach ($queries as $query) {
        $pdo->exec($query);
        echo "<p style='color:green'>✓ " . htmlspecialchars(substr($query, 0, 60)) . "...</p>";
    }
    
    // Verify columns
    $stmt = $pdo->query("
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'payroll' 
        ORDER BY ordinal_position
    ");
    
    echo "<h2>Payroll Table Columns:</h2>";
    echo "<ul>";
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "<li>" . htmlspecialchars($row['column_name']) . " (" . htmlspecialchars($row['data_type']) . ")</li>";
    }
    echo "</ul>";
    
    echo "<p style='color:green; font-weight:bold;'>✅ Migration completed successfully!</p>";
    echo "<p style='color:red;'>⚠️ DELETE this file now: api/migration-add-payslip-columns.php</p>";
    
} catch (PDOException $e) {
    echo "<p style='color:red'>❌ Error: " . $e->getMessage() . "</p>";
}
?>