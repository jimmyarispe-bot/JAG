# 03 — Dependency Improvements

**Phase:** B · **Date:** 2026-07-17

---

## DAG / pipeline

| Change | Before | After | Effect |
|--------|--------|-------|--------|
| organization-health | `dependencies: []` | `["oios-core"]` | Explicit foundation edge; partial runs pull dna → oios-core → health → financial |

Registration order in `INTELLIGENCE_MODULE_IDS` already placed health after oios-core; the empty deps array was the fragility (M-A3).

---

## Import graph

| Change | Effect |
|--------|--------|
| Platform callers leave mega-barrel | Lower accidental compile fan-in; clearer ownership |
| Mission Control facets | Orchestrator no longer owns priority/OEI/AI-brief helpers inline |
| executive-workflows canonical path | Separates from `platform/workflow` engine cognitively |

---

## Compatibility shims (intentional)

| Shim | Target | Removal criteria |
|------|--------|------------------|
| `@/lib/platform/workflows` | `executive-workflows` | Zero external imports remain |
| `CompetitiveIntelligence` market alias | `MarketCompetitiveIntelligence` | Call sites migrated |

---

## Direction rules reinforced

1. Domains → `intelligence/common` (never reverse)  
2. App / exec → domain or service entrypoints (not frozen internals)  
3. ADR dual stacks remain dual until an epic says otherwise  
