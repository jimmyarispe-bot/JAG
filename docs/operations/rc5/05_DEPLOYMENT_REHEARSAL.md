# RC-5 — Deployment Rehearsal

Generated: 2026-07-19T01:29:39.756Z
Overall: **pass_with_notes**
Base URL: http://127.0.0.1:3000
Probe window: 55ms
Build duration: skipped

## Checks

- **[pass] deploy.env.NEXT_PUBLIC_SUPABASE_URL** — present
- **[pass] deploy.env.NEXT_PUBLIC_SUPABASE_ANON_KEY** — present
- **[warn] deploy.env.NEXT_PUBLIC_APP_URL** — missing (warn)
- **[pass] deploy.env.CRON_SECRET** — present
- **[warn] deploy.env.VAULT_ENCRYPTION_KEY** — missing (warn)
- **[warn] deploy.env.SENDGRID_API_KEY** — missing (warn)
- **[skip] deploy.build** — RC5_RUN_BUILD not set — skipped (set=1 for full build rehearsal)
- **[pass] deploy.artifact** — .next build artifact present
- **[pass] deploy.probe.api.health** — HTTP 200 @ http://127.0.0.1:3000 (38ms)
- **[pass] deploy.probe.api.ready** — HTTP 200 @ http://127.0.0.1:3000 (6ms)
- **[warn] deploy.probe.api.ready.deep** — HTTP 401 (stale build allowlist) @ http://127.0.0.1:3000 — rebuild/redeploy to publish public deep probe (6ms)
- **[pass] deploy.monitoring.metrics** — HTTP 401 (401/404 acceptable depending on lock-down) (4ms)

## Notes

- Vercel promote drill remains operator-owned (see phase-f runbook 12).
- This harness validates production-mode health/ready/deep against a running target.
