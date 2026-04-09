/**
 * Payroll System - Database with Firebase + Render Integration
 * Phase 4: Fixed Teacher Load Functions + Payroll UPDATE
 */

import { 
    db, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc 
} from './firebase-config.js';

import { 
    savePayrollToRender, 
    getPayrollFromRender, 
    saveTeacherLoadsToRender, 
    getTeacherLoadsFromRender,
    sendNotification 
} from './render-api.js';

const DB_NAME = "PayrollDB";
const DB_VERSION = 4;

let _dbReady = null;
let _dbInitialized = false;
const _dbEventListeners = {};

function _emitEvent(eventName, data) {
    if (_dbEventListeners[eventName]) {
        _dbEventListeners[eventName].forEach(cb => { try { cb(data); } catch(e) { console.error(e); } });
    }
}

export const DatabaseEvents = {
    on: (eventName, callback) => { if (!_dbEventListeners[eventName]) _dbEventListeners[eventName] = []; _dbEventListeners[eventName].push(callback); },
    off: (eventName, callback) => { if (_dbEventListeners[eventName]) _dbEventListeners[eventName] = _dbEventListeners[eventName].filter(cb => cb !== callback); },
    emit: _emitEvent,
};

export const DB_EVENTS = {
    EMPLOYEE_ADDED: 'employee:added', EMPLOYEE_UPDATED: 'employee:updated', EMPLOYEE_DELETED: 'employee:deleted',
    ATTENDANCE_ADDED: 'attendance:added', ATTENDANCE_UPDATED: 'attendance:updated', ATTENDANCE_DELETED: 'attendance:deleted',
    LOADING_ADDED: 'loading:added', LOADING_UPDATED: 'loading:updated', PAYROLL_ADDED: 'payroll:added', PAYROLL_UPDATED: 'payroll:updated', ANY_CHANGE: 'database:any_change'
};

function getDbReadyPromise() {
    if (!_dbReady) _dbReady = initDB().then(db => { _dbInitialized = true; console.log("IndexedDB ready"); return db; });
    return _dbReady;
}
export function ensureDatabaseReady() { return getDbReadyPromise(); }

function initDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onerror = () => reject(req.error);
        req.onsuccess = () => resolve(req.result);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            
            // Employees store
            if (!db.objectStoreNames.contains("employees")) {
                const s = db.createObjectStore("employees", { keyPath: "id", autoIncrement: true });
                s.createIndex("firebaseId", "firebaseId", { unique: true });
                s.createIndex("full_name", "full_name");
                s.createIndex("assignment", "assignment");
                s.createIndex("status", "status");
            }
            
            // Teacher loads store (for OIC)
            if (!db.objectStoreNames.contains("teacher_loads")) {
                const s = db.createObjectStore("teacher_loads", { keyPath: "id", autoIncrement: true });
                s.createIndex("employee_id", "employee_id");
                s.createIndex("semester", "semester");
                s.createIndex("school_year", "school_year");
            }
            
            // Attendance store
            if (!db.objectStoreNames.contains("attendance")) {
                const s = db.createObjectStore("attendance", { keyPath: "id", autoIncrement: true });
                s.createIndex("employee_id", "employee_id");
                s.createIndex("tab_type", "tab_type");
                s.createIndex("date", "date");
                s.createIndex("period_start", "period_start");
                s.createIndex("period_end", "period_end");
            }
            
            // Users store
            if (!db.objectStoreNames.contains("users")) {
                const s = db.createObjectStore("users", { keyPath: "id", autoIncrement: true });
                s.createIndex("username", "username", { unique: true });
                s.createIndex("role", "role");
                s.createIndex("linked_employee", "linked_employee");
            }
            
            // Payroll store
            if (!db.objectStoreNames.contains("payroll")) {
                const s = db.createObjectStore("payroll", { keyPath: "id", autoIncrement: true });
                s.createIndex("employee_id", "employee_id");
                s.createIndex("period", "period");
                s.createIndex("status", "status");
            }
            
            console.log("IndexedDB stores created");
        };
    });
}

