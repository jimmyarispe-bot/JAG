# Runbook — Queue Recovery

| Field | Value |
|-------|-------|
| **Purpose** | Recover stuck platform automation queues |
| **Scope** | `/api/platform/process-queues` and related admissions processors |
| **Audience** | On-call engineers |
| **Prerequisites** | `CRON_SECRET` or `mission_control.access`; Supabase read |
| **Version** | 1.0.0 |

---

## Normal operation

- Vercel Cron: `0 0 * * *` (daily midnight UTC) → `GET /api/platform/process-queues`  
- Handler: `processAllPlatformQueues` (`src/lib/platform/automation/process-queues.ts`)  
- Auth: Bearer `CRON_SECRET` **or** authenticated user with `mission_control.access`

---

## Procedures — Manual drain

1. Confirm `CRON_SECRET` in environment.  
2. Call:

```bash
curl -X POST "$APP_URL/api/platform/process-queues" \
  -H "Authorization: Bearer $CRON_SECRET"
```

3. Expect `{ "success": true, "processedAt": "..." }`.  
4. If fails: inspect Vercel function logs; check Supabase errors.  
5. Optionally process admissions communications: `/api/admissions/process-communications`.

## Procedures — Stuck jobs

1. Identify failing queue rows/tables via Supabase (automation schema per migrations).  
2. Fix underlying data/permission error.  
3. Re-run manual drain.  
4. If poison message: quarantine per engineering guidance (do not delete audit trails casually).

## Storage maintenance

- Review Supabase Storage usage for `student-documents` / admissions buckets.  
- Confirm signed URL flows still authorize.  
- No automated GC script in repo — use Supabase dashboards + org retention policy (`17_COMPLIANCE_DOCUMENTATION.md`).

---

## Troubleshooting

| Issue | Action |
|-------|--------|
| 401 | Secret missing/wrong |
| 200 but no effect | Check queue empty vs processor no-op; review code paths |
| Timeout | Reduce batch / check parallel waves in process-queues |

## Related documents

- `../03_API_DOCUMENTATION.md`
- `../13_MONITORING_AND_OPERATIONS.md`

## Version history

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | 2026-07-17 | Initial |
