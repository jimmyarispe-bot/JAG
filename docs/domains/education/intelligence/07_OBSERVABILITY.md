# 07 — Education Intelligence Observability

**Program D2.7 — Execution Transparency**  
**Package:** `src/lib/domains/education/cognition/observability`

---

## 1. Purpose

Make every Education intelligence execution **explainable**.

This package is **diagnostic only**. It does not change planner, contributor, graph, or orchestrator intelligence behavior.

---

## 2. Surfaces

| Surface | Role |
|---------|------|
| Trace | Intent, planner decisions, stages, order, skips, dependency expansion, completion |
| Timeline | Ordered events across the pipeline |
| Metrics | Durations, counts, failures, warnings, skips |
| Recommendation audit | Origin, confidence, priority, evidence ids, constitutional trace |
| Evidence audit | Origin contributors, phase, attributes |
| Snapshot | Immutable frozen capture of the full run |

---

## 3. Tracing

`EducationExecutionTrace` records:

- Intent id / label  
- Planner include/skip decisions + reasons  
- Execution stages  
- Contributor order  
- Skipped contributors  
- Dependency expansion for included nodes  
- Completion timestamp  

---

## 4. Timeline

Ordered event kinds:

1. `planning` / `planning_completed`  
2. `contributor_started` / `contributor_completed` / `contributor_failed`  
3. `contributor_skipped` / `contributor_skipped_dependent`  
4. `graph_aggregation`  
5. `recommendation_generation`  
6. `pipeline_completion`  

Events are sequenced (`seq`) for deterministic ordering checks.

---

## 5. Metrics

Aggregate + per-contributor:

- Execution duration  
- Contributor durations  
- Recommendation / evidence / action proposal counts  
- Failures / warnings / skipped / executed counts  
- Graph-level counts (recommendations, evidence, conflicts)  

---

## 6. Auditing

**Recommendations** — contributor + graph entries with origin contributor ids, confidence, priority, evidence ids, constitutional trace chain.

**Evidence** — contributor + graph entries with origin contributor ids and phase.

---

## 7. Snapshots

`buildEducationExecutionSnapshot(...)` returns a **deep-frozen** object suitable for:

- Replay / debugging  
- Golden tests  
- Offline inspection  

---

## 8. Orchestrator integration

Every `orchestrator.execute(...)` return value exposes:

```ts
const {
  result,      // self-reference (full EducationExecutionResult)
  telemetry,
  snapshot,
  trace,
  timeline,
  metrics,
} = orchestrator.execute({ intent, observations });
```

Intelligence outcomes (plan, contributor results, graph) are unchanged; observability is additive.

---

## 9. Guarantees

- No Core / Runtime / Domain SDK changes  
- Contributors and Graph unchanged  
- Diagnostic-only — no side effects, no persistence, no UI  
