
function goBack() {
    window.location.href = "attendance.html";
}

// EMPLOYEE DROPDOWN
const employeeInput = document.getElementById("employeeInput");
const employeeDropdown = document.getElementById("employeeDropdown");

employeeInput.addEventListener("click", () => {
    employeeDropdown.style.display =
        employeeDropdown.style.display === "block" ? "none" : "block";
});

function selectEmployee(name) {
    employeeInput.value = name;
    employeeDropdown.style.display = "none";
}

// SAVE FORM
document.getElementById("attendanceForm").addEventListener("submit", function(e) {
    e.preventDefault();
    alert("Attendance saved (frontend demo)");
    window.location.href = "attendance.html";
});