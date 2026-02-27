// PASSWORD TOGGLE
const togglePassword = document.getElementById("togglePassword");
const passwordField = document.getElementById("password");

togglePassword.addEventListener("click", () => {
    const type = passwordField.getAttribute("type") === "password" ? "text" : "password";
    passwordField.setAttribute("type", type);
});

// LOGIN FORM
document.getElementById("loginForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if(username === "admin" && password === "admin123") {
        localStorage.setItem("isLoggedIn", "true");
        window.location.href = "dashboard.html";
    } else {
        alert("Invalid credentials");
    }
});