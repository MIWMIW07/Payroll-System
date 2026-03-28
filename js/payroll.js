// js/payroll.js - UPDATED VERSION with Approval and Payslip Download
console.log("PAYROLL JS LOADED");

// Pagination settings
const ITEMS_PER_PAGE = 10;
let currentPage = 1;
let totalItems = 0;
let allPayroll = [];
let allEmployees = [];
let currentFilter = 'All';
let currentSearch = '';

window.addEventListener("DOMContentLoaded", async () => {
    try {
        await Database.ensureDatabaseReady();
        
        // Subscribe to payroll changes to auto-refresh
        Database.Events.on(DB_EVENTS.PAYROLL_ADDED, handleDataChange);
        Database.Events.on(DB_EVENTS.PAYROLL_UPDATED, handleDataChange);
        Database.Events.on(DB_EVENTS.PAYROLL_DELETED, handleDataChange);
        
        loadPayrollData();
        
        // Setup filter button toggle
        const filterBtn = document.getElementById("filterBtn");
        const filterDropdown = document.getElementById("filterDropdown");
    
        if (filterBtn && filterDropdown) {
            filterBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                filterDropdown.style.display = 
                    filterDropdown.style.display === "block" ? "none" : "block";
            });
    
            document.addEventListener("click", (e) => {
                if (!filterBtn.contains(e.target) && !filterDropdown.contains(e.target)) {
                    filterDropdown.style.display = "none";
                }
            });
        }
        
        // Setup search input
        const searchInput = document.getElementById("searchInput");
        if (searchInput) {
            searchInput.addEventListener("input", (e) => {
                currentSearch = e.target.value.toLowerCase();
                currentPage = 1;
                applyFilters();
            });
        }
        
        // Setup period filter
        const periodFilter = document.getElementById("periodFilter");
        if (periodFilter) {
            periodFilter.addEventListener("change", filterByPeriod);
        }
    } catch (error) {
        console.error("Error initializing payroll:", error);
    }
});

// Handler for database changes - refreshes payroll data
function handleDataChange(data) {
    console.log("Payroll data change detected:", data);
    loadPayrollData();
}

async function loadPayrollData() {
    try {
        allPayroll = await Database.getAllPayroll();
        allEmployees = await Database.getAllEmployees();
        
        updateStats();
        applyFilters();
        checkApprovals();
        
    } catch (error) {
        console.error("Error loading payroll:", error);
    }
}

function updateStats() {
    const totalEmployees = allEmployees.length;
    const totalPayroll = allPayroll.reduce((sum, p) => sum + (p.net_salary || 0), 0);
    const pendingCount = allPayroll.filter(p => p.status === 'Pending' || !p.approved).length;
    const approvedCount = allPayroll.filter(p => p.status === 'Approved' || p.approved).length;
    
    const totalEmployeesEl = document.getElementById('totalEmployees');
    const totalPayrollEl = document.getElementById('totalPayroll');
    const pendingCountEl = document.getElementById('pendingCount');
    const approvedCountEl = document.getElementById('approvedCount');
    const summaryEmployeesEl = document.getElementById('summaryEmployees');
    const summaryGrossEl = document.getElementById('summaryGross');
    const summaryDeductionsEl = document.getElementById('summaryDeductions');
    const summaryNetEl = document.getElementById('summaryNet');
    
    if (totalEmployeesEl) totalEmployeesEl.textContent = totalEmployees;
    if (totalPayrollEl) totalPayrollEl.textContent = '₱' + totalPayroll.toLocaleString();
    if (pendingCountEl) pendingCountEl.textContent = pendingCount;
    if (approvedCountEl) approvedCountEl.textContent = approvedCount;
    
    // Summary card
    const grossTotal = allPayroll.reduce((sum, p) => sum + (p.gross_salary || 0), 0);
    const deductionsTotal = allPayroll.reduce((sum, p) => sum + (p.total_deduction || 0), 0);
    
    if (summaryEmployeesEl) summaryEmployeesEl.textContent = totalEmployees;
    if (summaryGrossEl) summaryGrossEl.textContent = '₱' + grossTotal.toLocaleString();
    if (summaryDeductionsEl) summaryDeductionsEl.textContent = '₱' + deductionsTotal.toLocaleString();
    if (summaryNetEl) summaryNetEl.textContent = '₱' + totalPayroll.toLocaleString();
}

