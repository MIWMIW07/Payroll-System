// database.js - Complete Standalone Version for Philtech GMA
// No ES6 imports - pure JavaScript for all pages

// ===========================
// GLOBAL NAMESPACE
// ===========================
window.Database = window.Database || {};
window.DB_EVENTS = window.DB_EVENTS || {};

// ===========================
// API INTEGRATION AUTO-INIT
// ===========================
// Auto-create ApiIntegration if not already available
async function ensureApiIntegration() {
    if (window.ApiIntegration && typeof window.ApiIntegration.getEmployees === 'function') {
        return window.ApiIntegration;
    }
    
    // If not available, create a basic fallback
    console.warn("ApiIntegration not found, creating fallback...");
    
    // Simple fetch-based API fallback
    window.ApiIntegration = {
        async call(endpoint, options = {}) {
            const response = await fetch(endpoint, {
                ...options,
                headers: { 'Content-Type': 'application/json', ...options.headers },
                credentials: 'include'
            });
            if (!response.ok) throw new Error(`API Error: ${response.status}`);
            return response.json();
        },
        async getEmployees() { return this.call('/api/employees.php'); },
        async getEmployee(id) { return this.call(`/api/employee?id=${id}`); },
        async createEmployee(data) { return this.call('/api/employees', { method: 'POST', body: JSON.stringify(data) }); },
        async updateEmployee(id, data) { return this.call('/api/employees', { method: 'PUT', body: JSON.stringify({ ...data, id }) }); },
        async deleteEmployee(id) { return this.call(`/api/employees?id=${id}`, { method: 'DELETE' }); },
        async getPayroll() { return this.call('/api/payroll.php'); },
        async getPayrollById(id) { return this.call(`/api/payroll?id=${id}`); },
        async createPayroll(data) { return this.call('/api/payroll', { method: 'POST', body: JSON.stringify(data) }); },
        async updatePayroll(id, data) { return this.call('/api/payroll', { method: 'PUT', body: JSON.stringify({ ...data, id }) }); },
        async deletePayroll(id) { return this.call(`/api/payroll?id=${id}`, { method: 'DELETE' }); },
        async getAttendance(type = 'admin-master') { return this.call(`/api/attendance.php?type=${encodeURIComponent(type)}`); },
        async createAttendance(type, data) { return this.call(`/api/attendance/${type}`, { method: 'POST', body: JSON.stringify(data) }); },
        async updateAttendance(type, id, data) { return this.call(`/api/attendance/${type}`, { method: 'PUT', body: JSON.stringify({ ...data, id }) }); },
        async deleteAttendance(type, id) { return this.call(`/api/attendance/${type}?id=${id}`, { method: 'DELETE' }); },
        async getUsers() { return this.call('/api/users'); },
        async createUser(data) { return this.call('/api/users', { method: 'POST', body: JSON.stringify(data) }); },
        async updateUser(id, data) { return this.call('/api/users', { method: 'PUT', body: JSON.stringify({ ...data, id }) }); },
        async deleteUser(id) { return this.call(`/api/users?id=${id}`, { method: 'DELETE' }); },
        async updateSettings(data) { return this.call('/api/settings', { method: 'PUT', body: JSON.stringify(data) }); }
    };
    
    return window.ApiIntegration;
}

// ===========================
// DATABASE CONFIGURATION
// ===========================
const DB_NAME = "PhiltechGMADB";
const DB_VERSION = 6;

let dbInstance = null;
let dbInitialized = false;
let initPromise = null;
const eventListeners = {};

// ===========================
// EVENT HANDLING
// ===========================
window.DB_EVENTS.on = function(event, callback) {
    if (!eventListeners[event]) eventListeners[event] = [];
    eventListeners[event].push(callback);
};

window.DB_EVENTS.off = function(event, callback) {
    if (!eventListeners[event]) return;
    eventListeners[event] = eventListeners[event].filter(cb => cb !== callback);
};

function emitEvent(event, data) {
    if (!eventListeners[event]) return;
    eventListeners[event].forEach(callback => {
        try { callback(data); } catch(e) { console.error(e); }
    });
}

