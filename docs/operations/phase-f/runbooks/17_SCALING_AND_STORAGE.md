# Runbook — Scaling & Storage Maintenance

| Field | Value |
|-------|-------|
| **Purpose** | Scale the current Vercel + Supabase architecture; maintain storage |
| **Scope** | App compute, DB, Storage buckets |
| **Audience** | Ops, eng |
| **Prerequisites** | Billing access to Vercel/Supabase |
| **Version** | 1.0.0 |

---

## Procedures — Scaling

### Application (Vercel)
1. Confirm function timeouts/memory in project settings if large exports fail.  
2. Rely on serverless concurrency; no container replicas in-repo.  
3. Use ISR/static caching only where Next config already allows (Phase C.1).  
4. Split heavy jobs to cron/queues rather than request path.

### Database (Supabase)
1. Watch connection count → enable/use pooler.  
2. Upgrade compute add-on when CPU/IO sustained high.  
3. Add indexes via migrations (eng) after EXPLAIN.  
4. Avoid service-role full scans from app paths.

### Rate limiting
In-memory limiter does **not** scale across instances — plan Redis/Upstash (Phase B) before abuse-sensitive launches.

---

## Procedures — Storage maintenance

1. Inventory buckets (e.g. admissions docs, `student-documents`).  
2. Confirm policies private; signed URLs only.  
3. Review orphaned objects quarterly.  
4. Align deletion with retention policy (`17_COMPLIANCE_DOCUMENTATION.md`).  
5. Monitor Storage size in Supabase dashboard.

## Troubleshooting

| Issue | Action |
|-------|--------|
| 429 / abuse | Durable rate limit project |
| Storage 403 | Policies + permissions |
| DB connections exhausted | Pooler + reduce server clients |

## Related documents

- `16_PERFORMANCE_TROUBLESHOOTING.md`
- `docs/security/phase-b/SECURITY_REPORT.md`

## Version history

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | 2026-07-17 | Initial |
