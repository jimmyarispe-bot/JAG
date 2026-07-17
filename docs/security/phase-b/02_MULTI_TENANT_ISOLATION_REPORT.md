# Multi-Tenant Isolation Report — Phase B

## Isolation model

Primary key is **school** (`can_access_school`) plus **organization** membership overlays (Sprint 002+). Parents use `is_parent_of_student` / guardian–family links. Students use `students.user_id` self-link.

## Cross-tenant test status

| Test type | Status |
|-----------|--------|
| In-memory IAM/org isolation unit tests | Present |
| Live Supabase cross-org RLS attack suite | **Missing** |
| Export API foreign-`schoolId` negative tests | **Missing** |
| Parent vs non-linked student negative tests | Partial (app asserts exist; DB suite incomplete) |

## Entity isolation assessment

| Entity | Isolation mechanism | Risk |
|--------|---------------------|------|
| Organizations / schools | Membership + school access | Medium — verify org overlays |
| Students / families | `sis_student_policy` / parent helpers | Medium |
| Employees / payroll | `171` permission + self | **Depends on 171 applied** |
| Finance invoices/payments | Finance policies + guardian | Medium — confirm guardian insert limits |
| Financial transactions / forecasts / allocations | `can_access_school` without finance perm | **High** |
| FI / executive `rpt_*` views | View owner privileges | **Critical/High** if security_invoker absent |
| Admissions | School-scoped + public RPC | High (public abuse) |
| Attendance / scheduling | School + permission | Medium |
| Documents | Path + RLS | Medium — student-documents policies missing |
| Messages | Parent/staff policies | Medium — mutable parent updates |
| Notifications | User-scoped | Lower |
| Audit logs | Permission-gated | Medium |
| PAJ / ULR | Fixed in `171` | **Critical if unapplied** |
| Platform notes/relationships | Null school_id / weak org check | **High** |
| Executive / Knowledge Graph | Mostly in-memory / scoped loaders | Medium — AI context IDOR |

## Required isolation proof before Phase C

For each entity class above, run as User@OrgA attempting:

1. Direct table select of OrgB row IDs  
2. Server Action / API with OrgB `schoolId`  
3. Parent accessing non-linked student  
4. Student accessing peer PAJ progress  

All must return empty / 403. Automate in `tests/integration/rls-cross-tenant.test.ts` against a seeded multi-tenant DB.