function applyFilters() {
    let filtered = [...allPayroll];
    
    // Apply search filter
    if (currentSearch) {
        filtered = filtered.filter(row => {
            const employee = allEmployees.find(emp => emp.id == row.employee_id);
            const full_name = employee ? employee.full_name.toLowerCase() : "";
            return full_name.includes(currentSearch);
        });
    }
    
    // Apply period filter
    if (currentFilter !== 'All') {
        filtered = filtered.filter(row => {
            return row.period && row.period.toLowerCase().includes(currentFilter.toLowerCase());
        });
    }
    
    renderTable(filtered);
}

function renderTable(records) {
    const tbody = document.getElementById("payrollTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (records.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center; padding:20px;">
                    No payroll records found.
                </td>
            </tr>
        `;
        return;
    }

    // Calculate pagination
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, records.length);
    const pageRecords = records.slice(startIndex, endIndex);
    
    totalItems = records.length;

    pageRecords.forEach(row => {
        // Find employee name
        const employee = allEmployees.find(emp => emp.id == row.employee_id);
        const full_name = employee ? employee.full_name : "Unknown";

        // Status badge
        let statusBadge = '';
        if (row.status === 'Pending') statusBadge = '<span class="status-pending">Pending</span>';
        else if (row.status === 'Approved') statusBadge = '<span class="status-approved">Approved</span>';
        else if (row.status === 'Paid') statusBadge = '<span class="status-paid">Paid</span>';
        else statusBadge = '<span class="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">Draft</span>';
        
        // Approval badge
        let approvalBadge = '';
        if (row.approved) {
            approvalBadge = '<span class="approval-badge approval-approved"><i class="fa-regular fa-circle-check"></i> Approved</span>';
        } else {
            approvalBadge = '<span class="approval-badge approval-pending"><i class="fa-regular fa-clock"></i> Pending</span>';
        }
        
        // Download button (only enabled for approved payroll)
        const downloadBtn = row.status === 'Approved' || row.approved ? 
            `<button onclick="downloadPayslip(${row.id})" class="download-btn text-sm">
                <i class="fa-solid fa-download"></i> Download
            </button>` : 
            `<button disabled class="bg-gray-200 text-gray-400 px-3 py-1 rounded-full text-xs cursor-not-allowed">
                <i class="fa-regular fa-lock"></i> Not Available
            </button>`;

        tbody.innerHTML += `
            <tr class="border-b hover:bg-gray-50">
                <td class="py-3 px-6 font-medium">${full_name}</td>
                <td class="py-3">${row.period || 'N/A'}</td>
                <td class="py-3">₱${parseFloat(row.gross_salary || 0).toLocaleString()}</td>
                <td class="py-3">₱${parseFloat(row.total_deduction || 0).toLocaleString()}</td>
                <td class="py-3 font-medium text-[#b0303b]">₱${parseFloat(row.net_salary || 0).toLocaleString()}</td>
                <td class="py-3">${statusBadge}</td>
                <td class="py-3">${approvalBadge}</td>
                <td class="py-3 text-center">${downloadBtn}</td>
            </tr>
        `;
    });

    updatePagination();
}

function updatePagination() {
    const pagination = document.getElementById("pagination");
    if (!pagination) return;

    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);

    if (totalItems === 0) {
        pagination.innerHTML = `
            <button class="page-btn" onclick="goToPage(1)" disabled>◀</button>
            <span class="page-info">No records</span>
            <button class="page-btn" onclick="goToPage(1)" disabled>▶</button>
        `;
        return;
    }

    pagination.innerHTML = `
        <button class="page-btn" onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>◀</button>
        <span class="page-info">${startItem}–${endItem} OF ${totalItems}</span>
        <button class="page-btn" onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>▶</button>
    `;
}

window.goToPage = function(page) {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    applyFilters();
};

// Filter by period
window.filterPayroll = function(period) {
    currentFilter = period;
    currentPage = 1;
    
    // Close dropdown
    const filterDropdown = document.getElementById("filterDropdown");
    if (filterDropdown) {
        filterDropdown.style.display = "none";
    }
    
    // Update filter button text
    const filterBtn = document.getElementById("filterBtn");
    if (filterBtn) {
        filterBtn.innerHTML = period === 'All' ? 'Filter by Date ▼' : `${period} ▼`;
    }
    
    applyFilters();
};

function filterByPeriod(e) {
    currentFilter = e.target.value === 'all' ? 'All' : e.target.value;
    currentPage = 1;
    applyFilters();
}

// ============================================
// PAYSLIP FUNCTIONS
// ============================================

window.generatePayslips = function() {
    const approvedPayroll = allPayroll.filter(p => p.status === 'Approved' || p.approved);
    
    if (approvedPayroll.length === 0) {
        alert('No approved payroll records found to generate payslips.');
        return;
    }
    
    if (confirm(`Generate payslips for ${approvedPayroll.length} approved payroll records?`)) {
        approvedPayroll.forEach(p => {
            generateSinglePayslip(p.id, false);
        });
        alert(`${approvedPayroll.length} payslips generated successfully!`);
    }
};

window.downloadPayslip = function(id) {
    const payroll = allPayroll.find(p => p.id === id);
    if (!payroll) return;
    
    if (payroll.status !== 'Approved' && !payroll.approved) {
        alert('This payroll is not yet approved. Payslip cannot be generated.');
        return;
    }
    
    generateSinglePayslip(id, true);
};

function generateSinglePayslip(id, openInNewTab = true) {
    const payroll = allPayroll.find(p => p.id === id);
    const employee = allEmployees.find(e => e.id === payroll.employee_id);
    
    // Calculate standard deductions if not present
    const sss = payroll.sss || payroll.gross_salary * 0.045;
    const philhealth = payroll.philhealth || payroll.gross_salary * 0.03;
    const pagibig = payroll.pagibig || 100;
    const tax = payroll.tax || payroll.gross_salary * 0.1;
    
    const payslipData = {
        id: payroll.id,
        employee_id: payroll.employee_id,
        employee_name: employee?.full_name || 'Unknown',
        position: employee?.position || 'Employee',
        period: payroll.period,
        gross: payroll.gross_salary || 0,
        sss: sss,
        philhealth: philhealth,
        pagibig: pagibig,
        tax: tax,
        total_deductions: payroll.total_deduction || (sss + philhealth + pagibig + tax),
        net: payroll.net_salary || 0
    };
    
    // Store in session storage for payslip page
    const payslips = JSON.parse(sessionStorage.getItem('payslips') || '{}');
    payslips[id] = payslipData;
    sessionStorage.setItem('payslips', JSON.stringify(payslips));
    
    if (openInNewTab) {
        window.open(`payslip.html?id=${id}`, '_blank');
    }
}

// ============================================
// APPROVAL FUNCTIONS
// ============================================

window.approvePayroll = function(id) {
    if (!confirm('Approve this payroll record?')) return;
    
    const payroll = allPayroll.find(p => p.id === id);
    if (payroll) {
        payroll.status = 'Approved';
        payroll.approved = true;
        payroll.approved_at = new Date().toISOString();
        payroll.approved_by = localStorage.getItem('userId') || 'accountant';
        
        Database.updatePayroll(payroll).then(() => {
            alert('Payroll approved successfully');
            loadPayrollData();
        }).catch(error => {
            console.error('Error approving payroll:', error);
            alert('Error approving payroll');
        });
    }
};

window.rejectPayroll = function(id) {
    const reason = prompt('Reason for rejection:');
    if (reason === null) return;
    
    const payroll = allPayroll.find(p => p.id === id);
    if (payroll) {
        payroll.status = 'Rejected';
        payroll.rejection_reason = reason;
        
        Database.updatePayroll(payroll).then(() => {
            alert('Payroll rejected');
            loadPayrollData();
        }).catch(error => {
            console.error('Error rejecting payroll:', error);
            alert('Error rejecting payroll');
        });
    }
};

function checkApprovals() {
    const pendingCount = allPayroll.filter(p => p.status === 'Pending' || !p.approved).length;
    const approvalSection = document.getElementById('approvalSection');
    const approvalMessage = document.getElementById('approvalMessage');
    
    if (approvalSection && approvalMessage) {
        if (pendingCount > 0) {
            approvalSection.classList.remove('hidden');
            approvalMessage.textContent = 
                `${pendingCount} payroll record${pendingCount > 1 ? 's' : ''} awaiting approval`;
        } else {
            approvalSection.classList.add('hidden');
        }
    }
}

window.scrollToPending = function() {
    const rows = document.querySelectorAll('#payrollTableBody tr');
    rows.forEach(row => {
        if (row.querySelector('.approval-pending')) {
            row.style.backgroundColor = '#fff3cd';
            setTimeout(() => {
                row.style.backgroundColor = '';
            }, 3000);
        }
    });
    
    document.querySelector('.overflow-x-auto')?.scrollIntoView({ behavior: 'smooth' });
};

// ============================================
// ORIGINAL FUNCTIONS (KEPT FOR COMPATIBILITY)
// ============================================

// Generate Payroll
window.generatePayroll = function() {
    alert("Generate Payroll - This will calculate payroll for all employees based on their attendance.");
};

// Export
window.exportPayroll = function() {
    alert("Export functionality - Export payroll data to Excel/PDF");
};

// Print Payroll
window.printPayroll = function(id) {
    if (id) {
        downloadPayslip(id);
    } else {
        window.location.href = "payslip.html";
    }
};