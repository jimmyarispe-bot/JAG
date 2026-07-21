# Autonomous Intelligence (Sprint 066)

**Sprint:** 066  
**Domain:** Autonomous Intelligence  
**Version:** 0.1.0  
**Module id:** `executive-autonomous`  
**Package:** `src/lib/platform/intelligence/executive-autonomous/`

## Purpose

Transform Decision Intelligence recommendations into **prepared execution plans**.

The system prepares checklists, dependencies, approvals, timelines, and rollback paths.  
**It does not automatically execute organizational actions.**

## Human-in-the-loop philosophy

| System does | Humans do |
|---|---|
| Generate execution plans | Authorize execution |
| Resolve prerequisites | Supply missing information |
| Route role-based approvals | Approve / reject as accountable owners |
| Prepare documents & milestones | Submit, hire, spend, or communicate |
| Define rollback conditions | Trigger recovery when needed |

Executives remain accountable for decisions.

## Pipeline position

```
… → wisdom
     → synthesis
     → briefing
     → executive-memory
     → decision-intelligence
     → executive-predictive
     → executive-autonomous
```

Hard DAG predecessor: `executive-predictive`.  
Soft-reads: decision-intelligence and executive-predictive result lights.

## Architecture

- `engine/` — autonomous, orchestration, execution planner, approval engines
- `workflows/` — staffing, finance, enrollment, compliance, grants, operations templates
- `planning/` — dependencies, sequencing, rollback, readiness validation
- `approvals/` — policy catalog + role routing (no hard-coded person names)

## Workflow lifecycle

1. Ingest recommendation (+ optional prediction influence)
2. Select workflow template
3. Sequence tasks and estimate duration
4. Route policy-driven approvals
5. Resolve prerequisites (approvals, info, resources, budget, compliance)
6. Score readiness
7. Build rollback plan
8. Assemble preparation package (checklist, documents, owners, timeline)
9. **Stop for human authorization**

## Approval routing

Roles only (examples): founder, CEO, executive director, school leader, board, finance lead, compliance lead.

Policies may apply thresholds (financial impact, risk, effort). Missing required routes surface as policy violations / blocked readiness.

## Rollback strategy

Every plan includes:

- Rollback conditions
- Recovery steps
- Required notifications (by role)
- Impact assessment

## Readiness states

`ready` · `blocked` · `waiting_approval` · `waiting_resources` · `waiting_information` · `scheduled`

## UI foundation

`src/components/autonomous-intelligence/`:

- ExecutionPlanCard
- ApprovalQueue
- DependencyGraph
- WorkflowTimeline
- ReadinessBadge
- RollbackPanel

## Extension guide

1. Add a template under `workflows/` and register in `workflows/index.ts`.
2. Add policies in `approvals/policies.ts` (roles only).
3. Keep soft-read lights in `types.ts` — do not import peer engines.
4. Preserve hard DAG: depend only on `executive-predictive`.
5. Never add auto-execution side effects.

## Example execution plan

> **Objective:** Close staffing gap — Hire temporary teachers  
> **Workflow:** staffing · ~33 days  
> **Tasks:** confirm role → source → interview → onboard  
> **Approvals:** school leader, executive director (+ finance/CEO if financial threshold met)  
> **Readiness:** waiting approval / information until packets complete  
> **Rollback:** revert requisition, restore interim coverage, notify campus + HR  
> **Authorization:** no offer or posting without recorded human approval

## Tests

```bash
npx vitest run tests/unit/intelligence/executive-autonomous.test.ts
```
