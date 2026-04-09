// js/login.js
// Login handler for Phase 3

document.addEventListener('DOMContentLoaded', () => {
    // Check if already logged in - DO NOT auto-redirect here
    // Only redirect if on login page and already logged in? No - let user decide
    
    // Load remembered username
    const rememberedUser = localStorage.getItem('rememberedUser');
    if (rememberedUser) {
        const usernameInput = document.getElementById('username');
        if (usernameInput) usernameInput.value = rememberedUser;
        const rememberCheckbox = document.getElementById('rememberMe');
        if (rememberCheckbox) rememberCheckbox.checked = true;
    }
    
    // Toggle password visibility
    const toggleBtn = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    if (toggleBtn && passwordInput) {
        toggleBtn.addEventListener('click', () => {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            const icon = toggleBtn.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-eye');
                icon.classList.toggle('fa-eye-slash');
            }
        });
    }
});

// Login function
async function handleLogin(username, password, rememberMe) {
    // Hardcoded users
    const users = {
        accountant: { 
            username: 'accountant', 
            password: 'accountant123', 
            role: 'accountant', 
            name: 'School Accountant', 
            dashboard: 'dashboard.html' 
        },
        superadmin: { 
            username: 'superadmin', 
            password: 'superadmin123', 
            role: 'superadmin', 
            name: 'Super Administrator', 
            dashboard: 'dashboardSadmin.html' 
        },
        oic: { 
            username: 'oic', 
            password: 'oic123', 
            role: 'oic', 
            name: 'OIC Head', 
            dashboard: 'dashboard-oic.html' 
        }
    };
    
    let foundUser = null;
    for (const key in users) {
        if (users[key].username === username && users[key].password === password) {
            foundUser = users[key];
            break;
        }
    }
    
    if (foundUser) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userRole', foundUser.role);
        localStorage.setItem('userName', foundUser.name);
        localStorage.setItem('user', JSON.stringify(foundUser));
        
        if (rememberMe) {
            localStorage.setItem('rememberedUser', username);
        } else {
            localStorage.removeItem('rememberedUser');
        }
        
        return { success: true, redirect: foundUser.dashboard };
    }
    
    return { success: false, message: 'Invalid username or password' };
}