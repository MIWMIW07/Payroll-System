<?php
/**
 * api/payslip.php
 * Dynamic Payslip Generation API
 * Returns payroll data formatted for PDF generation based on employee role
 */

require_once __DIR__ . '/core/bootstrap.php';
require_once __DIR__ . '/middleware/auth.php';

require_auth();

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    jsonError('Method not allowed', 405);
}

$employeeId = isset($_GET['employee_id']) ? (int)$_GET['employee_id'] : null;
$periodStart = $_GET['period_start'] ?? null;
$periodEnd = $_GET['period_end'] ?? null;
$payrollId = isset($_GET['payroll_id']) ? (int)$_GET['payroll_id'] : null;

if (!$employeeId && !$payrollId) {
    jsonError('Employee ID or Payroll ID required', 400);
}

try {
    $pdo = bootstrapGetPdo('require');
    
    // Get current user from session
    $currentUser = $_SESSION['user'] ?? null;
    $currentUserId = $_SESSION['user_id'] ?? null;
    $currentUserRole = $currentUser['role'] ?? '';
    
    // If fetching by payroll ID, get the payroll record first
    if ($payrollId) {
        $stmt = $pdo->prepare("
            SELECT p.*, e.full_name, e.position, e.assignment, e.employee_id as emp_code,
                   e.rate_shs, e.rate_college, e.rate_admin, e.base_salary,
                   e.hourly_rate, e.admin_pay_rate
            FROM payroll p
            JOIN employees e ON p.employee_id = e.id
            WHERE p.id = :id
        ");
        $stmt->execute([':id' => $payrollId]);
        $payroll = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$payroll) {
            jsonError('Payroll record not found', 404);
        }
        
        $employeeId = $payroll['employee_id'];
        $periodStart = $payroll['period_start'];
        $periodEnd = $payroll['period_end'];
    } else {
        // Fetch payroll by employee and period
        $stmt = $pdo->prepare("
            SELECT p.*, e.full_name, e.position, e.assignment, e.employee_id as emp_code,
                   e.rate_shs, e.rate_college, e.rate_admin, e.base_salary,
                   e.hourly_rate, e.admin_pay_rate
            FROM payroll p
            JOIN employees e ON p.employee_id = e.id
            WHERE p.employee_id = :employee_id
            AND p.period_start = :period_start
            AND p.period_end = :period_end
        ");
        $stmt->execute([
            ':employee_id' => $employeeId,
            ':period_start' => $periodStart,
            ':period_end' => $periodEnd
        ]);
        $payroll = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$payroll) {
            // Try to generate payroll on the fly for this period
            jsonError('Payroll record not found for this period. Please generate payroll first.', 404);
        }
    }
    
    // Authorization check: teachers/guards/sa can only view their own payslip
    $isAdmin = in_array($currentUserRole, ['superadmin', 'accountant']);
    $isSelf = ($currentUserId && $payroll['employee_id'] == $currentUserId) || 
              ($currentUser['employee_id'] ?? null) == $employeeId;
    
    if (!$isAdmin && !$isSelf) {
        jsonError('Unauthorized to view this payslip', 403);
    }
    
    // Fetch attendance summary for the period (for faculty)
    $attendanceSummary = [];
    if (in_array($payroll['assignment'], ['shs_only', 'college_only', 'both', 'admin_shs', 'admin_college', 'admin_shs_college'])) {
        // Get teaching hours from attendance tables
        $stmt = $pdo->prepare("
            SELECT 
                COALESCE(SUM(mon + tue + wed + thu + fri + sat + sun), 0) as teaching_hours
            FROM attendance_shs_loading
            WHERE employee_id = :employee_id
            AND period_start = :period_start
            AND period_end = :period_end
        ");
        $stmt->execute([
            ':employee_id' => (string)$employeeId,
            ':period_start' => $periodStart,
            ':period_end' => $periodEnd
        ]);
        $shsHours = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $stmt = $pdo->prepare("
            SELECT 
                COALESCE(SUM(mon + tue + wed + thu + fri + sat + sun), 0) as teaching_hours
            FROM attendance_college_loading
            WHERE employee_id = :employee_id
            AND period_start = :period_start
            AND period_end = :period_end
        ");
        $stmt->execute([
            ':employee_id' => (string)$employeeId,
            ':period_start' => $periodStart,
            ':period_end' => $periodEnd
        ]);
        $collegeHours = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Get admin hours from admin pay table
        $stmt = $pdo->prepare("
            SELECT COALESCE(admin_hours, 0) as admin_hours
            FROM attendance_admin_pay
            WHERE employee_id = :employee_id
            AND period_start = :period_start
            AND period_end = :period_end
        ");
        $stmt->execute([
            ':employee_id' => (string)$employeeId,
            ':period_start' => $periodStart,
            ':period_end' => $periodEnd
        ]);
        $adminHours = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $attendanceSummary = [
            'teaching_hours' => ($shsHours['teaching_hours'] ?? 0) + ($collegeHours['teaching_hours'] ?? 0),
            'admin_hours' => $adminHours['admin_hours'] ?? 0
        ];
    }
    
    // Determine payslip type based on employee assignment
    $assignment = $payroll['assignment'] ?? 'regular';
    $isFaculty = in_array($assignment, ['shs_only', 'college_only', 'both', 'admin_shs', 'admin_college', 'admin_shs_college']);
    $isAdminStaff = in_array($assignment, ['admin', 'admin_staff']);
    $isGuard = $assignment === 'guard';
    $isSA = $assignment === 'sa';
    
    // Calculate payslip data based on type
    $payslipData = [];
    
    if ($isFaculty) {
        // FACULTY PAYSLIP DATA
        $teachingHours = $attendanceSummary['teaching_hours'] ?? $payroll['regular_hours'] ?? 0;
        $adminHours = $attendanceSummary['admin_hours'] ?? $payroll['admin_hours'] ?? 0;
        
        $teachingRate = $payroll['rate_shs'] ?? $payroll['rate_college'] ?? 80;
        $adminRate = $payroll['rate_admin'] ?? $payroll['admin_pay_rate'] ?? 70;
        
        $teachingEarnings = $teachingHours * $teachingRate;
        $adminEarnings = $adminHours * $adminRate;
        $grossPay = $teachingEarnings + $adminEarnings;
        
        $payslipData = [
            'type' => 'faculty',
            'payroll_id' => $payroll['id'],
            'employee_id' => $payroll['employee_id'],
            'employee_code' => $payroll['emp_code'] ?? 'EMP' . $payroll['employee_id'],
            'employee_name' => $payroll['full_name'],
            'position' => $payroll['position'] ?? 'Faculty',
            'period_start' => $periodStart,
            'period_end' => $periodEnd,
            'period_display' => $payroll['period'] ?? date('F j, Y', strtotime($periodStart)) . ' - ' . date('F j, Y', strtotime($periodEnd)),
            'payslip_date' => date('F j, Y'),
            
            // Faculty specific
            'teaching_rate' => round($teachingRate, 2),
            'teaching_hours' => round($teachingHours, 2),
            'teaching_earnings' => round($teachingEarnings, 2),
            'admin_rate' => round($adminRate, 2),
            'admin_hours' => round($adminHours, 2),
            'admin_earnings' => round($adminEarnings, 2),
            'gross_pay' => round($grossPay, 2),
            
            // Deductions
            'sss' => round($payroll['sss'] ?? 0, 2),
            'philhealth' => round($payroll['philhealth'] ?? 0, 2),
            'pagibig' => round($payroll['pagibig'] ?? 0, 2),
            'wtax' => round($payroll['withholding_tax'] ?? 0, 2),
            'sss_loan' => round($payroll['sss_loan'] ?? 0, 2),
            'hdmf_loan' => round($payroll['hdmf_loan'] ?? 0, 2),
            'atm_deposit' => round($payroll['atm_deposit'] ?? 0, 2),
            'cash_advance' => round($payroll['cash_advance'] ?? 0, 2),
            'total_deductions' => round(($payroll['sss'] ?? 0) + ($payroll['philhealth'] ?? 0) + ($payroll['pagibig'] ?? 0) + ($payroll['withholding_tax'] ?? 0) + ($payroll['sss_loan'] ?? 0) + ($payroll['hdmf_loan'] ?? 0) + ($payroll['atm_deposit'] ?? 0) + ($payroll['cash_advance'] ?? 0), 2),
            
            // Allowances
            'marketing_allowance' => round($payroll['marketing_allowance'] ?? 0, 2),
            
            // Net
            'net_salary' => round($payroll['net_salary'] ?? ($grossPay - (($payroll['sss'] ?? 0) + ($payroll['philhealth'] ?? 0) + ($payroll['pagibig'] ?? 0) + ($payroll['withholding_tax'] ?? 0) + ($payroll['sss_loan'] ?? 0) + ($payroll['hdmf_loan'] ?? 0) + ($payroll['atm_deposit'] ?? 0) + ($payroll['cash_advance'] ?? 0)) + ($payroll['marketing_allowance'] ?? 0)), 2),
            
            // Status
            'status' => $payroll['status'] ?? 'Pending',
            'approved_by' => $payroll['approved_by'] ?? null,
            'approved_at' => $payroll['approved_at'] ?? null
        ];
        
    } elseif ($isAdminStaff) {
        // ADMIN PAYSLIP DATA
        $basicSalary = $payroll['base_salary'] ?? $payroll['gross_salary'] ?? 0;
        $overtimePay = $payroll['overtime_pay'] ?? 0;
        $undertimeDeduction = $payroll['undertime_deduction'] ?? 0;
        $absencesDeduction = ($payroll['absences'] ?? 0) * (($payroll['base_salary'] ?? 0) / 22);
        
        $grossEarnings = $basicSalary + $overtimePay - $undertimeDeduction - $absencesDeduction;
        
        $payslipData = [
            'type' => 'admin',
            'payroll_id' => $payroll['id'],
            'employee_id' => $payroll['employee_id'],
            'employee_code' => $payroll['emp_code'] ?? 'ADM' . $payroll['employee_id'],
            'employee_name' => $payroll['full_name'],
            'position' => $payroll['position'] ?? 'Admin Staff',
            'period_start' => $periodStart,
            'period_end' => $periodEnd,
            'period_display' => $payroll['period'] ?? date('F j, Y', strtotime($periodStart)) . ' - ' . date('F j, Y', strtotime($periodEnd)),
            'payslip_date' => date('F j, Y'),
            
            // Admin specific
            'basic_salary' => round($basicSalary, 2),
            'overtime_pay' => round($overtimePay, 2),
            'undertime_deduction' => round($undertimeDeduction, 2),
            'absences_deduction' => round($absencesDeduction, 2),
            'gross_earnings' => round($grossEarnings, 2),
            
            // Deductions
            'sss' => round($payroll['sss'] ?? 0, 2),
            'philhealth' => round($payroll['philhealth'] ?? 0, 2),
            'pagibig' => round($payroll['pagibig'] ?? 0, 2),
            'wtax' => round($payroll['withholding_tax'] ?? 0, 2),
            'sss_loan' => round($payroll['sss_loan'] ?? 0, 2),
            'hdmf_loan' => round($payroll['hdmf_loan'] ?? 0, 2),
            'atm_deposit' => round($payroll['atm_deposit'] ?? 0, 2),
            'cash_advance' => round($payroll['cash_advance'] ?? 0, 2),
            'total_deductions' => round(($payroll['sss'] ?? 0) + ($payroll['philhealth'] ?? 0) + ($payroll['pagibig'] ?? 0) + ($payroll['withholding_tax'] ?? 0) + ($payroll['sss_loan'] ?? 0) + ($payroll['hdmf_loan'] ?? 0) + ($payroll['atm_deposit'] ?? 0) + ($payroll['cash_advance'] ?? 0), 2),
            
            // Allowances
            'transpo_allowance' => round($payroll['transpo_allowance'] ?? 0, 2),
            'marketing_allowance' => round($payroll['marketing_allowance'] ?? 0, 2),
            
            // Net
            'net_salary' => round($payroll['net_salary'] ?? ($grossEarnings - (($payroll['sss'] ?? 0) + ($payroll['philhealth'] ?? 0) + ($payroll['pagibig'] ?? 0) + ($payroll['withholding_tax'] ?? 0) + ($payroll['sss_loan'] ?? 0) + ($payroll['hdmf_loan'] ?? 0) + ($payroll['atm_deposit'] ?? 0) + ($payroll['cash_advance'] ?? 0)) + ($payroll['transpo_allowance'] ?? 0) + ($payroll['marketing_allowance'] ?? 0)), 2),
            
            // Status
            'status' => $payroll['status'] ?? 'Pending',
            'approved_by' => $payroll['approved_by'] ?? null,
            'approved_at' => $payroll['approved_at'] ?? null
        ];
        
    } elseif ($isGuard) {
        // GUARD PAYSLIP DATA
        $dailyRate = $payroll['rate_guard'] ?? 433;
        $daysWorked = $payroll['days_worked'] ?? 22;
        $grossEarnings = $dailyRate * $daysWorked;
        
        $payslipData = [
            'type' => 'guard',
            'payroll_id' => $payroll['id'],
            'employee_id' => $payroll['employee_id'],
            'employee_code' => $payroll['emp_code'] ?? 'GRD' . $payroll['employee_id'],
            'employee_name' => $payroll['full_name'],
            'position' => $payroll['position'] ?? 'Security Guard',
            'period_start' => $periodStart,
            'period_end' => $periodEnd,
            'period_display' => $payroll['period'] ?? date('F j, Y', strtotime($periodStart)) . ' - ' . date('F j, Y', strtotime($periodEnd)),
            'payslip_date' => date('F j, Y'),
            
            // Guard specific
            'daily_rate' => round($dailyRate, 2),
            'days_worked' => round($daysWorked, 2),
            'gross_earnings' => round($grossEarnings, 2),
            
            // Deductions
            'sss' => round($payroll['sss'] ?? 0, 2),
            'philhealth' => round($payroll['philhealth'] ?? 0, 2),
            'pagibig' => round($payroll['pagibig'] ?? 0, 2),
            'wtax' => round($payroll['withholding_tax'] ?? 0, 2),
            'total_deductions' => round(($payroll['sss'] ?? 0) + ($payroll['philhealth'] ?? 0) + ($payroll['pagibig'] ?? 0) + ($payroll['withholding_tax'] ?? 0), 2),
            
            // Net
            'net_salary' => round($payroll['net_salary'] ?? ($grossEarnings - (($payroll['sss'] ?? 0) + ($payroll['philhealth'] ?? 0) + ($payroll['pagibig'] ?? 0) + ($payroll['withholding_tax'] ?? 0))), 2),
            
            'status' => $payroll['status'] ?? 'Pending'
        ];
        
    } elseif ($isSA) {
        // STUDENT ASSISTANT PAYSLIP DATA
        $hourlyRate = $payroll['rate_sa'] ?? 100;
        $hoursWorked = $payroll['hours_worked'] ?? 80;
        $grossEarnings = $hourlyRate * $hoursWorked;
        
        $payslipData = [
            'type' => 'sa',
            'payroll_id' => $payroll['id'],
            'employee_id' => $payroll['employee_id'],
            'employee_code' => $payroll['emp_code'] ?? 'SA' . $payroll['employee_id'],
            'employee_name' => $payroll['full_name'],
            'position' => $payroll['position'] ?? 'Student Assistant',
            'period_start' => $periodStart,
            'period_end' => $periodEnd,
            'period_display' => $payroll['period'] ?? date('F j, Y', strtotime($periodStart)) . ' - ' . date('F j, Y', strtotime($periodEnd)),
            'payslip_date' => date('F j, Y'),
            
            // SA specific
            'hourly_rate' => round($hourlyRate, 2),
            'hours_worked' => round($hoursWorked, 2),
            'gross_earnings' => round($grossEarnings, 2),
            
            // Deductions (minimal for SA)
            'pagibig' => round($payroll['pagibig'] ?? 0, 2),
            'total_deductions' => round($payroll['pagibig'] ?? 0, 2),
            
            // Net
            'net_salary' => round($payroll['net_salary'] ?? ($grossEarnings - ($payroll['pagibig'] ?? 0)), 2),
            
            'status' => $payroll['status'] ?? 'Pending'
        ];
    } else {
        jsonError('Unknown employee type for payslip generation', 400);
    }
    
    // Add QR code data (for verification)
    $payslipData['qr_data'] = json_encode([
        'payroll_id' => $payslipData['payroll_id'],
        'employee_id' => $payslipData['employee_id'],
        'employee_name' => $payslipData['employee_name'],
        'period' => $payslipData['period_display'],
        'net_salary' => $payslipData['net_salary'],
        'verified_at' => date('Y-m-d H:i:s')
    ]);
    
    echo json_encode([
        'success' => true,
        'data' => $payslipData
    ]);
    
} catch (PDOException $e) {
    jsonError('Database error: ' . $e->getMessage(), 500);
} catch (Exception $e) {
    jsonError('Server error: ' . $e->getMessage(), 500);
}
?>