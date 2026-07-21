import {
  resolveBaseline,
  subjectSignals,
  trendSlope,
} from "@/lib/platform/intelligence/executive-predictive/forecasting/shared";
import type { HistoricalSignal } from "@/lib/platform/intelligence/executive-predictive/types";

export function revenueSlope(signals: HistoricalSignal[]): number {
  return trendSlope(subjectSignals("revenue", signals));
}

export function cashSlope(signals: HistoricalSignal[]): number {
  return trendSlope(subjectSignals("cash", signals));
}

export function revenueBaseline(
  signals: HistoricalSignal[],
  createId: (prefix: string) => string
) {
  return resolveBaseline("revenue", signals, createId);
}

export function cashBaseline(
  signals: HistoricalSignal[],
  createId: (prefix: string) => string
) {
  return resolveBaseline("cash", signals, createId);
}
