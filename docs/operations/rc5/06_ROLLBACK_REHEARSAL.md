# RC-5 — Rollback Rehearsal

Generated: 2026-07-19T01:29:42.724Z
Overall: **pass_local_deferred_vercel**
Base URL: http://127.0.0.1:3000
App recovery duration: 2051ms

## Checks

- **[pass] rollback.pre.health** — HTTP 200 (38ms)
- **[pass] rollback.window** — Simulated cutover pause 2000ms
- **[pass] rollback.post.health.1** — HTTP 200 (5ms)
- **[pass] rollback.post.ready** — HTTP 200 (4ms)
- **[skip] rollback.post.deep** — HTTP 401 stale build — rebuild to publish public deep probe (4ms)
- **[pass] rollback.recovery.clock** — Recovered in 2051ms (2051ms)
- **[deferred] rollback.vercel.promote** — Vercel previous-deployment promote not confirmed in this environment — set RC5_ROLLBACK_CONFIRMED=1 after drill

## Compatibility notes

- App-only rollback: promote prior Vercel deployment (runbook 12).
- DB rollback: prefer forward-fix; PITR via restore rehearsal (G-RC1-08).
- Monitoring continuity: health/ready/deep re-probed post window.
