// Report Module
window.addEventListener("DOMContentLoaded", async () => {
    try {
        await Database.ensureDatabaseReady();
        
        // Subscribe to all database changes to refresh report data
        Database.Events.on(DB_EVENTS.EMPLOYEE_ADDED, handleDataChange);
        Database.Events.on(DB_EVENTS.EMPLOYEE_UPDATED, handleDataChange);
        Database.Events.on(DB_EVENTS.EMPLOYEE_DELETED, handleDataChange);
        Database.Events.on(DB_EVENTS.ATTENDANCE_ADDED, handleDataChange);
        Database.Events.on(DB_EVENTS.ATTENDANCE_UPDATED, handleDataChange);
        Database.Events.on(DB_EVENTS.ATTENDANCE_DELETED, handleDataChange);
        Database.Events.on(DB_EVENTS.PAYROLL_ADDED, handleDataChange);
        Database.Events.on(DB_EVENTS.PAYROLL_UPDATED, handleDataChange);
        Database.Events.on(DB_EVENTS.PAYROLL_DELETED, handleDataChange);
        Database.Events.on(DB_EVENTS.USER_ADDED, handleDataChange);
        Database.Events.on(DB_EVENTS.USER_UPDATED, handleDataChange);
        Database.Events.on(DB_EVENTS.USER_DELETED, handleDataChange);
    } catch (error) {
        console.error("Error initializing reports:", error);
    }
});

// Handler for database changes - shows notification that data may have changed
function handleDataChange(data) {
    console.log("Database change detected in report module:", data);
    // Optionally show a notification or refresh report data
}

// Report generation functions
window.generateMonthlyPayrollReport = function() {
    alert("Generating Monthly Payroll Salary Report...\n\nThis report shows the complete payroll summary for the current month.");
};

window.generateEmployeeSalaryReport = function() {
    alert("Generating Employee Salary Report...\n\nThis report shows individual employee salary details.");
};

window.generateDeductionSummary = function() {
    alert("Generating Deduction Summary...\n\nThis report shows all deductions (tax, benefits, etc.) summary.");
};

window.generateAttendanceReport = function() {
    alert("Generating Attendance Report...\n\nThis report shows employee attendance records.");
};

window.exportToPDF = function() {
    alert("Exporting to PDF...\n\nThis will generate a PDF report of the selected data.");
};

window.exportToExcel = function() {
    alert("Exporting to Excel...\n\nThis will generate an Excel spreadsheet of the selected data.");
};

window.generateReport = function() {
    alert("Generating comprehensive report...\n\nPlease select a report type from the list above.");
};

