# Dependency Graph Audit — JAG v1.0

> **Superseded in part by Stabilization A1 (July 2026).**  
> DI wiring is now modular under `intelligence/registration/`; pipeline module IDs remain authoritative.  
> Retained as historical baseline. See `../STABILIZATION_A5_CLEANUP.md`.

**Branch:** `v1.0-stabilization`  
**Date:** July 13, 2026  
**Sources of truth:** `INTELLIGENCE_MODULE_IDS`, `OIOS_INTELLIGENCE_DOMAINS`, `createDefaultIntelligenceModules()`, infrastructure registry topological sort.

---

## 1. Platform intelligence package graph

### Pipeline order (39 modules)

Matches `src/lib/platform/intelligence/infrastructure/types.ts` `INTELLIGENCE_MODULE_IDS`:

```
organization-dna → oios-core → organization-health → financial → founder
→ executive → executive-graph → executive-decision → predictive → board-governance
→ human-capital → revenue → funding → opportunity → organizational-improvement
→ business-model → operations → customer → knowledge → document
→ legal-compliance-risk → market → innovation → impact → economic
→ competitive → political → environmental → stakeholder → reputation
→ behavioral → cultural → ethical → systems → resilience → ecosystem
→ institutional-memory → collective → wisdom
```

### Late hard-DAG chain

```
ethical → systems → resilience → ecosystem → institutional-memory → collective → wisdom
```

Each late adapter declares a single hard predecessor (e.g. wisdom → `["collective"]`). Soft reads pull additional upstream context keys without DAG edges.

---

## 2. OIOS catalog vs platform modules

| Catalog | Count / notes |
|---------|----------------|
| `INTELLIGENCE_MODULE_IDS` | 39 active pipeline modules |
| `OIOS_INTELLIGENCE_DOMAINS` | Includes pipeline domains + dormant `legal`, `compliance`, `risk` |
| Platform-only | `oios-core` (module, not OIOS domain key) |

**Integrity:** Intentional per `JAG_V1_INTELLIGENCE_GRAPH.md`. Risk is documentation confusion if catalogs are treated as identical.

**Activation:** `defaultRegisteredDomains()` marks shipped domains active; legal/compliance/risk remain registered-only.

---

## 3. Dependency injection

### Entry points

| Entry | Role |
|-------|------|
| `createIntelligenceService()` | Wires all domain stacks + platform |
| `createIntelligencePlatform()` | Pipeline runtime + providers |
| `createXIntelligence()` | Per-domain DI factories |
| `createXModule()` | Infrastructure adapters |

### Assessment

- **Strength:** Optional stack injection on every factory; tests inject `createId` / `now` / wire flags.  
- **Weakness:** Wiring concentrated in `create-service.ts` (~1,300 lines).  
- **Integrity:** Terminal stacks expose `.wisdom`, `.collective`, `.institutionalMemory`, etc.

---

## 4. Circular dependency risks

### Mitigations in place

- Leaf `types.ts` / `contracts.ts` import types only (sampled wisdom/collective/ethical).  
- Soft `*ResultLight` DTOs instead of importing foreign implementations.  
- Infrastructure registry topo-sort throws on cycles (`CYCLIC_DEPENDENCY`).  
- Unit tests assert full pipeline completes with all modules `ok`.  

### Residual risks

| Risk | Evidence | Severity |
|------|----------|----------|
| Soft conceptual cycles | Domains soft-read each other via lights; learning loops list destinations | Low (types only) |
| Leaf boundary exceptions | `organization/types.ts`, `decision/types.ts` → `context/builder` | Medium |
| Fragile DAG edge | `organization-health` adapter `dependencies: []` | Medium |
| Name collisions | Two `CompetitiveIntelligence` classes | High (import risk, not runtime cycle) |

### Verdict

**No evidence of hard circular imports** among late intelligence packages under the leaf-types rule. Cycle risk is **low** at runtime; **medium** at maintainability for naming and fragile edges.

---

## 5. Soft integration graph (terminal domains)

Wisdom and collective soft-read many upstream keys (institutional-memory, knowledge, ethical, systems, resilience, opportunity, predictive, decision, etc.). Soft edges do **not** appear in `dependencies[]` and therefore do not reorder the DAG.

**Implication:** Soft-read data exists only if upstream modules already ran in the same pipeline execution (true for default order).

---

## 6. Broader repository dependency graph

| Layer | Depends on |
|-------|------------|
| Next app routes | Product libs, Supabase, platform registries |
| Product (admissions, EDI, FI, AIP) | Supabase tables + RLS |
| Intelligence pipeline | In-memory domain engines; optional DNA/OIOS/graph lights |
| Supabase | Migrations / RLS — not domain result stores |

Lean npm graph: Next + React + Supabase only in production dependencies.

---

## 7. Registry integrity checklist

| Check | Status |
|-------|--------|
| Module id in `INTELLIGENCE_MODULE_IDS` | Pass (39) |
| Adapter file per module | Pass (`infrastructure/modules/*.ts`) |
| Registered in `createDefaultIntelligenceModules()` | Pass |
| OIOS active for shipped domains | Pass (with documented dormants) |
| Terminal module is `wisdom` | Pass |
| Cycle detection present | Pass |
| Explicit dep for organization-health → DNA | **Gap** |
| Catalog equality OIOS ↔ MODULE_IDS | **Intentional mismatch** |

---

## 8. Recommendations

1. Add explicit `dependencies: ["organization-dna"]` (or oios-core) on organization-health.  
2. Document OIOS vs MODULE_IDS differences in one canonical table (done partially in JAG_V1 graph).  
3. Avoid hard edges between soft-read peers — keep learning loops soft.  
4. Resolve CompetitiveIntelligence naming to reduce import ambiguity.  
5. Split DI wiring without changing the DAG.  

---

## Diagram

```mermaid
flowchart LR
  DNA[organization-dna] --> OIOS[oios-core]
  OIOS --> OH[organization-health]
  OH --> FIN[financial]
  FIN --> ...[product modules]
  ... --> LCR[legal-compliance-risk]
  LCR --> MKT[market]
  MKT --> INN[innovation]
  INN --> IMP[impact]
  IMP --> ECO[economic]
  ECO --> CMP[competitive]
  CMP --> POL[political]
  POL --> ENV[environmental]
  ENV --> STK[stakeholder]
  STK --> REP[reputation]
  REP --> BEH[behavioral]
  BEH --> CUL[cultural]
  CUL --> ETH[ethical]
  ETH --> SYS[systems]
  SYS --> RSL[resilience]
  RSL --> ESM[ecosystem]
  ESM --> IMM[institutional-memory]
  IMM --> COL[collective]
  COL --> WIS[wisdom]
```
