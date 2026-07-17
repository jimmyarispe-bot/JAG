# 04 — Technical Debt Reduction

**Phase:** B · **Date:** 2026-07-17

---

## Closed or materially reduced

| ID | Item | Status |
|----|------|--------|
| M-A1 / D-01 | ResultLightBase ×16 | **Closed** — shared common type |
| H-A2 / D-06 | workflow vs workflows naming | **Closed** — rename + shim |
| H-A3 / D-03 | CompetitiveIntelligence collision | **Closed** — market rename |
| H-A1 | Intelligence surfaces map | **Closed** — published |
| H-A11 | Mega-barrel coupling | **Reduced** — guidance + caller migration started |
| H-A12 | mission-control-compose hub | **Reduced** — facet split; facade retained |
| M-A3 | organization-health empty deps | **Closed** |
| M-A5 | MODULE_IDS orientation | **Closed** — surfaces map section |

---

## Remaining (accepted / deferred)

| ID | Item | Severity | Plan |
|----|------|----------|------|
| C-A1 | Non-durable OIOS results | Critical | Wave 1 |
| H-A4 | Sequential 39-module pipeline | High | Phase C / Wave 3 |
| H-A5 | Process-scoped memory | High | With C-A1 |
| H-A6 / H-A7 | Dual executive-graph / finance | High | ADR enforce; epic later |
| D-02 | Engine/projection shells | Medium–High | Freeze / parameterized later |
| H-A9 residual | Live migrate 171+172 | High (ops) | Security ops |
| Mega-barrel | Still exists for compat | Medium | Continue subpath migration |
| workflows shim | Compat path | Low | Remove after migration |

---

## Counts (architecture register lens)

| | Phase A open | Phase B after |
|--|-------------:|--------------:|
| Critical architecture (product durability) | 3 (C-A1–C-A3) | **1** (C-A1; C-A2/C-A3 closed in A.1) |
| High naming/coupling targets addressed this phase | — | **H-A1, H-A2, H-A3, H-A11↓, H-A12↓** |
| Medium duplication targets closed | — | **M-A1, M-A3, M-A5** |
