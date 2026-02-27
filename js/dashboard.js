// LOGIN PROTECTION
if(localStorage.getItem("isLoggedIn") !== "true") {
    window.location.href = "index.html";
}

// LOGOUT FUNCTION
function logout() {
    localStorage.removeItem("isLoggedIn");
    window.location.href = "index.html";
}

// BAR CHART (Payroll Trend)
const barCtx = document.getElementById('barChart');
new Chart(barCtx, {
    type: 'bar',
    data: {
        labels: ['Jan','Feb','Mar','Apr','May','Jun'],
        datasets: [{
            label: 'Payroll',
            data: [40000, 55000, 50000, 60000, 65000, 58000],
            backgroundColor: '#b0303b',
            borderRadius: 10
        }]
    },
    options: {
        responsive: true,
        plugins: {
            legend: { display: false }
        }
    }
});

// PIE CHART (Employee Type)
const pieCtx = document.getElementById('pieChart');
new Chart(pieCtx, {
    type: 'pie',
    data: {
        labels: ['Regular', 'Contractual'],
        datasets: [{
            data: [68, 32],
            backgroundColor: ['#ffffff', '#5c0f18']
        }]
    },
    options: {
        responsive: true,
        plugins: {
            legend: { position: 'bottom', labels: { color: 'white' } }
        }
    }
});