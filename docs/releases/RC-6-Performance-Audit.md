# RC-6 Performance Audit

**Scope:** RC-6.05 executive / ECC / KPI / connector publish path  
**Date:** 2026-07-19  
**Auditor:** RC-6 quality cycle (code review + targeted fixes + unit validation)

---

## Findings

| Area | Pre-audit | Post-audit |
|------|-----------|------------|
| ECC / Mission Control build | Walked ~50-module platform assembly | Direct `createExecutiveCommandCenter().service.build()` |
| Interactive Command Center | Eager bundle | Dynamic import |
| Mission Control view | Eager | Dynamic import |
| KPI queries | Broad / org-first patterns | School-scope-first where applicable |
| EDI / Mission Control fan-out | Sequential / chatty | Concurrency limits + batched MC |
| Insights persistence | Row-at-a-time risk | Batch insert |
| CRM / Finance publish | Large single payloads | Chunked publish |
| Finance forms context | Re-render churn | Memoized context |
| DB indexes (executive hot paths) | Incomplete | Migration `180_rc605_executive_perf_indexes.sql` |
| Validation | — | `tsc` clean; 27 KPI/executive unit tests passed |

Intelligence modules must not call vendor APIs (unchanged contract — protects connector fan-out from intelligence layer).

---

## Issues discovered

1. **ECC cold path** pulled a near-full intelligence platform graph on every build.
2. **Large client bundles** for Interactive Command Center / Mission Control.
3. **KPI query shape** not school-first → unnecessary row scans.
4. **EDI / MC N+1 and unbounded concurrency** under load.
5. **Insights insert chatter**.
6. **CRM/Finance publish** risk of oversized transactions / memory spikes.
7. **Missing indexes** on executive-critical filters/joins.

---

## Fixes applied

| Fix | Evidence |
|-----|----------|
| Direct ECC service build | Executive Command Center factory path |
| Dynamic imports | Interactive Command Center + Mission Control view |
| School-scope-first KPI | KPI query modules |
| EDI concurrency + batched MC | EDI / Mission Control builders |
| Insights batch insert | Insights persistence |
| Chunked CRM/Finance publish | Publish pipelines |
| Finance forms memoization | Finance forms context |
| Executive indexes | `supabase/migrations/180_rc605_executive_perf_indexes.sql` |

---

## Remaining risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Migration **180** not applied | **High** until applied | Apply before claiming perf wins in prod |
| No sustained production RUM / load numbers attached to this audit | Medium | Run `npm run perf:regression` / `load:suite` (RC-10 pack) against staging |
| Remaining intelligence modules still heavy if invoked via old entry points | Medium | Prefer product RC packages (`docs/platform/rc-packages.md`) |
| Serverless cold starts for dynamic chunks | Low | Acceptable trade for smaller initial exec shell |
| Connector sync volume outside audited paths | Medium | Continue chunking patterns for new publishers |

---

## GO / NO-GO recommendation

### **CONDITIONAL GO**

Hot-path code changes are sound and unit-validated for KPI/executive suites. **GO for staging** after applying migration `180_rc605_executive_perf_indexes.sql`.

**NO-GO for performance sign-off / GA** until:

1. Indexes from **180** are live on the target DB.  
2. At least one staging pass of `npm run perf:regression` (or equivalent RC-10 evidence) shows no regression vs the RC-10 baseline.
