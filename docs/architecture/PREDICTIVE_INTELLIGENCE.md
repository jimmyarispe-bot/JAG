# Predictive Intelligence — Architecture

**Sprint:** 028  
**Package:** `src/lib/platform/intelligence/predictive-intelligence/`  
**Version:** `0.1.0`

## Purpose

Predict future organizational outcomes across enrollment, financial, workforce, capacity, mission, risk, and executive KPI domains. Forecasts compose signals from Organization Health, Financial, Founder, Executive, Executive Graph, and Executive Decision modules.

## Contracts

| Contract | Role |
|----------|------|
| `PredictionEngine` | Orchestrate full prediction runs |
| `ForecastEngine` | Project domain values + intervals + thresholds |
| `TrendAnalyzer` | Classify series momentum |
| `PredictionConfidence` | Calibrate confidence scores |
| `ForecastScoring` | Score domain / scenario quality |
| `ForecastRepository` | Persist scenario forecasts (in-memory) |
| `ForecastHistory` | Audit trail |
| `ForecastQueries` | Deterministic Q&A |
| `ForecastProjection` | Dashboard / briefing flatten |
| `PredictionService` | Public façade |

## Forecast pipeline

1. Resolve graph / decision context (optional DI hooks)
2. Derive `ForecastBaseline` from executive / health / founder / decision baselines
3. Build or accept historical signals (synthetic fallback for sparse data)
4. For each scenario × domain:
   - Analyze trend
   - Project 30/90/180/365 points with confidence intervals
   - Detect threshold crossings
5. Identify emerging risks and preventive actions
6. Score scenarios, project briefing, record history

## Platform integration

Module id: `predictive`  
Dependencies: `["executive-decision"]`  
Context write key: `predictive`  
Context reads: `executiveGraph`, `executiveDecision`

Default pipeline order:

```
organization-health → financial → founder → executive
→ executive-graph → executive-decision → predictive
```

## DI entry points

```ts
createPredictiveIntelligence(options?)
createIntelligenceService().predictiveIntelligence
createIntelligencePlatform({ predictive, predictiveOptions })
```

## Scenario kinds

`baseline` · `optimistic` · `pessimistic` · `stress` · `decision_linked` · `custom`

Decision-linked scenarios apply relative bias from Executive Decision impact forecasts onto domain multipliers.
