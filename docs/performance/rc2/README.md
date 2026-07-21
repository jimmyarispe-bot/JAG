# RC-2 — Load, Scalability & Resilience

## Framework

| Path | Role |
|------|------|
| `scripts/load/suite.mts` | Full suite orchestrator |
| `scripts/load/scenarios.ts` | Domain scenarios + concurrency levels |
| `scripts/load/runner.ts` | Concurrent HTTP runner |
| `scripts/load/failure-inject.ts` | Controlled failure injection |
| `scripts/load/endurance.ts` | Soak / endurance |
| `scripts/load/local-target.ts` | Local failure simulator |
| `scripts/load/db-capacity.ts` | Deep-ready + metrics DB snapshot |

## Commands

```bash
npm run load:suite
```

### Useful env

| Variable | Default | Purpose |
|----------|---------|---------|
| `LOAD_TEST_BASE_URL` | `http://127.0.0.1:3000` | Live app |
| `LOAD_MAX_VUS` | `100` | Cap ramp (10→500) |
| `LOAD_SCENARIO_MS` | `8000` | Per-scenario duration |
| `LOAD_RAMP_MS` | `10000` | Per concurrency step |
| `LOAD_ENDURANCE_MS` | `120000` | Soak (set 21600000 for 6h) |
| `LOAD_TEST_COOKIE` | — | Authenticated Cookie header |
| `LOAD_TEST_EMAIL` / `PASSWORD` | — | Supabase password grant |
| `CRON_SECRET` | — | Metrics scrape |
| `LOAD_SKIP_LIVE` | — | Force local target only |

## Staging soak (release candidate)

```bash
export LOAD_TEST_BASE_URL=https://staging.example.com
export LOAD_TEST_COOKIE='...'
export LOAD_MAX_VUS=500
export LOAD_SCENARIO_MS=600000
export LOAD_RAMP_MS=600000
export LOAD_ENDURANCE_MS=21600000   # 6 hours
npm run load:suite
```

## Outputs

- `perf-load-report.json`
- `perf-load-baselines.json`
- `docs/performance/rc2/LOAD_RESILIENCE_REPORT.md`
