# Monitoring & Operations Guide — Phase F / RC-1

| Field | Value |
|-------|-------|
| **Purpose** | Define logging, health, metrics, alerting, SLIs/SLOs as implemented |
| **Scope** | Production observability |
| **Audience** | Ops, eng |
| **Prerequisites** | Vercel + Supabase dashboards |
| **Version** | 2.0.0 |

---

## Implemented today (RC-1)

| Signal | Implementation |
|--------|----------------|
| Liveness | `GET /api/health` |
| Readiness (cheap) | `GET /api/ready` |
| Readiness (deep) | `GET /api/ready/deep` — DB, Supabase, integrations, queue, cache |
| Structured logs | JSON via `@/lib/observability` logger (`requestId`, `traceId`, `organizationId`, `userId`, `operation`, `durationMs`) |
| Trace ids | Middleware sets `x-request-id`, `x-trace-id`, `traceparent` |
| Spans | In-process OpenTelemetry-compatible spans; optional OTLP/HTTP export |
| RUM | `web-vitals` → `POST /api/observability/rum` (TTFB, FCP, LCP, INP, CLS, TTI approx) |
| Metrics API | `GET /api/observability/metrics` (Bearer `CRON_SECRET` or `operations.view`) |
| Alerts API | `GET /api/observability/alerts` |
| Perf dashboard | `/admin/performance` — p50/p95/p99, slow routes/actions/queries, RUM, alerts |
| Regression CI | `npm run perf:regression` (bundle budgets vs `perf-baselines.json`) |
| DB metrics | Query duration + slow-query tracking; pool/locks via Supabase dashboards |

---

## Environment

| Variable | Role |
|----------|------|
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Optional OTLP/HTTP base URL |
| `OTEL_EXPORTER_OTLP_HEADERS` | Optional `key=value,key=value` |
| `OTEL_SERVICE_NAME` | Default `jag` |
| `OBSERVABILITY_LOG_LEVEL` | `debug` \| `info` \| `warn` \| `error` |
| `NEXT_PUBLIC_RUM_SAMPLE_RATE` | `0`–`1` |
| `OBSERVABILITY_SLOW_QUERY_MS` | Default `500` |
| `OBSERVABILITY_ALERT_*` | Threshold overrides for in-process alerts |

---

## Logging standards

| Rule | Guidance |
|------|----------|
| Format | One JSON object per line |
| Correlation | Always include `requestId` + `traceId` when context is active |
| No secrets | Never log keys, tokens, raw PII |
| Auth failures | Status / errorCode only |
| Student PII | Minimize; FERPA-aware |

---

## SLIs / SLOs (initial targets)

| SLI | SLO |
|-----|-----|
| Ready probe success | 99.9% monthly |
| Deep ready (deploy gate) | Success before traffic shift |
| Login success (auth provider up) | 99.5% |
| Cron success | ≥ 99% of scheduled runs |
| p95 HTTP latency | Track via metrics API; alert default 2s |
| p95 LCP (RUM) | Alert default 4s |

---

## Alerting

### In-process (JAG)

Evaluated by `evaluateAlerts()` / `/api/observability/alerts`:

| Alert | Default threshold |
|-------|-------------------|
| API p95 | > 2000 ms |
| Error rate | > 5% |
| Slow query burst | > 10 retained slow samples |
| RUM LCP p95 | > 4000 ms |

### External (configure in Vercel / Supabase / pager)

| Alert | Condition |
|-------|-----------|
| Ready failing | 2+ consecutive 503 |
| Deep ready failing | Deploy blocked |
| 5xx rate | > 2% / 5 min |
| Cron miss | No success in 26h |
| DB CPU | > 80% sustained |
| Auth error spike | Supabase auth failures |

---

## Dashboards

1. **JAG** `/admin/performance` — process-local APM + RUM  
2. Vercel project overview  
3. Supabase reports (pool, locks, seq scans, indexes)  
4. Optional OTLP backend when `OTEL_EXPORTER_OTLP_ENDPOINT` is set  

---

## Instrumentation helpers

```ts
import {
  observeServerAction,
  observeWorkspaceExecution,
  observeExecutiveIntelligence,
  observeIntegration,
  observeDbOperation,
  logger,
} from "@/lib/observability";
```

Already wired on: Executive Brief, Integrations loaders, Executive Workspace, Executive Intelligence workspace, `commitTrace` cache counters, deep health DB probes.

---

## Incident escalation

See `runbooks/11_INCIDENT_RESPONSE.md` and `16_SUPPORT_READINESS.md`.

## Related documents

- `docs/product/PERFORMANCE_PHASE_C1_REPORT.md`
- `perf-baselines.json`
- `npm run perf:regression`

## Version history

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | 2026-07-17 | Baseline probes + targets |
| 2.0.0 | 2026-07-19 | RC-1 observability foundation |
