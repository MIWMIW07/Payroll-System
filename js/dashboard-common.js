/**
 * js/dashboard-common.js
 * Shared dashboard functions for all employee roles
 */

class DashboardCommon {
    
    /**
     * Get current cut-off based on date
     */
    static getCurrentCutoff() {
        const today = new Date();
        const day = today.getDate();
        const year = today.getFullYear();
        const month = today.getMonth();
        
        if (day <= 15) {
            return {
                type: 'first',
                label: `${today.toLocaleString('default', { month: 'long' })} ${year} (1st-15th)`,
                start: new Date(year, month, 1),
                end: new Date(year, month, 15),
                startStr: `${year}-${String(month+1).padStart(2,'0')}-01`,
                endStr: `${year}-${String(month+1).padStart(2,'0')}-15`
            };
        } else {
            const lastDay = new Date(year, month + 1, 0).getDate();
            return {
                type: 'second',
                label: `${today.toLocaleString('default', { month: 'long' })} ${year} (16th-${lastDay}th)`,
                start: new Date(year, month, 16),
                end: new Date(year, month, lastDay),
                startStr: `${year}-${String(month+1).padStart(2,'0')}-16`,
                endStr: `${year}-${String(month+1).padStart(2,'0')}-${lastDay}`
            };
        }
    }
    
    /**
     * Filter attendance by cut-off period
     */
    static filterAttendanceByCutoff(attendance, cutoffStart, cutoffEnd) {
        if (!cutoffStart || !cutoffEnd || cutoffStart === 'all' || cutoffEnd === 'all') {
            return attendance;
        }
        
        const startDate = new Date(cutoffStart);
        const endDate = new Date(cutoffEnd);
        
        return attendance.filter(a => {
            const attDate = new Date(a.attendance_date || a.date);
            return attDate >= startDate && attDate <= endDate;
        });
    }
    
    /**
     * Calculate attendance statistics from records
     */
    static calculateAttendanceStats(attendance) {
        let totalHours = 0;
        let totalOvertime = 0;
        let totalLates = 0;
        let daysPresent = 0;
        
        attendance.forEach(a => {
            const hours = parseFloat(a.hours_worked || a.hours_attended || 0);
            const overtime = parseFloat(a.overtime_hours || a.ot_hours || 0);
            const lates = parseFloat(a.lates || a.late_hours || 0);
            
            totalHours += hours;
            totalOvertime += overtime;
            totalLates += lates;
            if (hours > 0) daysPresent++;
        });
        
        const undertimeHours = totalLates / 60;
        
        return {
            daysPresent,
            totalHours: totalHours.toFixed(1),
            totalOvertime: totalOvertime.toFixed(1),
            totalLates: totalLates.toFixed(1),
            undertimeHours: undertimeHours.toFixed(1),
            avgHoursPerDay: daysPresent > 0 ? (totalHours / daysPresent).toFixed(1) : 0
        };
    }
    
    /**
     * Filter payroll by cut-off period
     */
    static filterPayrollByCutoff(payroll, cutoffStart, cutoffEnd) {
        if (!payroll || payroll.length === 0) return [];
        if (!cutoffStart || !cutoffEnd || cutoffStart === 'all') return payroll;
        
        const filterStart = new Date(cutoffStart);
        const filterEnd = new Date(cutoffEnd);
        
        return payroll.filter(p => {
            if (p.period_start && p.period_end) {
                const payStart = new Date(p.period_start);
                const payEnd = new Date(p.period_end);
                return payStart <= filterEnd && payEnd >= filterStart;
            }
            return false;
        });
    }
    
    /**
     * Get available cut-off periods from attendance
     */
    static getAvailableCutoffs(attendance) {
        const cutoffMap = new Map();
        
        attendance.forEach(a => {
            const date = new Date(a.attendance_date || a.date);
            if (isNaN(date.getTime())) return;
            
            const year = date.getFullYear();
            const month = date.getMonth();
            const day = date.getDate();
            const monthName = date.toLocaleString('default', { month: 'long' });
            
            let cutoffType, cutoffLabel, startDate, endDate;
            
            if (day <= 15) {
                cutoffType = 'first';
                cutoffLabel = `${monthName} ${year} (1st-15th)`;
                startDate = new Date(year, month, 1);
                endDate = new Date(year, month, 15);
            } else {
                const lastDay = new Date(year, month + 1, 0).getDate();
                cutoffType = 'second';
                cutoffLabel = `${monthName} ${year} (16th-${lastDay}th)`;
                startDate = new Date(year, month, 16);
                endDate = new Date(year, month, lastDay);
            }
            
            const key = `${year}-${month}-${cutoffType}`;
            if (!cutoffMap.has(key)) {
                cutoffMap.set(key, {
                    key: key,
                    label: cutoffLabel,
                    start: startDate,
                    end: endDate,
                    startStr: `${year}-${String(month+1).padStart(2,'0')}-${startDate.getDate()}`,
                    endStr: `${year}-${String(month+1).padStart(2,'0')}-${endDate.getDate()}`
                });
            }
        });
        
        return Array.from(cutoffMap.values()).sort((a, b) => b.start - a.start);
    }
    
    /**
     * Render cutoff filter dropdown HTML
     */
    static renderCutoffFilter(cutoffs, selectedKey) {
        if (!cutoffs || cutoffs.length === 0) {
            return '<option value="all">No records found</option>';
        }
        
        let html = '<option value="all">All Periods</option>';
        cutoffs.forEach(cutoff => {
            const selected = (selectedKey === cutoff.key) ? 'selected' : '';
            html += `<option value="${cutoff.key}" ${selected}>${cutoff.label}</option>`;
        });
        
        return html;
    }
    
    /**
     * Get cutoff period by key
     */
    static getCutoffByKey(cutoffs, key) {
        return cutoffs.find(c => c.key === key);
    }
    
    /**
     * Format date
     */
    static formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }
    
    /**
     * Format currency
     */
    static formatMoney(amount) {
        return '₱' + (amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    
    /**
     * Show loading overlay
     */
    static showLoading(show) {
        let overlay = document.getElementById('loadingOverlay');
        if (!overlay && show) {
            overlay = document.createElement('div');
            overlay.id = 'loadingOverlay';
            overlay.className = 'loading-overlay';
            overlay.innerHTML = '<div class="spinner"></div>';
            document.body.appendChild(overlay);
            
            // Add styles if not present
            if (!document.getElementById('loadingStyles')) {
                const styles = document.createElement('style');
                styles.id = 'loadingStyles';
                styles.textContent = `
                    .loading-overlay {
                        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                        background: rgba(0,0,0,0.5); display: flex; align-items: center;
                        justify-content: center; z-index: 9999; backdrop-filter: blur(4px);
                    }
                    .spinner {
                        width: 50px; height: 50px; border: 3px solid #f3f3f3;
                        border-top: 3px solid #b0303b; border-radius: 50%;
                        animation: spin 1s linear infinite;
                    }
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `;
                document.head.appendChild(styles);
            }
        } else if (overlay && !show) {
            overlay.remove();
        }
    }
}

window.DashboardCommon = DashboardCommon;