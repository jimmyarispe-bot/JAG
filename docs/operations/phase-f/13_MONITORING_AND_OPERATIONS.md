# Monitoring & Operations Guide — Phase F

| Field | Value |
|-------|-------|
| **Purpose** | Define logging, health, metrics, alerting, SLIs/SLOs as implemented or required |
| **Scope** | Production observability |
| **Audience** | Ops, eng |
| **Prerequisites** | Vercel + Supabase dashboards |
| **Version** | 1.0.0 |

---

## Implemented today

| Signal | Implementation |
|--------|----------------|
| Liveness | `GET /api/health` |
| Readiness | `GET /api/ready` |
| Platform logs | Vercel function logs |
| DB metrics | Supabase dashboard |
| Build health | GitHub Actions CI |
| Cron | Vercel cron execution logs |

**Not in dependencies:** Sentry, OpenTelemetry, Datadog — treat as Wave F.1 / eng backlog (noted in performance reports).

---

## Logging standards

| Rule | Guidance |
|------|----------|
| No secrets | Never log keys, tokens, raw PII |
| Prefer structured | JSON fields: `requestId`, `userId` hash, `route`, `errorCode` |
| Auth failures | Status only |
| Student PII | Minimize; FERPA-aware |

---

## SLIs / SLOs (initial targets)

| SLI | SLO |
|-----|-----|
| Ready probe success | 99.9% monthly |
| Login success (auth provider up) | 99.5% |
| Cron success | ≥ 99% of scheduled runs |
| p95 dashboard TTFB | Track in Vercel; target &lt; 2s for cached shells (aspirational) |

---

## Alerting (configure externally)

| Alert | Condition |
|-------|-----------|
| Ready failing | 2+ consecutive 503 |
| 5xx rate | > 2% / 5 min |
| Cron miss | No success in 26h |
| DB CPU | > 80% sustained |
| Auth error spike | Supabase auth failures |

---

## Dashboards

1. Vercel project overview  
2. Supabase reports  
3. Optional: future APM  

Certification UI metrics are product-facing, not ops APM.

---

## Incident escalation

See `runbooks/11_INCIDENT_RESPONSE.md` and `16_SUPPORT_READINESS.md`.

## Troubleshooting

| Gap | Action |
|-----|--------|
| No APM | Use Vercel logs + reproduce locally |
| False ready | Ready does not ping DB — add deeper check in future hardening |

## Related documents

- `docs/product/PERFORMANCE_PHASE_C1_REPORT.md`
- `runbooks/16_PERFORMANCE_TROUBLESHOOTING.md`

## Version history

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | 2026-07-17 | Baseline probes + targets |
