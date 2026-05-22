console.log("EDIT EMPLOYEE JS LOADED");

window.addEventListener("DOMContentLoaded", async () => {
    // Initialize database
    await Database.ensureDatabaseReady();

    // Get employee ID from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const employeeId = parseInt(urlParams.get('id'));

    if (!employeeId) {
        alert("Employee ID not provided");
        window.location.href = "employees.html";
        return;
    }

    // Load employee data
    const employee = await Database.getEmployeeById(employeeId);

    if (!employee) {
        alert("Employee not found");
        window.location.href = "employees.html";
        return;
    }

    // Populate form with employee data
    document.getElementById("employeeId").value = employee.id;
    document.getElementById("fullName").value = employee.full_name || '';
    document.getElementById("position").value = employee.position || '';
    document.getElementById("employmentType").value = employee.employment_type || '';
    document.getElementById("salary").value = employee.base_salary || '';
    document.getElementById("email").value = employee.email || '';
    document.getElementById("status").value = employee.status || '';
    
    // Personal Information
    document.getElementById("phone").value = employee.phone || '';
    document.getElementById("birthDate").value = employee.birth_date || '';
    
    // Employment Details
    document.getElementById("department").value = employee.department || '';
    document.getElementById("hireDate").value = employee.hire_date || '';

    // Employee Assignment
    const assignmentType = employee.assignment || 'shs_only';
    if (document.getElementById('assignmentType')) {
        document.getElementById('assignmentType').value = assignmentType;
        if (typeof toggleAssignmentFields === 'function') toggleAssignmentFields();
    }

    if (document.getElementById('shsRate')) document.getElementById('shsRate').value = employee.rate_shs ?? '';
    if (document.getElementById('shsSubjects')) {
        const shsSubjects = Array.isArray(employee.subjects_shs)
            ? employee.subjects_shs.join(', ')
            : (employee.shsSubjects || employee.shs_subjects || '');
        document.getElementById('shsSubjects').value = shsSubjects || '';
    }

    if (document.getElementById('collegeRate')) document.getElementById('collegeRate').value = employee.rate_college ?? '';
    if (document.getElementById('collegeSubjects')) {
        const collegeSubjects = Array.isArray(employee.subjects_college)
            ? employee.subjects_college.join(', ')
            : (employee.collegeSubjects || employee.college_subjects || '');
        document.getElementById('collegeSubjects').value = collegeSubjects || '';
    }

    if (document.getElementById('adminRate')) document.getElementById('adminRate').value = employee.rate_admin ?? '';
    if (document.getElementById('adminPosition')) document.getElementById('adminPosition').value = employee.admin_position || employee.adminPosition || '';

    if (document.getElementById('guardRate')) document.getElementById('guardRate').value = employee.rate_guard ?? '';
    if (document.getElementById('saRate')) document.getElementById('saRate').value = employee.rate_sa ?? '';

    // Compensation
    document.getElementById("hourlyRate").value = employee.hourly_rate || '';
    document.getElementById("adminPayRate").value = employee.admin_pay_rate || '';

    
    // Government Numbers
    document.getElementById("sss").value = employee.sss || '';
    document.getElementById("philhealth").value = employee.philhealth || '';
    document.getElementById("pagibig").value = employee.pagibig || '';
    document.getElementById("tin").value = employee.tin || '';
    
    // Emergency Contact
    document.getElementById("emergencyName").value = employee.emergency_name || '';
    document.getElementById("emergencyRelation").value = employee.emergency_relation || '';
    document.getElementById("emergencyPhone").value = employee.emergency_phone || '';

    // DROPDOWN - Employment Type
    const empTypeInput = document.getElementById("employmentType");
    const dropdownMenu = document.getElementById("dropdownMenu");

    if (empTypeInput && dropdownMenu) {
        empTypeInput.addEventListener("click", () => {
            dropdownMenu.style.display =
                dropdownMenu.style.display === "block" ? "none" : "block";
        });

        document.addEventListener("click", (e) => {
            if (!empTypeInput.contains(e.target) && !dropdownMenu.contains(e.target)) {
                dropdownMenu.style.display = "none";
            }
        });
    }

    window.selectType = function(type) {
        document.getElementById("employmentType").value = type;
        dropdownMenu.style.display = "none";
    };

    // DROPDOWN - Status
    const statusInput = document.getElementById("status");
    const statusMenu = document.getElementById("statusMenu");

    if (statusInput && statusMenu) {
        statusInput.addEventListener("click", () => {
            statusMenu.style.display =
                statusMenu.style.display === "block" ? "none" : "block";
        });

        document.addEventListener("click", (e) => {
            if (!statusInput.contains(e.target) && !statusMenu.contains(e.target)) {
                statusMenu.style.display = "none";
            }
        });
    }

    window.selectStatus = function(status) {
        document.getElementById("status").value = status;
        statusMenu.style.display = "none";
    };

    // FORM SUBMIT
    const form = document.getElementById("employeeForm");

    if (!form) {
        console.error("Form not found");
        return;
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        console.log("FORM SUBMITTED");

        const id = parseInt(document.getElementById("employeeId").value);
        const full_name = document.getElementById("fullName").value.trim();
        const position = document.getElementById("position").value.trim();
        const employment_type = document.getElementById("employmentType").value;
        const base_salary = document.getElementById("salary").value;
        const email = document.getElementById("email").value.trim();
        const status = document.getElementById("status").value;

        // Validation
        if (!full_name || !position || !employment_type || !base_salary || !email || !status) {
            alert("Please fill in all required fields");
            return;
        }

        // Create updated employee object with all fields
        const updatedEmployee = {

            id,
            full_name,
            position,
            employment_type,
            base_salary: parseFloat(base_salary),
            email,
            status,
            // Personal Information
            phone: document.getElementById("phone").value || '',
            birth_date: document.getElementById("birthDate").value || null,
            // Employment Details
            department: document.getElementById("department").value || '',
            hire_date: document.getElementById("hireDate").value || '',
            // Compensation
            hourly_rate: parseFloat(document.getElementById("hourlyRate").value) || 0,
            admin_pay_rate: parseFloat(document.getElementById("adminPayRate").value) || 0,

            // Employee Assignment
            assignment: document.getElementById('assignmentType')?.value || employee.assignment || 'shs_only',
            rate_shs: parseFloat(document.getElementById('shsRate')?.value) || 0,
            subjects_shs: document.getElementById('shsSubjects')?.value?.split(',').map(s => s.trim()).filter(Boolean) || [],
            rate_college: parseFloat(document.getElementById('collegeRate')?.value) || 0,
            subjects_college: document.getElementById('collegeSubjects')?.value?.split(',').map(s => s.trim()).filter(Boolean) || [],
            rate_admin: parseFloat(document.getElementById('adminRate')?.value) || 0,
            admin_position: document.getElementById('adminPosition')?.value || '',
            rate_guard: parseFloat(document.getElementById('guardRate')?.value) || 0,
            rate_sa: parseFloat(document.getElementById('saRate')?.value) || 0,

            // Government Numbers
            sss: document.getElementById("sss").value || '',
            philhealth: document.getElementById("philhealth").value || '',
            pagibig: document.getElementById("pagibig").value || '',
            tin: document.getElementById("tin").value || '',
            // Emergency Contact
            emergency_name: document.getElementById("emergencyName").value || '',
            emergency_relation: document.getElementById("emergencyRelation").value || '',
            emergency_phone: document.getElementById("emergencyPhone").value || ''
        };


        try {
            // Update in database (both local IndexedDB and server API)
            // First, update in IndexedDB for offline support
            await Database.updateEmployee(updatedEmployee);
            
            // Then, sync to server API if available
            try {
                const response = await fetch('/api/employees.php', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify(updatedEmployee)
                });
                
                if (!response.ok) {
                    console.warn("API update failed with status:", response.status);
                    // Continue anyway - local IndexedDB was updated successfully
                }
            } catch (apiError) {
                console.warn("Could not sync to server API:", apiError);
                // Continue anyway - local IndexedDB was updated successfully
            }
            
            alert("Employee updated successfully!");
            window.location.href = "employees.html";
        } catch (error) {
            console.error("Error updating employee:", error);
            alert("Error updating employee. Please try again.");
        }
    });
});

