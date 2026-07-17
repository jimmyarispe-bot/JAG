# Runbook — Deployment & Rollback

| Field | Value |
|-------|-------|
| **Purpose** | Deploy AcademyOS to Vercel production and roll back safely |
| **Scope** | App deploy; DB migrations coordinated separately |
| **Audience** | Engineers, release managers |
| **Prerequisites** | Vercel project linked to repo; Supabase access; env vars set |
| **Version** | 1.0.0 |

---

## Procedures — Deploy

### Pre-deploy

1. CI green on `main` (`.github/workflows/ci.yml`).  
2. Go/No-Go checklist in `../14_RELEASE_OPERATIONS_MANUAL.md`.  
3. Confirm production env vars (`PRODUCTION_ENV.md`).  
4. If schema changes: migrations reviewed and staged (prefer migrate **before** app if backward-compatible; otherwise expand/contract).  
5. Note current Vercel deployment ID for rollback.

### Deploy application

1. Merge to `main` (or promote release branch per org policy).  
2. Vercel builds (`npm run build` includes registry validators).  
3. Wait for deployment Ready.  
4. Post-deploy validation (§ below).

### Apply database migrations

1. Take/confirm backup snapshot (Supabase).  
2. `supabase db push` (or approved migration pipeline) against **production** project.  
3. Verify critical migrations **171** and **172** applied (`supabase migration list` / schema_migrations).  
4. Smoke RLS with a non-service-role user.

### Post-deployment validation

| Check | Expect |
|-------|--------|
| `GET /api/health` | 200 |
| `GET /api/ready` | 200 |
| Login staff | Dashboard loads |
| Login portal user | `/portal` loads |
| One export or search | Authorized success |
| Cron secret present | Vercel env |
| Error rate | No spike in Vercel logs |

Smoke: `npm run test:smoke` against staging URL when available (`PLAYWRIGHT_BASE_URL`).

---

## Procedures — Rollback

### App-only rollback

1. Vercel → Deployments → prior known-good → **Promote to Production**.  
2. Re-run health/ready + login smoke.  
3. Announce in incident channel.

### Migration rollback

1. **Do not** blindly reverse SQL without reviewed down-migration.  
2. Prefer forward fix.  
3. If restore required: `13_DATABASE_BACKUP_RESTORE.md`.  
4. Align app version with schema compatibility.

---

## Troubleshooting

| Issue | Action |
|-------|--------|
| Build fails on validators | Fix registry locally; do not skip validators |
| Ready 503 | Missing `NEXT_PUBLIC_SUPABASE_*` |
| Works in preview not prod | Env parity / migration lag |

## Related documents

- `../14_RELEASE_OPERATIONS_MANUAL.md`
- `../10_DISASTER_RECOVERY_PLAN.md`

## Version history

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | 2026-07-17 | Initial |
