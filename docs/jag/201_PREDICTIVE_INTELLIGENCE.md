# Sprint 201 — Predictive Intelligence Engine

**Status:** Complete (Phase II)  
**Scope:** Application services + contributor-bound forecasts. No JAG Core or Runtime interface changes.

---

## 1. Objective

Move JAG from descriptive intelligence to **advisory predictive intelligence**.

Forecasts answer:

| Question | Surface |
|----------|---------|
| What is happening? | Organization Health, Decision Center, Briefings |
| What is likely to happen? | Forecasts, Decision consequences, Briefing Forecast |
| Why? | Drivers, evidence, assumptions |
| What decision reduces future risk? | Preventive actions |

Predictions are **never facts**. Every result exposes evidence, assumptions, and confidence.

---

## 2. Package

```
src/lib/platform/intelligence/predictive/
  PredictionTypes.ts
  PredictionHorizon.ts
  PredictionEvidence.ts
  PredictionResult.ts
  ForecastModel.ts
  ConfidenceModel.ts
  PredictionRegistry.ts
  PredictionEngine.ts
  PredictionService.ts
  observability.ts
  index.ts
```

Command Center adapter (application layer):

```
src/lib/jag-command-center/predictive/
  build-context.ts
  load-forecasts.ts
  index.ts
```

---

## 3. Prediction lifecycle

1. **Bind** — Education contributor executions / school health snapshots are stored in the Command Center intelligence store.
2. **Context** — `buildPredictionContext` maps signals + decision queue metrics into a portable `PredictionContext`.
3. **Registry** — `PredictionRegistry` selects kinds and default horizons.
4. **Forecast** — `ForecastModel` computes current vs predicted state, trend, risk, drivers, evidence, assumptions, preventive actions.
5. **Confidence** — `ConfidenceModel` scores evidence strength (not outcome certainty).
6. **Engine** — `PredictionEngine` composes forecast + confidence into `PredictionResult`.
7. **Service** — `PredictionService.forecast` / `consequenceIfNoAction` orchestrates runs and observability.
8. **Surfaces** — Overview Forecasts, Decision Center consequences, Briefing Forecast section, Observability.

---

## 4. Forecast model

Deterministic extrapolation from contributor signals and decision pressure:

- **Signal score** from health score, readiness, warnings, and blocking issues.
- **Decision pressure** from open / overdue / P1 queue volume.
- **Horizon decay** — longer horizons amplify projected drift and lower confidence.
- **Queue growth** — separate path projecting open decision volume from completion share.

If no signals exist, the engine returns `insufficientData` with an explanation — it does **not** invent metrics.

---

## 5. Confidence model

Confidence is a 0–1 score with band `low` | `moderate` | `high`, derived from:

- Signal quality
- Evidence count
- Contributor count and average contributor confidence
- Horizon length (penalty)
- Decision pressure (small penalty)

Confidence explains **evidence strength**, not probability of a guaranteed future.

---

## 6. Assumption model

Every prediction includes assumptions such as:

- Continuity of contributor conditions across the horizon
- Advisory nature (must not be treated as guaranteed)
- No explicit external shock model (policy cliff, funding shock, etc.)

Each assumption states impact if wrong.

---

## 7. Horizons

| Id | Label |
|----|-------|
| `7_days` | 7 Days |
| `30_days` | 30 Days |
| `90_days` | 90 Days |
| `6_months` | 6 Months |
| `1_year` | 1 Year |
| `{ kind: "custom", days, label }` | Future-ready custom |

---

## 8. Initial prediction kinds

1. Organization Health  
2. Student Success  
3. Operational Readiness  
4. Funding Readiness  
5. Decision Queue Growth  
6. Staffing Capacity  
7. Enrollment Trend  
8. Compliance Risk  

---

## 9. Result shape

Every `PredictionResult` includes:

- Current State / Predicted State  
- Confidence (+ explanation)  
- Primary Drivers  
- Supporting Contributors  
- Evidence  
- Assumptions  
- Recommended Preventive Actions  
- Advisory notice  

---

## 10. UI integration

| Surface | Behavior |
|---------|----------|
| Executive Overview → **Forecasts** | Trend, confidence, drivers, actions, risk |
| Decision Center | Predicted consequence if no action (30-day advisory) |
| Briefings → **Forecast** | Likely next, why, confidence, preventative decisions |
| Observability | Prediction runs + audit `prediction_run` |

---

## 11. Observability

Each observed run records:

- Execution timing (`startedAt`, `finishedAt`, `durationMs`)
- Inputs (signal count, open/overdue decisions)
- Contributors used
- Confidence calculation factors by kind
- Prediction ids / insufficient count

List enrichment of decision cards uses `observe: false` to avoid flooding the log; Overview and Briefing runs are observed.

---

## 12. Design rules

- Never present predictions as facts  
- Always show evidence, assumptions, confidence  
- Executives must understand **why** the forecast exists  
- Extend via contributors and application services only — no Core / Runtime changes  
