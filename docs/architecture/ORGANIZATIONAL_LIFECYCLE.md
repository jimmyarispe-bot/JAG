# Organizational Lifecycle (OIOS)

## Purpose

Define how OIOS understands and advances organizational lifecycle stages.

## Stages

Aligned with Organizational DNA:

`idea → startup → operating → growth → turnaround → acquisition → exit`

Type: `OiosLifecyclePhase` (alias of DNA `OrganizationStage`).

## Resolution

`OrganizationalLifecycle.resolve(dna, baseline)`:

1. Prefer DNA stage when DNA is present
2. Else derive from baseline risk/execution signals:
   - high risk → `turnaround`
   - strong execution → `growth`
   - moderate execution → `operating`
   - default → `startup`

## State engine

`OrganizationalStateEngine.derive()` produces:

- lifecycle phase
- health / maturity / readiness scores
- active domains
- risk narratives

State feeds the Digital Twin and Organizational Context.

## Improvement loop across lifecycle

Regardless of stage, OIOS runs:

`assess → prioritize → plan → execute → measure → learn`

Stage changes the **content** of opportunities and strategy, not the loop itself.

## Integration with DNA

DNA owns genotype + Company Builder stage detection.  
OIOS owns operating-system lifecycle consumption and twin projection.
