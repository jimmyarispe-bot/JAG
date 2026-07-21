# Initiative Intelligence (Sprint 069)

**Sprint:** 069  
**Domain:** Initiative Intelligence  
**Version:** 0.1.0  
**Module id:** `initiative-intelligence`  
**Package:** `src/lib/platform/intelligence/initiative-intelligence/`

## Purpose

The organizational execution layer that transforms approved recommendations into measurable strategic initiatives — the permanent objects representing meaningful change.

Examples: Increase Enrollment, Open New Campus, Improve Reading Outcomes, Reduce Operating Costs, Medicaid Expansion, AI Rollout, Grant Application, Accreditation, Teacher Recruitment, Curriculum Modernization.

## Namespace verification

| Existing | Action |
|---|---|
| `domains/strategic` initiatives helper | Frozen |
| `execution/initiatives` | Frozen |
| `board-governance/strategic-initiative-tracker` | Frozen |
| `executive-memory/entities/initiative` | Frozen |

Sprint 069 uses `initiative-intelligence` under the intelligence platform.

## Lifecycle model

`proposed → approved → planned → active ⇄ at_risk / on_hold → completed | cancelled → archived`

Every transition is timestamped and attributable by **role** (not hard-coded users).

## Architecture

```
initiative-intelligence/
  engine/     initiative, lifecycle, dependency, progress, outcome
  planning/   milestones, objectives, kpis, owners, budget
  tracking/   progress, blockers, risks, timeline, health
  services/   initiative-service
```

## KPI framework

Weighted KPI achievement: `sum((actual/target) * weight) / sum(weight)`.

## Progress calculations

- Percent complete from nested work breakdown  
- Milestone completion ratio  
- Schedule variance (days)  
- Budget variance (absolute + %)  
- Health: Healthy / Watch / At Risk / Critical  

## Risk management

Open risks scored by severity × likelihood. Escalation when severity ≥ 70 and likelihood ≥ 50.

## Budget tracking

Planned / actual / forecast with soft consumption of financial intelligence signals — no duplicated FI calculations.

## Outcome measurement

On completion: actual outcomes, KPI results, budget/timeline performance, lessons learned → Executive Memory persistence flag.

## Integration diagram

```
Executive Brief → Decision → Predictive → Autonomous
        → Copilot → Command Center → Initiative Intelligence
        → Execution → Measurement → Lessons → Executive Memory
```

Hard DAG predecessor: `executive-command-center`.

## ECC widgets

Active Initiatives, At-Risk Initiatives, Upcoming Milestones, Budget Variance, Recently Completed Initiatives — projected via existing ECC widget architecture (soft-read lights; initiative module re-enriches ECC in the same pipeline pass).

## Extension guide

1. Add planning helpers under `planning/` without importing peer engines.  
2. Soft-read new upstream lights in `types.ts`.  
3. Keep ownership as RBAC assignment keys.  
4. Preserve hard DAG on `executive-command-center`.  
5. Do not regenerate frozen initiative helpers.

## Tests

```bash
npx vitest run tests/unit/intelligence/initiative-intelligence.test.ts
```
