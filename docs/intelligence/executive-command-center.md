# Executive Command Center (Sprint 068)

**Sprint:** 068  
**Domain:** Executive Command Center  
**Version:** 0.1.0  
**Module id:** `executive-command-center`  
**Package (intelligence DAG):** `src/lib/platform/intelligence/executive-command-center/`

> **Dual stack (maintainers):** Product **Mission Control 2.0 / ECC** for RC-6 lives at  
> `src/lib/platform/executive-command-center/` (executive Mission Control UI).  
> This document describes the Sprint 068 intelligence-pipeline module.  
> See [`docs/platform/rc-packages.md`](../platform/rc-packages.md).

## Purpose

A single executive workspace that composes the Executive Cognitive Stack into role-prioritized widgets.

- Every widget **consumes** an existing domain soft-read  
- **No duplicated** domain logic  
- Workspace **refreshes** from the intelligence pipeline  
- Personas share the same platform with different prioritization  

## Namespace verification

| Existing | Action |
|---|---|
| `src/lib/executive/command-center.ts` (legacy metrics) | Frozen — do not regenerate |
| `src/lib/platform/executive-command-center/` (RC-6 Mission Control 2.0) | **Active product package** — soft-reads KG / Copilot 2.0 |
| Automation Mission Control (`automation/**`) | Operational feed — distinct from ECC 2.0 |
| `components/executive/CommandCenterDashboard.tsx` | Frozen legacy UI |

Sprint 068 uses `executive-command-center` under the intelligence platform; RC-6 uses the top-level product package.

## Pipeline position

```
… → wisdom
     → synthesis
     → briefing
     → executive-memory
     → decision-intelligence
     → executive-predictive
     → executive-autonomous
     → executive-copilot
     → executive-command-center
```

Hard DAG predecessor: `executive-copilot`.

## Role layouts

| Role | First widgets (priority) |
|---|---|
| Founder | health → copilot → decisions → forecasts… |
| CEO | briefing → health → decisions → risks… |
| Board | risks → forecasts → decisions → health… |
| School Leader | risks → plans → approvals → signals… |

Same widget set; different order.

## Widgets (domain sources)

| Widget | Source domain |
|---|---|
| briefing / risks / opportunities / health | briefing (+ synthesis) |
| decisions | decision-intelligence |
| forecasts / signals | executive-predictive |
| approvals / plans | executive-autonomous |
| memory | executive-memory |
| copilot | executive-copilot |

## Drill-down actions

Every card supports (via ActionChip):

- Open Investigation  
- View Evidence  
- Compare  
- Forecast  
- Assign  
- Create Initiative  

## UI foundation

`src/components/executive-command-center/`:

- CommandCenterWorkspace  
- InteractiveCommandCenter (role switch + refresh via router)  
- CommandCenterWidget  
- WidgetCardActions (ActionChip drill-downs)  
- RoleLayoutSwitcher  
- RefreshBanner  

Route: `/dashboard/executive?view=command-center&role=ceo`  
(Legacy metrics remain at `?view=legacy-command-center`.)  

## Extension guide

1. Add a projector in `widgets/projectors.ts` (soft-read only).  
2. Register kind in `WIDGET_KINDS` and layout `widgetOrder`.  
3. Keep legacy command-center / Mission Control frozen.  
4. Preserve hard DAG on `executive-copilot`.

## Tests

```bash
npx vitest run tests/unit/intelligence/executive-command-center.test.ts
```
