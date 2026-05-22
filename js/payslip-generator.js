/**
 * js/payslip-generator.js
 * Dynamic PDF Payslip Generator
 * Supports Faculty and Admin templates
 */

class PayslipGenerator {
    constructor() {
        this.pdf = null;
        this.element = null;
    }

    /**
     * Generate PDF from payslip data
     * @param {Object} payslipData - Data from API
     * @param {string} templateType - 'faculty' or 'admin'
     * @returns {Promise} html2pdf promise
     */
    async generatePDF(payslipData, templateType) {
        const container = document.createElement('div');
        container.className = 'payslip-pdf-container';
        container.style.padding = '20px';
        container.style.backgroundColor = 'white';
        container.style.width = '210mm'; // A4 width
        container.style.margin = '0 auto';
        
        // Generate HTML based on template type
        if (templateType === 'faculty') {
            container.innerHTML = this.generateFacultyHTML(payslipData);
        } else if (templateType === 'admin') {
            container.innerHTML = this.generateAdminHTML(payslipData);
        } else if (templateType === 'guard') {
            container.innerHTML = this.generateGuardHTML(payslipData);
        } else if (templateType === 'sa') {
            container.innerHTML = this.generateSAHTML(payslipData);
        } else {
            container.innerHTML = this.generateFacultyHTML(payslipData);
        }
        
        document.body.appendChild(container);
        
        const opt = {
            margin: [0.5, 0.5, 0.5, 0.5],
            filename: `payslip_${payslipData.employee_name.replace(/\s/g, '_')}_${payslipData.period_start}_to_${payslipData.period_end}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, letterRendering: true, useCORS: true },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        };
        
        try {
            const result = await html2pdf().set(opt).from(container).save();
            document.body.removeChild(container);
            return result;
        } catch (error) {
            console.error('PDF Generation Error:', error);
            document.body.removeChild(container);
            throw error;
        }
    }
    
    /**
     * Generate HTML for Faculty payslip (matches PHILTECH GMA Faculty SHS Payslip.docx)
     */
    generateFacultyHTML(data) {
        const formatMoney = (amount) => {
            return '₱' + (amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        };
        
        const formatDate = (dateString) => {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase();
        };
        
        const periodEndDate = new Date(data.period_end);
        const periodStartDate = new Date(data.period_start);
        const paySlipDate = formatDate(data.payslip_date);
        
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Payslip - ${data.employee_name}</title>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    body {
                        font-family: 'Courier New', Courier, monospace;
                        background: white;
                        padding: 20px;
                    }
                    .payslip-container {
                        max-width: 800px;
                        margin: 0 auto;
                        background: white;
                        border: 1px solid #000;
                        padding: 20px;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 20px;
                        border-bottom: 2px solid #000;
                        padding-bottom: 10px;
                    }
                    .header h1 {
                        font-size: 18px;
                        font-weight: bold;
                        letter-spacing: 2px;
                        margin: 0;
                    }
                    .header h2 {
                        font-size: 14px;
                        font-weight: normal;
                        margin: 5px 0 0;
                    }
                    .subheader {
                        text-align: center;
                        font-weight: bold;
                        margin: 10px 0;
                    }
                    .info-row {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 10px;
                        border-bottom: 1px dotted #ccc;
                        padding-bottom: 5px;
                    }
                    .info-label {
                        font-weight: bold;
                    }
                    .salary-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 15px 0;
                    }
                    .salary-table td, .salary-table th {
                        border: 1px solid #000;
                        padding: 8px;
                        vertical-align: top;
                    }
                    .salary-table td:first-child {
                        width: 60%;
                    }
                    .salary-table td:last-child {
                        text-align: right;
                    }
                    .deduction-section {
                        margin: 15px 0;
                    }
                    .deduction-row {
                        display: flex;
                        justify-content: space-between;
                        border-bottom: 1px dotted #ccc;
                        padding: 5px 0;
                    }
                    .total-row {
                        font-weight: bold;
                        border-top: 2px solid #000;
                        margin-top: 5px;
                        padding-top: 5px;
                    }
                    .net-salary {
                        font-size: 18px;
                        font-weight: bold;
                        text-align: right;
                        margin-top: 15px;
                        padding-top: 10px;
                        border-top: 2px solid #000;
                    }
                    .footer {
                        margin-top: 20px;
                        font-size: 10px;
                        text-align: center;
                        border-top: 1px solid #ccc;
                        padding-top: 10px;
                    }
                    .qr-code {
                        text-align: center;
                        margin-top: 15px;
                    }
                    .qr-code img {
                        width: 80px;
                        height: 80px;
                    }
                    @media print {
                        body { margin: 0; padding: 0; }
                        .payslip-container { border: none; }
                    }
                </style>
            </head>
            <body>
                <div class="payslip-container">
                    <div class="header">
                        <h1>PHILTECH GMA</h1>
                        <h2>SENIOR HIGHSCHOOL AND COLLEGE</h2>
                    </div>
                    
                    <div class="info-row">
                        <span class="info-label">Pay Slip:</span>
                        <span>${paySlipDate}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Name:</span>
                        <span>${this.escapeHtml(data.employee_name)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Position:</span>
                        <span>${this.escapeHtml(data.position)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">For the Period:</span>
                        <span>${periodStartDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()} - ${periodEndDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()}</span>
                    </div>
                    
                    <table class="salary-table">
                        <tr>
                            <td><strong>Rate per Hour:</strong></td>
                            <td>${formatMoney(data.teaching_rate)}</td>
                        </tr>
                        <tr>
                            <td><strong>Total hrs rendered:</strong></td>
                            <td>${(data.teaching_hours || 0).toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td><strong>Total Earnings:</strong></td>
                            <td>${formatMoney(data.teaching_earnings)}</td>
                        </tr>
                        <tr>
                            <td><strong>Admin Rate:</strong></td>
                            <td>${formatMoney(data.admin_rate)}</td>
                        </tr>
                        <tr>
                            <td><strong>Total Hrs rendered:</strong></td>
                            <td>${(data.admin_hours || 0).toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td><strong>Total Earnings:</strong></td>
                            <td>${formatMoney(data.admin_earnings)}</td>
                        </tr>
                        <tr style="background-color: #f0f0f0;">
                            <td><strong>Gross Pay:</strong></td>
                            <td><strong>${formatMoney(data.gross_pay)}</strong></td>
                        </tr>
                    </table>
                    
                    <div class="deduction-section">
                        <div class="deduction-row">
                            <span><strong>Deductions:</strong></span>
                            <span></span>
                        </div>
                        <div class="deduction-row">
                            <span>SSS:</span>
                            <span>${formatMoney(data.sss)}</span>
                        </div>
                        <div class="deduction-row">
                            <span>Philhealth:</span>
                            <span>${formatMoney(data.philhealth)}</span>
                        </div>
                        <div class="deduction-row">
                            <span>HDMF:</span>
                            <span>${formatMoney(data.pagibig)}</span>
                        </div>
                        <div class="deduction-row">
                            <span>W/Tax:</span>
                            <span>${formatMoney(data.wtax)}</span>
                        </div>
                        <div class="deduction-row">
                            <span>SSS Loan:</span>
                            <span>${formatMoney(data.sss_loan)}</span>
                        </div>
                        <div class="deduction-row">
                            <span>HDMF Loan:</span>
                            <span>${formatMoney(data.hdmf_loan)}</span>
                        </div>
                        <div class="deduction-row">
                            <span>ATM Dep:</span>
                            <span>${formatMoney(data.atm_deposit)}</span>
                        </div>
                        <div class="deduction-row">
                            <span>Cash Advance:</span>
                            <span>${formatMoney(data.cash_advance)}</span>
                        </div>
                        <div class="deduction-row total-row">
                            <span><strong>Total Deductions:</strong></span>
                            <span><strong>${formatMoney(data.total_deductions)}</strong></span>
                        </div>
                    </div>
                    
                    <div class="deduction-section">
                        <div class="deduction-row">
                            <span>Marketing Allowance:</span>
                            <span>${formatMoney(data.marketing_allowance)}</span>
                        </div>
                    </div>
                    
                    <div class="net-salary">
                        <strong>Total Net Salary: ${formatMoney(data.net_salary)}</strong>
                    </div>
                    
                    <div class="footer">
                        <p>This is a computer-generated payslip. No signature required.</p>
                        <p>Generated on: ${new Date().toLocaleString()}</p>
                    </div>
                    
                    ${data.qr_data ? `<div class="qr-code" id="qrCodeContainer"></div>` : ''}
                </div>
            </body>
            </html>
        `;
    }
    
    /**
     * Generate HTML for Admin payslip (matches PHILTECH GMA ADMIN Payslip.docx)
     */
    generateAdminHTML(data) {
        const formatMoney = (amount) => {
            return '₱' + (amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        };
        
        const formatDate = (dateString) => {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase();
        };
        
        const periodEndDate = new Date(data.period_end);
        const periodStartDate = new Date(data.period_start);
        const paySlipDate = formatDate(data.payslip_date);
        
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Payslip - ${data.employee_name}</title>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    body {
                        font-family: 'Courier New', Courier, monospace;
                        background: white;
                        padding: 20px;
                    }
                    .payslip-container {
                        max-width: 800px;
                        margin: 0 auto;
                        background: white;
                        border: 1px solid #000;
                        padding: 20px;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 20px;
                        border-bottom: 2px solid #000;
                        padding-bottom: 10px;
                    }
                    .header h1 {
                        font-size: 18px;
                        font-weight: bold;
                        letter-spacing: 2px;
                        margin: 0;
                    }
                    .header h2 {
                        font-size: 14px;
                        font-weight: normal;
                        margin: 5px 0 0;
                    }
                    .subheader {
                        text-align: center;
                        font-weight: bold;
                        margin: 10px 0;
                    }
                    .info-row {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 10px;
                        border-bottom: 1px dotted #ccc;
                        padding-bottom: 5px;
                    }
                    .info-label {
                        font-weight: bold;
                    }
                    .salary-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 15px 0;
                    }
                    .salary-table td, .salary-table th {
                        border: 1px solid #000;
                        padding: 8px;
                        vertical-align: top;
                    }
                    .salary-table td:first-child {
                        width: 70%;
                    }
                    .salary-table td:last-child {
                        text-align: right;
                    }
                    .deduction-section {
                        margin: 15px 0;
                    }
                    .deduction-row {
                        display: flex;
                        justify-content: space-between;
                        border-bottom: 1px dotted #ccc;
                        padding: 5px 0;
                    }
                    .total-row {
                        font-weight: bold;
                        border-top: 2px solid #000;
                        margin-top: 5px;
                        padding-top: 5px;
                    }
                    .allowance-row {
                        margin: 10px 0;
                    }
                    .net-salary {
                        font-size: 18px;
                        font-weight: bold;
                        text-align: right;
                        margin-top: 15px;
                        padding-top: 10px;
                        border-top: 2px solid #000;
                    }
                    .footer {
                        margin-top: 20px;
                        font-size: 10px;
                        text-align: center;
                        border-top: 1px solid #ccc;
                        padding-top: 10px;
                    }
                    .qr-code {
                        text-align: center;
                        margin-top: 15px;
                    }
                    .qr-code img {
                        width: 80px;
                        height: 80px;
                    }
                    @media print {
                        body { margin: 0; padding: 0; }
                        .payslip-container { border: none; }
                    }
                </style>
            </head>
            <body>
                <div class="payslip-container">
                    <div class="header">
                        <h1>PHILTECH GMA</h1>
                        <h2>ADMIN</h2>
                    </div>
                    
                    <div class="info-row">
                        <span class="info-label">Pay Slip:</span>
                        <span>${paySlipDate}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Name:</span>
                        <span>${this.escapeHtml(data.employee_name)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Position:</span>
                        <span>${this.escapeHtml(data.position)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">For the Period:</span>
                        <span>${periodStartDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()} - ${periodEndDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()}</span>
                    </div>
                    
                    <table class="salary-table">
                        <tr style="background-color: #f0f0f0;">
                            <td><strong>Basic Rate:</strong></td>
                            <td>${formatMoney(data.basic_salary)}</td>
                        </tr>
                        <tr>
                            <td>Overtime:</td>
                            <td>${formatMoney(data.overtime_pay)}</td>
                        </tr>
                        <tr>
                            <td>Absences/Undertime:</td>
                            <td>${formatMoney(data.undertime_deduction + data.absences_deduction)}</td>
                        </tr>
                        <tr style="background-color: #f0f0f0;">
                            <td><strong>Gross Earnings:</strong></td>
                            <td><strong>${formatMoney(data.gross_earnings)}</strong></td>
                        </tr>
                    </table>
                    
                    <div class="deduction-section">
                        <div class="deduction-row">
                            <span><strong>Deductions:</strong></span>
                            <span></span>
                        </div>
                        <div class="deduction-row">
                            <span>SSS:</span>
                            <span>${formatMoney(data.sss)}</span>
                        </div>
                        <div class="deduction-row">
                            <span>Philhealth:</span>
                            <span>${formatMoney(data.philhealth)}</span>
                        </div>
                        <div class="deduction-row">
                            <span>HDMF:</span>
                            <span>${formatMoney(data.pagibig)}</span>
                        </div>
                        <div class="deduction-row">
                            <span>W/Tax:</span>
                            <span>${formatMoney(data.wtax)}</span>
                        </div>
                        <div class="deduction-row">
                            <span>SSS Loan:</span>
                            <span>${formatMoney(data.sss_loan)}</span>
                        </div>
                        <div class="deduction-row">
                            <span>HDMF Loan:</span>
                            <span>${formatMoney(data.hdmf_loan)}</span>
                        </div>
                        <div class="deduction-row">
                            <span>ATM Dep:</span>
                            <span>${formatMoney(data.atm_deposit)}</span>
                        </div>
                        <div class="deduction-row">
                            <span>Cash Advance:</span>
                            <span>${formatMoney(data.cash_advance)}</span>
                        </div>
                        <div class="deduction-row total-row">
                            <span><strong>Total Deductions:</strong></span>
                            <span><strong>${formatMoney(data.total_deductions)}</strong></span>
                        </div>
                    </div>
                    
                    <div class="allowance-row">
                        <div class="deduction-row">
                            <span><strong>Allowance/Adjustment:</strong></span>
                            <span></span>
                        </div>
                        <div class="deduction-row">
                            <span>Transpo Allowance:</span>
                            <span>${formatMoney(data.transpo_allowance)}</span>
                        </div>
                        <div class="deduction-row">
                            <span>Marketing Allowance:</span>
                            <span>${formatMoney(data.marketing_allowance)}</span>
                        </div>
                    </div>
                    
                    <div class="net-salary">
                        <strong>Total Net Salary: ${formatMoney(data.net_salary)}</strong>
                    </div>
                    
                    <div class="footer">
                        <p>This is a computer-generated payslip. No signature required.</p>
                        <p>Generated on: ${new Date().toLocaleString()}</p>
                    </div>
                    
                    ${data.qr_data ? `<div class="qr-code" id="qrCodeContainer"></div>` : ''}
                </div>
            </body>
            </html>
        `;
    }
    
    /**
     * Generate HTML for Guard payslip
     */
    generateGuardHTML(data) {
        const formatMoney = (amount) => {
            return '₱' + (amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        };
        
        const periodEndDate = new Date(data.period_end);
        const periodStartDate = new Date(data.period_start);
        
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Payslip - ${data.employee_name}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Courier New', Courier, monospace; background: white; padding: 20px; }
                    .payslip-container { max-width: 800px; margin: 0 auto; background: white; border: 1px solid #000; padding: 20px; }
                    .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
                    .header h1 { font-size: 18px; font-weight: bold; }
                    .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px dotted #ccc; padding-bottom: 5px; }
                    .info-label { font-weight: bold; }
                    .salary-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                    .salary-table td, .salary-table th { border: 1px solid #000; padding: 8px; }
                    .salary-table td:last-child { text-align: right; }
                    .deduction-row { display: flex; justify-content: space-between; border-bottom: 1px dotted #ccc; padding: 5px 0; }
                    .total-row { font-weight: bold; border-top: 2px solid #000; margin-top: 5px; padding-top: 5px; }
                    .net-salary { font-size: 18px; font-weight: bold; text-align: right; margin-top: 15px; padding-top: 10px; border-top: 2px solid #000; }
                    .footer { margin-top: 20px; font-size: 10px; text-align: center; border-top: 1px solid #ccc; padding-top: 10px; }
                </style>
            </head>
            <body>
                <div class="payslip-container">
                    <div class="header">
                        <h1>PHILTECH GMA</h1>
                        <h2>SECURITY GUARD</h2>
                    </div>
                    <div class="info-row"><span class="info-label">Name:</span><span>${this.escapeHtml(data.employee_name)}</span></div>
                    <div class="info-row"><span class="info-label">Period:</span><span>${periodStartDate.toLocaleDateString()} - ${periodEndDate.toLocaleDateString()}</span></div>
                    <table class="salary-table">
                        <tr><td>Daily Rate:</td><td>${formatMoney(data.daily_rate)}</td></tr>
                        <tr><td>Days Worked:</td><td>${data.days_worked || 0}</td></tr>
                        <tr style="background-color:#f0f0f0;"><td><strong>Gross Earnings:</strong></td><td><strong>${formatMoney(data.gross_earnings)}</strong></td></tr>
                    </table>
                    <div class="deduction-row"><span><strong>Deductions:</strong></span><span></span></div>
                    <div class="deduction-row"><span>SSS:</span><span>${formatMoney(data.sss)}</span></div>
                    <div class="deduction-row"><span>Philhealth:</span><span>${formatMoney(data.philhealth)}</span></div>
                    <div class="deduction-row"><span>Pag-IBIG:</span><span>${formatMoney(data.pagibig)}</span></div>
                    <div class="deduction-row"><span>W/Tax:</span><span>${formatMoney(data.wtax)}</span></div>
                    <div class="deduction-row total-row"><span><strong>Total Deductions:</strong></span><span><strong>${formatMoney(data.total_deductions)}</strong></span></div>
                    <div class="net-salary"><strong>Net Salary: ${formatMoney(data.net_salary)}</strong></div>
                    <div class="footer"><p>Generated on: ${new Date().toLocaleString()}</p></div>
                </div>
            </body>
            </html>
        `;
    }
    
    /**
     * Generate HTML for Student Assistant payslip
     */
    generateSAHTML(data) {
        const formatMoney = (amount) => {
            return '₱' + (amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        };
        
        const periodEndDate = new Date(data.period_end);
        const periodStartDate = new Date(data.period_start);
        
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Payslip - ${data.employee_name}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Courier New', Courier, monospace; background: white; padding: 20px; }
                    .payslip-container { max-width: 800px; margin: 0 auto; background: white; border: 1px solid #000; padding: 20px; }
                    .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
                    .header h1 { font-size: 18px; font-weight: bold; }
                    .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px dotted #ccc; padding-bottom: 5px; }
                    .info-label { font-weight: bold; }
                    .salary-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                    .salary-table td, .salary-table th { border: 1px solid #000; padding: 8px; }
                    .salary-table td:last-child { text-align: right; }
                    .deduction-row { display: flex; justify-content: space-between; border-bottom: 1px dotted #ccc; padding: 5px 0; }
                    .total-row { font-weight: bold; border-top: 2px solid #000; margin-top: 5px; padding-top: 5px; }
                    .net-salary { font-size: 18px; font-weight: bold; text-align: right; margin-top: 15px; padding-top: 10px; border-top: 2px solid #000; }
                    .footer { margin-top: 20px; font-size: 10px; text-align: center; border-top: 1px solid #ccc; padding-top: 10px; }
                </style>
            </head>
            <body>
                <div class="payslip-container">
                    <div class="header">
                        <h1>PHILTECH GMA</h1>
                        <h2>STUDENT ASSISTANT</h2>
                    </div>
                    <div class="info-row"><span class="info-label">Name:</span><span>${this.escapeHtml(data.employee_name)}</span></div>
                    <div class="info-row"><span class="info-label">Period:</span><span>${periodStartDate.toLocaleDateString()} - ${periodEndDate.toLocaleDateString()}</span></div>
                    <table class="salary-table">
                        <tr><td>Hourly Rate:</td><td>${formatMoney(data.hourly_rate)}</td></tr>
                        <tr><td>Hours Worked:</td><td>${data.hours_worked || 0}</td></tr>
                        <tr style="background-color:#f0f0f0;"><td><strong>Gross Earnings:</strong></td><td><strong>${formatMoney(data.gross_earnings)}</strong></td></tr>
                    </table>
                    <div class="deduction-row"><span><strong>Deductions:</strong></span><span></span></div>
                    <div class="deduction-row"><span>Pag-IBIG:</span><span>${formatMoney(data.pagibig)}</span></div>
                    <div class="deduction-row total-row"><span><strong>Total Deductions:</strong></span><span><strong>${formatMoney(data.total_deductions)}</strong></span></div>
                    <div class="net-salary"><strong>Net Salary: ${formatMoney(data.net_salary)}</strong></div>
                    <div class="footer"><p>Generated on: ${new Date().toLocaleString()}</p></div>
                </div>
            </body>
            </html>
        `;
    }
    
    /**
     * Print payslip
     */
    printPayslip(data, templateType) {
        let html = '';
        if (templateType === 'faculty') {
            html = this.generateFacultyHTML(data);
        } else if (templateType === 'admin') {
            html = this.generateAdminHTML(data);
        } else if (templateType === 'guard') {
            html = this.generateGuardHTML(data);
        } else if (templateType === 'sa') {
            html = this.generateSAHTML(data);
        } else {
            html = this.generateFacultyHTML(data);
        }
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
    }
    
    /**
     * Escape HTML special characters
     */
    escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
}

// Initialize global instance
window.payslipGenerator = new PayslipGenerator();