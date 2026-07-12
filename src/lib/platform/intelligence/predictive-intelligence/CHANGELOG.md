# Changelog — Predictive Intelligence

## 0.1.0 — Sprint 028 (2026-07-12)

### Added

- `PredictionEngine` — orchestrates multi-scenario, multi-horizon forecasting
- `ForecastEngine` — domain projections with confidence intervals
- `TrendAnalyzer` — accelerating / declining / stable / volatile detection
- `ForecastRepository` — in-memory scenario forecast store
- `PredictionModels` (`predictionModels`) — baselines, presets, signal synthesis
- `ForecastQueries` — deterministic Q&A over prediction results
- `ForecastProjection` — executive briefing flatten
- `PredictionConfidence` — calibrated confidence scoring
- `ForecastScoring` — domain / scenario quality scores
- `ForecastHistory` — audit trail
- `PredictionService` — public façade
- `createPredictiveIntelligence()` DI factory
- Platform module adapter `predictive` (depends on `executive-decision`)

### Domains

Enrollment, Revenue, Cash Flow, Expense, Payroll, Staffing, Capacity, Admissions, Mission, Risk, Executive KPI

### Horizons

30-day, 90-day, 180-day, 365-day
