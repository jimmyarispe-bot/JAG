# Prioritized Remediation Plan — Phase B

**Rule:** No Phase C until Critical + High closed and live multi-tenant RLS tests pass.  
**Rule:** Show findings before changes — this plan is the gate; implement only after approval.

## Wave B.1 — Critical / High (blockers)

| Order | ID | Action | Evidence of done |
|-------|-----|--------|------------------|
| 1 | SEC-RLS-01 | Apply & verify migration `171` on all envs | `supabase migration list` / SQL check |
| 2 | SEC-MT-01 | Add `security_invoker=true` (or rewrite) on `rpt_*` / sensitive views | RLS test: school-access user cannot SELECT finance via view |
| 3 | SEC-MT-02 | Finance RLS: require finance permissions + school scope | Policy tests for txns/forecasts/allocations |
| 4 | SEC-DATA-02 | Storage policies for private buckets + signed URL only | Upload/download denied without perm |
| 5 | SEC-PAY-01 | Disable or hard-fail `square_planned` parent payment path | No simulated settle in prod |
| 6 | SEC-AUTH-01 | Enforce MFA for staff / elevated perms (or org policy) | Login blocked without MFA when required |
| 7 | SEC-APP-01 | Secure headers: CSP, HSTS, frame-ancestors, etc. | Header scan green |
| 8 | SEC-API-01 | Durable rate limit (Redis/Upstash) on public + auth APIs | Abuse test fails after N |
| 9 | SEC-AUTH-02 | CAPTCHA + rate limit on admissions inquiry RPC | Public RPC cannot spam |
| 10 | SEC-APP-02 | Explicit permission asserts on portal/admissions Server Actions | Unit + e2e authz tests |
| 11 | SEC-API-02 | Membership check on every `schoolId`/`orgId` param | IDOR tests fail closed |
| 12 | SEC-API-03 | AI context: bind org/school/student to session membership | Cross-tenant AI context denied |
| 13 | SEC-SEC-01 | Split service-role vs user client; lint ban | No request path uses service role by default |
| 14 | SEC-DATA-01 | Parent medical/service DTO minimization | Parent cannot read restricted fields |
| 15 | SEC-PLAT-01 | Harden platform_notes/relationships RLS | Cross-org denied |
| 16 | — | Live RLS penetration suite (tenant A vs B) | Pen plan § RLS green |

## Wave B.2 — Medium

| ID | Action |
|----|--------|
| SEC-AUD-01 | Persist finance audit to DB + immutable retention |
| SEC-DEP-01 | Next upgrade when postcss fixed; CI audit gate |
| — | Account lockout / brute-force (Auth + app layer) |
| — | CSRF strategy for cookie sessions documented + tested |
| — | Audit log coverage matrix for critical actions |
| — | Privacy: retention/deletion/export jobs |

## Wave B.3 — Hardening

- Pen test execution + retest  
- Secrets: dedicated vault key, gitleaks CI  
- Dependency/license automation  
- MFA recovery / SSO readiness docs  

## Approval gate

Reply **`proceed Wave B.1`** (or list IDs) to implement remediations. Until then: documentation only.  
