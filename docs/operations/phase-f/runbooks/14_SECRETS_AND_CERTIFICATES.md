# Runbook — Secret Rotation & Certificate Renewal

| Field | Value |
|-------|-------|
| **Purpose** | Rotate secrets and manage TLS without downtime surprises |
| **Scope** | Vercel env, Supabase keys, Resend, cron, vault |
| **Audience** | Ops, security |
| **Prerequisites** | Access to secret stores; maintenance window for dual-key when needed |
| **Version** | 1.0.0 |

---

## Secret inventory

| Secret | Where set | Notes |
|--------|-----------|-------|
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel | Public by design |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel (server only) | High privilege |
| `CRON_SECRET` | Vercel | Required prod |
| `VAULT_ENCRYPTION_KEY` | Vercel | Prefer dedicated; never commit |
| `RESEND_API_KEY` | Vercel | Email (Resend) |
| Supabase JWT secret | Supabase dashboard | Provider-managed |
| OAuth connector creds | Vault / connector config | Per tenant |

TLS for `*.vercel.app` / custom domains: **Vercel-managed certificates**. Custom domain renewal is automatic; verify DNS if renew fails.

---

## Procedures — Rotate CRON_SECRET

1. Generate new secret (≥32 chars).  
2. Add to Vercel (prod) — brief overlap: update app env, redeploy.  
3. Confirm cron succeeds with new Bearer.  
4. Remove old secret.  
5. Log rotation in audit notes.

## Procedures — Rotate Supabase keys

1. Coordinate downtime risk (anon key in clients).  
2. Generate new keys in Supabase.  
3. Update all Vercel envs + local templates.  
4. Redeploy; invalidate old sessions if JWT secret rotated.  
5. Verify login + ready probe.

## Procedures — Vault encryption key

1. If data encrypted under old key, plan re-encrypt (engineering).  
2. Do not simply replace key without migration path.  
3. Never fall back to service role for encryption in production (Phase B).

---

## Troubleshooting

| Issue | Action |
|-------|--------|
| Cron 401 after rotate | Env not redeployed |
| Email fail | Resend key / from-domain verify |
| Custom domain TLS error | DNS / Vercel cert status |

## Related documents

- `docs/security/phase-b/07_SECRETS_MANAGEMENT_REVIEW.md`
- `docs/launch/PRODUCTION_ENV.md`

## Version history

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | 2026-07-17 | Initial |