// ===========================
// INDEXEDDB HELPERS
// ===========================

function addToIndexedDB(store, data) {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onsuccess = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(store)) { resolve(null); return; }
            const tx = db.transaction([store], "readwrite");
            const st = tx.objectStore(store);
            const r = st.add(data);
            r.onsuccess = () => resolve(r.result);
            r.onerror = () => reject(r.error);
        };
        req.onerror = () => reject(req.error);
    });
}

function getAllFromIndexedDB(store) {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onsuccess = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(store)) { resolve([]); return; }
            const tx = db.transaction([store], "readonly");
            const st = tx.objectStore(store);
            const r = st.getAll();
            r.onsuccess = () => resolve(r.result);
            r.onerror = () => reject(r.error);
        };
        req.onerror = () => reject(req.error);
    });
}

function updateInIndexedDB(store, data) {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onsuccess = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(store)) { resolve(null); return; }
            const tx = db.transaction([store], "readwrite");
            const st = tx.objectStore(store);
            const r = st.put(data);
            r.onsuccess = () => resolve(r.result);
            r.onerror = () => reject(r.error);
        };
        req.onerror = () => reject(req.error);
    });
}

function deleteFromIndexedDB(store, id) {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onsuccess = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(store)) { resolve(true); return; }
            const tx = db.transaction([store], "readwrite");
            const st = tx.objectStore(store);
            const r = st.delete(Number(id));
            r.onsuccess = () => resolve(true);
            r.onerror = () => reject(r.error);
        };
        req.onerror = () => reject(req.error);
    });
}

function getByIndexFromIndexedDB(store, indexName, value) {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onsuccess = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(store)) { resolve([]); return; }
            const tx = db.transaction([store], "readonly");
            const st = tx.objectStore(store);
            const index = st.index(indexName);
            const r = index.getAll(value);
            r.onsuccess = () => resolve(r.result);
            r.onerror = () => reject(r.error);
        };
        req.onerror = () => reject(req.error);
    });
}

// ===========================
// EMPLOYEES - Firebase + IndexedDB
// ===========================

export async function getAllEmployees() {
    try {
        const snap = await getDocs(collection(db, "employees"));
        const employees = [];
        snap.forEach(doc => employees.push({ firebaseId: doc.id, ...doc.data() }));
        await Promise.all(employees.map(e => addToIndexedDB('employees', e).catch(() => {})));
        return employees;
    } catch (error) {
        console.warn('Firebase failed, using cache:', error);
        return getAllFromIndexedDB('employees');
    }
}

export async function getEmployeeById(id) {
    const employees = await getAllEmployees();
    return employees.find(e => e.id === id || e.firebaseId === id);
}

export async function getEmployeesByAssignment(assignment) {
    const employees = await getAllEmployees();
    return employees.filter(e => e.assignment === assignment);
}

export async function addEmployee(employee) {
    try {
        const docRef = await addDoc(collection(db, "employees"), employee);
        employee.firebaseId = docRef.id;
        await addToIndexedDB('employees', employee);
        _emitEvent(DB_EVENTS.EMPLOYEE_ADDED, employee);
        return employee;
    } catch (error) {
        console.error('Error adding employee:', error);
        const result = await addToIndexedDB('employees', employee);
        _emitEvent(DB_EVENTS.EMPLOYEE_ADDED, employee);
        return employee;
    }
}

export async function updateEmployee(employee) {
    try {
        if (employee.firebaseId) {
            const ref = doc(db, "employees", employee.firebaseId);
            const { firebaseId, ...data } = employee;
            await updateDoc(ref, data);
        }
        await updateInIndexedDB('employees', employee);
        _emitEvent(DB_EVENTS.EMPLOYEE_UPDATED, employee);
        return employee;
    } catch (error) {
        console.error('Error updating employee:', error);
        await updateInIndexedDB('employees', employee);
        return employee;
    }
}

