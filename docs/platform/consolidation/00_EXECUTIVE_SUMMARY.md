# P-013A — AcademyOS + JAG Complete Platform Consolidation

| Field | Value |
|-------|--------|
| **Sprint** | P-013A |
| **Type** | Critical architecture consolidation (**documentation only**) |
| **Status** | Complete |
| **Code / UI / DB changes** | **None** — no new engines, features, redesigns, or migrations |
| **Relation to P-013** | Distinct from **P-013 JAG CFO™** (`packages/platform/cfo/`) |
| **Relation to P-010A** | Extends Domain Integration™ with live screens, workflows, forms, portals, roles, and one product spec |

---

## Primary goal

Merge the original AcademyOS product with the JAG Organizational Intelligence Operating System into **ONE canonical platform**.

**AcademyOS becomes the Education Intelligence Domain of JAG** — not a parallel product, not a fork, not a second operating system.

```
JAG Organizational Intelligence Operating System (OIOS)
  └── Shared Engines (Identity, Org, Finance, CFO, Knowledge, Workflow, …)
        └── Industry Intelligence
              └── Education Intelligence = AcademyOS
```

---

## What this sprint delivers

| Doc | Purpose |
|-----|---------|
| [01_COMPLETE_CAPABILITY_MASTER_LIST](./01_COMPLETE_CAPABILITY_MASTER_LIST.md) | Every capability recovered and classified |
| [02_FRONTEND_SCREEN_CATALOG](./02_FRONTEND_SCREEN_CATALOG.md) | Every major screen / route family |
| [03_WORKFLOW_CATALOG](./03_WORKFLOW_CATALOG.md) | Every business workflow |
| [04_FORM_LIBRARY](./04_FORM_LIBRARY.md) | Every registered form |
| [05_PORTAL_MAP](./05_PORTAL_MAP.md) | Public, parent, student, apply portals |
| [06_ROLE_EXPERIENCE_MAP](./06_ROLE_EXPERIENCE_MAP.md) | Every role → home, nav, AI, docs |
| [07_ENGINE_MAPPING](./07_ENGINE_MAPPING.md) | Every surface → canonical engines |
| [08_UI_COMPONENT_LIBRARY](./08_UI_COMPONENT_LIBRARY.md) | Reusable UI building blocks |
| [09_BACKLOG_RECONCILIATION](./09_BACKLOG_RECONCILIATION.md) | Completed / Integrated / Refactor / … |
| [10_CANONICAL_PRODUCT_SPEC](./10_CANONICAL_PRODUCT_SPEC.md) | **Master product specification** |

---

## Non-goals (explicit STOP)

- No new engines  
- No new product features  
- No UI redesign  
- No database changes  
- No parallel AcademyOS  

---

## Canonical references (do not fragment)

| Concern | Source of truth |
|---------|-----------------|
| Product architecture | **This pack → [10_CANONICAL_PRODUCT_SPEC](./10_CANONICAL_PRODUCT_SPEC.md)** |
| Shared vs education layer | `docs/platform/domain-integration/` (P-010A) |
| Roadmap sequencing | `docs/platform/domain-integration/06_MASTER_ROADMAP.md` |
| Shared Finance / CFO / Knowledge | `packages/platform/{finance,cfo,knowledge}` |
| Education pack | `packages/academyos/` |
| App composition | `src/applications/academyos/` |

---

## Success criteria

- [x] Every AcademyOS capability recovered into the master list  
- [x] Workflows, screens, forms, portals, dashboards, roles documented  
- [x] Every major surface mapped to canonical engines  
- [x] Duplicates identified for retirement **after** shared ownership  
- [x] One canonical product architecture and specification  
- [x] Master roadmap updated to include P-013A  

**Next feature sprint:** P-015 — Learning Intelligence™ (integrate existing mastery/assessment IP; do not rebuild).
