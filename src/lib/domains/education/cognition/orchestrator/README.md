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
const result = orchestrator.execute({
  intent,
  observations: {
    enrollment: enrollmentObservation,
    attendance: attendanceObservation,
  },
});

// result.graphResult — unified recommendations / evidence / proposals
// result.telemetry — executed / skipped / failures / counts
```

## Guarantees

- Does not modify Core, Runtime, Domain SDK, contributors, or the graph
- Does not access databases or construct observations
- Contributor failures are recorded; dependents are skipped; pipeline continues

## Docs

[`docs/domains/education/intelligence/06_INTELLIGENCE_ORCHESTRATOR.md`](../../../../../docs/domains/education/intelligence/06_INTELLIGENCE_ORCHESTRATOR.md)
