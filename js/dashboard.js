

/* BAR CHART */
new Chart(document.getElementById("barChart"), {
    type: "bar",
    data: {
        labels: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug"],
        datasets: [{
            data: [40,60,50,80,85,45,70,100],
            backgroundColor: "#b0303b",
            borderRadius: 15
        }]
    },
    options: {
        plugins: { legend: { display: false } },
        scales: {
            x: { grid: { display: false } },
            y: { grid: { display: false }, ticks: { display: false } }
        }
    }
});

/* PIE CHART */
new Chart(document.getElementById("pieChart"), {
    type: "pie",
    data: {
        labels: ["Regular", "Contractual"],
        datasets: [{
            data: [68, 32],
            backgroundColor: ["#ffffff", "#5c0f18"]
        }]
    },
    options: {
        plugins: {
            legend: {
                position: "right",
                labels: { color: "white" }
            }
        }
    }
});