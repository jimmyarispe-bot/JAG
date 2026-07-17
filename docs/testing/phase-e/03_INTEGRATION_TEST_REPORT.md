# 3. Integration Test Report

## Gate result

| Metric | Result |
|--------|--------|
| Command | `npm run test:integration` |
| Outcome | **PASS** |
| Style | Mostly mocked Supabase (`tests/helpers/mock-supabase.ts`) |

## Suites covered

- Profile route resolution & permission gating
- Platform registry validation
- Platform services (activity, notes, tags, relationships)
- Workflow / decision / rules / events / ULR / automation / hierarchy
- Execution engine workspaces
- Intelligence graph persistence (mock)
- PAJ / evidence / admissions registry & case
- Mission control wiring
- RC1 operational loop

## Cross-module integrations (Phase E matrix)

| Integration | Automated? | Result |
|-------------|------------|--------|
| Admissions ↔ SIS | Partial (registry/case only) | Incomplete |
| SIS ↔ Scheduling | No | Gap |
| Scheduling ↔ Attendance | No | Gap |
| Attendance ↔ Teacher | No | Gap |
| Teacher ↔ Parent portal | No | Gap |
| Finance ↔ Billing | No | Gap |
| Finance ↔ Executive dashboards | Intelligence unit only | Incomplete |
| HR ↔ Payroll | No | Gap |
| Executive Graph ↔ Intelligence | Unit/integration partial | Pass (mock) |
| Knowledge Graph ↔ AI runtime | Limited | Incomplete |

## Shared platform services

Validated under mock clients: activity, relationships, tags, notes, evidence, event/decision/rules persistence.

**Not validated:** live RLS, storage buckets, cron workers, real queue brokers.
