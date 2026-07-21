# Portfolio Intelligence (Sprint 070)

**Sprint:** 070  
**Domain:** Portfolio Intelligence  
**Version:** 0.1.0  
**Module id:** `portfolio-intelligence`  
**Package:** `src/lib/platform/intelligence/portfolio-intelligence/`

## Purpose

Enterprise portfolio management over Initiative Intelligence (069). Optimizes strategic alignment, capacity, allocation, risk, and expected impact across the full initiative set.

## Namespace verification

| Existing | Action |
|---|---|
| `innovation/innovation-portfolio-intelligence.ts` | Frozen |
| `portal/portfolio` (non-intelligence) | Leave alone |

## Portfolio model

Registry of initiatives, programs, strategic themes, budgets, owners, risks, KPIs, and capacity allocation.

## Prioritization methodology

Composite score from impact, alignment, ROI, inverted risk, urgency, inverted resource demand, executive priority, and prediction confidence.

## Capacity planning

Tracks budget, staff, leadership attention, operational bandwidth, and time pressure. Flags overcommitment, underutilization, and bottlenecks.

## Health calculations

Aggregates initiative health, budget/schedule performance, risk index, capacity utilization, completion rate, and strategic coverage → Excellent / Healthy / Watch / At Risk / Critical.

## Optimization strategies

Advisory recommendations only: sequence changes, resource shifts, deferrals, accelerations, consolidations, retirements. Respects Sprint 066 Autonomous governance (human authorization required).

## Scenario planning

Current, budget reduction/expansion, hiring freeze, accelerated growth, and executive custom scenarios — soft-reads Executive Predictive.

## Integration architecture

```
… → executive-command-center
     → initiative-intelligence
     → portfolio-intelligence
```

Hard DAG predecessor: `initiative-intelligence`.

ECC widgets (soft-read projectors; portfolio module re-enriches ECC): Portfolio Health, Priority Matrix, Capacity Utilization, Budget Allocation, Cross-Initiative Risks, Recommended Portfolio Changes.

## Extension guide

1. Add scoring helpers under `scoring/` without peer engine imports.  
2. Soft-read new lights in leaf `types.ts`.  
3. Keep optimizations advisory (`advisory: true`, `autoExecute: false`).  
4. Do not regenerate frozen innovation portfolio helper.

## Tests

```bash
npx vitest run tests/unit/intelligence/portfolio-intelligence.test.ts
```
