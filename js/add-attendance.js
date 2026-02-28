window.addEventListener("DOMContentLoaded", () => {
  loadEmployees();

  const employeeInput = document.getElementById("employeeInput");
  const dropdown = document.getElementById("employeeDropdown");

  employeeInput.addEventListener("click", () => {
    dropdown.style.display =
      dropdown.style.display === "block" ? "none" : "block";
  });

  document.getElementById("attendanceForm").addEventListener("submit", saveAttendance);
});

let selectedEmployeeId = null;

async function loadEmployees() {
  const res = await fetch("api/employees_list.php");
  const employees = await res.json();

  const dropdown = document.getElementById("employeeDropdown");
  dropdown.innerHTML = "";

  employees.forEach(emp => {
    const div = document.createElement("div");
    div.textContent = emp.full_name;
    div.onclick = () => selectEmployee(emp.id, emp.full_name);
    dropdown.appendChild(div);
  });
}

function selectEmployee(id, name) {
  selectedEmployeeId = id;
  document.getElementById("employeeInput").value = name;
  document.getElementById("employeeDropdown").style.display = "none";
}

async function saveAttendance(e) {
  e.preventDefault();

  const days_present = document.querySelectorAll("input")[1].value;
  const payroll_period = document.querySelectorAll("input")[2].value;
  const overtime_hours = document.querySelectorAll("input")[3].value;

  if (!selectedEmployeeId) {
    alert("Please select an employee");
    return;
  }

  const res = await fetch("api/attendance_create.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      employee_id: selectedEmployeeId,
      payroll_period,
      days_present,
      overtime_hours
    })
  });

  const data = await res.json();

  if (data.ok) {
    alert("Attendance saved");
    window.location.href = "attendance.html";
  } else {
    alert(data.error || "Error saving attendance");
  }
}