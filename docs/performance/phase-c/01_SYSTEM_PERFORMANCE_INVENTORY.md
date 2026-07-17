# System Performance Inventory — Phase C

| Field | Value |
|-------|-------|
| **Purpose** | Inventory every major subsystem for performance relevance |
| **Scope** | App, DB, jobs, storage, graphs, AI, mobile |
| **Audience** | Performance engineers |
| **Version** | 1.0.0 |

---

## Subsystem inventory

| Subsystem | Location | Perf relevance | Measure status |
|-----------|----------|----------------|----------------|
| Next.js App Router | `src/app/` | SSR/RSC, hydration | Static only |
| React components | `src/components/` | Client islands, re-renders | Static only |
| Server Actions | `src/lib/**/actions.ts` | Mutation latency | Static only |
| API routes | `src/app/api/**` | Export/report latency | Static only |
| Supabase PostgreSQL | `supabase/migrations/` | Query/index/RLS cost | Indexes inventoried; no EXPLAIN |
| Edge Functions | — | **None in repo** | N/A |
| Background jobs | `process-queues.ts`, Vercel cron | Throughput, concurrency | Unit-tested parallel structure |
| Storage | Supabase Storage buckets | Upload/download | Static / policy gaps |
| Authentication | Supabase Auth + SSR | Login latency | Provider-dependent |
| Authorization | `identity/*` | Extra queries per request | Static |
| Executive Graph | `/exec`, EDI, intelligence-graph | Traversal/aggregation | Placeholder/partial |
| Knowledge Graph | intelligence-graph providers | Search `ilike` | Bounded in places |
| AI Runtime | `/api/intelligence/context` | Context build | No provider invoke in route |
| Mobile APIs | — | **No native mobile API** | Portal web only |
| Integrations | connectors + vault | Cold bootstrap | Phase 1 probe: cold/warm |
| Health probes | `/api/health`, `/api/ready` | Ops | Shallow |

---

## Local probe artefacts (existing)

| Tool | Path | Metrics |
|------|------|---------|
| Perf probe script | `scripts/perf-probe.mts` | Mean/median-style cold/warm DI |
| Admin UI | `/admin/performance` | Probe display |
| Phase 1 report | `docs/product/PERFORMANCE_PHASE1_REPORT.md` | Intelligence ~98ms cold; integrations ~64ms cold (pre-parallel) |

**Not available in-repo:** p95/p99 production, Core Web Vitals CI, k6/Artillery suites.

## Related documents

- `09_PERFORMANCE_BOTTLENECK_INVENTORY.md`

## Version history

| Version | Date | Notes |
|---------|------|-------|
| 1.0.0 | 2026-07-17 | Initial |
