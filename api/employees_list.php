<?php
require_once "helpers.php";
require_once "db.php";

require_method("GET");

$result = $conn->query("SELECT * FROM employees ORDER BY id DESC");

$employees = [];

while ($row = $result->fetch_assoc()) {
  $employees[] = $row;
}

echo json_encode($employees);