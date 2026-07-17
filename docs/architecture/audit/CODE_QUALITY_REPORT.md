# Code Quality Report — JAG v1.0

> **HISTORICAL (H-A8).** Prefer [../phase-a/](../phase-a/). **Current truth:** [../README.md](../README.md).

> **Superseded in part by Stabilization A1–A4 (July 2026).**  
> Recommendations to split `create-service` and introduce `common/` were implemented.  
> Retained as historical baseline. See `../STABILIZATION_A5_CLEANUP.md`.

**Branch:** `v1.0-stabilization`  
**Date:** July 13, 2026  
**Constraint:** Reports only.

---

## Naming

### Strengths

- Late domains follow consistent kebab-case package folders and snake_case area keys.  
- Domain keys generally match folder names (`wisdom`, `collective`, `ethical`).  
- ID prefixes are documented (`wis-`, `col-`, `imm-`, `esm-`, etc.).  

### Issues

| Issue | Examples | Severity |
|-------|----------|----------|
| Double `-intelligence` filenames | `collaborative-intelligence-intelligence.ts`, `media-intelligence-intelligence.ts`, `expertise-intelligence-intelligence.ts` | Medium |
| Folder vs module id | `predictive-intelligence/` vs `"predictive"` | Medium |
| Routing domain location | `domains/executive/` without top-level `executive/` | Medium |
| Class name collisions | `CompetitiveIntelligence`, `ValuesAlignmentIntelligence` | High |
| Test naming trap | `finance.test.ts` ≠ financial pipeline adapter | Low |
| Product “intelligence” overload | AIP hub vs OIOS pipeline vs FI intelligence | Medium |

---

## Consistency

### Strong consistency (late sprints)

Across S046–060 packages:

- `types.ts` / `contracts.ts` / `models.ts` / `index.ts`  
- Area factories + suite engines  
- README / ARCHITECTURE / VERIFICATION / CHANGELOG  
- Unit test shape (version, lens keys, learning destinations, DI, pipeline order)  

### Inconsistencies

| Area | Observation |
|------|-------------|
| Early vs late domain style | Pre-046 packages (market, knowledge, human-capital) use richer custom engines; late packages use factory stubs |
| Early-warning engines | Present in most late domains; absent in competitive/economic |
| Docs location | Some sprints have `docs/architecture/SPRINT*.md`; 045–060 often package-local only |
| Export surface | Root `intelligence/index.ts` is a large re-export barrel — growing linearly |

---

## Readability

### Strengths

- Leaf contracts are easy to navigate.  
- Capstone graph doc clarifies terminal chain.  
- Adapter files are short and predictable.  

### Weaknesses

- `create-service.ts` is difficult to review (~1,300 lines).  
- Generated one-line area classes are readable but obscure real scoring logic (baseline-driven).  
- Encoding issues historically appeared in some READMEs (fixed in places; risk remains with non-ASCII).  

---

## Maintainability

| Factor | Rating | Notes |
|--------|--------|-------|
| Adding a new domain | Medium | Clear pattern, but touches create-service + modules index + OIOS + tests everywhere |
| Changing scoring semantics | Poor | Must edit dozens of models.ts copies |
| Changing repository persistence | Poor | 33 clones |
| Freezing packages | Good | Convention enforced; soft reads preserve isolation |
| Onboarding | Medium | Stale domain model docs hurt |

**Primary maintainability risk:** Copy-paste architecture at scale without a shared common module.

---

## TypeScript quality

### Strengths

- Strict contracts and typed stacks.  
- `import type` usage in leaf modules.  
- Build includes `tsc --noEmit` and test tsconfig.  

### Issues

- Large barrel exports increase compile coupling.  
- Soft light types duplicated rather than shared generics.  
- Some `Record<string, unknown>` metadata bags reduce precision.  

---

## Dead code / unused exports (observed risks)

| Category | Observation | Confidence |
|----------|-------------|------------|
| Terminal domain UI consumers | wisdom/collective unused by `src/app` | High — unused product surface, not unused code |
| Generator scripts | `scripts/generate-*-intelligence.mjs` | Medium — tooling, not dead |
| Dormant OIOS keys | legal/compliance/risk | Intentional |
| Meta packages | `dashboard/`, `memory/` | Need ownership docs |

Full unused-export elimination would require knip/ts-prune (not run in this audit). Recommend adding such a tool in stabilization.

---

## Folder organization

```
src/lib/platform/intelligence/
  infrastructure/     # shared runtime — good
  domains/            # executive/strategic/support routing — historical
  <domain>/           # product domains — good
  create-service.ts   # DI monolith — organizational smell
```

**Recommendation:** Keep domain folders; introduce `common/`; split create-service; document `domains/` as legacy cognitive routing.

---

## Test quality

- Intelligence unit tests are systematic and assert pipeline order — excellent for DAG integrity.  
- Many tests assert synthetic scores `> 0` rather than business correctness — appropriate for baseline engines, weak as product acceptance.  
- Integration tests cover platform registries more than domain truthfulness.  

---

## Recommendations

1. Enforce naming lint for `*-intelligence-intelligence.ts`.  
2. Add knip/ts-prune to CI for unused exports.  
3. Extract common scoring/repository modules.  
4. Refresh `INTELLIGENCE_DOMAIN_MODEL.md` or mark deprecated.  
5. Glossary distinguishing AIP / FI / OIOS pipeline.  
6. Keep ASCII-only docs for generated packages.  
