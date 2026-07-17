# Scalability Assessment — Phase C

| Field | Value |
|-------|-------|
| **Purpose** | Project behavior at target production scale |
| **Scope** | Modeled scenarios — **not load-tested** |
| **Audience** | Architects, stakeholders |
| **Version** | 1.0.0 |

---

## Target scenario (from brief)

| Entity | Count |
|--------|------:|
| Schools | 100 |
| Students | 10,000 |
| Parents online | 2,000 |
| Teachers online | 500 |
| Administrators | 100 |

Additional peaks: morning attendance, monthly billing, enrollment season, concurrent executive dashboards.

---

## Projection matrix (static model)

| Scenario | Likely bottleneck | Projected outcome without P0 fixes |
|----------|-------------------|--------------------------------------|
| 10k students list open | `getStudents()` full fetch | **Timeout / OOM risk / multi-second SSR** |
| 2k parents portal | SSR + RLS + messages | Degraded TTFB; Vercel concurrency OK if pages lean |
| 500 teachers + attendance rush | Scheduling/attendance writes + reads | DB CPU spike; conflicts without pagination/caching |
| 100 admin + exec dashboards | `rpt_*` full scans + board export fan-out | Concurrent heavy queries; pool exhaustion risk |
| Monthly billing | Finance exports + jobs | Long exports; cron collision if same window |
| Enrollment season | Admissions leads unbounded | CRM unusable at volume |
| Cron night batch | Parallel waves + 20-school insight cap | Insights incomplete beyond 20 schools (`process-queues.ts`) |

**School insights/KPI hard cap: 20 schools** — explicit scalability ceiling (`SCALABILITY_HARDENING_C1.md`).

---

## Connection / compute model (order-of-magnitude)

| Resource | Concern |
|----------|---------|
| Supabase connections | Serverless × concurrent requests; need pooler at peak |
| Vercel function memory | Unbounded JSON lists inflate payloads |
| Cron wall time | Daily job must finish within function max duration |
| Storage | Document spikes at enrollment — bandwidth plan |

---

## Mobile API scalability

**N/A** — no native mobile API surface. Portal is responsive web; sync/offline not productized.

## Graph / AI at large org

| Path | Projection |
|------|------------|
| Intelligence graph `ilike` search | Degrades without trigram/limits |
| Context builder sequential providers | Latency sum of 4 providers |
| Exec graph UI | Placeholder — not scale-proven |

## Confidence

| Claim | Confidence |
|-------|------------|
| Unbounded lists fail at 10k | **High** (code evidence) |
| Exact p95 at 2k parents | **None** (untested) |
| Cron completes for 100 schools | **Low** (20-school cap) |

## Related documents

- `07_LOAD_TESTING_RESULTS.md`
- `docs/product/SCALABILITY_HARDENING_C1.md`

## Version history

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | 2026-07-17 | Modeled only |
