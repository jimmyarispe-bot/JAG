# 04 — Operations Runbook (Phase C index)

**Phase:** C · **Date:** 2026-07-17  
**Rule:** Prefer existing Phase F runbooks — this document is the Phase C entrypoint.

---

## Canonical runbooks

| Topic | Path |
|-------|------|
| Deployment & rollback | `docs/operations/phase-f/runbooks/12_DEPLOYMENT.md` |
| Database backup / restore | `docs/operations/phase-f/runbooks/13_DATABASE_BACKUP_RESTORE.md` |
| Secrets & certificates | `docs/operations/phase-f/runbooks/14_SECRETS_AND_CERTIFICATES.md` |
| Queue recovery | `docs/operations/phase-f/runbooks/15_QUEUE_RECOVERY.md` |
| Incident response | `docs/operations/phase-f/runbooks/11_INCIDENT_RESPONSE.md` |
| Performance troubleshooting | `docs/operations/phase-f/runbooks/16_PERFORMANCE_TROUBLESHOOTING.md` |
| Scaling / storage | `docs/operations/phase-f/runbooks/17_SCALING_AND_STORAGE.md` |
| DR plan | `docs/operations/phase-f/10_DISASTER_RECOVERY_PLAN.md` |

---

## Probes

| Probe | Path | Expect |
|-------|------|--------|
| Liveness | `GET /api/health` | `{"status":"ok"}` |
| Readiness | `GET /api/ready` | `{"status":"ready"}`; production also requires `CRON_SECRET`, `VAULT_ENCRYPTION_KEY`, `RESEND_API_KEY`, `NEXT_PUBLIC_APP_URL` |

---

## Security ops loop

1. Apply migrations through **172** (authority: `supabase/migrations/`).  
2. Complete `docs/security/phase-b1/07_PRODUCTION_SECURITY_CHECKLIST.md`.  
3. Record evidence in `docs/architecture/phase-a/H-A9_OPS_GATE_EVIDENCE.md`.  
4. Re-run cross-tenant RLS spot checks after every security migration.

---

## On-call quick actions

| Symptom | First action |
|---------|--------------|
| 503 ready | Check missing env from response body |
| Cron silent | Verify `CRON_SECRET` + Vercel cron schedule |
| Auth cascade 403 | Check permission catalog / role grants — not role-string hacks |
| Suspected tenant leak | Disable suspect route; pull activity/audit; verify RLS policies for table |
| Vault decrypt fail | Confirm `VAULT_ENCRYPTION_KEY` length/rotation — do not fall back to service role |

---

## Logging & errors

- Prefer platform activity / events for audited mutations.  
- Do not log secret values (env validator already redacts).  
- Client errors: avoid leaking stack traces in production responses.
