# 001 — JAG Executive Command Center

**Sprint:** JAG-001  
**Route:** `/jag`  
**Status:** Shell complete · Overview populated in [002_EXECUTIVE_OVERVIEW.md](./002_EXECUTIVE_OVERVIEW.md)

---

## 1. Purpose

The Executive Command Center is the first production UI for **JAG** — the Organizational Intelligence Operating System.

It is **not** AcademyOS. AcademyOS remains a domain product launched from JAG.

This shell gives leadership a dense, dark, operational surface for:

- Organization context
- Domain and capability pack discovery
- Intelligence services (planner, policy, knowledge, graph)
- Future briefing and observability views

No JAG Core, Runtime, or Domain SDK changes are required for this shell.

---

## 2. Layout

`src/app/jag/layout.tsx` provides:

| Region | Role |
|--------|------|
| Left navigation | Primary Command Center destinations |
| Top header | JAG mark, organization selector, domain selector, search, current user |
| Main content | Page body |

Login (`/jag/login`) is excluded from the shell.

Authentication continues to use the existing JAG Platform session (`getJagPlatformSession`). Unauthenticated visits redirect to `/jag/login`.

---

## 3. Navigation

| Item | Path |
|------|------|
| Overview | `/jag` |
| Decision Center | `/jag/decisions` — see [003_DECISION_CENTER.md](./003_DECISION_CENTER.md), [004_DECISION_EXECUTION.md](./004_DECISION_EXECUTION.md) |
| Executive Briefings | `/jag/briefings` — see [005_EXECUTIVE_BRIEFING_ENGINE.md](./005_EXECUTIVE_BRIEFING_ENGINE.md) |
| Organizations | `/jag/organizations` |
| Domains | `/jag/domains` |
| Capability Packs | `/jag/capability-packs` |
| Knowledge | `/jag/knowledge` |
| Policies | `/jag/policies` |
| Intelligence Graph | `/jag/intelligence-graph` |
| Observability | `/jag/observability` |
| Runtime | `/jag/runtime` |
| Settings | `/jag/settings` |

Reusable nav catalog: `src/components/jag/command-center/nav.ts`.

---

## 4. Overview page

Overview cards support **Loading / Empty / Ready**.

Cards consume real services where available (Education capability packs, knowledge model, planner catalog, policy registry, organizations for the session). When no live session data exists (executive brief, orchestrator run, runtime binding, observability traces), cards render informative **empty** states — they do not invent metrics.

---

## 5. Components

Under `src/components/jag/command-center/`:

- `JagCommandShell`
- `JagSidebar`
- `JagHeader`
- `JagCard`
- `JagMetric`
- `JagStatusBadge`
- `JagSection`
- `JagOverviewGrid`
- `JagPlaceholderPage`

Design direction: Linear / Vercel / Palantir / Apple — dark-first, minimal, dense, no gradients, no marketing graphics.

---

## 6. Future pages

Planned expansions (UI only unless product requires otherwise):

1. Live Executive Briefing viewer bound to Education Executive Intelligence results  
2. Runtime session attach / lifecycle panel  
3. Orchestrator run console + observability timeline  
4. Multi-domain registry beyond Education  
5. Cross-organization network health  
6. Command palette search over packs, policies, and evidence  

---

## 7. Constraints

- Do not modify JAG Core  
- Do not modify Runtime  
- Do not modify Domain SDK  
- Do not weaken authentication  
- Do not fabricate overview metrics  