// ===========================
// DATABASE INITIALIZATION
// ===========================
function initDatabase() {
    if (initPromise) return initPromise;
    
    initPromise = new Promise((resolve, reject) => {
        if (dbInitialized && dbInstance) {
            resolve(dbInstance);
            return;
        }
        
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = function(event) {
            console.error('Database error:', event.target.error);
            reject(event.target.error);
        };
        
        request.onsuccess = function(event) {
            dbInstance = event.target.result;
            dbInitialized = true;
            
            dbInstance.onversionchange = function() {
                dbInstance.close();
            };
            
            console.log("IndexedDB ready:", DB_NAME);
            resolve(dbInstance);
        };
        
        request.onupgradeneeded = function(event) {
            const db = event.target.result;
            console.log("Creating/upgrading database stores...");
            
            // Employees store
            if (!db.objectStoreNames.contains("employees")) {
                const store = db.createObjectStore("employees", { keyPath: "id", autoIncrement: true });
                store.createIndex("full_name", "full_name");
                store.createIndex("assignment", "assignment");
                store.createIndex("status", "status");
                store.createIndex("email", "email");
                console.log("Created employees store");
            }
            
            // Teacher loads store
            if (!db.objectStoreNames.contains("teacher_loads")) {
                const store = db.createObjectStore("teacher_loads", { keyPath: "id", autoIncrement: true });
                store.createIndex("employee_id", "employee_id");
                store.createIndex("semester", "semester");
                store.createIndex("school_year", "school_year");
                console.log("Created teacher_loads store");
            }
            
            // Attendance store
            if (!db.objectStoreNames.contains("attendance")) {
                const store = db.createObjectStore("attendance", { keyPath: "id", autoIncrement: true });
                store.createIndex("employee_id", "employee_id");
                store.createIndex("tab_type", "tab_type");
                store.createIndex("date", "date");
                store.createIndex("period_start", "period_start");
                store.createIndex("period_end", "period_end");
                console.log("Created attendance store");
            }
            
            // Users store
            if (!db.objectStoreNames.contains("users")) {
                const store = db.createObjectStore("users", { keyPath: "id", autoIncrement: true });
                store.createIndex("username", "username", { unique: true });
                store.createIndex("role", "role");
                store.createIndex("linked_employee", "linked_employee");
                console.log("Created users store");
            }
            
            // Payroll store
            if (!db.objectStoreNames.contains("payroll")) {
                const store = db.createObjectStore("payroll", { keyPath: "id", autoIncrement: true });
                store.createIndex("employee_id", "employee_id");
                store.createIndex("period", "period");
                store.createIndex("status", "status");
                console.log("Created payroll store");
            }
            
            // Settings store
            if (!db.objectStoreNames.contains("settings")) {
                db.createObjectStore("settings", { keyPath: "key" });
                console.log("Created settings store");
            }
            
            // Notifications store
            if (!db.objectStoreNames.contains("notifications")) {
                const store = db.createObjectStore("notifications", { keyPath: "id", autoIncrement: true });
                store.createIndex("read", "read");
                store.createIndex("type", "type");
                console.log("Created notifications store");
            }
            
            console.log("All database stores created/upgraded");
        };
    });
    
    return initPromise;
}

// Wait for database helper
window.ensureDatabaseReady = function() {
    return initDatabase();
};