export async function deleteEmployee(id, firebaseId) {
    try {
        if (firebaseId) await deleteDoc(doc(db, "employees", firebaseId));
        await deleteFromIndexedDB('employees', id);
        _emitEvent(DB_EVENTS.EMPLOYEE_DELETED, { id });
        return true;
    } catch (error) {
        console.error('Error deleting employee:', error);
        await deleteFromIndexedDB('employees', id);
        return true;
    }
}

// ===========================
// TEACHER LOADS - FIXED VERSION (PERSISTENT)
// ===========================

export async function getAllTeacherLoads() {
    try {
        // Try to get from IndexedDB first (faster)
        const local = await getAllFromIndexedDB('teacher_loads');
        if (local && local.length > 0) {
            console.log(`Loaded ${local.length} teacher loads from IndexedDB`);
            return local;
        }
        // Fallback to Render API
        const loads = await getTeacherLoadsFromRender();
        await Promise.all(loads.map(l => addToIndexedDB('teacher_loads', l).catch(() => {})));
        return loads;
    } catch (error) {
        console.warn('Render failed, using cache:', error);
        return getAllFromIndexedDB('teacher_loads');
    }
}

export async function getTeacherLoadsByEmployee(employeeId, semester, schoolYear) {
    const all = await getAllTeacherLoads();
    let filtered = all.filter(l => l.employee_id === employeeId);
    if (semester) filtered = filtered.filter(l => l.semester === semester);
    if (schoolYear) filtered = filtered.filter(l => l.school_year === schoolYear);
    return filtered[0] || null;
}

export async function saveTeacherLoad(load) {
    try {
        console.log("Saving teacher load:", load);
        
        // Check if existing
        const existing = await getTeacherLoadsByEmployee(load.employee_id, load.semester, load.school_year);
        let result;
        
        if (existing && existing.id) {
            // Update existing
            load.id = existing.id;
            result = await updateInIndexedDB('teacher_loads', load);
            console.log("Updated existing teacher load, ID:", existing.id);
            _emitEvent(DB_EVENTS.LOADING_UPDATED, load);
        } else {
            // Add new
            result = await addToIndexedDB('teacher_loads', load);
            load.id = result;
            console.log("Added new teacher load, ID:", result);
            _emitEvent(DB_EVENTS.LOADING_ADDED, load);
        }
        
        // Also try to save to Render (async, don't wait)
        saveTeacherLoadsToRender(load).catch(e => console.warn("Render save failed:", e));
        
        return load;
    } catch (error) {
        console.error('Error saving teacher load:', error);
        // Fallback to IndexedDB
        if (existing && existing.id) {
            await updateInIndexedDB('teacher_loads', load);
        } else {
            await addToIndexedDB('teacher_loads', load);
        }
        return load;
    }
}

// ===========================
// ATTENDANCE - Local + Firebase
// ===========================

export async function getAllAttendance() {
    return getAllFromIndexedDB('attendance');
}

export async function getAttendanceByEmployee(employeeId) {
    const all = await getAllFromIndexedDB('attendance');
    return all.filter(a => Number(a.employee_id) === Number(employeeId));
}

export async function getAttendanceByEmployeeAndPeriod(employeeId, periodStart, periodEnd, tabType) {
    const all = await getAllFromIndexedDB('attendance');
    let filtered = all.filter(a => Number(a.employee_id) === Number(employeeId));
    if (periodStart) filtered = filtered.filter(a => new Date(a.date) >= new Date(periodStart));
    if (periodEnd) filtered = filtered.filter(a => new Date(a.date) <= new Date(periodEnd));
    if (tabType) filtered = filtered.filter(a => a.tab_type === tabType);
    return filtered;
}

export async function getAttendanceByPeriod(periodStart, periodEnd, tabType) {
    const all = await getAllFromIndexedDB('attendance');
    let filtered = all;
    if (periodStart) filtered = filtered.filter(a => new Date(a.date) >= new Date(periodStart));
    if (periodEnd) filtered = filtered.filter(a => new Date(a.date) <= new Date(periodEnd));
    if (tabType) filtered = filtered.filter(a => a.tab_type === tabType);
    return filtered;
}

