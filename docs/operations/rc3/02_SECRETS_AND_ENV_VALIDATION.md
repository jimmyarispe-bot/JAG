# RC-3 — Secrets & Environment Validation

## Contract

| Source of truth | Path |
|-----------------|------|
| Machine schema | `src/lib/platform/env/schema.ts` |
| Boot validation | `src/instrumentation.ts` → `ensureEnvironmentValidated()` |
| Human reference | `docs/launch/PRODUCTION_ENV.md` |
| Local template | `.env.example` (tracked; `!.env.example` in `.gitignore`) |

## Production required (validated at boot)

| Variable | Notes |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Secret |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret; preview+production |
| `NEXT_PUBLIC_APP_URL` | Required for `next start` / prod |
| `CRON_SECRET` | Queue / cron Bearer |
| `VAULT_ENCRYPTION_KEY` | ≥32 chars |
| `RESEND_API_KEY` | Email (Resend) |

RC-2 finding confirmed: missing prod vars → instrumentation fails → no traffic.

## Dev placeholders must not reach production

| Variable | Rule |
|----------|------|
| `ALLOW_SQUARE_PLANNED` | Optional only in development/preview |
| `ALLOW_EXEC_DEMO_MODE` | Explicit opt-in; unset in prod |
| `EXEC_OPERATING_MODE=demo` | Avoid in production |

## Rotation

See `docs/operations/phase-f/runbooks/14_SECRETS_AND_CERTIFICATES.md`.

## Secret scanning

| Control | Status |
|---------|--------|
| `.env*` gitignored | Yes |
| `.env.example` force-included | Yes (RC-3) |
| CI gitleaks | Not installed — accepted residual; recommend adding before RC-5 |
| No secrets in repo (spot check) | Pass for this sprint |

## Updates this sprint

- Added tracked `.env.example`
- Aligned `PRODUCTION_ENV.md` with schema (`SUPABASE_SERVICE_ROLE_KEY` required in production)
