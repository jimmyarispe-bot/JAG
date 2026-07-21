# Organizational Digital Twin (Sprint 071)

**Sprint:** 071  
**Domain:** Organizational Digital Twin  
**Version:** 0.1.0  
**Module id:** `digital-twin`  
**Package:** `src/lib/platform/intelligence/digital-twin/`

> Product Copilot / Mission Control soft-read this module; they do not own a separate `platform/digital-twin` package. See [`docs/platform/rc-packages.md`](../platform/rc-packages.md).

## Purpose

A living strategic sandbox that models system-wide interactions so executives can simulate change before implementation. Soft-reads Portfolio / Initiative / Predictive outputs — never mutates production data.

Distinct from frozen OIOS foundation `OrganizationalDigitalTwin` (`src/lib/platform/oios/organizational-digital-twin.ts`).

## Namespace verification

| Existing | Action |
|---|---|
| OIOS `organizational-digital-twin.ts` | Frozen foundation snapshot |
| Executive Predictive scenario engines | Frozen domain helpers |
| `innovation-portfolio` / portal portfolio | Frozen |

## Architecture

```
digital-twin/
  engine/     twin, simulation, impact, constraint, state
  scenarios/  staffing, finance, enrollment, facilities, operations, custom
  models/     organization, dependency, capacity, resource
  services/   twin-service
```

## Simulation lifecycle

1. Build live model from soft-reads  
2. Create isolated scenario state (`isolated: true`)  
3. Apply scenario mutations to clone only  
4. Evaluate constraints  
5. Analyze cross-domain impacts  
6. Compare + recommend (advisory)

## Constraint model

Budget ceiling, staffing limits, capacity thresholds, compliance rules, governance approval (Sprint 066 — human authorization required).

## Scenario framework

Hire teachers, close campus, open location, reduce budget, increase enrollment, expand virtual, launch initiative, custom.

## Explainability

Assumptions, confidence, inputs used, domains consulted, constraints encountered, uncertainties.

## Integration diagram

```
… → initiative-intelligence
     → portfolio-intelligence
     → digital-twin
```

Hard DAG predecessor: `portfolio-intelligence`.

## ECC widgets

Active Simulations, Scenario Comparison, Highest-Impact Opportunities, Constraint Alerts, Recommended Scenario.

## Extension guide

1. Add scenario factories under `scenarios/`.  
2. Soft-read new lights in `types.ts` only.  
3. Keep `mayAutoExecute: false`.  
4. Do not regenerate OIOS foundation twin.

## Tests

```bash
npx vitest run tests/unit/intelligence/digital-twin.test.ts
```
