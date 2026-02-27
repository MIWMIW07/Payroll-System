

// FILTER DROPDOWN
const filterBtn = document.getElementById("filterBtn");
const dropdown = document.getElementById("filterDropdown");

filterBtn.addEventListener("click", () => {
    dropdown.style.display =
        dropdown.style.display === "block" ? "none" : "block";
});

function filterType(type) {
    const rows = document.querySelectorAll("#employeeBody tr");
    rows.forEach(row => {
        row.style.display =
            row.dataset.type === type ? "" : "none";
    });
    dropdown.style.display = "none";
}