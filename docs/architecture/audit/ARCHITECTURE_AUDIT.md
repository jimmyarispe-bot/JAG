# JAG v1.0 Architecture Audit

> **Superseded in part by Stabilization A1–A4 (July 2026).**  
> Shared primitives (`intelligence/common/`) and modular DI registration are now in place.  
> Retained as the pre-stabilization baseline. See `../STABILIZATION_A5_CLEANUP.md` and `../V1_STABILIZATION_MASTER_PLAN.md`.  
> **Remediation applied:** Release Phase A.1 — see `ARCHITECTURE_REMEDIATION_REPORT.md` (July 2026).

**Branch:** `v1.0-stabilization`  
**Date:** July 13, 2026  
**Scope:** Full repository review (reports only — no code changes)  
**Companion reports:** `TECHNICAL_DEBT.md`, `DUPLICATE_CODE_REPORT.md`, `DEPENDENCY_GRAPH_AUDIT.md`, `CODE_QUALITY_REPORT.md`, `PRODUCTION_GAP_ANALYSIS.md`, `ARCHITECTURE_SCORECARD.md`

---

## Executive summary

JAG v1.0 delivers a coherent **Organizational Intelligence Operating System (OIOS)** with a **39-module** default intelligence pipeline terminating at **Wisdom Intelligence** (Sprint 060). Architectural layering, leaf types/contracts, soft light integrations, and DI via `createIntelligenceService()` are consistently applied across late sprints (046–060).

The primary architectural debt is **scale without shared domain primitives**: scoring helpers, in-memory repositories, registries, area factories, and projection/query shells are copied per package rather than extracted. Product UI and persistence lag the library: wisdom/collective outputs are tested but not surfaced in `src/app`, and domain results remain process-local `Map` stores.

**Verdict:** Strong library architecture for an intelligence graph; not yet a production intelligence product end-to-end.

---

## System inventory

| Layer | Evidence | Scale |
|-------|----------|-------|
| App (Next.js 16.2.9) | `src/app/` | ~292 route/directory nodes (depth ≤2) |
| Platform / product libs | `src/lib/` | Platform, admissions, EDI, finance, compliance, etc. |
| Intelligence packages | `src/lib/platform/intelligence/` | ~43 top-level folders; 39 pipeline modules |
| OIOS | `src/lib/platform/oios/` | Domain catalog + registry |
| Supabase | `supabase/migrations/` | ~157 SQL migrations |
| Tests | `tests/` | ~85 `*.test.ts` files; ~52 under `tests/unit/intelligence/` |
| Architecture docs | `docs/architecture/` | ~88 markdown files (+ this audit set) |

**Runtime dependencies (production):** Next, React 19, Supabase SSR/JS only — lean surface.

---

## Architectural layering (observed)

```
UI / App Routes
  → Product services (admissions, EDI, FI, AIP hub)
  → Platform registries / workflows / events
  → Intelligence Platform Infrastructure (pipeline, registry, cache)
  → Domain packages (DNA … wisdom)
  → Leaf types/contracts
```

### Intelligence reasoning layers (v1.0)

Documented in `JAG_V1_INTELLIGENCE_GRAPH.md` and confirmed in `INTELLIGENCE_MODULE_IDS`:

1. Foundation — organization-dna, oios-core, organization-health  
2. Product — financial through document / legal-compliance-risk  
3. External / Future — market … environmental; innovation, impact, economic  
4. Relationship — stakeholder, reputation  
5. Behavioral / cultural / ethical  
6. Systems / resilience / ecosystem  
7. Memory — institutional-memory (knowledge remains mid-pipeline)  
8. Collective — multi-domain synthesis  
9. Wisdom — terminal executive judgment  

---

## Strengths

1. **Consistent late-sprint pattern** — types → contracts → models → engines → service → factory → infrastructure adapter → DI registration → unit tests.  
2. **Leaf discipline** — domain `types.ts` / `contracts.ts` avoid importing implementations; soft `*ResultLight` DTOs prevent hard cycles.  
3. **Pipeline DAG** — `IntelligenceRegistry` topological sort with cycle detection; unit tests assert full module order ending at `wisdom`.  
4. **Build gates** — `npm run build` runs multiple registry validators including `validate:intelligence-graph`.  
5. **Capstone documentation** — `JAG_V1_INTELLIGENCE_GRAPH.md` records module inventory and terminal chain.  
6. **Broad unit coverage of intelligence** — dedicated tests for ~36/39 pipeline modules; full intelligence suite previously reported 477 passing.  

