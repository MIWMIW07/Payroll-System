// js/navigation.js - FIXED VERSION for Local Only Mode
// ===========================
// AUTH GUARD
// ===========================
const currentPageName = window.location.pathname.split('/').pop();
const publicPages = ['index.html', ''];

// Role-based page mappings
const rolePages = {
    accountant: [
        'dashboard.html',
        'employees.html',
        'payroll.html',
        'attendance.html',
        'settings.html',
        'add-attendance.html',
        'add-employee.html',
        'edit-attendance.html',
        'edit-employee.html',
        'edit-payroll.html',
        'view-attendance.html',
        'view-employee.html',
        'payslip.html'
    ],
    superadmin: [
        'dashboardSadmin.html',
        'employeesSadmin.html',
        'payrollSadmin.html',
        'user-mgmt.html',
        'settingsSadmin.html',
        'add-employee.html',
        'edit-employeeSadmin.html',
        'edit-payrollSadmin.html',
        'view-employeeSadmin.html',
        'payslipSadmin.html',
        'report.html'
    ],
    oic: [
        'dashboard-oic.html',
        'teacher-loading.html'
    ],
    teacher: [
        'teacher-dashboard.html',
        'teacher-payslips.html',
        'teacher-attendance.html',
        'teacher-profile.html'
    ],
    guard: [
        'dashboard-guard.html',
        'my-attendance.html',
        'my-payslips.html',
        'profile.html'
    ],
    sa: [
        'dashboard-sa.html',
        'my-attendance.html',
        'my-payslips.html',
        'profile.html'
    ]
};

// ===========================
// AUTH CHECK - FIXED
// ===========================
async function checkAuth() {
    if (publicPages.includes(currentPageName)) return;
    
    // Wait a tiny bit to ensure localStorage is ready
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Check if user is logged in via localStorage
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    console.log("Auth check - token exists:", !!token, "user exists:", !!userStr, "page:", currentPageName);
    
    if (!token || !userStr) {
        console.log("No session found, redirecting to login");
        window.location.href = "index.html";
        return;
    }
    
    try {
        const user = JSON.parse(userStr);
        
        // Validate that user has required fields
        if (!user.role) {
            console.log("Invalid user data, clearing session");
            localStorage.clear();
            window.location.href = "index.html";
            return;
        }
        
        // Store user info for easy access
        localStorage.setItem('userRole', user.role);
        localStorage.setItem('userName', user.full_name || user.username);
        localStorage.setItem('isLoggedIn', 'true');
        
        // Role-based page redirection
        const userRole = user.role?.toLowerCase() || 'accountant';
        const allowedPages = rolePages[userRole] || [];
        
        // Special case: attendanceSadmin.html is removed
        if (currentPageName === 'attendanceSadmin.html') {
            console.log("Superadmin attendance page removed, redirecting to dashboard");
            window.location.href = "dashboardSadmin.html";
            return;
        }
        
        // If current page is not allowed for this role, redirect to appropriate dashboard
        if (!allowedPages.includes(currentPageName) && !publicPages.includes(currentPageName)) {
            const dashboards = {
                'superadmin': 'dashboardSadmin.html',
                'accountant': 'dashboard.html',
                'oic': 'dashboard-oic.html',
                'teacher': 'teacher-dashboard.html',
                'guard': 'dashboard-guard.html',
                'sa': 'dashboard-sa.html'
            };
            console.log("Redirecting to:", dashboards[userRole]);
            window.location.href = dashboards[userRole] || 'dashboard.html';
        }
        
    } catch (err) {
        console.error('Auth check failed:', err);
        // Clear invalid session
        localStorage.clear();
        window.location.href = "index.html";
    }
}

// Run auth check on all pages except login
if (!publicPages.includes(currentPageName)) {
    // Add small delay to ensure page is ready
    setTimeout(() => {
        checkAuth();
    }, 50);
}

// ===========================
// PAGE NAVIGATION
// ===========================
function go(page) {
    window.location.href = page;
}

function goBack() {
    window.history.back();
}

// ===========================
// LOGOUT - CLEAR ALL
// ===========================
async function logout() {
    // Clear all localStorage items
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "index.html";
}

// ===========================
// PROFILE MENU FUNCTIONS
// ===========================
let profileMenu = null;

