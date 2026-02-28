<?php
require_once "helpers.php";
require_once "db.php";

require_method("POST");
$data = read_json();

$employee_id = isset($data["employee_id"]) ? (int)$data["employee_id"] : 0;
$payroll_period = isset($data["payroll_period"]) ? $data["payroll_period"] : "";
$days_present = isset($data["days_present"]) ? (int)$data["days_present"] : 0;
$overtime_hours = isset($data["overtime_hours"]) ? (float)$data["overtime_hours"] : 0;

$stmt = $conn->prepare("
  INSERT INTO attendance 
  (employee_id, payroll_period, days_present, overtime_hours, created_at)
  VALUES (?, ?, ?, ?, NOW())
");

$stmt->bind_param("isid", $employee_id, $payroll_period, $days_present, $overtime_hours);

if (!$stmt->execute()) {
  http_response_code(500);
  echo json_encode(["error" => $stmt->error]);
  exit;
}

echo json_encode(["ok" => true]);