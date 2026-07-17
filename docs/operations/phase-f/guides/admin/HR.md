# Administrator Guide — HR / Workforce

| Field | Value |
|-------|-------|
| **Purpose** | Manage employees, leave, and HR workflows |
| **Scope** | `/dashboard/hr`, employee profiles |
| **Audience** | HR staff |
| **Prerequisites** | `hr.view` / `hr.manage` (not role-name bypass) |
| **Version** | 1.0.0 |

## Procedures

### Configuration
- HR settings in configuration studio when permitted.  
- Employee self-service: `/dashboard/employee` (linked employee record required).

### Daily operations
1. `/dashboard/hr` tabs — roster, leave, onboarding, payroll UI as available.  
2. Employee profile `/dashboard/hr/employees/[employeeId]`.  
3. Approve/deny leave with ownership rules.  
4. Coordinate payroll exports with finance; treat files as confidential.

### Best practices
- Minimize PII in notes.  
- Confirm school-scoped payroll visibility (migration 171).  
- Use clear status labels for candidates/employees.

## Troubleshooting

| Issue | Action |
|-------|--------|
| HR module missing | Permission gate |
| Self-service IDOR suspicion | Stop; escalate security |
| Form label issues | Known UX gap — use keyboard carefully; report to eng |

## Related documents

- `docs/ux/phase-d/05_ACCESSIBILITY_ASSESSMENT.md`
- Employee user guide

## Version history

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | 2026-07-17 | Initial |
