# Sprint 202 — Scenario Planning Engine

**Status:** Complete (Phase II)  
**Scope:** Application services + Command Center UI. No JAG Core or Runtime interface changes.

---

## 1. Objective

Allow executives to model **hypothetical changes** before deciding.

Every scenario is **advisory**. Every result explains:

| Element | Purpose |
|---------|---------|
| Inputs | Structured change parameters |
| Assumptions | Continuity, timing, magnitude, external |
| Projected impacts | Current vs scenario vs difference |
| Confidence | Evidence strength, not certainty |
| Primary drivers | Why the projection moves |
| Trade-offs | Gains vs costs |

---

## 2. Package

```
src/lib/platform/intelligence/scenarios/
  ScenarioTypes.ts
  ScenarioAssumptions.ts
  ScenarioResult.ts
  ScenarioComparison.ts
  ScenarioTemplates.ts
  ScenarioModel.ts
  ScenarioRegistry.ts
  ScenarioRunner.ts
  ScenarioEngine.ts
  ScenarioService.ts
  observability.ts
  index.ts
```

Command Center adapter:

```
src/lib/jag-command-center/scenarios/
  build-baseline.ts
  load-scenarios.ts
  index.ts
```

UI: `/jag/scenarios` · Decision Center what-if · Briefing **Scenario Analysis** · Observability

---

## 3. Scenario lifecycle

1. **Baseline** — Bind contributor outputs / school health into `ScenarioBaseline`.
2. **Template / inputs** — Choose a kind (or custom) and structured inputs.
3. **Model** — `ScenarioModel` computes dimension impacts vs baseline.
4. **Confidence** — Signal quality × input strength × timeline penalty.
5. **Runner / Engine** — Produce `ScenarioResult` (+ optional comparison).
6. **Service** — Observability + Decision what-if branches.
7. **Surfaces** — Planner, Decision Center, Briefings, Observability.

---

## 4. Comparison model

`compareScenarios` builds a side-by-side table:

- **Current** (baseline row, Δ = 0)
- Each scenario: score delta, stance, confidence, risk/opportunity counts

Ranks:

- Most favorable (highest Δ)
- Highest risk (most risk signals / weakest Δ)
- Highest confidence

---

## 5. Assumption framework

Categories:

| Category | Intent |
|----------|--------|
| advisory | Not guaranteed outcomes |
| continuity | Other conditions stay similar |
| timing | Effects over stated timeline |
| magnitude | Linear/bounded application of inputs |
| external | No explicit shock model |

Each assumption includes **impact if wrong**.

---

## 6. Confidence methodology

Confidence is 0–1 with band `low` | `moderate` | `high`, from:

- Baseline signal quality (bound contributors)
- Input strength (magnitude of structured change)
- Timeline length (longer → lower)
- Thin-baseline penalty when unbound

Confidence measures **evidence strength for the projection**, not probability of a certain future.

---

## 7. Supported scenarios

Enrollment Growth / Decline · Teacher Hiring / Loss · Funding Increase / Reduction · Budget Reallocation · Open New Campus · Close Program · Compliance Change · Custom

### Inputs

`enrollmentPercent`, `headcount`, `staffCount`, `fundingDollars`, `capacity`, `timelineDays`, `organization`, `domain`, plus extensible `attributes`.

### Output

Current State · Scenario State · Projected Difference · Confidence · Drivers · Evidence · Assumptions · Risks · Opportunities · Recommended Decisions · Trade-offs

---

## 8. Design rules

Clearly separate:

1. **Observed facts** — bound contributor evidence  
2. **Forecasts** — Sprint 201 predictive intelligence  
3. **Scenario projections** — hypothetical what-ifs  
4. **Assumptions** — stated explicitly on every result  

Never present projections as certainty.

---

## 9. Observability

Each observed run records: execution timing, inputs summary, confidence by scenario, comparison id, mode (`single` | `compare` | `decision_what_if`).

Audit action: `scenario_run`.
