window.addEventListener("DOMContentLoaded", () => {
  loadEmployees();
});

async function loadEmployees() {
  try {
    const res = await fetch("api/employees_list.php");
    const data = await res.json();

    const tbody = document.getElementById("employeeBody");
    tbody.innerHTML = "";

    data.forEach(emp => {
      const row = `
  <tr>
    <td>#${emp.id}</td>
    <td>${emp.full_name}</td>
    <td>${emp.position}</td>
    <td>${emp.employment_type}</td>
    <td>₱${parseFloat(emp.base_salary).toLocaleString()}</td>
    <td>${emp.status}</td>
    <td class="actions">
      <button>✏</button>
      <button onclick="deleteEmployee(${emp.id})">🗑</button>
      <button>👁</button>
    </td>
  </tr>
`;
      tbody.innerHTML += row;
    });

  } catch (err) {
    console.error("Error loading employees:", err);
  }
}

async function deleteEmployee(id) {
  if (!confirm("Delete this employee?")) return;

  const res = await fetch("api/employees_delete.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id })
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.error || "Delete failed");
    return;
  }

  loadEmployees();
}