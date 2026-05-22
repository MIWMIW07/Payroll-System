/**
 * payslip.js - Standalone payslip viewer for direct access
 * Supports direct view from payroll table
 */

let currentPayslipData = null;
let currentTemplateType = null;

document.addEventListener('DOMContentLoaded', async () => {
    await loadPayslipFromUrl();
});

async function loadPayslipFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const payrollId = urlParams.get('id');
    
    if (!payrollId) {
        showError('No payroll ID provided');
        return;
    }
    
    showLoading(true);
    
    try {
        const response = await fetch(`/api/payslip.php?payroll_id=${payrollId}`, {
            method: 'GET',
            credentials: 'include'
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to load payslip');
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Failed to load payslip data');
        }
        
        currentPayslipData = result.data;
        currentTemplateType = result.data.type;
        
        renderPayslip();
        
    } catch (error) {
        console.error('Error loading payslip:', error);
        showError(error.message);
    } finally {
        showLoading(false);
    }
}

function renderPayslip() {
    const container = document.getElementById('payslipContent');
    if (!container) return;
    
    let html = '';
    if (currentTemplateType === 'faculty') {
        html = window.payslipGenerator.generateFacultyHTML(currentPayslipData);
    } else if (currentTemplateType === 'admin') {
        html = window.payslipGenerator.generateAdminHTML(currentPayslipData);
    } else if (currentTemplateType === 'guard') {
        html = window.payslipGenerator.generateGuardHTML(currentPayslipData);
    } else if (currentTemplateType === 'sa') {
        html = window.payslipGenerator.generateSAHTML(currentPayslipData);
    } else {
        html = window.payslipGenerator.generateFacultyHTML(currentPayslipData);
    }
    
    container.innerHTML = html;
    
    // Update status badge if exists
    const statusBadge = document.getElementById('payslipStatus');
    if (statusBadge) {
        if (currentPayslipData.status === 'Approved') {
            statusBadge.innerHTML = 'Approved';
            statusBadge.className = 'px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm';
        } else {
            statusBadge.innerHTML = currentPayslipData.status || 'Pending';
            statusBadge.className = 'px-3 py-1 bg-yellow-100 text-yellow-600 rounded-full text-sm';
        }
    }
    
    // Update approved by if exists
    const approvedBySpan = document.getElementById('approvedBy');
    if (approvedBySpan && currentPayslipData.approved_by) {
        approvedBySpan.textContent = currentPayslipData.approved_by;
        document.getElementById('approvedByRow').style.display = 'flex';
    }
}

function downloadPDF() {
    if (!currentPayslipData) {
        alert('No payslip data available');
        return;
    }
    
    if (currentPayslipData.status !== 'Approved') {
        if (!confirm('This payslip is not yet approved. Download anyway?')) {
            return;
        }
    }
    
    showLoading(true);
    
    window.payslipGenerator.generatePDF(currentPayslipData, currentTemplateType)
        .catch(error => {
            console.error('PDF generation error:', error);
            alert('Error generating PDF: ' + error.message);
        })
        .finally(() => showLoading(false));
}

function printPayslip() {
    if (!currentPayslipData) {
        alert('No payslip data available');
        return;
    }
    
    window.payslipGenerator.printPayslip(currentPayslipData, currentTemplateType);
}

function goBack() {
    window.history.back();
}

function showError(message) {
    const container = document.getElementById('payslipContent');
    if (container) {
        container.innerHTML = `
            <div class="text-center py-12 text-red-500">
                <i class="fa-solid fa-circle-exclamation text-4xl mb-3"></i>
                <p>Error: ${message}</p>
                <button onclick="goBack()" class="mt-4 bg-[#b0303b] text-white px-4 py-2 rounded-lg">Go Back</button>
            </div>
        `;
    }
}

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = show ? 'flex' : 'none';
    }
}

function logout() {
    localStorage.clear();
    window.location.href = 'index.html';
}