console.log("ATTENDANCE JS LOADED");
window.addEventListener("DOMContentLoaded", () => {
  loadAttendance();
});

async function loadAttendance() {
  try {
    const res = await fetch("api/attendance_list.php");
    const data = await res.json();

    const tbody = document.getElementById("attTbody");
    tbody.innerHTML = "";

    if (data.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center; padding:20px;">
            No attendance records yet.
          </td>
        </tr>
      `;
      return;
    }

    data.forEach(row => {
      tbody.innerHTML += `
        <tr>
          <td class="name">${row.full_name}</td>
          <td>${row.days_present}</td>
          <td>${row.ot_hours || 0}</td>
          <td class="period">
            <span>${row.payroll_period}</span>
            <span class="cal">📅</span>
          </td>
          <td>
            <div class="action-icons">
              <button class="icon-btn">✏</button>
              <button class="icon-btn">🗑</button>
            </div>
          </td>
        </tr>
      `;
    });

  } catch (err) {
    console.error("Attendance load error:", err);
  }
}