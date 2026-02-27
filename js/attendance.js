
// Simple search filter (frontend demo)
const searchInput = document.getElementById("searchInput");
const rows = document.querySelectorAll("#attTbody tr");

searchInput.addEventListener("input", () => {
  const q = searchInput.value.toLowerCase();
  rows.forEach(r => {
    const name = r.querySelector(".name").textContent.toLowerCase();
    r.style.display = name.includes(q) ? "" : "none";
  });
});