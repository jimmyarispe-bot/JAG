# Technical Debt — JAG v1.0

> **HISTORICAL (H-A8).** Prefer [../phase-a/03_TECHNICAL_DEBT_REPORT.md](../phase-a/03_TECHNICAL_DEBT_REPORT.md) for current debt.  
> **Current truth:** [../README.md](../README.md).

> **Superseded in part by Stabilization A1–A4 (July 2026).**  
> TD items about scoring duplication (TD-C4) and the `create-service` god factory (TD-H1) were addressed.  
> Retained as historical ranking. See `../STABILIZATION_A5_CLEANUP.md`.

**Branch:** `v1.0-stabilization`  
**Date:** July 13, 2026  
**Constraint:** Reports only; no code changes in this audit.

Ranking: **Critical** → **High** → **Medium** → **Low**

---

## Critical

| ID | Debt | Evidence | Impact | Suggested direction |
|----|------|----------|--------|---------------------|
| TD-C1 | Domain intelligence results are ephemeral | All sampled `*RepositoryStore` use `Map`; no Supabase writes under `src/lib/platform/intelligence/` | Restart/deploy loses assessments; no audit trail | Persist results or formally declare “session-only” semantics |
| TD-C2 | Synthetic / baseline-driven External domains | `area-factory.ts` pattern; `default*Baseline()` hardcodes; no market/political APIs | Misleading “intelligence” if treated as live data | Connectors + provenance, or label as simulated |
| TD-C3 | No app/API surface for terminal domains | Zero `src/app` references to wisdom/collective | Library complete; product incomplete | Dashboard/API contract for wisdom briefs |
| TD-C4 | Scoring/storage primitives duplicated 27–36× | `clamp`, `statusFromScore`, `priorityFromScore`, `defaultCreateId` across domain `models.ts` | Drift, bug-fix cost | Extract `intelligence/common` |

---

## High

| ID | Debt | Evidence | Impact | Suggested direction |
|----|------|----------|--------|---------------------|
| TD-H1 | `create-service.ts` god factory (~1,300 lines) | 39+ stack factories; ~80 option fields | Every domain requires monolith edit | Layer-based wiring modules |
| TD-H2 | 15-domain boilerplate cluster (S046–060) | Shared area-factory / repo / registry / projection / learning-loop | ~180 near-copy files | Shared factories + generics |
| TD-H3 | Dual `CompetitiveIntelligence` classes | `market/competitive-intelligence.ts` vs `competitive/competitive-intelligence.ts` | Import/name collision risk | Rename market submodule |
| TD-H4 | Knowledge (040) vs Institutional Memory (058) overlap | Same concept names; stub vs full engines | Confusion; dual maintenance | Document ownership; soft-read only |
| TD-H5 | Sequential 39-module pipeline | `pipeline.ts` `for` over module order | Latency = sum of modules | Parallelize independent siblings; cache |
| TD-H6 | Process-global in-memory repos | Keyed by `requestId`; scope filter on list only | Multi-tenant / concurrency risk | Org-scoped keys + persistence |
| TD-H7 | Stale canonical docs | `INTELLIGENCE_DOMAIN_MODEL.md` ends at innovation; `CURRENT_ARCHITECTURE_REPORT.md` dated Jul 5 | Onboarding lies | Align to `INTELLIGENCE_MODULE_IDS` |
| TD-H8 | Missing dedicated tests for 3 foundation modules | No `organization-health` / pipeline `financial` / `founder` unit files | Blind spots | Add adapter tests |
| TD-H9 | AIP hub ≠ OIOS pipeline | AIP UI simulated; separate from wisdom pipeline | Product messaging confusion | Clarify product surfaces |

---

## Medium

| ID | Debt | Evidence | Impact | Suggested direction |
|----|------|----------|--------|---------------------|
| TD-M1 | `-intelligence-intelligence.ts` filenames | 5 files (collective, reputation, institutional-memory) | Generator artifact | Rename on next touch |
| TD-M2 | `predictive-intelligence/` vs module id `predictive` | Folder vs OIOS/platform id | Cognitive load | Alias docs or rename folder later |
| TD-M3 | `organization-health` empty `dependencies` | Relies on topo tie-break | Fragile DAG | Explicit `["organization-dna"]` |
| TD-M4 | OIOS catalog extras | `legal`/`compliance`/`risk` registered dormant | Catalog vs module mismatch | Keep documented or split packages |
| TD-M5 | Vault key fallback to service role | `vault-crypto.ts` pattern | Secret coupling | Fail closed without `VAULT_ENCRYPTION_KEY` |
| TD-M6 | `.env.example` not tracked | README/PRODUCTION_ENV reference template | Onboarding friction | Track sanitized example |
| TD-M7 | 4× `collaboration-engine.ts` | behavioral, cultural, collective, ecosystem | Parallel concepts | Shared interface or naming prefixes |
| TD-M8 | Leaf boundary mild violations | `organization/types.ts`, `decision/types.ts` → `context/builder` | Cycle risk | Type-only shared context module |
| TD-M9 | Codegen scripts drift | `scripts/generate-*-intelligence.mjs` | Manual edits diverge | Single generator + schema |
| TD-M10 | Duplicate class names across domains | e.g. `ValuesAlignmentIntelligence` in ethical + wisdom | Ambiguous imports | Namespace or rename |

---

## Low

| ID | Debt | Evidence | Impact | Suggested direction |
|----|------|----------|--------|---------------------|
| TD-L1 | `organization/` / `organization-dna/` / `organization-health/` naming proximity | Three packages | Mild confusion | Docs glossary |
| TD-L2 | `finance.test.ts` vs financial adapter | Tests enterprise finance engine | False coverage assumption | Rename test file |
| TD-L3 | In-memory pipeline cache | `IntelligenceCacheImpl` Map | Multi-instance miss | Redis only if multi-node |
| TD-L4 | Meta packages (`dashboard/`, `memory/`, `founder/`) | Adjacent to product domains | Boundary clarity | Document roles |
| TD-L5 | Graph edge persistence ≠ result payloads | `platform_graph_edges` | Incomplete audit trail | Link result ids if persisted |
| TD-L6 | 20× `knowledge-contribution.ts` copies | Per-domain drafts | Maintenance | Shared draft builder |
| TD-L7 | Early-warning missing in competitive/economic | Pattern inconsistency | Incomplete parity | Add if needed |

---

## Debt themes

1. **Scale of copy-paste** after Sprint 046 is the largest maintainability debt.  
2. **Productization** (UI, persistence, live data) is behind the library.  
3. **Documentation freshness** lags the shipped graph.  
4. **Foundation DAG/test gaps** are small but high-leverage to fix.  

---

## Suggested debt burn-down order (stabilization)

1. TD-C4 → shared scoring/repository primitives  
2. TD-H1 → split create-service  
3. TD-H7 → doc refresh  
4. TD-C3 / TD-C1 → product surface + persistence strategy decision  
5. TD-H3 / TD-H4 → naming/ownership clarity  
6. Remaining Medium/Low on touch  

See `ARCHITECTURE_SCORECARD.md` for scored impact.