export async function addAttendance(record) {
    // Ensure date is stored as YYYY-MM-DD string
    if (record.date && !record.date.includes('-')) {
        record.date = new Date(record.date).toISOString().split('T')[0];
    }
    const r = await addToIndexedDB('attendance', record);
    _emitEvent(DB_EVENTS.ATTENDANCE_ADDED, record);
    return r;
}

export async function updateAttendance(record) {
    if (record.date && !record.date.includes('-')) {
        record.date = new Date(record.date).toISOString().split('T')[0];
    }
    const r = await updateInIndexedDB('attendance', record);
    _emitEvent(DB_EVENTS.ATTENDANCE_UPDATED, record);
    return r;
}

export async function deleteAttendance(id) {
    const r = await deleteFromIndexedDB('attendance', id);
    _emitEvent(DB_EVENTS.ATTENDANCE_DELETED, { id });
    return r;
}

// ===========================
// USERS - Local
// ===========================

export async function getAllUsers() {
    return getAllFromIndexedDB('users');
}

export async function addUser(user) {
    return addToIndexedDB('users', user);
}

export async function getUserByUsername(username) {
    const users = await getAllFromIndexedDB('users');
    return users.find(u => u.username === username);
}

// ===========================
// PAYROLL - Render + IndexedDB (UPDATED to UPDATE instead of ADD)
// ===========================

export async function getAllPayroll() {
    try {
        const payroll = await getPayrollFromRender();
        await Promise.all(payroll.map(p => addToIndexedDB('payroll', p).catch(() => {})));
        return payroll;
    } catch (error) {
        console.warn('Render failed, using cache:', error);
        return getAllFromIndexedDB('payroll');
    }
}

export async function addPayroll(record) {
    try {
        const result = await savePayrollToRender(record);
        await addToIndexedDB('payroll', record);
        _emitEvent(DB_EVENTS.PAYROLL_ADDED, record);
        return result;
    } catch (error) {
        console.error('Error saving payroll:', error);
        const result = await addToIndexedDB('payroll', record);
        return result;
    }
}

export async function updatePayroll(record) {
    try {
        const result = await savePayrollToRender(record);
        await updateInIndexedDB('payroll', record);
        _emitEvent(DB_EVENTS.PAYROLL_UPDATED, record);
        return result;
    } catch (error) {
        console.error('Error updating payroll:', error);
        await updateInIndexedDB('payroll', record);
        return record;
    }
}

export async function updatePayrollStatus(id, status, reason = null, approvedBy = null) {
    const all = await getAllPayroll();
    const payroll = all.find(p => p.id === id);
    if (!payroll) throw new Error('Payroll not found');
    
    payroll.status = status;
    payroll.approved = status === 'Approved';
    
    if (status === 'Approved') {
        payroll.approved_at = new Date().toISOString();
        payroll.approved_by = approvedBy;
    } else if (status === 'Rejected') {
        payroll.rejected_at = new Date().toISOString();
        payroll.rejection_reason = reason;
    }
    
    return updatePayroll(payroll);
}

