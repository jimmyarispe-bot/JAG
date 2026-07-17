# Hypercare & Rollback Plan

Canonical procedures: `docs/operations/phase-f/14_RELEASE_OPERATIONS_MANUAL.md` and deployment/incident runbooks.

## Hypercare (post-GA only)

| Window | Coverage | Focus |
|--------|----------|-------|
| T+0 → T+72h | Eng + ops on-call | Auth, RLS anomalies, 5xx, cron, queues |
| T+3d → T+14d | Business hours + SEV paging | Tenant issues, data integrity, integrations |

## Rollback triggers

- Cross-tenant data exposure (SEV-1)  
- Auth outage > 15 minutes  
- Data corruption / failed migration without forward fix  
- Sustained 5xx above agreed SLO  

## Rollback actions

1. Promote previous Vercel deployment  
2. DB restore **only** if migration/data corruption requires it (coordinate with Supabase PITR)  
3. Disable failing cron if queue storm  
4. Incident record + customer notice  

## Pre-GA note

Hypercare staffing is **not** activated under NO-GO. Pilots use incident runbook only with explicit risk acceptance.
