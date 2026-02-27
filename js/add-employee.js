console.log("ADD EMPLOYEE JS LOADED");

window.addEventListener("DOMContentLoaded", () => {

  // BACK BUTTON
  function goBack() {
    window.location.href = "employees.html";
  }

  // DROPDOWN
  const empTypeInput = document.getElementById("employmentType");
  const dropdownMenu = document.getElementById("dropdownMenu");

  if (empTypeInput && dropdownMenu) {
    empTypeInput.addEventListener("click", () => {
      dropdownMenu.style.display =
        dropdownMenu.style.display === "block" ? "none" : "block";
    });
  }

  window.selectType = function(type) {
    document.getElementById("employmentType").value = type;
    dropdownMenu.style.display = "none";
  };

  // FORM SUBMIT
  const form = document.getElementById("employeeForm");

  if (!form) {
    console.error("Form not found");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log("FORM SUBMITTED");

    const full_name = document.getElementById("fullName").value;
    const position = document.getElementById("position").value;
    const employment_type = document.getElementById("employmentType").value;
    const base_salary = document.getElementById("salary").value;
    const email = document.getElementById("email").value;

    const res = await fetch("api/employees_create.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name,
        position,
        employment_type,
        base_salary,
        email
      })
    });

    const data = await res.json();
    console.log(data);

    if (!res.ok) {
      alert(data.error || "Error adding employee");
      return;
    }

    alert("Employee added successfully");
    window.location.href = "employees.html";
  });

});