function createProfileMenu() {
    // Check if menu already exists
    if (document.getElementById('globalProfileMenu')) return;
    
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = user.role || 'accountant';
    
    const menuHTML = `
        <div id="globalProfileMenu" class="profile-menu" style="display: none;">
            <div class="profile-menu-item" onclick="viewProfile()">
                <i class="fa-regular fa-user w-5"></i>
                <span>My Profile</span>
            </div>
            <div class="profile-menu-item" onclick="changePassword()">
                <i class="fa-solid fa-key w-5"></i>
                <span>Change Password</span>
            </div>
            <div class="profile-menu-item" onclick="viewActivity()">
                <i class="fa-regular fa-clock w-5"></i>
                <span>Activity Log</span>
            </div>
            ${userRole === 'superadmin' ? `
            <div class="profile-menu-item" onclick="viewAuditLog()">
                <i class="fa-regular fa-file-lines w-5"></i>
                <span>Audit Log</span>
            </div>
            ` : ''}
            <hr class="my-1 border-gray-100">
            <div class="profile-menu-item logout" onclick="logout()">
                <i class="fa-solid fa-sign-out-alt w-5"></i>
                <span>Logout</span>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', menuHTML);
    profileMenu = document.getElementById('globalProfileMenu');
}

// Toggle profile menu
function toggleProfileMenu(event) {
    event?.stopPropagation();
    
    if (!profileMenu) {
        createProfileMenu();
        profileMenu = document.getElementById('globalProfileMenu');
    }
    
    const isVisible = profileMenu.style.display === 'block';
    
    // Position the menu near the profile image
    const profileImage = document.getElementById('profileImage');
    if (profileImage) {
        const rect = profileImage.getBoundingClientRect();
        profileMenu.style.position = 'fixed';
        profileMenu.style.top = (rect.bottom + 5) + 'px';
        profileMenu.style.right = (window.innerWidth - rect.right) + 'px';
    }
    
    profileMenu.style.display = isVisible ? 'none' : 'block';
}

// Close profile menu when clicking outside
document.addEventListener('click', function(event) {
    if (profileMenu && profileMenu.style.display === 'block') {
        const isClickInside = profileMenu.contains(event.target);
        const isClickOnProfile = event.target.closest('#profileImage') || event.target.closest('.profile-trigger');
        
        if (!isClickInside && !isClickOnProfile) {
            profileMenu.style.display = 'none';
        }
    }
});

// Profile menu actions
function viewProfile() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const role = user.role?.toLowerCase() || 'accountant';
    
    if (role === 'superadmin') {
        window.location.href = 'settingsSadmin.html';
    } else {
        window.location.href = 'settings.html';
    }
    
    if (profileMenu) profileMenu.style.display = 'none';
}

function changePassword() {
    if (currentPageName.includes('settings')) {
        const event = new CustomEvent('openPasswordModal');
        document.dispatchEvent(event);
    } else {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const role = user.role?.toLowerCase() || 'accountant';
        
        if (role === 'superadmin') {
            window.location.href = 'settingsSadmin.html';
        } else {
            window.location.href = 'settings.html';
        }
    }
    
    if (profileMenu) profileMenu.style.display = 'none';
}

function viewActivity() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const role = user.role?.toLowerCase() || 'accountant';
    
    if (role === 'superadmin') {
        if (currentPageName === 'settingsSadmin.html') {
            if (window.switchTab) window.switchTab('activity');
        } else {
            window.location.href = 'settingsSadmin.html#activity';
        }
    } else {
        alert('Login activity would be shown here');
    }
    
    if (profileMenu) profileMenu.style.display = 'none';
}

function viewAuditLog() {
    if (currentPageName === 'settingsSadmin.html') {
        const event = new CustomEvent('openAuditModal');
        document.dispatchEvent(event);
    } else {
        window.location.href = 'settingsSadmin.html#audit';
    }
    
    if (profileMenu) profileMenu.style.display = 'none';
}

// ===========================
// ROLE-BASED NAVIGATION HELPERS
// ===========================
function getDashboardUrl() {
    const role = localStorage.getItem('userRole');
    if (role === 'superadmin') return 'dashboardSadmin.html';
    if (role === 'accountant') return 'dashboard.html';
    if (role === 'teacher') return 'teacher-dashboard.html';
    if (role === 'guard') return 'dashboard-guard.html';
    if (role === 'sa') return 'dashboard-sa.html';
    return 'index.html';
}

function getEmployeesUrl() {
    const role = localStorage.getItem('userRole');
    if (role === 'superadmin') return 'employeesSadmin.html';
    if (role === 'accountant') return 'employees.html';
    return 'teacher-dashboard.html';
}

function getAttendanceUrl() {
    const role = localStorage.getItem('userRole');
    if (role === 'superadmin') return 'dashboardSadmin.html';
    if (role === 'accountant') return 'attendance.html';
    if (role === 'guard') return 'my-attendance.html';
    if (role === 'sa') return 'my-attendance.html';
    return 'teacher-attendance.html';
}

function getPayrollUrl() {
    const role = localStorage.getItem('userRole');
    if (role === 'superadmin') return 'payrollSadmin.html';
    if (role === 'accountant') return 'payroll.html';
    if (role === 'guard') return 'my-payslips.html';
    if (role === 'sa') return 'my-payslips.html';
    return 'teacher-payslips.html';
}

function getSettingsUrl() {
    const role = localStorage.getItem('userRole');
    if (role === 'superadmin') return 'settingsSadmin.html';
    if (role === 'accountant') return 'settings.html';
    if (role === 'guard') return 'profile.html';
    if (role === 'sa') return 'profile.html';
    return 'teacher-profile.html';
}

// ===========================
// UTILITY FUNCTIONS
// ===========================
function formatCurrency(amount) {
    return '₱' + parseFloat(amount).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function showNotification(message, type = 'success') {
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
        `;
        document.body.appendChild(toastContainer);
    }
    
    const toastId = 'toast-' + Date.now();
    const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-yellow-500';
    
    const toast = document.createElement('div');
    toast.id = toastId;
    toast.className = `text-white px-4 py-3 rounded-lg shadow-lg mb-2 ${bgColor} flex items-center gap-2`;
    toast.style.minWidth = '250px';
    toast.style.animation = 'slideIn 0.3s ease';
    toast.innerHTML = `
        <i class="fa-${type === 'success' ? 'regular fa-circle-check' : type === 'error' ? 'solid fa-circle-exclamation' : 'solid fa-clock'}"></i>
        <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .profile-menu {
        position: fixed;
        width: 14rem;
        background-color: white;
        border-radius: 0.75rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        padding: 0.5rem 0;
        z-index: 1000;
        border: 1px solid #e5e7eb;
    }
    
    .profile-menu-item {
        padding: 0.75rem 1rem;
        transition: all 0.2s;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        color: #374151;
    }
    
    .profile-menu-item:hover {
        background-color: #f3f4f6;
    }
    
    .profile-menu-item.logout:hover {
        background-color: #fee2e2;
        color: #dc2626;
    }
`;
document.head.appendChild(style);

// ===========================
// CONFIRM DIALOG
// ===========================
function confirmAction(message, callback) {
    if (confirm(message)) {
        callback();
    }
}

// ===========================
// EXPORT FUNCTIONS
// ===========================
window.go = go;
window.goBack = goBack;
window.logout = logout;
window.getDashboardUrl = getDashboardUrl;
window.getEmployeesUrl = getEmployeesUrl;
window.getAttendanceUrl = getAttendanceUrl;
window.getPayrollUrl = getPayrollUrl;
window.getSettingsUrl = getSettingsUrl;
window.formatCurrency = formatCurrency;
window.showNotification = showNotification;
window.confirmAction = confirmAction;
window.toggleProfileMenu = toggleProfileMenu;
window.viewProfile = viewProfile;
window.changePassword = changePassword;
window.viewActivity = viewActivity;
window.viewAuditLog = viewAuditLog;

// ===========================
// INITIALIZE PROFILE MENU
// ===========================
document.addEventListener('DOMContentLoaded', () => {
    const profileImage = document.getElementById('profileImage');
    if (profileImage) {
        profileImage.classList.add('profile-trigger');
        createProfileMenu();
    }
});

console.log("Navigation.js loaded - Fixed Local Only Mode");