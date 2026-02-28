<?php
require_once "db.php";

$sql = "
SELECT 
    a.employee_id,
    a.payroll_period,
    a.days_present,
    a.overtime_hours,
    e.full_name
FROM attendance a
JOIN employees e ON a.employee_id = e.id
ORDER BY a.created_at DESC
";

$result = $conn->query($sql);

$data = [];

while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}

echo json_encode($data);