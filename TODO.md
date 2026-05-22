# TODO

## Employee View/Edit Sync - Assignment + Status/Hire/Department
- [x] Update `view-employee.html` to include Employee Assignment display section with IDs: `viewAssignment`, `viewRateShs`, `viewRateCollege`, `viewRateAdmin`.
- [x] Update `js/view-employee.js` to populate department/hire date into the existing spans and populate assignment section fields.
- [x] Update `js/view-employeeSadmin.js` to inject Status + Hire Date and Employee Assignment fields (all rates/subjects) into `#employeeDetails`.
- [x] Add Employee Assignment section to `edit-employee.html` form HTML (Accountant edit) with inputs: `assignmentType`, `shsRate`, `shsSubjects`, `collegeRate`, `collegeSubjects`, `adminRate`, `adminPosition`, `guardRate`, `saRate`.
- [x] Update `js/edit-employee.js` to populate: department, hireDate, status and assignment fields; include assignment fields in PUT payload.
- [ ] Add Employee Assignment section to `edit-employeeSadmin.html` form HTML (Superadmin edit) with the same assignment inputs.
- [ ] Update `js/edit-employeeSadmin.js` to populate department/hireDate/status and all assignment fields; include assignment fields in PUT payload.

## Verification
- [ ] Manually load view/edit pages for a sample employee and confirm values render and edits persist.

