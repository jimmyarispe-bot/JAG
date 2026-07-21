# Predictive Intelligence (Sprint 065)

**Sprint:** 065  
**Domain:** Predictive Intelligence  
**Version:** 0.1.0  
**Module id:** `executive-predictive`  
**Package:** `src/lib/platform/intelligence/executive-predictive/`

> Sprint 028 already owns `src/lib/platform/intelligence/predictive-intelligence/` (module id `predictive`). Sprint 065 uses `executive-predictive` so that package stays frozen.

## Purpose

Transform JAG from a reactive system into a predictive executive platform.

Instead of reporting the past or recommending responses to the present, Predictive Intelligence estimates plausible future organizational states using historical patterns, current signals, and known uncertainties.

It answers:

- What is likely to happen if we do nothing?
- What changes if we choose Option B instead of Option A?
- Which risks are emerging before they become critical?

**Predictions are advisory, not guarantees.**

## Pipeline position

```
… → wisdom
     → synthesis
     → briefing
     → executive-memory
     → decision-intelligence
     → executive-predictive   (Predictive Intelligence / Sprint 065)
```

Hard DAG predecessor: `decision-intelligence`.  
Soft-reads: decision-intelligence, executive-memory, and briefing result lights.

## Forecast lifecycle

1. **Ingest** historical signals (explicit series and/or executive-memory timeline).
2. **Baseline** each forecast subject (enrollment, revenue, cash, staffing, retention, parent satisfaction, operations, compliance).
3. **Project** values across horizons (`30d` / `90d` / `180d` / `365d`).
4. **Scenario** best / expected / worst (+ optional custom).
5. **Detect** emerging weak signals.
6. **Impact** Decision Intelligence options (org / financial / operational / horizon).
7. **Explain** why, evidence, invalidators, confidence guidance.
8. **Register** standardized prediction records.
9. **Drift** compare forecast vs actuals when supplied.

## Confidence model

Confidence combines:

| Factor | Effect |
|---|---|
| History depth | More points → higher confidence |
| Horizon length | Longer horizon → lower confidence |
| Signal agreement | Directional consensus → higher |
| Contradictions | Up+down history → penalty |
| Empty history | Advisory-only; invalidator noted |

Confidence is a planning aid, not a probability of truth.

## Scenario methodology

| Kind | Intent |
|---|---|
| Best | Favorable perturbation of expected path |
| Expected | Trend continuation if leadership takes no extraordinary action |
| Worst | Compounding risk degradation |
| Custom | Leadership-defined magnitude / narrative |

Decision Intelligence options are evaluated against these scenarios for impact comparison.

## Drift detection

When actuals are attached:

- Forecast vs actual error per subject
- Mean absolute error and bias
- Calibration note (overconfidence / tight band / moderate error)
- `degrading` flag for feedback into future forecasts

## UI foundation

`src/components/predictive-intelligence/`:

- `ForecastCard`
- `ScenarioComparison`
- `TrendProjection`
- `ConfidenceGauge`
- `SignalTimeline`
- `PredictionEvidencePanel`

Interactions use the shared `ActionChip` system.

## Extension guide

1. Add a subject to `FORECAST_SUBJECTS` + forecasting helper under `forecasting/`.
2. Extend weak-signal patterns in `engine/signal-engine.ts`.
3. Keep soft-read lights in `types.ts` — do not import peer engines.
4. Preserve hard DAG: only depend on `decision-intelligence`.
5. Do not regenerate Sprint 028 `predictive-intelligence/` or module id `predictive`.

## Example forecast (executive interpretation)

> Enrollment is projected to ease over 90 days under expected conditions (conversion softening in history). Worst case compounds staffing and operations pressure. Option A (temporary hires) shows stronger organizational impact than Option B (reallocation) but weaker near-term financial impact. Confidence is moderate — verify with admissions before committing budget.

## Tests

```bash
npx vitest run tests/unit/intelligence/executive-predictive.test.ts
```

Coverage includes forecast generation, scenarios, emerging signals, decision impact, explainability, drift, empty history, sparse data, and contradictory signals.