// ===========================
// INDEXEDDB HELPERS
// ===========================
async function getAllFromStore(storeName) {
    const db = await initDatabase();
    if (!db.objectStoreNames.contains(storeName)) return [];
    
    return new Promise((resolve, reject) => {
        const tx = db.transaction([storeName], "readonly");
        const store = tx.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function getByIdFromStore(storeName, id) {
    const all = await getAllFromStore(storeName);
    return all.find(item => item.id === id);
}

async function addToStore(storeName, data) {
    const db = await initDatabase();
    return new Promise((resolve, reject) => {
        const tx = db.transaction([storeName], "readwrite");
        const store = tx.objectStore(storeName);
        const request = store.add(data);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function updateInStore(storeName, data) {
    const db = await initDatabase();
    return new Promise((resolve, reject) => {
        const tx = db.transaction([storeName], "readwrite");
        const store = tx.objectStore(storeName);
        const request = store.put(data);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function deleteFromStore(storeName, id) {
    const db = await initDatabase();
    return new Promise((resolve, reject) => {
        const tx = db.transaction([storeName], "readwrite");
        const store = tx.objectStore(storeName);
        const request = store.delete(Number(id));
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
    });
}

// ===========================
// EMPLOYEES
// ===========================
async function getAllEmployees() {
    try {
        // Direct fetch to correct endpoint with .php extension
        const response = await fetch('/api/employees.php', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Cache-Control': 'no-cache'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const employees = await response.json();
        console.log("✓ Loaded " + (employees?.length || 0) + " employees from database");
        return Array.isArray(employees) ? employees : [];
    } catch (error) {
        console.error("Error loading employees:", error);
        return [];
    }
}

async function getEmployeeById(id) {
    // Try API first
    try {
        const api = await ensureApiIntegration();
        return await api.getEmployee(id);
    } catch (error) {
        console.warn("API call failed, falling back to IndexedDB:", error);
    }
    // Fallback to IndexedDB
    const employees = await getAllFromStore("employees");
    return employees.find(e => e.id === id);
}

async function getEmployeesByAssignment(assignment) {
    const employees = await getAllEmployees();
    return employees.filter(e => e.assignment === assignment && e.status === "Active");
}

async function addEmployee(employee) {
    const api = await ensureApiIntegration();
    const result = await api.createEmployee(employee);
    console.log("✓ Employee added to database");
    emitEvent(DB_EVENTS.EMPLOYEE_ADDED, result);
    emitEvent(DB_EVENTS.ANY_CHANGE, { type: "employee_added", data: result });
    return result;
}

async function updateEmployee(employee) {
    const api = await ensureApiIntegration();
    const result = await api.updateEmployee(employee.id, employee);
    console.log("✓ Employee updated in database");
    emitEvent(DB_EVENTS.EMPLOYEE_UPDATED, result);
    emitEvent(DB_EVENTS.ANY_CHANGE, { type: "employee_updated", data: result });
    return result;
}

async function deleteEmployee(id) {
    const api = await ensureApiIntegration();
    await api.deleteEmployee(id);
    console.log("✓ Employee deleted from database");
    emitEvent(DB_EVENTS.EMPLOYEE_DELETED, { id });
    emitEvent(DB_EVENTS.ANY_CHANGE, { type: "employee_deleted", id });
    return true;
}

// ===========================
// TEACHER LOADS
// ===========================
async function getAllTeacherLoads() {
    return getAllFromStore("teacher_loads");
}

async function getTeacherLoadsByEmployee(employeeId, semester, schoolYear) {
    const all = await getAllTeacherLoads();
    let filtered = all.filter(l => l.employee_id === employeeId);
    if (semester) filtered = filtered.filter(l => l.semester === semester);
    if (schoolYear) filtered = filtered.filter(l => l.school_year === schoolYear);
    return filtered[0] || null;
}

async function saveTeacherLoad(load) {
    const existing = await getTeacherLoadsByEmployee(load.employee_id, load.semester, load.school_year);
    
    if (existing && existing.id) {
        load.id = existing.id;
        await updateInStore("teacher_loads", load);
        emitEvent(DB_EVENTS.LOADING_UPDATED, load);
    } else {
        const newId = await addToStore("teacher_loads", load);
        load.id = newId;
        emitEvent(DB_EVENTS.LOADING_ADDED, load);
    }
    emitEvent(DB_EVENTS.ANY_CHANGE, { type: "loading_updated", data: load });
    return load;
}

// ===========================
// ATTENDANCE
// ===========================
async function getAllAttendance() {
    const api = await ensureApiIntegration();
    const attendanceTypes = ['shs-dtr', 'college-dtr', 'eda', 'admin-pay', 'guard', 'sa'];
    const [shsDtr, collegeDtr, eda, adminPay, guard, sa] = await Promise.all(
        attendanceTypes.map(type => getAttendanceRecordsByType(api, type))
    );

    const attendance = [
        ...normalizeDtrAttendanceRows(shsDtr, 'shs-dtr', 'Teaching'),
        ...normalizeDtrAttendanceRows(collegeDtr, 'college-dtr', 'College'),
        ...normalizeEdaAttendanceRows(eda),
        ...normalizeAdminPayRows(adminPay),
        ...normalizeDayPayRows(guard, 'guard', 'Guard'),
        ...normalizeDayPayRows(sa, 'sa', 'Student Assistant')
    ];

    console.log("Loaded " + attendance.length + " attendance records from database");
    return attendance;
}

function getPeriodDate(record) {
    return record.period_start || record.attendance_date || record.date || '';
}

function normalizeEmployeeId(value) {
    const numeric = Number(value);
    return Number.isFinite(numeric) && String(value).trim() !== '' ? numeric : value;
}

function getPeriodLabel(record) {
    if (record.payroll_period) return record.payroll_period;
    if (record.period_start && record.period_end) return `${record.period_start} - ${record.period_end}`;
    return record.period || '';
}

function normalizeDtrAttendanceRows(records, tabType, payType) {
    return (records || []).flatMap(record => {
        const expanded = expandDtrAttendance([record], record.employee_id, tabType, payType);
        if (expanded.length > 0) {
            return expanded.map(row => ({
                ...row,
                id: record.id,
                employee_id: normalizeEmployeeId(record.employee_id),
                tab_type: tabType,
                payroll_period: getPeriodLabel(record)
            }));
        }

        const totalHours = Number(record.total_hours) || 0;
        if (totalHours <= 0) return [];

        return [{
            id: record.id,
            employee_id: normalizeEmployeeId(record.employee_id),
            tab_type: tabType,
            attendance_date: getPeriodDate(record),
            date: getPeriodDate(record),
            period_start: record.period_start || '',
            period_end: record.period_end || '',
            payroll_period: getPeriodLabel(record),
            hours_worked: totalHours,
            hours_attended: totalHours,
            overtime_hours: 0,
            ot_hours: 0,
            lates: 0,
            absences: 0,
            pay_type: payType,
            source: tabType
        }];
    });
}

function normalizeEdaAttendanceRows(records) {
    return (records || []).map(record => ({
        id: record.id,
        employee_id: normalizeEmployeeId(record.employee_id),
        tab_type: 'eda',
        attendance_date: getPeriodDate(record),
        date: getPeriodDate(record),
        period_start: record.period_start || '',
        period_end: record.period_end || '',
        payroll_period: getPeriodLabel(record),
        hours_worked: 0,
        hours_attended: 0,
        overtime_hours: Number(record.overtime) || 0,
        ot_hours: Number(record.overtime) || 0,
        lates: Number(record.lates) || 0,
        absences: Number(record.absences) || 0,
        pay_type: 'EDA',
        source: 'eda'
    }));
}

function normalizeAdminPayRows(records) {
    return (records || []).map(record => {
        const hours = Number(record.admin_hours) || 0;
        return {
            id: record.id,
            employee_id: normalizeEmployeeId(record.employee_id),
            tab_type: 'admin-pay',
            attendance_date: getPeriodDate(record),
            date: getPeriodDate(record),
            period_start: record.period_start || '',
            period_end: record.period_end || '',
            payroll_period: getPeriodLabel(record),
            hours_worked: hours,
            hours_attended: hours,
            overtime_hours: 0,
            ot_hours: 0,
            lates: 0,
            absences: 0,
            pay_type: 'Admin Pay',
            admin_pay: Number(record.total_pay) || 0,
            source: 'admin-pay'
        };
    });
}

function normalizeDayPayRows(records, tabType, payType) {
    return (records || []).map(record => {
        const daysWorked = Number(record.days_worked) || 0;
        const hours = daysWorked * 8;
        return {
            id: record.id,
            employee_id: normalizeEmployeeId(record.employee_id),
            tab_type: tabType,
            attendance_date: getPeriodDate(record),
            date: getPeriodDate(record),
            period_start: record.period_start || '',
            period_end: record.period_end || '',
            payroll_period: getPeriodLabel(record),
            hours_worked: hours,
            hours_attended: hours,
            overtime_hours: 0,
            ot_hours: 0,
            lates: 0,
            absences: 0,
            pay_type: payType,
            days_worked: daysWorked,
            total_pay: Number(record.total_pay) || 0,
            source: tabType
        };
    });
}

async function loadPeriods() {
    try {
        const response = await fetch('/api/period/list.php', { credentials: 'include' });
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data.periods) ? data.periods : [];
    } catch (error) {
        console.warn('Could not load payroll periods:', error.message);
        return [];
    }
}

async function getAttendanceRecordsByType(api, type) {
    try {
        const attendance = await api.getAttendance(type);
        return Array.isArray(attendance) ? attendance : [];
    } catch (error) {
        console.warn(`Could not load ${type} attendance records:`, error.message);
        return [];
    }
}

function parseDailyData(dailyData) {
    if (!dailyData) return {};
    if (typeof dailyData === 'string') {
        try {
            const parsed = JSON.parse(dailyData);
            return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
        } catch (error) {
            return {};
        }
    }
    return typeof dailyData === 'object' && !Array.isArray(dailyData) ? dailyData : {};
}

function expandDtrAttendance(records, employeeId, source, payType) {
    const employeeKey = String(employeeId);
    const expanded = [];

    (records || [])
        .filter(record => String(record.employee_id) === employeeKey)
        .forEach(record => {
            const dailyData = parseDailyData(record.daily_data);

            Object.entries(dailyData).forEach(([date, hours]) => {
                const hoursWorked = Number(hours) || 0;
                if (!date || hoursWorked <= 0) return;

                expanded.push({
                    employee_id: normalizeEmployeeId(record.employee_id),
                    attendance_date: date,
                    date,
                    hours_worked: hoursWorked,
                    hours_attended: hoursWorked,
                    overtime_hours: 0,
                    ot_hours: 0,
                    lates: 0,
                    pay_type: payType,
                    period_start: record.period_start || '',
                    period_end: record.period_end || '',
                    source
                });
            });
        });

    return expanded;
}

function mergeDailyAttendance(records) {
    const byDate = new Map();

    records.forEach(record => {
        const key = record.attendance_date || record.date;
        if (!key) return;

        if (!byDate.has(key)) {
            byDate.set(key, { ...record });
            return;
        }

        const existing = byDate.get(key);
        const hoursWorked = (Number(existing.hours_worked) || 0) + (Number(record.hours_worked) || 0);
        const overtimeHours = (Number(existing.overtime_hours) || 0) + (Number(record.overtime_hours) || 0);
        const lates = (Number(existing.lates) || 0) + (Number(record.lates) || 0);
        const sources = new Set(String(existing.source || '').split('+').filter(Boolean));
        sources.add(record.source);
        const payTypes = new Set(String(existing.pay_type || '').split('+').filter(Boolean));
        payTypes.add(record.pay_type);

        byDate.set(key, {
            ...existing,
            hours_worked: hoursWorked,
            hours_attended: hoursWorked,
            overtime_hours: overtimeHours,
            ot_hours: overtimeHours,
            lates,
            pay_type: Array.from(payTypes).join('+'),
            source: Array.from(sources).join('+')
        });
    });

    return Array.from(byDate.values());
}

function isDateInRange(date, start, end) {
    if (!date || !start || !end) return false;
    const value = new Date(`${date}T00:00:00`);
    const startDate = new Date(`${start}T00:00:00`);
    const endDate = new Date(`${end}T00:00:00`);
    return value >= startDate && value <= endDate;
}

function applyEdaTotalsToDailyRecords(dailyRecords, edaRecords, employeeId) {
    const employeeKey = String(employeeId);

    (edaRecords || [])
        .filter(record => String(record.employee_id) === employeeKey)
        .forEach(eda => {
            const periodRecords = dailyRecords.filter(record =>
                isDateInRange(record.attendance_date || record.date, eda.period_start, eda.period_end)
            );

            if (periodRecords.length === 0) return;

            const totalHours = periodRecords.reduce((sum, record) => sum + (Number(record.hours_worked) || 0), 0);
            const totalLates = Number(eda.lates) || 0;
            const totalOvertime = Number(eda.overtime) || 0;

            periodRecords.forEach(record => {
                const weight = totalHours > 0
                    ? (Number(record.hours_worked) || 0) / totalHours
                    : 1 / periodRecords.length;
                const lates = totalLates * weight;
                const overtimeHours = totalOvertime * weight;

                record.lates = lates;
                record.overtime_hours = overtimeHours;
                record.ot_hours = overtimeHours;
                record.absences = (Number(eda.absences) || 0) * weight;
            });
        });

    return dailyRecords;
}

async function getAttendanceByEmployee(employeeId, tabType = null) {
    if (tabType && ['guard', 'sa'].includes(tabType)) {
        // NOTE:
        // Previously this code hard-blocked guard/SA attendance API calls on a specific static-only host.
        // That prevented dashboards from displaying any DB data.
        // Now we always attempt the API and fall back to [] only if the call fails.
        //
        // If guard/SA endpoints are truly unavailable in a deployment, the catch below will handle it.


        try {
            const api = await ensureApiIntegration();
            const attendance = await api.getAttendance(tabType);
            return (Array.isArray(attendance) ? attendance : []).filter(a =>
                Number(a.employee_id) === Number(employeeId) ||
                String(a.employee_id) === String(employeeId)
            );
        } catch (error) {
            // Guard/SA attendance endpoints may be absent on static-only deployments.
            // Keep role dashboards usable by showing an empty attendance state.
            console.warn(`Could not load ${tabType} attendance records:`, error.message);
            return [];
        }
    }

    const api = await ensureApiIntegration();
    const [shsDtr, collegeDtr, eda] = await Promise.all([
        getAttendanceRecordsByType(api, 'shs-dtr'),
        getAttendanceRecordsByType(api, 'college-dtr'),
        getAttendanceRecordsByType(api, 'eda')
    ]);

    const dailyAttendance = mergeDailyAttendance([
        ...expandDtrAttendance(shsDtr, employeeId, 'shs', 'teaching'),
        ...expandDtrAttendance(collegeDtr, employeeId, 'college', 'college')
    ]);

    return applyEdaTotalsToDailyRecords(dailyAttendance, eda, employeeId)
        .sort((a, b) => new Date(a.attendance_date || a.date) - new Date(b.attendance_date || b.date));
}

async function getAttendanceById(id) {
    const all = await getAllAttendance();
    return all.find(a => a.id === id);
}

async function getAttendanceByPeriod(periodStart, periodEnd, tabType) {
    const all = await getAllAttendance();
    let filtered = all;
    if (periodStart) filtered = filtered.filter(a => new Date(a.date) >= new Date(periodStart));
    if (periodEnd) filtered = filtered.filter(a => new Date(a.date) <= new Date(periodEnd));
    if (tabType) filtered = filtered.filter(a => a.tab_type === tabType);
    return filtered;
}

async function addAttendance(record) {
    const api = await ensureApiIntegration();
    if (record.date && !record.date.includes("-")) {
        record.date = new Date(record.date).toISOString().split("T")[0];
    }
    const id = await api.createAttendance('admin-master', record);
    console.log("✓ Attendance record added to database");
    emitEvent(DB_EVENTS.ATTENDANCE_ADDED, record);
    emitEvent(DB_EVENTS.ANY_CHANGE, { type: "attendance_added", data: record });
    return id;
}

async function updateAttendance(record) {
    const api = await ensureApiIntegration();
    if (record.date && !record.date.includes("-")) {
        record.date = new Date(record.date).toISOString().split("T")[0];
    }
    const result = await api.updateAttendance('admin-master', record.id, record);
    console.log("✓ Attendance record updated in database");
    emitEvent(DB_EVENTS.ATTENDANCE_UPDATED, result);
    emitEvent(DB_EVENTS.ANY_CHANGE, { type: "attendance_updated", data: result });
    return result;
}

async function deleteAttendance(id) {
    const api = await ensureApiIntegration();
    await api.deleteAttendance('admin-master', id);
    console.log("✓ Attendance record deleted from database");
    emitEvent(DB_EVENTS.ATTENDANCE_DELETED, { id });
    emitEvent(DB_EVENTS.ANY_CHANGE, { type: "attendance_deleted", id });
    return true;
}

// ===========================
// USERS
// ===========================
async function getAllUsers() {
    const api = await ensureApiIntegration();
    const users = await api.getUsers();
    console.log("✓ Loaded " + (users?.length || 0) + " users from database");
    return Array.isArray(users) ? users : [];
}

async function getUserById(id) {
    const users = await getAllUsers();
    return users.find(u => u.id === id);
}

async function getUserByUsername(username) {
    const users = await getAllUsers();
    return users.find(u => u.username === username);
}

async function addUser(user) {
    const api = await ensureApiIntegration();
    const result = await api.createUser(user);
    console.log("✓ User added to database");
    emitEvent(DB_EVENTS.USER_ADDED, result);
    emitEvent(DB_EVENTS.ANY_CHANGE, { type: "user_added", data: result });
    return result;
}

async function updateUser(user) {
    const api = await ensureApiIntegration();
    const result = await api.updateUser(user.id, user);
    console.log("✓ User updated in database");
    emitEvent(DB_EVENTS.USER_UPDATED, result);
    emitEvent(DB_EVENTS.ANY_CHANGE, { type: "user_updated", data: result });
    return result;
}

async function deleteUser(id) {
    const api = await ensureApiIntegration();
    await api.deleteUser(id);
    console.log("✓ User deleted from database");
    emitEvent(DB_EVENTS.USER_DELETED, { id });
    emitEvent(DB_EVENTS.ANY_CHANGE, { type: "user_deleted", id });
    return true;
}

// ===========================
// PAYROLL
// ===========================
async function getAllPayroll() {
    try {
        const response = await fetch('/api/payroll.php', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Cache-Control': 'no-cache'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const payroll = await response.json();
        console.log("✓ Loaded " + (payroll?.length || 0) + " payroll records from database");
        return Array.isArray(payroll) ? payroll : [];
    } catch (error) {
        console.error("Error loading payroll:", error);
        return [];
    }
}

async function getPayrollById(id) {
    // Try API first
    if (id) {
        try {
            const api = await ensureApiIntegration();
            return await api.getPayrollById(id);
        } catch (error) {
            console.warn("API call failed, falling back to IndexedDB:", error);
        }
    }
    // Fallback to IndexedDB
    const all = await getAllFromStore("payroll");
    return all.find(p => p.id === id);
}

async function addPayroll(record) {
    const api = await ensureApiIntegration();
    const id = await api.createPayroll(record);
    console.log("✓ Payroll record added to database");
    emitEvent(DB_EVENTS.PAYROLL_ADDED, record);
    emitEvent(DB_EVENTS.ANY_CHANGE, { type: "payroll_added", data: record });
    return id;
}

async function updatePayroll(record) {
    const api = await ensureApiIntegration();
    const result = await api.updatePayroll(record.id, record);
    console.log("✓ Payroll record updated in database");
    emitEvent(DB_EVENTS.PAYROLL_UPDATED, result);
    emitEvent(DB_EVENTS.ANY_CHANGE, { type: "payroll_updated", data: result });
    return result;
}

async function updatePayrollStatus(id, status, reason = null, approvedBy = null) {
    const payroll = await getPayrollById(id);
    if (!payroll) throw new Error("Payroll not found");
    
    payroll.status = status;
    payroll.approved = status === "Approved";
    
    if (status === "Approved") {
        payroll.approved_at = new Date().toISOString();
        payroll.approved_by = approvedBy;
    } else if (status === "Rejected") {
        payroll.rejected_at = new Date().toISOString();
        payroll.rejection_reason = reason;
    }
    
    return updatePayroll(payroll);
}

async function submitForApproval(period) {
    const all = await getAllPayroll();
    const pendingPayroll = all.filter(p => p.period === period && (p.status === "Pending" || !p.approved));
    
    for (const payroll of pendingPayroll) {
        payroll.status = "Pending";
        payroll.submitted_at = new Date().toISOString();
        await updatePayroll(payroll);
    }
    
    return { count: pendingPayroll.length, records: pendingPayroll };
}

async function generatePayrollFromAttendance(periodStart, periodEnd) {
    try {
        const employees = await getAllEmployees();
        const attendance = await getAllAttendance();
        const payrollRecords = [];
        
        const periodLabel = `${new Date(periodStart).toLocaleDateString()} - ${new Date(periodEnd).toLocaleDateString()}`;
        const existingPayroll = await getAllPayroll();
        
        for (const employee of employees) {
            const empAttendance = attendance.filter(a => 
                Number(a.employee_id) === Number(employee.id) &&
                new Date(a.date) >= new Date(periodStart) &&
                new Date(a.date) <= new Date(periodEnd)
            );
            
            if (empAttendance.length === 0) continue;
            
            let totalHours = 0;
            let totalOvertime = 0;
            let totalLates = 0;
            let totalAdminPay = 0;
            let totalGuardPay = 0;
            let totalSaPay = 0;

            empAttendance.forEach(att => {
                if (att.tab_type === "shs-dtr" || att.tab_type === "college-dtr") {
                    totalHours += att.hours_worked || 0;
                } else if (att.tab_type === "eda") {
                    totalOvertime += att.overtime_hours || att.ot_hours || 0;
                    totalLates += att.lates || 0;
                } else if (att.tab_type === "admin-pay") {
                    totalHours += att.hours_worked || 0;
                    totalAdminPay += att.admin_pay || 0;
                } else if (att.tab_type === "guard") {
                    totalHours += att.hours_worked || 0;
                    totalGuardPay += att.total_pay || 0;
                } else if (att.tab_type === "sa") {
                    totalHours += att.hours_worked || 0;
                    totalSaPay += att.total_pay || 0;
                }
            });

            let hourlyRate = 0;
            switch(employee.assignment) {
                case "shs_only": hourlyRate = employee.rate_shs || 80; break;
                case "college_only": hourlyRate = employee.rate_college || 85; break;
                case "both": hourlyRate = employee.rate_shs || 80; break;
                case "admin": hourlyRate = employee.rate_admin || 70; break;
                case "admin_college": hourlyRate = employee.rate_college || employee.rate_admin || 85; break;
                case "admin_shs": hourlyRate = employee.rate_shs || employee.rate_admin || 80; break;
                case "admin_shs_college": hourlyRate = employee.rate_shs || employee.rate_college || employee.rate_admin || 80; break;
                case "guard": hourlyRate = (employee.rate_guard || 433) / 8; break;
                case "sa": hourlyRate = employee.rate_sa || 100; break;
                default: hourlyRate = 80;
            }

            const regularSalary = totalHours * hourlyRate;
            const overtimeSalary = totalOvertime * hourlyRate * 1.25;
            const grossSalary = regularSalary + overtimeSalary + totalAdminPay + totalGuardPay + totalSaPay;
            
            const undertimeHours = totalLates / 60;
            const undertimeDeduction = undertimeHours * hourlyRate;
            const sss = Math.round(grossSalary * 0.045);
            const philhealth = Math.round(grossSalary * 0.03);
            const pagibig = 100;
            const totalDeduction = sss + philhealth + pagibig + Math.round(undertimeDeduction);
            const netSalary = Math.round(grossSalary - totalDeduction);
            
            const payrollRecord = {
                employee_id: employee.id,
                period: periodLabel,
                period_start: periodStart,
                period_end: periodEnd,
                regular_hours: totalHours,
                overtime_hours: totalOvertime,
                admin_pay: totalAdminPay,
                guard_pay: totalGuardPay,
                sa_pay: totalSaPay,
                gross_salary: Math.round(grossSalary),
                sss: sss,
                philhealth: philhealth,
                pagibig: pagibig,
                undertime_deduction: Math.round(undertimeDeduction),
                total_deduction: totalDeduction,
                net_salary: netSalary,
                status: "Pending",
                approved: false,
                generated_at: new Date().toISOString()
            };
            
            const existing = existingPayroll.find(p => 
                p.employee_id === employee.id && p.period === periodLabel
            );
            
            if (existing) {
                payrollRecord.id = existing.id;
                await updatePayroll(payrollRecord);
                payrollRecords.push(payrollRecord);
            } else {
                await addPayroll(payrollRecord);
                payrollRecords.push(payrollRecord);
            }
        }
        
        return payrollRecords;
    } catch (error) {
        console.error("Error generating payroll:", error);
        throw error;
    }
}

// ===========================
// NOTIFICATIONS
// ===========================
async function addNotification(notification) {
    const newNotification = {
        ...notification,
        id: Date.now(),
        timestamp: new Date().toISOString(),
        read: false
    };
    await addToStore("notifications", newNotification);
    return newNotification;
}

async function getNotifications(unreadOnly = false) {
    const all = await getAllFromStore("notifications");
    if (unreadOnly) return all.filter(n => !n.read);
    return all.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

async function markNotificationRead(id) {
    const notifications = await getAllFromStore("notifications");
    const notification = notifications.find(n => n.id === id);
    if (notification) {
        notification.read = true;
        await updateInStore("notifications", notification);
    }
    return true;
}

// ===========================
// SETTINGS
// ===========================
async function getSetting(key) {
    const api = await ensureApiIntegration();
    if (!key) {
        throw new Error("Setting key is required");
    }
    const result = await api.call(`/api/settings?key=${key}`);
    console.log("✓ Setting retrieved from database");
    return result;
}

// Alias for compatibility with settings.js
// Returns format: { key: 'system', data: {...} }
async function getSettingByKey(key) {
    const api = await ensureApiIntegration();
    if (!key) {
        throw new Error("Setting key is required");
    }
    try {
        const result = await api.call(`/api/settings?key=${key}`);
        if (result && result.value) {
            // Handle both string and object from JSONB
            let dataValue;
            if (typeof result.value === 'string') {
                // Try to parse JSON string
                try {
                    dataValue = JSON.parse(result.value);
                } catch (e) {
                    dataValue = result.value;
                }
            } else if (typeof result.value === 'object') {
                // Already an object (from JSONB)
                dataValue = result.value;
            } else {
                dataValue = result.value;
            }
            return { key: key, data: dataValue };
        }
        return { key: key, data: null };
    } catch (error) {
        console.warn("API call failed:", error);
        return { key: key, data: null };
    }
}

async function saveSetting(setting) {
    const key = setting.key;
    const value = typeof setting.data === 'object' ? JSON.stringify(setting.data) : setting.value;
    const settingRecord = { key, value, updated_at: new Date().toISOString() };
    
    // Try API first
    if (key) {
        try {
            const api = await ensureApiIntegration();
            await api.updateSettings({ key, value });
            // Update IndexedDB cache
            await updateInStore("settings", settingRecord);
            return setting;
        } catch (error) {
            console.warn("API call failed, using local store:", error);
        }
    }
    
    // Fallback to local store
    await updateInStore("settings", settingRecord);
    return setting;
}

// ===========================
// CLEAR DATA
// ===========================
async function clearAllData() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.deleteDatabase(DB_NAME);
        request.onsuccess = () => {
            console.log("Database deleted");
            dbInitialized = false;
            dbInstance = null;
            initPromise = null;
            resolve(true);
        };
        request.onerror = () => reject(request.error);
    });
}

// ===========================
// EXPORT TO GLOBAL
// ===========================
const Database = {
    ensureDatabaseReady,
    
    // Employees
    getAllEmployees,
    getEmployeeById,
    getEmployeesByAssignment,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    
    // Teacher Loads
    getAllTeacherLoads,
    getTeacherLoadsByEmployee,
    saveTeacherLoad,
    
    // Attendance
    getAllAttendance,
    getAttendanceByEmployee,
    getAttendanceById,
    getAttendanceByPeriod,
    loadPeriods,
    addAttendance,
    updateAttendance,
    deleteAttendance,
    
    // Payroll
    getAllPayroll,
    getPayrollById,
    addPayroll,
    updatePayroll,
    updatePayrollStatus,
    generatePayrollFromAttendance,
    submitForApproval,
    
    // Users
    getAllUsers,
    getUserById,
    getUserByUsername,
    addUser,
    updateUser,
    deleteUser,
    
    // Notifications
    addNotification,
    getNotifications,
    markNotificationRead,
    
// Settings
    getSetting,
    getSettingByKey,
    saveSetting,
    
    // Utility
    clearAllData,
    
    // Events
    Events: {
        on: window.DB_EVENTS.on,
        off: window.DB_EVENTS.off,
        emit: emitEvent
    }
};

window.Database = Database;
window.DB_EVENTS = {
    EMPLOYEE_ADDED: "employee:added",
    EMPLOYEE_UPDATED: "employee:updated",
    EMPLOYEE_DELETED: "employee:deleted",
    ATTENDANCE_ADDED: "attendance:added",
    ATTENDANCE_UPDATED: "attendance:updated",
    ATTENDANCE_DELETED: "attendance:deleted",
    LOADING_ADDED: "loading:added",
    LOADING_UPDATED: "loading:updated",
    PAYROLL_ADDED: "payroll:added",
    PAYROLL_UPDATED: "payroll:updated",
    PAYROLL_DELETED: "payroll:deleted",
    USER_ADDED: "user:added",
    USER_UPDATED: "user:updated",
    USER_DELETED: "user:deleted",
    ANY_CHANGE: "database:any_change"
};

console.log("Database loaded - Standalone Version (No ES6 Modules)");