// FIXED: Generate payroll with UPDATE instead of ADD (no duplicates)
export async function generatePayrollFromAttendance(periodStart, periodEnd) {
    try {
        const employees = await getAllEmployees();
        const attendance = await getAllAttendance();
        const payrollRecords = [];
        
        // Get existing payroll for this period to check for updates
        const periodLabel = `${new Date(periodStart).toLocaleDateString()} - ${new Date(periodEnd).toLocaleDateString()}`;
        const existingPayroll = await getAllPayroll();
        
        for (const employee of employees) {
            // Get attendance for this employee within the period
            const empAttendance = attendance.filter(a => 
                Number(a.employee_id) === Number(employee.id) &&
                new Date(a.date) >= new Date(periodStart) &&
                new Date(a.date) <= new Date(periodEnd)
            );
            
            if (empAttendance.length === 0) continue;
            
            // Calculate totals
            let totalHours = 0;
            let totalOvertime = 0;
            let totalLates = 0;
            let totalAbsences = 0;
            
            empAttendance.forEach(att => {
                if (att.tab_type === 'shs-dtr' || att.tab_type === 'college-dtr') {
                    totalHours += (att.mon || 0) + (att.tue || 0) + (att.wed || 0) + 
                                  (att.thu || 0) + (att.fri || 0) + (att.sat || 0) + (att.sun || 0);
                } else if (att.tab_type === 'eda') {
                    totalOvertime += att.overtime || 0;
                    totalLates += att.lates || 0;
                    totalAbsences += att.absences || 0;
                } else if (att.tab_type === 'admin-pay') {
                    totalHours += (att.mon || 0) + (att.tue || 0) + (att.wed || 0) + 
                                  (att.thu || 0) + (att.fri || 0) + (att.sat || 0) + (att.sun || 0);
                }
            });
            
            // Get hourly rate based on assignment
            let hourlyRate = 0;
            switch(employee.assignment) {
                case 'shs_only': hourlyRate = employee.rate_shs || 80; break;
                case 'college_only': hourlyRate = employee.rate_college || 85; break;
                case 'admin': hourlyRate = employee.rate_admin || 70; break;
                case 'guard': hourlyRate = (employee.rate_guard || 433) / 8; break;
                case 'sa': hourlyRate = employee.rate_sa || 100; break;
                default: hourlyRate = 80;
            }
            
            // Calculate deductions
            const undertimeHours = totalLates / 60;
            const undertimeDeduction = undertimeHours * hourlyRate;
            const grossSalary = (totalHours * hourlyRate) + (totalOvertime * hourlyRate * 1.25);
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
            
            // Check if record already exists
            const existing = existingPayroll.find(p => 
                p.employee_id === employee.id && p.period === periodLabel
            );
            
            if (existing) {
                // UPDATE existing record
                payrollRecord.id = existing.id;
                await updatePayroll(payrollRecord);
                payrollRecords.push(payrollRecord);
            } else {
                // ADD new record
                await addPayroll(payrollRecord);
                payrollRecords.push(payrollRecord);
            }
        }
        
        return payrollRecords;
    } catch (error) {
        console.error('Error generating payroll:', error);
        throw error;
    }
}

// ===========================
// CLEAR DATA
// ===========================

export async function clearAllData() {
    try {
        const req = indexedDB.deleteDatabase(DB_NAME);
        req.onsuccess = () => { console.log("Local database cleared"); location.reload(); };
    } catch (error) { console.error("Error clearing data:", error); }
}

// ===========================
// EXPORT
// ===========================

export const Database = {
    ensureDatabaseReady, 
    isDatabaseReady: () => _dbInitialized, 
    Events: DatabaseEvents, 
    DB_EVENTS,
    
    // Employees
    getAllEmployees,
    getEmployeeById,
    getEmployeesByAssignment,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    
    // Teacher Loads (FIXED)
    getAllTeacherLoads,
    getTeacherLoadsByEmployee,
    saveTeacherLoad,
    
    // Attendance
    getAllAttendance,
    getAttendanceByEmployee,
    getAttendanceByEmployeeAndPeriod,
    getAttendanceByPeriod,
    addAttendance,
    updateAttendance,
    deleteAttendance,
    
    // Payroll (UPDATED)
    getAllPayroll,
    addPayroll,
    updatePayroll,
    updatePayrollStatus,
    generatePayrollFromAttendance,
    
    // Users
    getAllUsers,
    addUser,
    getUserByUsername,
    
    // Utility
    clearAllData
};

window.Database = Database;
window.DB_EVENTS = DB_EVENTS;
console.log("Database loaded - Phase 4: Fixed Teacher Load Functions + Payroll UPDATE");