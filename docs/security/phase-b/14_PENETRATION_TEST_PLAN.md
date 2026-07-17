# Penetration Test Plan — Phase B (Repeatable)

**Environment:** staging with two orgs (A/B), two schools each, seeded users with known permission sets.  
**Never** run destructive tests against production without change control.

## Preconditions

- [ ] Migration `171` applied  
- [ ] Seed: `org_a`, `org_b`, users: staff_A, staff_B, parent_A, parent_B, student_A, finance_A, teacher_A  
- [ ] Capture JWTs / cookie sessions per user  
- [ ] Service role key available only to test harness (not app under test)

## T1 — Authentication

| # | Test | Pass criteria |
|---|------|---------------|
| T1.1 | Valid login / logout | Session cleared; protected routes 401/redirect |
| T1.2 | Password reset | Token single-use; expired token rejected |
| T1.3 | Session expiry / refresh | Expired access denied; refresh rotates correctly |
| T1.4 | Brute force | Lockout or progressive delay after N failures |
| T1.5 | MFA (when enforced) | Staff without MFA cannot reach elevated routes |
| T1.6 | Token storage | No tokens in localStorage if cookie-only design |

## T2 — Authorization / privilege escalation

| # | Test | Pass criteria |
|---|------|---------------|
| T2.1 | Call each API with anon | 401 |
| T2.2 | Authenticated without permission | 403 |
| T2.3 | Role name spoofing in body | Ignored; permission engine decides |
| T2.4 | Server Action without cookie | Denied |
| T2.5 | Escalate via forged `schoolId` | Denied |

## T3 — Multi-tenant isolation

| # | Entity | Attack | Pass |
|---|--------|--------|------|
| T3.1 | Students | staff_A SELECT student_B | 0 rows / 403 |
| T3.2 | Families | parent_A read family_B | denied |
| T3.3 | Payroll | finance_A read org_B payroll | denied |
| T3.4 | Finance txns | school-access-only user read finance | denied |
| T3.5 | Documents | signed URL for other tenant object | 403 |
| T3.6 | Messages | cross-org thread | denied |
| T3.7 | Audit logs | org_B via org_A session | denied |
| T3.8 | Reports / dashboards | cross-school filters | denied |
| T3.9 | Executive / knowledge graph | org_B nodes | denied |
| T3.10 | AI context | pass org_B ids as staff_A | denied / empty |

## T4 — RLS direct (PostgREST / SQL as user JWT)

| # | Table/view | Pass |
|---|------------|------|
| T4.1 | Core tables as staff_A | only org_A |
| T4.2 | `rpt_*` views as school-access user | no finance leak |
| T4.3 | PAJ / ULR writes | no open write (post-171) |
| T4.4 | Storage `list` / `download` | private buckets deny |

## T5 — API abuse

| # | Test | Pass |
|---|------|------|
| T5.1 | Oversized body | 413 / reject |
| T5.2 | SQLi / NoSQLi in filters | no data leak |
| T5.3 | XSS in stored fields | encoded on render |
| T5.4 | Open redirect | only allowlisted hosts |
| T5.5 | Rate limit public inquiry | 429 after threshold |
| T5.6 | Pagination overflow | capped |

## T6 — Uploads / storage

| # | Test | Pass |
|---|------|------|
| T6.1 | Upload without auth | denied |
| T6.2 | Upload to other org path | denied |
| T6.3 | Path traversal in object key | sanitized / denied |
| T6.4 | Signed URL expiry | expired URL fails |
| T6.5 | Malware/type mismatch | content-type validated |

## T7 — Injection & classic OWASP

| # | Class | Method |
|---|-------|--------|
| T7.1 | SSRF | AI/webhook URLs — block private ranges |
| T7.2 | Command injection | no shell of user input |
| T7.3 | CSRF | mutate without CSRF/same-site fail |
| T7.4 | Clickjacking | `frame-ancestors` blocks iframe |

## Execution cadence

1. After Wave B.1 remediations  
2. Before Phase C  
3. Quarterly / major release  

## Evidence package

- Test script IDs + timestamps  
- Redacted request/response samples for failures  
- Retest log after each fix  

## Automation targets

`tests/security/` (to be added in Wave B.1): RLS SQL fixtures + API IDOR suite.  
