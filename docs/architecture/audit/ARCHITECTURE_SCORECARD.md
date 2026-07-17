# Architecture Scorecard — JAG v1.0

> **HISTORICAL (H-A8).** Pre A1–A4 / pre Phase A scorecard. Do not use for release decisions.  
> **Current scorecard:** [../phase-a/ARCHITECTURE_SCORECARD.md](../phase-a/ARCHITECTURE_SCORECARD.md).  
> **Current truth index:** [../README.md](../README.md).

> **Historical scorecard (pre A1–A4).** Maintainability scores reflected pre-stabilization duplication.  
> See `../STABILIZATION_A5_CLEANUP.md` for post-stabilization status.

**Branch:** `v1.0-stabilization`  
**Date:** July 13, 2026  
**Scale:** 1 (weak) – 10 (excellent)  
**Companion:** Full narrative in `ARCHITECTURE_AUDIT.md`.

---

## Scores

| Dimension | Score | Rationale |
|-----------|------:|-----------|
| Architecture | **8** | Clear OIOS layering, leaf types, soft integrations, terminal wisdom DAG; weakened by DI monolith and copy-paste domains |
| Maintainability | **5** | Freeze discipline helps, but 27–36× helper clones and ~180 boilerplate files make change costly |
| Scalability | **4** | Sequential 39-module pipeline; in-memory maps; no multi-instance result store |
| Performance | **5** | Fine for library tests; full pipeline latency sums modules; no sibling parallelism |
| Testability | **8** | Strong unit coverage of domains + DAG order asserts; some foundation adapter gaps |
| Security | **6** | Product RLS exists; intelligence results lack persistence/RLS; vault fallback risk; synthetic data risk if mislabeled |
| Documentation | **6** | Capstone graph + package docs strong; canonical domain model / current architecture report stale |
| Product Readiness | **4** | Platform features closer to prod; OIOS wisdom/collective not UI-wired; results ephemeral/synthetic |

### Overall (unweighted mean)

**5.8 / 10** — Architecture-complete intelligence graph; stabilization/productization still required for production intelligence.

---

## Strengths

1. End-to-end intelligence DAG from organization-dna through wisdom (39 modules).  
2. Consistent late-sprint package conventions and DI stack factories.  
3. Soft light types preserve package freezes without circular hard edges.  
4. Registry topo-sort + cycle detection + pipeline order tests.  
5. Lean production dependency set (Next, React, Supabase).  
6. Capstone documentation (`JAG_V1_INTELLIGENCE_GRAPH.md`).  
7. Build-time platform registry validators.  

---

## Recommended improvements (by score impact)

| Priority | Improvement | Likely score lift |
|----------|-------------|-------------------|
| P0 | Persist org-scoped intelligence results + RLS **or** declare session-only | Product Readiness, Security, Scalability |
| P0 | Extract `intelligence/common` (scoring, repository, ResultLightBase) | Maintainability, Architecture |
| P0 | Ship wisdom brief UI/API | Product Readiness |
| P1 | Split `create-service.ts` wiring | Maintainability, Architecture |
| P1 | Label synthetic domains; add provenance | Security, Product Readiness |
| P1 | Refresh stale architecture docs | Documentation |
| P2 | Parallelize independent pipeline modules + job runner | Performance, Scalability |
| P2 | Fix CompetitiveIntelligence naming; DAG edge on organization-health | Architecture, Code quality |
| P2 | Add missing foundation adapter tests | Testability |
| P3 | knip/ts-prune; rename `-intelligence-intelligence` files | Maintainability |

---

## Dimension notes

### Architecture (8)

Excellent conceptual design and enforcement of boundaries for a research/enterprise OS. Deducted for create-service concentration and intentional but confusing dual knowledge layers.

### Maintainability (5)

Freeze rules prevent accidental regeneration (good). Copy-paste factory era (046–060) dominates maintenance cost (bad).

### Scalability (4)

Works for single-process demos. Not ready for multi-tenant high-volume intelligence runs without persistence and async execution.

### Performance (5)

Acceptable for on-demand executive runs if cached; poor if every page load runs all 39 modules.

### Testability (8)

Library is highly testable; product acceptance tests for intelligence truthfulness are thin by design of synthetic engines.

### Security (6)

Auth/RLS mature for school platform tables; intelligence layer not yet in that model. Misuse of synthetic outputs is a trust/security issue.

### Documentation (6)

Plenty of docs; truth drift between older canonical files and live module list reduces reliability.

### Product Readiness (4)

v1.0 is an **architecture milestone**, not a full production intelligence product. Stabilization should productize terminal domains before claiming production intelligence.

---

## Scorecard summary diagram

```
Architecture        ████████░░  8
Maintainability     █████░░░░░  5
Scalability         ████░░░░░░  4
Performance         █████░░░░░  5
Testability         ████████░░  8
Security            ██████░░░░  6
Documentation       ██████░░░░  6
Product Readiness   ████░░░░░░  4
```

---

## Stabilization north star

Raise **Product Readiness ≥ 7** and **Maintainability ≥ 7** before calling intelligence “production,” without regenerating frozen domain packages — via shared commons, persistence strategy, and product surfaces on top of the existing graph.
