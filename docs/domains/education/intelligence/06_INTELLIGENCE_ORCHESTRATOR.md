# 06 — Education Intelligence Orchestrator

**Program D2.6 — Domain Intelligence Execution**  
**Package:** `src/lib/domains/education/cognition/orchestrator`

---

## 1. Purpose

Single entry point for Education reasoning. Applications never call contributors or the Intelligence Graph directly.

---

## 2. Execution lifecycle

```text
EducationExecutionContext
  (Intent + Planner Context + Observations)
        ↓
Planner → EducationExecutionPlan
        ↓
Contributor Executor (respect stages / skips)
        ↓
Contributor Results
        ↓
Education Intelligence Graph
        ↓
EducationExecutionResult
  (plan + results + graph + telemetry + validation)
```

---

## 3. Planner integration

The orchestrator calls `createEducationPlanner().plan(...)` unchanged.

- Included contributors run  
- Skipped contributors are recorded, not executed  
- Plan validation issues are surfaced on the result  

---

## 4. Contributor execution

`executeEducationContributors` runs `plan.stages` in order:

1. Resolve observation for the contributor  
2. Call the contributor’s public `run*Intelligence` API  
3. Map results to `EducationContributorResult` when needed  
4. On failure: record reason, mark dependents skipped, continue  

Built-in runners:

| Contributor id | Observation | Runner |
|----------------|-------------|--------|
| `education.cognition.enrollment` | `observations.enrollment` | `runEnrollmentIntelligence` |
| `education.cognition.attendance` | `observations.attendance` | `runAttendanceIntelligence` |

Future contributors can be injected via `runners` without changing Core / Runtime / SDK.

---

## 5. Graph integration

Successful results are passed to `createEducationIntelligenceGraph().evaluateResults(...)`.

The graph remains a pure aggregator — the orchestrator does not alter graph internals.

---

## 6. Failure handling

| Event | Behavior |
|-------|----------|
| Contributor throws / missing observation | Record failure; do not crash |
| Dependent of a failed contributor | `skipped_dependent`; cascade |
| Other stages | Continue when possible |

---

## 7. Telemetry

Captured on every run:

- Executed / skipped / failed contributor ids  
- Skipped dependents + reasons  
- Duration (ms)  
- Evidence / recommendation / action proposal counts  
- Stage count / plan ok / analyzedAt  

---

## 8. Observations

Hosts supply normalized observations. The orchestrator:

- Does **not** access databases  
- Does **not** construct observations internally  
- Only routes provided observations to contributors  

---

## 9. Extensibility

No Core / Runtime / Domain SDK / contributor / graph changes required for new Education contributors — register a plan catalog entry and an optional `runners` override.
