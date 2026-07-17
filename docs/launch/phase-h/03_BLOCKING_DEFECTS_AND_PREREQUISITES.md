# Blocking Defects & Prerequisites

Imported from Phase E / F / B.1 / C. Severity unchanged unless noted.

## Critical (block GA)

| ID | Source | Summary |
|----|--------|---------|
| E-001 | Phase E | No authenticated multi-role Playwright journeys |
| E-002 | Phase E | Live RLS two-org isolation not executed |
| E-003 | Phase E | Scheduling / attendance core workflows untested |
| E-004 | Phase E | API routes / Server Actions largely untested |
| C-SCALE | Phase C | Unbounded list loaders / no load-test evidence |
| F1-03 | Phase F | DR restore not evidenced |
| G-00 | Phase G | Soft-launch / pilot not executed |

## High (block GA unless formally waived)

| ID | Source | Summary |
|----|--------|---------|
| E-005 / E-006 | Phase E | Cross-browser / mobile not validated |
| E-007 | Phase E | Accessibility not certified |
| E-008 | Phase E | Performance regression not re-run |
| E-009 | Phase E | Recovery scenarios not tested |
| F1-01 / F1-02 | Phase F | Full action I/O + ERD / RLS matrix incomplete |
| F1-04 | Phase F | APM / alerting not wired |
| B1-RLS | Phase B.1 | Live JWT A/B RLS suite residual |

## Ops prerequisites (every environment)

1. Apply Supabase migrations including **`171`** and **`172`**  
2. Set production secrets per `docs/launch/PRODUCTION_ENV.md` (`CRON_SECRET`, `VAULT_ENCRYPTION_KEY`, `SENDGRID_*`, Supabase keys, `NEXT_PUBLIC_APP_URL`)  
3. Confirm cron schedule matches `vercel.json`  
4. Confirm `student-documents` bucket private + policies from 172  

## Required sequence before re-attempting Phase H

```
E.1 (test/reliability Critical) 
  → F.1 (ops High + DR evidence) 
  → G (pilot) 
  → H (GA re-score)
```

Skipping G after E/F failures is **not** an approved path to GA.
