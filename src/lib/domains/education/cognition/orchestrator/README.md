# Education Intelligence Orchestrator

Single entry point for Education domain reasoning.

## Pipeline

```text
Intent + Context + Observations
        ↓
Planner → Execution Plan
        ↓
Contributor Executor (by stage)
        ↓
Education Intelligence Graph
        ↓
Unified Education Result + Telemetry
```

Applications should call the orchestrator — not contributors or the graph directly.

## Usage

```ts
import { createEducationIntelligenceOrchestrator } from "@/lib/domains/education";

const orchestrator = createEducationIntelligenceOrchestrator();
const {
  result,
  telemetry,
  snapshot,
  trace,
  timeline,
  metrics,
} = orchestrator.execute({
  intent,
  observations: {
    enrollment: enrollmentObservation,
    attendance: attendanceObservation,
  },
});

// result.graphResult — unified recommendations / evidence / proposals
// telemetry / trace / timeline / metrics / snapshot — D2.7 observability
```

## Guarantees

- Does not modify Core, Runtime, Domain SDK, contributors, or the graph
- Does not access databases or construct observations
- Contributor failures are recorded; dependents are skipped; pipeline continues

## Docs

[`docs/domains/education/intelligence/06_INTELLIGENCE_ORCHESTRATOR.md`](../../../../../docs/domains/education/intelligence/06_INTELLIGENCE_ORCHESTRATOR.md)
