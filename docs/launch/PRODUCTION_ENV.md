# Production Environment Variables (v1.0)

Copy these into your Vercel project (or local `.env.local`). A template also exists at `.env.example` in the repo root (not tracked — see below).

## Required

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (client + server auth) |
| `NEXT_PUBLIC_APP_URL` | Production app URL for admissions email merge links |
| `CRON_SECRET` | Bearer token for Vercel cron `/api/platform/process-queues` |
| `VAULT_ENCRYPTION_KEY` | 32+ char secret for credential vault AES-256-GCM (required in production; do not use service role) |
| `SENDGRID_API_KEY` | SendGrid API key for admissions transactional email |
| `SENDGRID_FROM_EMAIL` | Verified sender address (e.g. `noreply@your-domain.com`) |

## Optional

| Variable | Purpose |
|----------|---------|
| `SUPABASE_SERVICE_ROLE_KEY` | Server admin scripts only — never expose to client; never use as vault key in production |
| `SENDGRID_FROM_NAME` | Display name for outbound email (default: AcademyOS) |
| `ENFORCE_MFA` | `true`/`false` — force MFA for privileged users (defaults on in production) |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Durable multi-instance rate limiting |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile for public admissions inquiry |
| `ALLOW_SQUARE_PLANNED` | Dev-only simulated payments — **never** set in production |

## Vercel cron

`vercel.json` schedules `GET /api/platform/process-queues` daily at midnight UTC (`0 0 * * *`). Set `CRON_SECRET` in Vercel; the route accepts `Authorization: Bearer <CRON_SECRET>`. Manual drain and recovery: `docs/operations/phase-f/runbooks/15_QUEUE_RECOVERY.md`.

## Local template

Create `.env.local` from this template:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://127.0.0.1:3000
CRON_SECRET=local-dev-cron-secret
VAULT_ENCRYPTION_KEY=local-dev-vault-key-min-32-chars
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=noreply@localhost
SENDGRID_FROM_NAME=AcademyOS
```
