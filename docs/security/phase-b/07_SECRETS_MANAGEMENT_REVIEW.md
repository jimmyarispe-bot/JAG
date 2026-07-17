# Secrets Management Review — Phase B

## Repository hygiene

| Check | Result |
|-------|--------|
| `.env*` in `.gitignore` | Yes |
| `.env.example` tracked | Yes (templates only — verify no real secrets) |
| `.env.local` present locally | Yes — must never be committed |
| Secrets in source scanned | No hardcoded production keys found in this audit pass |

## Runtime secret usage

| Secret | Usage | Risk |
|--------|-------|------|
| `NEXT_PUBLIC_SUPABASE_URL` / `ANON_KEY` | Client + SSR | Public by design |
| `SUPABASE_SERVICE_ROLE_KEY` | Preferred by `src/lib/supabase/server.ts` | **High** — RLS bypass if used in request handlers |
| `CRON_SECRET` | Queue runner Bearer | Fail-closed if missing (good) |
| Vault encryption | Falls back to service role (`vault-crypto`) | **High** — key coupling / rotation |
| OAuth connector credentials | Per-tenant vault (hash refs historically) | Production needs KMS/Vault |
| SendGrid / payment keys | Env / vault | Confirm not logged |

## Recommendations

1. Split `createServiceRoleClient()` from user-scoped clients; ban service role in App Router via lint.  
2. Dedicated `VAULT_ENCRYPTION_KEY` (versioned) — never service role.  
3. Supabase Vault or cloud KMS for connector secrets.  
4. Rotate keys on schedule; document break-glass.  
5. Pre-commit secret scanning (gitleaks).  
6. Vercel/hosting secret store only — no secrets in git history (audit history if ever leaked).  
