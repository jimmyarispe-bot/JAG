/**
 * Prediction registry — standardized prediction objects (Sprint 065).
 */

import type {
  OrganizationalForecast,
  PredictionRecord,
  ScenarioKind,
  ScenarioProjection,
} from "@/lib/platform/intelligence/executive-predictive/types";

export function toPredictionRecord(
  forecast: OrganizationalForecast,
  scenarios: ScenarioProjection[],
  createId: (prefix: string) => string
): PredictionRecord {
  return {
    id: createId("pred-reg"),
    subject: forecast.subject,
    horizon: forecast.horizon,
    confidence: forecast.confidence,
    assumptions: forecast.assumptions,
    supportingEvidence: forecast.evidence,
    alternativeScenarios: scenarios.map((s) => s.kind as ScenarioKind),
    timestamp: forecast.generatedAt,
    forecastId: forecast.id,
  };
}

export function registerForecasts(
  forecasts: OrganizationalForecast[],
  scenarios: ScenarioProjection[],
  createId: (prefix: string) => string
): PredictionRecord[] {
  return forecasts.map((f) => toPredictionRecord(f, scenarios, createId));
}
