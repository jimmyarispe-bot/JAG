import {
  resolveBaseline,
  subjectSignals,
  trendSlope,
} from "@/lib/platform/intelligence/executive-predictive/forecasting/shared";
import type { HistoricalSignal } from "@/lib/platform/intelligence/executive-predictive/types";

export function operationsSlope(signals: HistoricalSignal[]): number {
  return trendSlope(subjectSignals("operations", signals));
}

export function retentionSlope(signals: HistoricalSignal[]): number {
  return trendSlope(subjectSignals("retention", signals));
}

export function satisfactionSlope(signals: HistoricalSignal[]): number {
  return trendSlope(subjectSignals("parent_satisfaction", signals));
}

export function operationsBaseline(
  signals: HistoricalSignal[],
  createId: (prefix: string) => string
) {
  return resolveBaseline("operations", signals, createId);
}
