// ===========================
// AUTH GUARD
// ===========================
if (localStorage.getItem("isLoggedIn") !== "true") {
  window.location.href = "index.html";
}

// ===========================
// PAGE NAVIGATION
// ===========================
function go(page) {
  window.location.href = page;
}

// ===========================
// LOGOUT
// ===========================
function logout() {
  localStorage.removeItem("isLoggedIn");
  window.location.href = "index.html";
}