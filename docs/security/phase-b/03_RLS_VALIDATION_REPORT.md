# RLS Validation Report — Phase B

## Remediated (source migrations) — verify applied

| Item | Bad migration | Fix migration |
|------|---------------|---------------|
| PAJ `using (true)` | `154` | `171` |
| ULR open writes | `150` | `171` |
| Payroll school-wide | `057` | `171` |

**Action:** Confirm `171` applied in every environment before closing Critical PAJ/ULR/payroll findings.

## Open Critical / High RLS findings

| ID | Severity | Finding | Evidence |
|----|----------|---------|----------|
| RLS-01 | Critical/High | FI / executive report views lack `security_invoker` — may bypass base-table finance RLS | `102`, `094`, other `rpt_*` |
| RLS-02 | High | `financial_transactions`, `budget_forecast_snapshots`, `payroll_cost_allocations` use school access without finance/payroll permission | `089` |
| RLS-03 | High | Migration `058` grants broad SELECT/CRUD defaults to anon/authenticated | `058_api_grants_and_schema_reload.sql` |
| RLS-04 | High | Platform relationships/notes/activity allow weak org / null-school writes | `133` |
| RLS-05 | High | Parent portal medical alerts / services / funding without classification gates | `091` |
| RLS-06 | High | Portal form templates readable cross-school with `portal.forms.submit` | `091` |
| RLS-07 | High | SpEd review reminders without `special_education` classification | `079` |

## Remaining `using (true)` patterns (review individually)

Not all are Critical — some are intentional catalog/public reference reads:

- ULR **select** catalog (acceptable if writes locked by `171`)  
- Config/certification/cloud catalog selects  
- Identity preference inserts  
- Grade funding programs  

Each must be classified: **catalog-OK** vs **tenant-data-BAD**.

## Storage RLS

| Bucket | Policies in migrations | Risk |
|--------|------------------------|------|
| Admissions | Yes, application-scoped | Medium (client metadata trust) |
| `student-documents` | **None found** | High — broken access or ad-hoc policies outside repo |

## Validation checklist

- [ ] `SELECT * FROM pg_policies` for PAJ/ULR/payroll matches `171`  
- [ ] All `rpt_*` recreated with `WITH (security_invoker = true)` or security barrier + RLS predicates  
- [ ] Revoke unnecessary anon grants from `058`  
- [ ] Storage policies for `student-documents` committed  
- [ ] Automated RLS negative tests green  
