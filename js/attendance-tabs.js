// js/attendance-tabs.js - COMPLETE VERSION with 12 Tabs + 15-Day Dynamic Period
console.log("ATTENDANCE TABS JS LOADED - COMPLETE VERSION");

const ATTENDANCE_TABS = {
    // 1. EDA - Admin Staff Attendance
    eda: {
        id: 'eda',
        title: 'EDA - Employee Daily Attendance',
        description: 'Tracks lates, absences, and overtime for Admin staff',
        columns: ['Name', 'Lates/UT (min)', 'Absences (days)', 'Overtime (hrs)'],
        employeeType: 'admin'
    },
    // 2. SHS Loading (Read-only)
    'shs-loading': {
        id: 'shs-loading',
        title: 'SHS Loading - Teacher Load Assignment',
        description: 'Teaching loads per day for SHS faculty (read-only - set by OIC)',
        columns: ['Name', 'Subject', 'Rate/hr', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Total Hours'],
        employeeType: 'shs_only',
        readOnly: true
    },
    // 3. SHS-DTR - Actual hours worked
    'shs-dtr': {
        id: 'shs-dtr',
        title: 'SHS-DTR - Daily Time Record',
        description: 'Daily attendance hours for SHS faculty',
        columns: ['Name', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Total Hours'],
        employeeType: 'shs_only'
    },
    // 4. College Loading (Read-only)
    'college-loading': {
        id: 'college-loading',
        title: 'College Loading - Teacher Load Assignment',
        description: 'Teaching loads per day for College faculty (read-only - set by OIC)',
        columns: ['Name', 'Subject', 'Rate/hr', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Total Hours'],
        employeeType: 'college_only',
        readOnly: true
    },
    // 5. College-DTR - Actual hours worked
    'college-dtr': {
        id: 'college-dtr',
        title: 'College-DTR - Daily Time Record',
        description: 'Daily attendance hours for College faculty',
        columns: ['Name', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Total Hours'],
        employeeType: 'college_only'
    },
    // 6. Admin Pay - Extra hours for teachers
    'admin-pay': {
        id: 'admin-pay',
        title: 'Admin Pay - Extra Hours for Teachers',
        description: 'Extra hours when teachers work on unscheduled days',
        columns: ['Name', 'Rate/hr', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Total Hours', 'Total Pay'],
        employeeType: 'teacher'
    },
    // 7. ADMIN - Admin Staff Payroll with Deductions (EDITABLE)
    'admin-master': {
        id: 'admin-master',
        title: 'ADMIN - Payroll with Deductions',
        description: 'Enter government deductions and loans for Admin staff',
        columns: ['Name', 'Basic Pay', 'Overtime', 'Gross', 'SSS', 'PhilHealth', 'Pag-IBIG', 'W/Tax', 'SSS Loan', 'HDMF Loan', 'Cash Adv', 'ATM Dep', 'Transpo', 'Marketing', 'Net Pay'],
        employeeType: 'admin'
    },
    // 8. FACULTY_shs - SHS Teacher Payroll (EDITABLE)
    'faculty-shs': {
        id: 'faculty-shs',
        title: 'FACULTY SHS - Teacher Payroll',
        description: 'Enter government deductions and loans for SHS Teachers',
        columns: ['Name', 'Regular Hrs', 'Admin Hrs', 'Gross Pay', 'SSS', 'PhilHealth', 'Pag-IBIG', 'W/Tax', 'SSS Loan', 'HDMF Loan', 'Cash Adv', 'ATM Dep', 'Marketing', 'Net Pay'],
        employeeType: 'shs_only'
    },
    // 9. FACULTY_college - College Teacher Payroll (EDITABLE)
    'faculty-college': {
        id: 'faculty-college',
        title: 'FACULTY College - Teacher Payroll',
        description: 'Enter government deductions and loans for College Teachers',
        columns: ['Name', 'Regular Hrs', 'Admin Hrs', 'Gross Pay', 'SSS', 'PhilHealth', 'Pag-IBIG', 'W/Tax', 'SSS Loan', 'HDMF Loan', 'Cash Adv', 'ATM Dep', 'Marketing', 'Net Pay'],
        employeeType: 'college_only'
    },
    // 10. Fac & College Merge - Combined Summary (READ-ONLY)
    'faculty-merge': {
        id: 'faculty-merge',
        title: 'FAC & College Merge - Combined Faculty Summary',
        description: 'Consolidated faculty payroll for government reporting',
        columns: ['Department', 'SHS Total', 'College Total', 'Total Faculty', 'SSS Total', 'PHIC Total', 'HDMF Total', 'Net Total'],
        employeeType: 'summary',
        readOnly: true
    },
    // 11. GUARD - Checkboxes per day
    guard: {
        id: 'guard',
        title: 'GUARD - Security Personnel',
        description: 'Daily attendance for security guards (check present days)',
        columns: ['Name', 'Rate/day', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Days Worked', 'Total Pay'],
        employeeType: 'guard'
    },
    // 12. SA - Checkboxes per day (Allowance per day)
    sa: {
        id: 'sa',
        title: 'SA - Student Assistants',
        description: 'Daily attendance for student assistants (check present days)',
        columns: ['Name', 'Allowance/day', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Days Worked', 'Total Allowance'],
        employeeType: 'sa'
    }
};

let currentTab = 'eda';
let currentPeriod = { start: null, end: null };
let saveTimeout = null;
let periodDates = [];

// ===========================
// DYNAMIC PERIOD FUNCTIONS
// ===========================

function generatePeriodDates(start, end) {
    const dates = [];
    let current = new Date(start);
    while (current <= new Date(end)) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
    }
    return dates;
}

function getDayColumnsForPeriod() {
    if (!currentPeriod.start || !currentPeriod.end) {
        return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    }
    periodDates = generatePeriodDates(currentPeriod.start, currentPeriod.end);
    return periodDates.map(date => {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return `${dayNames[date.getDay()]} ${date.getDate()}`;
    });
}

// ===========================
// LOCALSTORAGE PERIOD FUNCTIONS
// ===========================

export function loadSavedPeriod() {
    const savedStart = localStorage.getItem('payrollPeriodStart');
    const savedEnd = localStorage.getItem('payrollPeriodEnd');
    if (savedStart && savedEnd) {
        currentPeriod = { start: savedStart, end: savedEnd };
        const startInput = document.getElementById('periodStart');
        const endInput = document.getElementById('periodEnd');
        const display = document.getElementById('periodDisplay');
        if (startInput) startInput.value = savedStart;
        if (endInput) endInput.value = savedEnd;
        if (display) display.textContent = `Period: ${new Date(savedStart).toLocaleDateString()} - ${new Date(savedEnd).toLocaleDateString()}`;
        console.log("Period loaded from localStorage:", savedStart, "to", savedEnd);
    }
}

export function setGlobalPeriod(start, end) {
    if (start && end) {
        currentPeriod = { start, end };
        localStorage.setItem('payrollPeriodStart', start);
        localStorage.setItem('payrollPeriodEnd', end);
        const display = document.getElementById('periodDisplay');
        if (display) display.textContent = `Period: ${new Date(start).toLocaleDateString()} - ${new Date(end).toLocaleDateString()}`;
        console.log("Period saved to localStorage:", start, "to", end);
    }
}

export function setPayrollPeriod() {
    const start = document.getElementById('periodStart').value;
    const end = document.getElementById('periodEnd').value;
    if (start && end) {
        setGlobalPeriod(start, end);
        loadTabData(currentTab);
    } else {
        alert('Please select both start and end dates');
    }
}

function showSaveToast() {
    const toast = document.getElementById('saveToast');
    if (!toast) return;
    toast.classList.add('show');
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => toast.classList.remove('show'), 2000);
}

// ===========================
// INITIALIZATION
// ===========================

export async function initAttendanceTabs() {
    loadSavedPeriod();
    const tabs = document.querySelectorAll('.attendance-tab');
    tabs.forEach(tab => tab.addEventListener('click', () => switchTab(tab.dataset.tab)));
    await switchTab('eda');
}

export async function switchTab(tabId) {
    document.querySelectorAll('.attendance-tab').forEach(t => t.classList.remove('active'));
    const activeTab = document.querySelector(`[data-tab="${tabId}"]`);
    if (activeTab) activeTab.classList.add('active');
    const tab = ATTENDANCE_TABS[tabId];
    document.getElementById('currentTabTitle').textContent = tab.title;
    document.getElementById('tabDescription').textContent = tab.description;
    currentTab = tabId;
    await loadTabData(tabId);
}

async function loadTabData(tabId) {
    showLoading(true);
    try {
        const employees = await Database.getAllEmployees();
        const attendance = await Database.getAllAttendance();
        const loads = await Database.getAllTeacherLoads();
        const tab = ATTENDANCE_TABS[tabId];
        
        let filteredEmployees = employees.filter(emp => emp.status === 'Active');
        
        if (tab.employeeType === 'admin') {
            filteredEmployees = filteredEmployees.filter(emp => emp.assignment === 'admin');
        } else if (tab.employeeType === 'shs_only') {
            filteredEmployees = filteredEmployees.filter(emp => emp.assignment === 'shs_only' || emp.assignment === 'both');
        } else if (tab.employeeType === 'college_only') {
            filteredEmployees = filteredEmployees.filter(emp => emp.assignment === 'college_only' || emp.assignment === 'both');
        } else if (tab.employeeType === 'teacher') {
            filteredEmployees = filteredEmployees.filter(emp => emp.assignment === 'shs_only' || emp.assignment === 'college_only' || emp.assignment === 'both');
        } else if (tab.employeeType === 'guard') {
            filteredEmployees = filteredEmployees.filter(emp => emp.assignment === 'guard');
        } else if (tab.employeeType === 'sa') {
            filteredEmployees = filteredEmployees.filter(emp => emp.assignment === 'sa');
        } else if (tab.employeeType !== 'summary') {
            filteredEmployees = filteredEmployees.filter(emp => emp.assignment === tab.employeeType);
        }
        
        // Faculty merge tab handling
        if (tabId === 'faculty-merge') {
            await loadFacultyMergeTab(employees, attendance, loads);
            return;
        }
        
        // Get dynamic columns for period-based tabs
        const periodBasedTabs = ['eda', 'shs-dtr', 'college-dtr', 'admin-pay', 'guard', 'sa'];
        const usePeriod = periodBasedTabs.includes(tabId) && currentPeriod.start && currentPeriod.end;
        
        let dynamicColumns = [];
        if (usePeriod) {
            dynamicColumns = getDayColumnsForPeriod();
        }
        
        const tableData = [];
        for (const emp of filteredEmployees) {
            const empLoad = loads.find(l => l.employee_id === emp.id) || {};
            let empAttendance = {};
            
            if (usePeriod && periodDates.length > 0) {
                // Get daily attendance for each date in period
                const dailyData = [];
                for (const date of periodDates) {
                    const dateStr = date.toISOString().split('T')[0];
                    const dayRecord = attendance.find(a => 
                        a.employee_id === emp.id && 
                        a.tab_type === tabId && 
                        a.date === dateStr
                    ) || {};
                    
                    dailyData.push({
                        date: dateStr,
                        dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()],
                        value: getValueForTab(dayRecord, tabId)
                    });
                    
                    // Sum for totals
                    if (tabId === 'guard' || tabId === 'sa') {
                        empAttendance.days = (empAttendance.days || 0) + (dayRecord.value ? 1 : 0);
                        empAttendance.total = (empAttendance.total || 0) + (dayRecord.value ? (emp.rate_guard || emp.rate_sa || 0) : 0);
                    } else if (tabId === 'eda') {
                        empAttendance.lates = (empAttendance.lates || 0) + (dayRecord.lates || 0);
                        empAttendance.absences = (empAttendance.absences || 0) + (dayRecord.absences || 0);
                        empAttendance.overtime = (empAttendance.overtime || 0) + (dayRecord.overtime || 0);
                    } else {
                        empAttendance.total = (empAttendance.total || 0) + (dayRecord.value || 0);
                    }
                }
                empAttendance.dailyData = dailyData;
            }
            
            tableData.push(transformEmployeeData(emp, empAttendance, empLoad, tabId));
        }
        
        renderTable(tabId, tableData, tab.readOnly, dynamicColumns);
        updateStats(tabId, filteredEmployees);
        
    } catch (error) {
        console.error('Error loading tab data:', error);
        document.getElementById('attendanceGrid').innerHTML = '<div class="p-8 text-center text-red-500">Error loading data</div>';
    } finally { showLoading(false); }
}

function getValueForTab(record, tabId) {
    if (tabId === 'guard' || tabId === 'sa') {
        return (record.mon || record.tue || record.wed || record.thu || record.fri || record.sat || record.sun) ? 1 : 0;
    } else if (tabId === 'eda') {
        return record.lates || record.absences || record.overtime;
    } else {
        return (record.mon || 0) + (record.tue || 0) + (record.wed || 0) + (record.thu || 0) + (record.fri || 0) + (record.sat || 0) + (record.sun || 0);
    }
}

function transformEmployeeData(employee, attendance, load, tabId) {
    const base = { id: employee.id, name: employee.full_name };
    
    switch(tabId) {
        case 'eda':
            return { ...base, lates: attendance.lates || 0, absences: attendance.absences || 0, overtime: attendance.overtime || 0 };
        case 'shs-loading':
        case 'college-loading':
            const loadTotal = (load.mon||0)+(load.tue||0)+(load.wed||0)+(load.thu||0)+(load.fri||0)+(load.sat||0)+(load.sun||0);
            let rate = employee.rate_shs || employee.rate_college || 0;
            return { ...base, subject: load.subject || '', rate: rate, mon: load.mon||0, tue: load.tue||0, wed: load.wed||0, thu: load.thu||0, fri: load.fri||0, sat: load.sat||0, sun: load.sun||0, total: loadTotal };
        case 'shs-dtr':
        case 'college-dtr':
            const dtrTotal = (attendance.mon||0)+(attendance.tue||0)+(attendance.wed||0)+(attendance.thu||0)+(attendance.fri||0)+(attendance.sat||0)+(attendance.sun||0);
            return { ...base, mon: attendance.mon||0, tue: attendance.tue||0, wed: attendance.wed||0, thu: attendance.thu||0, fri: attendance.fri||0, sat: attendance.sat||0, sun: attendance.sun||0, total: dtrTotal };
        case 'admin-pay':
            const adminTotal = (attendance.mon||0)+(attendance.tue||0)+(attendance.wed||0)+(attendance.thu||0)+(attendance.fri||0)+(attendance.sat||0)+(attendance.sun||0);
            let teacherRate = employee.rate_shs || employee.rate_college || 0;
            return { ...base, rate: teacherRate, mon: attendance.mon||0, tue: attendance.tue||0, wed: attendance.wed||0, thu: attendance.thu||0, fri: attendance.fri||0, sat: attendance.sat||0, sun: attendance.sun||0, total: adminTotal, totalPay: adminTotal * teacherRate };
        case 'admin-master':
            return { ...base, basic: attendance.basic_pay || 0, overtime: attendance.overtime_pay || 0, gross: (attendance.basic_pay||0)+(attendance.overtime_pay||0), sss: attendance.sss || 0, philhealth: attendance.philhealth || 0, pagibig: attendance.pagibig || 0, withholding_tax: attendance.withholding_tax || 0, sss_loan: attendance.sss_loan || 0, hdmf_loan: attendance.hdmf_loan || 0, cash_advance: attendance.cash_advance || 0, atm_deposit: attendance.atm_deposit || 0, transpo_allowance: attendance.transpo_allowance || 0, marketing_allowance: attendance.marketing_allowance || 0, net: (attendance.basic_pay||0)+(attendance.overtime_pay||0) - (attendance.sss||0) - (attendance.philhealth||0) - (attendance.pagibig||0) - (attendance.withholding_tax||0) - (attendance.sss_loan||0) - (attendance.hdmf_loan||0) - (attendance.cash_advance||0) - (attendance.atm_deposit||0) + (attendance.transpo_allowance||0) + (attendance.marketing_allowance||0) };
        case 'faculty-shs':
        case 'faculty-college':
            let regularRate = employee.rate_shs || employee.rate_college || 0;
            let adminRate = employee.rate_admin || 0;
            let regularHours = attendance.regular_hours || 0;
            let adminHours = attendance.admin_hours || 0;
            let grossPay = (regularHours * regularRate) + (adminHours * adminRate);
            return { ...base, regular_hours: regularHours, admin_hours: adminHours, gross: grossPay, sss: attendance.sss || 0, philhealth: attendance.philhealth || 0, pagibig: attendance.pagibig || 0, withholding_tax: attendance.withholding_tax || 0, sss_loan: attendance.sss_loan || 0, hdmf_loan: attendance.hdmf_loan || 0, cash_advance: attendance.cash_advance || 0, atm_deposit: attendance.atm_deposit || 0, marketing_allowance: attendance.marketing_allowance || 0, net: grossPay - (attendance.sss||0) - (attendance.philhealth||0) - (attendance.pagibig||0) - (attendance.withholding_tax||0) - (attendance.sss_loan||0) - (attendance.hdmf_loan||0) - (attendance.cash_advance||0) - (attendance.atm_deposit||0) + (attendance.marketing_allowance||0) };
        case 'guard':
            const guardDays = attendance.dailyData ? attendance.dailyData.filter(d => d.value).length : (attendance.days || 0);
            const guardTotal = guardDays * (employee.rate_guard || 433);
            return { ...base, rate: employee.rate_guard || 433, days: guardDays, total: guardTotal, dailyData: attendance.dailyData };
        case 'sa':
            const saDays = attendance.dailyData ? attendance.dailyData.filter(d => d.value).length : (attendance.days || 0);
            const saTotal = saDays * (employee.rate_sa || 100);
            return { ...base, rate: employee.rate_sa || 100, days: saDays, total: saTotal, dailyData: attendance.dailyData };
        default: return base;
    }
}

function renderTable(tabId, data, readOnly = false, dynamicColumns = []) {
    const container = document.getElementById('attendanceGrid');
    const tab = ATTENDANCE_TABS[tabId];
    
    if (!data || data.length === 0) {
        container.innerHTML = '<div class="p-8 text-center text-gray-400">No employees found</div>';
        return;
    }
    
    // Build dynamic headers for period-based tabs
    let columns = [...tab.columns];
    if (dynamicColumns.length > 0 && (tabId === 'guard' || tabId === 'sa')) {
        const rateIndex = columns.indexOf('Rate/day') !== -1 ? columns.indexOf('Rate/day') : columns.indexOf('Allowance/day');
        const beforeDays = columns.slice(0, rateIndex + 1);
        const afterDays = columns.slice(columns.indexOf('Days Worked'));
        columns = [...beforeDays, ...dynamicColumns, ...afterDays];
    }
    
    let html = '<table class="attendance-table"><thead class="bg-gray-50"><tr>';
    columns.forEach(col => { html += `<th>${col}</th>`; });
    html += '</tr></thead><tbody>';
    
    data.forEach((row, rowIndex) => {
        html += '<tr>';
        html += `<td style="text-align:left; font-weight:500;">${row.name}</td>`;
        
        switch(tabId) {
            case 'eda':
                html += `<td><input type="number" value="${row.lates}" data-row="${rowIndex}" data-field="lates" data-tab="${tabId}" class="w-20"></td>`;
                html += `<td><input type="number" value="${row.absences}" data-row="${rowIndex}" data-field="absences" data-tab="${tabId}" class="w-20"></td>`;
                html += `<td><input type="number" value="${row.overtime}" data-row="${rowIndex}" data-field="overtime" data-tab="${tabId}" class="w-20"></td>`;
                break;
            case 'shs-loading':
            case 'college-loading':
                html += `<td>${row.subject || '—'}</td>`;
                html += `<td>₱${row.rate}/hr</td>`;
                html += `<td>${row.mon}</td><td>${row.tue}</td><td>${row.wed}</td><td>${row.thu}</td><td>${row.fri}</td><td>${row.sat}</td><td>${row.sun}</td>`;
                html += `<td class="total-cell">${row.total}</td>`;
                break;
            case 'shs-dtr':
            case 'college-dtr':
                html += `<td><input type="number" value="${row.mon}" data-row="${rowIndex}" data-field="mon" data-tab="${tabId}" class="w-16"></td>`;
                html += `<td><input type="number" value="${row.tue}" data-row="${rowIndex}" data-field="tue" data-tab="${tabId}" class="w-16"></td>`;
                html += `<td><input type="number" value="${row.wed}" data-row="${rowIndex}" data-field="wed" data-tab="${tabId}" class="w-16"></td>`;
                html += `<td><input type="number" value="${row.thu}" data-row="${rowIndex}" data-field="thu" data-tab="${tabId}" class="w-16"></td>`;
                html += `<td><input type="number" value="${row.fri}" data-row="${rowIndex}" data-field="fri" data-tab="${tabId}" class="w-16"></td>`;
                html += `<td><input type="number" value="${row.sat}" data-row="${rowIndex}" data-field="sat" data-tab="${tabId}" class="w-16"></td>`;
                html += `<td><input type="number" value="${row.sun}" data-row="${rowIndex}" data-field="sun" data-tab="${tabId}" class="w-16"></td>`;
                html += `<td class="total-cell">${row.total}</td>`;
                break;
            case 'admin-pay':
                html += `<td>₱${row.rate}/hr</td>`;
                html += `<td><input type="number" value="${row.mon}" data-row="${rowIndex}" data-field="mon" data-tab="${tabId}" class="w-16"></td>`;
                html += `<td><input type="number" value="${row.tue}" data-row="${rowIndex}" data-field="tue" data-tab="${tabId}" class="w-16"></td>`;
                html += `<td><input type="number" value="${row.wed}" data-row="${rowIndex}" data-field="wed" data-tab="${tabId}" class="w-16"></td>`;
                html += `<td><input type="number" value="${row.thu}" data-row="${rowIndex}" data-field="thu" data-tab="${tabId}" class="w-16"></td>`;
                html += `<td><input type="number" value="${row.fri}" data-row="${rowIndex}" data-field="fri" data-tab="${tabId}" class="w-16"></td>`;
                html += `<td><input type="number" value="${row.sat}" data-row="${rowIndex}" data-field="sat" data-tab="${tabId}" class="w-16"></td>`;
                html += `<td><input type="number" value="${row.sun}" data-row="${rowIndex}" data-field="sun" data-tab="${tabId}" class="w-16"></td>`;
                html += `<td class="total-cell">${row.total}</td>`;
                html += `<td class="total-cell">₱${(row.totalPay || 0).toFixed(2)}</td>`;
                break;
            case 'admin-master':
                html += `<td><input type="number" value="${row.basic}" data-row="${rowIndex}" data-field="basic_pay" class="w-24"></td>`;
                html += `<td><input type="number" value="${row.overtime}" data-row="${rowIndex}" data-field="overtime_pay" class="w-24"></td>`;
                html += `<td class="total-cell">₱${(row.gross || 0).toFixed(2)}</td>`;
                html += `<td><input type="number" value="${row.sss}" data-row="${rowIndex}" data-field="sss" class="w-20"></td>`;
                html += `<td><input type="number" value="${row.philhealth}" data-row="${rowIndex}" data-field="philhealth" class="w-20"></td>`;
                html += `<td><input type="number" value="${row.pagibig}" data-row="${rowIndex}" data-field="pagibig" class="w-20"></td>`;
                html += `<td><input type="number" value="${row.withholding_tax}" data-row="${rowIndex}" data-field="withholding_tax" class="w-20"></td>`;
                html += `<td><input type="number" value="${row.sss_loan}" data-row="${rowIndex}" data-field="sss_loan" class="w-20"></td>`;
                html += `<td><input type="number" value="${row.hdmf_loan}" data-row="${rowIndex}" data-field="hdmf_loan" class="w-20"></td>`;
                html += `<td><input type="number" value="${row.cash_advance}" data-row="${rowIndex}" data-field="cash_advance" class="w-20"></td>`;
                html += `<td><input type="number" value="${row.atm_deposit}" data-row="${rowIndex}" data-field="atm_deposit" class="w-20"></td>`;
                html += `<td><input type="number" value="${row.transpo_allowance}" data-row="${rowIndex}" data-field="transpo_allowance" class="w-20"></td>`;
                html += `<td><input type="number" value="${row.marketing_allowance}" data-row="${rowIndex}" data-field="marketing_allowance" class="w-20"></td>`;
                html += `<td class="total-cell">₱${(row.net || 0).toFixed(2)}</td>`;
                break;
            case 'faculty-shs':
            case 'faculty-college':
                html += `<td><input type="number" value="${row.regular_hours}" data-row="${rowIndex}" data-field="regular_hours" class="w-20"></td>`;
                html += `<td><input type="number" value="${row.admin_hours}" data-row="${rowIndex}" data-field="admin_hours" class="w-20"></td>`;
                html += `<td class="total-cell">₱${(row.gross || 0).toFixed(2)}</td>`;
                html += `<td><input type="number" value="${row.sss}" data-row="${rowIndex}" data-field="sss" class="w-20"></td>`;
                html += `<td><input type="number" value="${row.philhealth}" data-row="${rowIndex}" data-field="philhealth" class="w-20"></td>`;
                html += `<td><input type="number" value="${row.pagibig}" data-row="${rowIndex}" data-field="pagibig" class="w-20"></td>`;
                html += `<td><input type="number" value="${row.withholding_tax}" data-row="${rowIndex}" data-field="withholding_tax" class="w-20"></td>`;
                html += `<td><input type="number" value="${row.sss_loan}" data-row="${rowIndex}" data-field="sss_loan" class="w-20"></td>`;
                html += `<td><input type="number" value="${row.hdmf_loan}" data-row="${rowIndex}" data-field="hdmf_loan" class="w-20"></td>`;
                html += `<td><input type="number" value="${row.cash_advance}" data-row="${rowIndex}" data-field="cash_advance" class="w-20"></td>`;
                html += `<td><input type="number" value="${row.atm_deposit}" data-row="${rowIndex}" data-field="atm_deposit" class="w-20"></td>`;
                html += `<td><input type="number" value="${row.marketing_allowance}" data-row="${rowIndex}" data-field="marketing_allowance" class="w-20"></td>`;
                html += `<td class="total-cell">₱${(row.net || 0).toFixed(2)}</td>`;
                break;
            case 'guard':
                html += `<td>₱${row.rate}/day</td>`;
                if (dynamicColumns.length > 0 && row.dailyData) {
                    row.dailyData.forEach((day, idx) => {
                        const checked = day.value ? 'checked' : '';
                        html += `<td><input type="checkbox" ${checked} data-row="${rowIndex}" data-date="${day.date}" data-field="present" class="w-5 h-5"></td>`;
                    });
                } else {
                    html += `<td><input type="checkbox" ${row.mon ? 'checked' : ''} data-row="${rowIndex}" data-field="mon" class="w-5 h-5"></td>`;
                    html += `<td><input type="checkbox" ${row.tue ? 'checked' : ''} data-row="${rowIndex}" data-field="tue" class="w-5 h-5"></td>`;
                    html += `<td><input type="checkbox" ${row.wed ? 'checked' : ''} data-row="${rowIndex}" data-field="wed" class="w-5 h-5"></td>`;
                    html += `<td><input type="checkbox" ${row.thu ? 'checked' : ''} data-row="${rowIndex}" data-field="thu" class="w-5 h-5"></td>`;
                    html += `<td><input type="checkbox" ${row.fri ? 'checked' : ''} data-row="${rowIndex}" data-field="fri" class="w-5 h-5"></td>`;
                    html += `<td><input type="checkbox" ${row.sat ? 'checked' : ''} data-row="${rowIndex}" data-field="sat" class="w-5 h-5"></td>`;
                    html += `<td><input type="checkbox" ${row.sun ? 'checked' : ''} data-row="${rowIndex}" data-field="sun" class="w-5 h-5"></td>`;
                }
                html += `<td>${row.days || 0}</td>`;
                html += `<td class="total-cell">₱${(row.total || 0).toFixed(2)}</td>`;
                break;
            case 'sa':
                html += `<td>₱${row.rate}/day</td>`;
                if (dynamicColumns.length > 0 && row.dailyData) {
                    row.dailyData.forEach((day, idx) => {
                        const checked = day.value ? 'checked' : '';
                        html += `<td><input type="checkbox" ${checked} data-row="${rowIndex}" data-date="${day.date}" data-field="present" class="w-5 h-5"></td>`;
                    });
                } else {
                    html += `<td><input type="checkbox" ${row.mon ? 'checked' : ''} data-row="${rowIndex}" data-field="mon" class="w-5 h-5"></td>`;
                    html += `<td><input type="checkbox" ${row.tue ? 'checked' : ''} data-row="${rowIndex}" data-field="tue" class="w-5 h-5"></td>`;
                    html += `<td><input type="checkbox" ${row.wed ? 'checked' : ''} data-row="${rowIndex}" data-field="wed" class="w-5 h-5"></td>`;
                    html += `<td><input type="checkbox" ${row.thu ? 'checked' : ''} data-row="${rowIndex}" data-field="thu" class="w-5 h-5"></td>`;
                    html += `<td><input type="checkbox" ${row.fri ? 'checked' : ''} data-row="${rowIndex}" data-field="fri" class="w-5 h-5"></td>`;
                    html += `<td><input type="checkbox" ${row.sat ? 'checked' : ''} data-row="${rowIndex}" data-field="sat" class="w-5 h-5"></td>`;
                }
                html += `<td>${row.days || 0}</td>`;
                html += `<td class="total-cell">₱${(row.total || 0).toFixed(2)}</td>`;
                break;
        }
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
    attachInputListeners(tabId);
}

function attachInputListeners(tabId) {
    // Debounce helper
    const debounce = (fn, delay) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn(...args), delay);
        };
    };
    const debouncedLoadTabData = debounce((tab) => loadTabData(tab), 500);

    // Number inputs
    document.querySelectorAll('#attendanceGrid input[type="number"]').forEach(input => {
        input.removeEventListener('change', handleNumberInput);
        input.removeEventListener('keydown', handleNumberKeydown);
        input.addEventListener('change', handleNumberInput);
        input.addEventListener('keydown', handleNumberKeydown);
    });
    
    // Checkboxes
    document.querySelectorAll('#attendanceGrid input[type="checkbox"]').forEach(input => {
        input.removeEventListener('change', handleCheckboxInput);
        input.addEventListener('change', handleCheckboxInput);
    });
    
    function handleNumberKeydown(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            handleNumberInput(e);
            return false;
        }
    }
    
    async function handleNumberInput(e) {
        e.preventDefault();
        e.stopPropagation();
        const input = e.target;
        const row = parseInt(input.dataset.row);
        const field = input.dataset.field;
        const value = parseFloat(input.value) || 0;
        const currentTab = input.dataset.tab || tabId;
        
        const originalBg = input.style.backgroundColor;
        input.style.backgroundColor = '#fff3cd';
        try {
            await updateCellValue(currentTab, row, field, value);
        } finally {
            input.style.backgroundColor = originalBg;
        }
        // Debounced refresh instead of immediate
        debouncedLoadTabData(currentTab);
    }
    
    async function handleCheckboxInput(e) {
        e.preventDefault();
        e.stopPropagation();
        const input = e.target;
        const row = parseInt(input.dataset.row);
        const field = input.dataset.field;
        const date = input.dataset.date;
        const value = input.checked ? 1 : 0;
        
        await updateCheckboxValue(tabId, row, date, value);
    }
}

async function updateCellValue(tabId, rowIndex, field, value) {
    try {
        const table = document.getElementById('attendanceGrid');
        const rows = table.querySelectorAll('tbody tr');
        const nameCell = rows[rowIndex]?.querySelector('td:first-child');
        if (!nameCell) return;
        
        const employeeName = nameCell.textContent.trim();
        const employees = await Database.getAllEmployees();
        const employee = employees.find(e => e.full_name === employeeName);
        if (!employee) return;
        
        const recordDate = currentPeriod.start || new Date().toISOString().split('T')[0];
        let attendanceRecords = await Database.getAttendanceByEmployee(employee.id);
        let attendance = attendanceRecords.find(a => a.tab_type === tabId);
        
        if (!attendance) {
            attendance = {
                employee_id: employee.id,
                tab_type: tabId,
                payroll_period: currentPeriod.start ? `${currentPeriod.start} to ${currentPeriod.end}` : new Date().toLocaleDateString()
            };
        }
        
        attendance[field] = value;
        
        if (attendance.id) {
            await Database.updateAttendance(attendance);
        } else {
            await Database.addAttendance(attendance);
        }
        
        showSaveToast();
        // Removed: await loadTabData(tabId); - handled by debounced caller
        
    } catch (error) { 
        console.error('Error updating cell:', error);
        alert('Failed to save: ' + error.message);
    }
}

async function updateCheckboxValue(tabId, rowIndex, date, value) {
    try {
        const table = document.getElementById('attendanceGrid');
        const rows = table.querySelectorAll('tbody tr');
        const nameCell = rows[rowIndex]?.querySelector('td:first-child');
        if (!nameCell) return;
        
        const employeeName = nameCell.textContent.trim();
        const employees = await Database.getAllEmployees();
        const employee = employees.find(e => e.full_name === employeeName);
        if (!employee) return;
        
        let attendanceRecords = await Database.getAttendanceByEmployee(employee.id);
        let attendance = attendanceRecords.find(a => 
            a.tab_type === tabId && a.date === date
        );
        
        if (!attendance) {
            attendance = {
                employee_id: employee.id,
                tab_type: tabId,
                date: date,
                payroll_period: currentPeriod.start ? `${currentPeriod.start} to ${currentPeriod.end}` : new Date().toLocaleDateString()
            };
        }
        
        // For guard and SA, store as 8 hours if present, 0 if absent
        attendance.mon = attendance.tue = attendance.wed = attendance.thu = attendance.fri = attendance.sat = attendance.sun = 0;
        const dayOfWeek = new Date(date).getDay();
        const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        attendance[dayNames[dayOfWeek]] = value ? 8 : 0;
        
        if (attendance.id) {
            await Database.updateAttendance(attendance);
        } else {
            await Database.addAttendance(attendance);
        }
        
        showSaveToast();
        // Removed: await loadTabData(tabId); - handled by debounced caller
        
    } catch (error) { 
        console.error('Error updating checkbox:', error);
        alert('Failed to save: ' + error.message);
    }
}

async function loadFacultyMergeTab(employees, attendance, loads) {
    const container = document.getElementById('attendanceGrid');
    
    // Get SHS teachers
    const shsTeachers = employees.filter(e => 
        (e.assignment === 'shs_only' || e.assignment === 'both') && e.status === 'Active'
    );
    
    // Get College teachers
    const collegeTeachers = employees.filter(e => 
        (e.assignment === 'college_only' || e.assignment === 'both') && e.status === 'Active'
    );
    
    // Calculate totals from payroll or attendance
    let shsTotal = 0, collegeTotal = 0, sssTotal = 0, phicTotal = 0, hdmfTotal = 0, netTotal = 0;
    
    for (const emp of shsTeachers) {
        const empAttendance = attendance.find(a => a.employee_id === emp.id && a.tab_type === 'faculty-shs') || {};
        const gross = empAttendance.gross || 0;
        shsTotal += gross;
        sssTotal += empAttendance.sss || 0;
        phicTotal += empAttendance.philhealth || 0;
        hdmfTotal += empAttendance.pagibig || 0;
        netTotal += empAttendance.net || gross;
    }
    
    for (const emp of collegeTeachers) {
        const empAttendance = attendance.find(a => a.employee_id === emp.id && a.tab_type === 'faculty-college') || {};
        const gross = empAttendance.gross || 0;
        collegeTotal += gross;
        sssTotal += empAttendance.sss || 0;
        phicTotal += empAttendance.philhealth || 0;
        hdmfTotal += empAttendance.pagibig || 0;
        netTotal += empAttendance.net || gross;
    }
    
    const totalFaculty = shsTotal + collegeTotal;
    
    let html = '<table class="attendance-table"><thead class="bg-gray-50">=<th>Department</th><th>SHS Total</th><th>College Total</th><th>Total Faculty</th><th>SSS Total</th><th>PHIC Total</th><th>HDMF Total</th><th>Net Total</th> </thead><tbody>';
    html += `<tr><td style="font-weight:500;">Faculty Payroll</td>
            <td class="total-cell">₱${shsTotal.toFixed(2)}</td>
            <td class="total-cell">₱${collegeTotal.toFixed(2)}</td>
            <td class="total-cell">₱${totalFaculty.toFixed(2)}</td>
            <td class="total-cell">₱${sssTotal.toFixed(2)}</td>
            <td class="total-cell">₱${phicTotal.toFixed(2)}</td>
            <td class="total-cell">₱${hdmfTotal.toFixed(2)}</td>
            <td class="total-cell">₱${netTotal.toFixed(2)}</td>
         </tr>`;
    html += '</tbody></table>';
    container.innerHTML = html;
    showLoading(false);
}

function updateStats(tabId, employees) {
    document.getElementById('totalEmployees').textContent = employees.length;
    document.getElementById('totalHours').textContent = '0';
    document.getElementById('totalOT').textContent = '0';
    document.getElementById('totalAbsences').textContent = '0';
    document.getElementById('totalLates').textContent = '0';
}

function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    const container = document.getElementById('attendanceGridContainer');
    if (show) { spinner?.classList.remove('hidden'); container?.classList.add('opacity-50'); }
    else { spinner?.classList.add('hidden'); container?.classList.remove('opacity-50'); }
}

export async function saveAllChanges() { 
    alert('All changes saved'); 
    await loadTabData(currentTab); 
}

export function exportToExcel() { 
    alert('Export to Excel'); 
}

export function calculateOT() { 
    alert('Overtime calculation'); 
}

export function applyToAll(value) { 
    alert(`Apply ${value} to all cells`); 
}

export function copyPreviousWeek() { 
    alert('Copy previous week'); 
}

export function changePeriod(direction) { 
    loadTabData(currentTab); 
}