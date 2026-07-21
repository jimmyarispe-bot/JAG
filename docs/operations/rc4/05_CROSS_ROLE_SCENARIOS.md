# RC-4 — Cross-Role Scenarios

## XR-1 Lead → Billing

Paths: Admissions → Students → Scheduling → Teacher → Portal progress → Portal finance → Finance staff.

| Step | Actor | Validation |
|------|-------|------------|
| 1 | School Leader | Lead created / advanced |
| 2 | Admissions | Decision / enrollment handoff |
| 3 | SIS | Student record exists |
| 4 | Scheduling | Section/session assigned |
| 5 | Teacher | Attendance / progress written |
| 6 | Parent | Sees progress + invoice |
| 7 | Finance / Exec | Metrics reflect activity |

**Automated today:** path existence only. **Behavioral:** staging required.

## XR-2 Teacher → Parent → Exec

Teacher updates progress → Parent `/portal/progress` → Executive `/dashboard/executive` / `/exec`.

## XR-3 Finance → Exec metrics

Staff finance action → FI / executive KPIs refresh (or next probe).

## XR-4 Integration → Audit

Integration sync (or simulated) → `/exec/integrations` health → `/dashboard/admin/audit` or security events.
