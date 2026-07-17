# Runbook — Performance Troubleshooting

| Field | Value |
|-------|-------|
| **Purpose** | Diagnose slow pages, API timeouts, DB pressure |
| **Scope** | Vercel functions, Supabase, client UX |
| **Audience** | Engineers, ops |
| **Prerequisites** | Vercel analytics/logs; Supabase metrics; Phase C.1 docs |
| **Version** | 1.0.0 |

---

## Procedures

1. Confirm scope: one route vs global.  
2. Check Vercel: function duration, region, error rate.  
3. Check Supabase: CPU, connections, slow queries.  
4. Reproduce with staff account; note permissions (RLS cost).  
5. Review recent deploys / migrations / large exports.  
6. Mitigate: rollback, disable heavy cron, reduce export size, add indexes (eng change).  
7. Reference: `docs/product/PERFORMANCE_PHASE_C1_REPORT.md`, `docs/architecture/CACHING_STRATEGY.md`.

## Common causes

| Symptom | Likely cause |
|---------|--------------|
| Slow dashboard | N+1 queries; large widgets; cold start |
| Export timeout | Unbounded result set |
| Portal lag | Heavy client render; missing loading states |
| DB high CPU | Missing index; sequential scans; service-role scans |

## Scaling notes (current)

- Horizontal: Vercel serverless scales with traffic.  
- DB: Supabase plan upgrade / connection pooling (Supabase pooler).  
- Rate limit is in-memory — not a scaling control plane.  
- No Docker/K8s scaling runbook — not the deploy model.

## Related documents

- `../13_MONITORING_AND_OPERATIONS.md`
- `docs/product/SCALABILITY_HARDENING_C1.md`

## Version history

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | 2026-07-17 | Initial |
