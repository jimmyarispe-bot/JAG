# Education Intelligence Observability

Diagnostic-only package for Education intelligence execution transparency.

## What it captures

- **Trace** — intent, planner decisions, stages, order, skips, dependencies  
- **Timeline** — ordered planning → contributor → graph → completion events  
- **Metrics** — durations, counts, failures, warnings  
- **Audits** — recommendation / evidence origin, confidence, priority, traces  
- **Snapshot** — immutable full-run capture for replay / debugging  

## Usage

Observability is produced by the orchestrator on every `execute()`:

```ts
const {
  result, // alias fields also on the return value
  telemetry,
  snapshot,
  trace,
  timeline,
  metrics,
} = orchestrator.execute({ intent, observations });

// Prefer the frozen snapshot for persistence / tests:
snapshot.recommendationAudit.entries;
snapshot.timeline.events;
```

Does **not** change Core, Runtime, Domain SDK, contributors, or graph behavior.

## Docs

[`docs/domains/education/intelligence/07_OBSERVABILITY.md`](../../../../../docs/domains/education/intelligence/07_OBSERVABILITY.md)
