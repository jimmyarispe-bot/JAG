# API Security Report — Phase B

## Route inventory (approx.)

~28 App Router handlers under `src/app/api`. Public: health, ready, selected docs. Protected: exports, cron, scholarship, intelligence context, etc.

## Findings

| ID | Severity | Finding |
|----|----------|---------|
| API-01 | High | Rate limiting only on scholarship; in-memory; keyed by client `x-forwarded-for` |
| API-02 | High | Export routes accept caller `schoolId` after coarse permission — IDOR if RLS regresses |
| API-03 | High | Intelligence context route accepts arbitrary org/school/student IDs |
| API-04 | Medium | No shared DTO validation library (Zod/etc.) across APIs |
| API-05 | Medium | Inconsistent error shapes; risk of info leakage in messages |
| API-06 | Medium | No API versioning strategy for mobile/BFF |
| API-07 | Medium | Missing global security headers (CSP, HSTS, etc.) |
| API-08 | Low | Pagination/filter limits inconsistently enforced |

## Server Actions

Mutating admissions portal actions often omit explicit auth asserts (RLS-only). Staff acceptance checks must verify actor permission + school scope in application code.

## Recommendations

1. Central `guardApiRoute` + **scope resolver** (allowed school IDs from identity).  
2. Durable rate limit (KV/Redis) in middleware for `/api/*` and public RPCs.  
3. Origin/CSRF checks for state-changing POSTs/actions.  
4. Schema validation on all write bodies.  
5. Never use service-role client in request path without explicit break-glass.  
