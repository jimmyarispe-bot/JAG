# Production Environment Variables (v1.0)

Copy into Vercel (or local `.env.local`). Tracked template: `.env.example`.  
**Canonical validation:** `src/lib/platform/env/schema.ts` (enforced at boot via `instrumentation.ts`).

## Required (production)

| Variable | Purpose | Validation |
|----------|---------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | URL; all envs |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Secret; all envs |
| `SUPABASE_SERVICE_ROLE_KEY` | Privileged server operations | Secret; required preview+production |
| `NEXT_PUBLIC_APP_URL` | Public app URL (links, merge fields) | URL; required preview+production — **needed for `next start`** |
| `CRON_SECRET` | Bearer for cron / queue routes | Secret; required production |
| `OAUTH_STATE_SECRET` | HMAC secret for integration OAuth `state` (RC-6.04) | Secret; required when OAuth connect is enabled — treat as production-required for external beta |
| `VAULT_ENCRYPTION_KEY` | Vault AES key (min 32 chars) | Secret; required production |
| `RESEND_API_KEY` | Transactional email (Resend) | Secret; required preview + production (C-6.2) |

## Optional

| Variable | Purpose |
|----------|---------|
| `EMAIL_FROM` / `RESEND_FROM_NAME` | Sender identity — default `noreply@theacademyway.org` (verify `theacademyway.org` in Resend). `RESEND_FROM_EMAIL` remains a legacy alias for `EMAIL_FROM`. |
| `ENFORCE_MFA` | Force MFA for privileged users (default on in production) |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Durable rate limiting |
| `TURNSTILE_SECRET_KEY` | Public admissions inquiry |
| `OTEL_EXPORTER_OTLP_ENDPOINT` / `OTEL_EXPORTER_OTLP_HEADERS` / `OTEL_SERVICE_NAME` | OpenTelemetry export |
| `OBSERVABILITY_LOG_LEVEL` | Structured log level |
| `NEXT_PUBLIC_RUM_SAMPLE_RATE` | RUM sample 0–1 |
| `OBSERVABILITY_SLOW_QUERY_MS` | Slow query threshold |

## Never in production

| Variable | Why |
|----------|-----|
| `ALLOW_SQUARE_PLANNED` | Simulated payments (dev/preview only in schema) |
| `ALLOW_EXEC_DEMO_MODE` | Unless explicitly approved |
| `EXEC_OPERATING_MODE=demo` | Prefer unset / tenant |

## Vercel cron

`vercel.json` schedules `GET /api/platform/process-queues`. Set `CRON_SECRET`. Recovery: `docs/operations/phase-f/runbooks/15_QUEUE_RECOVERY.md`.

## Local template

See `.env.example`. RC-2/RC-3 note: starting production mode without the required secrets causes instrumentation to fail and the server will not serve traffic correctly.

## Rotation

`docs/operations/phase-f/runbooks/14_SECRETS_AND_CERTIFICATES.md`