---

## Weaknesses

1. **Boilerplate multiplication** — 15 Sprint 046–060 domains share near-identical area-factory / repository / registry / projection / learning-loop shells (~180 files).  
2. **No shared intelligence common library** — `clamp`, `statusFromScore`, `priorityFromScore`, `defaultCreateId`, `ResultLightBase` redefined dozens of times.  
3. **God DI factory** — `create-service.ts` (~1,300 lines) wires all stacks in one file.  
4. **Conceptual overlaps** — Market competitive submodule vs Competitive domain; Knowledge (040) vs Institutional Memory (058).  
5. **Docs drift** — `INTELLIGENCE_DOMAIN_MODEL.md` and `CURRENT_ARCHITECTURE_REPORT.md` lag shipped domains.  
6. **Library vs product gap** — wisdom/collective unused by `src/app`; AIP hub is governance/simulation, not domain pipeline UI.  
7. **Ephemeral domain results** — in-memory `Map` repositories; no intelligence result tables / RLS.  

---

## Package boundaries

| Boundary | Status |
|----------|--------|
| Domain package isolation | Strong for late sprints (frozen packages; soft reads) |
| Infrastructure adapters | Clean — one module file per domain id |
| OIOS vs platform module catalog | Intentional extras: OIOS `legal`/`compliance`/`risk`; platform `oios-core` |
| Product vs intelligence | Clear separation, but product UI does not consume late domains |
| Leaf types | Generally respected; mild exceptions in `organization/types.ts`, `decision/types.ts` importing `context/builder` |

---

## SOLID compliance (summary)

| Principle | Assessment |
|-----------|------------|
| Single Responsibility | Engines/areas generally focused; `create-service.ts` violates SRP at platform scale |
| Open/Closed | New domains extend via new packages + registry; factory file still requires edits |
| Liskov | Contracts + DI stacks are consistent |
| Interface Segregation | Contracts are domain-scoped; good |
| Dependency Inversion | Strong — services depend on contracts; adapters inject stacks |

---

## Registry & DI integrity

- `INTELLIGENCE_MODULE_IDS`: 39 ids; adapters: 39; default pipeline registers all.  
- `OIOS_INTELLIGENCE_DOMAINS`: includes dormant `legal`/`compliance`/`risk`; omits `oios-core`.  
- `createIntelligenceService().wisdom` / `.collective` / etc. return typed stacks.  
- Cycle protection exists in infrastructure registry.  

See `DEPENDENCY_GRAPH_AUDIT.md` for detail.

---

## Testability

- Unit tests are the primary quality gate for intelligence domains.  
- Integration tests cover platform graph persistence, workflows, admissions — not domain result DB.  
- Missing dedicated adapter tests: `organization-health`, `financial` (pipeline), `founder`.  
- Naming trap: `finance.test.ts` covers enterprise finance engine, not financial intelligence adapter.  

---

## Security & tenancy (architecture view)

- Product tables use RLS extensively (admissions, EDI, FI, AIP).  
- Domain intelligence stores are in-process Maps — **no org isolation at persistence layer**.  
- Secret patterns documented in `docs/launch/PRODUCTION_ENV.md`; vault key fallback to service role is a risk.  
- External domains are baseline/template-driven — not live data connectors.  

See `PRODUCTION_GAP_ANALYSIS.md`.

---

## Recommendations (stabilization priority)

1. Extract `intelligence/common` for scoring, ResultLightBase, generic Map repository/registry (no domain logic rewrite).  
2. Split `create-service.ts` into layer-based wiring modules.  
3. Persist domain results (or explicitly mark domains as ephemeral session intelligence).  
4. Wire terminal domains (wisdom/collective) into a dashboard or API contract.  
5. Refresh stale architecture docs to match `INTELLIGENCE_MODULE_IDS`.  
6. Resolve CompetitiveIntelligence naming collision and knowledge vs institutional-memory documentation clarity.  

---

## Related reports

| Report | Focus |
|--------|--------|
| `TECHNICAL_DEBT.md` | Ranked debt backlog |
| `DUPLICATE_CODE_REPORT.md` | Duplication inventory + consolidation |
| `DEPENDENCY_GRAPH_AUDIT.md` | DAG, DI, cycles, registry |
| `CODE_QUALITY_REPORT.md` | Naming, consistency, maintainability |
| `PRODUCTION_GAP_ANALYSIS.md` | Production blockers |
| `ARCHITECTURE_SCORECARD.md` | 1–10 scores |
