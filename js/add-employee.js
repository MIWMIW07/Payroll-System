
// BACK BUTTON
function goBack() {
    window.location.href = "employees.html";
}

// DROPDOWN
const empTypeInput = document.getElementById("empType");
const dropdownMenu = document.getElementById("dropdownMenu");

empTypeInput.addEventListener("click", () => {
    dropdownMenu.style.display =
        dropdownMenu.style.display === "block" ? "none" : "block";
});

function selectType(type) {
    empTypeInput.value = type;
    dropdownMenu.style.display = "none";
}

// SAVE FORM
document.getElementById("employeeForm").addEventListener("submit", function(e) {
    e.preventDefault();
    alert("Employee saved (frontend demo)");
    window.location.href = "employees.html";
});