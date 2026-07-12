# Predictive Intelligence (Sprint 028)

Forecasting layer for the JAG Executive Intelligence Platform. Predicts future organizational outcomes using historical intelligence, Executive Graph relationships, and Executive Decision simulations.

## Quick start

```ts
import {
  createPredictiveIntelligence,
  createForecastScenario,
} from "@/lib/platform/intelligence/predictive-intelligence";

const { service } = createPredictiveIntelligence({
  createId: (prefix) => `${prefix}-demo`,
  now: () => new Date("2026-07-12T12:00:00.000Z"),
});

const result = service.predict({
  requestId: "pred-1",
  question: "What should leadership anticipate over the next year?",
  scenarios: [
    createForecastScenario("baseline"),
    createForecastScenario("pessimistic", { magnitude: 0.1 }),
  ],
  horizons: [30, 90, 180, 365],
  scope: { organizationId: "org-1", schoolId: "school-1" },
});

console.log(result.projection.headline);
console.log(result.scenarioForecasts[0]?.emergingRisks);
```

Via the master service:

```ts
import { createIntelligenceService } from "@/lib/platform/intelligence";

const service = createIntelligenceService();
const forecast = service.predictiveIntelligence.service.predict({
  requestId: "pred-2",
  scenarios: [createForecastScenario("optimistic")],
});
```

## Capabilities

| Capability | Implementation |
|------------|----------------|
| Multi-horizon forecasts (30/90/180/365) | `ForecastEngine` |
| Trend analysis (accelerating / declining / stable / volatile) | `TrendAnalyzer` |
| Threshold crossing detection | `ForecastEngine.detectThresholds` |
| Confidence intervals | `ForecastPoint.low` / `high` |
| Emerging risk identification | `PredictionEngine` |
| Preventive executive actions | `PredictionEngine` |
| Multi-scenario support | `ForecastScenarioDefinition` |
| Decision / graph integration | DI via `createPredictiveIntelligence` |
| Query / projection / history | `ForecastQueries`, `ForecastProjection`, `ForecastHistory` |

## Forecast domains

Enrollment · Revenue · Cash Flow · Expense · Payroll · Staffing · Capacity · Admissions · Mission · Risk · Executive KPI

## Architecture position

```
organization-health → financial → founder → executive
  → executive-graph → executive-decision → predictive
```

## DI entry

`createPredictiveIntelligence()` — also attached on `createIntelligenceService().predictiveIntelligence` and registered as platform module `predictive`.
