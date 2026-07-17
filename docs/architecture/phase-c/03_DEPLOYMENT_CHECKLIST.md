# 03 — Deployment Checklist

**Phase:** C · **Date:** 2026-07-17  
**Companions:** `docs/operations/phase-f/runbooks/12_DEPLOYMENT.md` · `docs/launch/PRODUCTION_ENV.md` · Security checklist B.1

---

## Pre-deploy

- [ ] CI green on target commit (lint, typecheck, build, unit, integration, smoke, migration presence)
- [ ] `npm audit --omit=dev` reviewed (no Critical; document Moderate acceptances)
- [ ] Production env vars set per `PRODUCTION_ENV.md` / env schema
- [ ] `ALLOW_SQUARE_PLANNED` unset
- [ ] `ALLOW_EXEC_DEMO_MODE` unset (unless signed exception)
- [ ] `ENFORCE_MFA=true` (or exception recorded)
- [ ] Privileged users MFA-enrolled (sample check)
- [ ] Backup / PITR confirmed on Supabase plan
- [ ] Note current Vercel deployment ID for rollback
- [ ] Migrations `171` + `172` plan: apply **before** or coordinated with app (prefer before if additive)

## Deploy

- [ ] Merge / promote to production channel
- [ ] Vercel build Ready
- [ ] Apply migrations; verify `supabase migration list` shows 171 and 172
- [ ] Hit `/api/health` → `ok`
- [ ] Hit `/api/ready` → `ready` (must not list missing secrets)

## Post-deploy smoke

- [ ] Login + password-reset exempt paths behave
- [ ] Non-privileged user cannot open `/exec` or finance without permission
- [ ] Org A user cannot read Org B school-scoped row (manual or scripted RLS)
- [ ] Cron: `Authorization: Bearer $CRON_SECRET` on `/api/platform/process-queues` succeeds
- [ ] Cron without secret and without permission → 401/403
- [ ] Security headers present (CSP/HSTS) on production URL
- [ ] Attach evidence to `docs/architecture/phase-a/H-A9_OPS_GATE_EVIDENCE.md` §3

## Rollback

- [ ] Instant: revert Vercel deployment to prior ID
- [ ] Data: PITR/restore per `13_DATABASE_BACKUP_RESTORE.md` (coordinate with incident lead)
- [ ] Do not rewrite applied migrations — forward-fix only

## Sign-off

| Role | Name | Date | Go? |
|------|------|------|-----|
| Engineering | | | |
| Security / Ops | | | |
| Product (claims) | | | Bound by Production Intelligence Contract |
