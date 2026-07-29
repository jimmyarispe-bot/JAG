# 08 — Canonical UI Component Library

**Reuse first.** This sprint identifies reusable building blocks — it does **not** redesign UI.

Primary inventories:  
`docs/applications/academyos/ui/00_UI_INVENTORY.md` · workspace design system · `src/components/**`

---

## A. Shells & navigation

| Component family | Where | Reuse rule |
|------------------|-------|------------|
| App / dashboard shell | Workspace design system, exec shell | One staff shell pattern |
| Portal shell | `src/app/portal/layout` | One family shell |
| Marketing shell | `(marketing)/layout` | Public brand surface |
| Role navigation packs | Dashboard navigation libs | Driven by Identity roles |

## B. Data & layout primitives

| Component | Use |
|-----------|-----|
| Forms / Form framework bindings | All create/edit |
| Tables / data grids | Lists, rosters, ledgers |
| Cards | Interaction containers only (not decorative clutter) |
| Dashboards / KPI strips | Executive, school, finance |
| Charts | Analytics, CFO, mastery |
| Calendars | School + shared calendar |
| Timeline | Student history, Knowledge timeline, finance audit |
| Wizards | Admissions, enrollment, onboarding |
| Empty / loading / error states | Shared patterns |

## C. Domain viewers

| Component | Use | Engine |
|-----------|-----|--------|
| Document viewer | Staff + portal docs | Knowledge |
| Evidence viewer | Citations / facts | Knowledge |
| Knowledge graph viewer | Graph exploration | Knowledge |
| Workflow tracker | Stage progress | Workflow |
| Approval panels | Gates | Workflow |
| Upload / dropzone | Files | Knowledge |
| Signature hook UI | Acknowledge / sign | Workflow + Knowledge |
| Messaging / threads | Comms | Notifications |
| Comments | Records | Shared pattern |
| AI panel | Coach / CFO ask | Mr. JAG / CFO |

## D. Education-specific UI (keep in Education Domain)

| Family | Examples |
|--------|----------|
| Admissions pipeline boards | Case stages, document checklist |
| Teacher “today” | Classes, attendance take |
| Mastery / progress visuals | After P-015 — consume LI APIs |
| IEP/504 editors | Education SoR forms |
| Family finance widgets | Adapter over Revenue balances |

## E. Consolidation rules

1. Prefer shared shells/components before new one-offs.  
2. Document/evidence UI binds to **KnowledgeEngine** APIs.  
3. Finance widgets bind to **Finance / Reporting / CFO** — not a parallel edu charting model.  
4. No hero/marketing redesign in product dashboards (product rules remain).  
5. Accessibility and mobile: extend existing shells; no parallel mobile design system in this sprint.
