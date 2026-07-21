import {
  resolveBaseline,
  subjectSignals,
  trendSlope,
} from "@/lib/platform/intelligence/executive-predictive/forecasting/shared";
import type { HistoricalSignal } from "@/lib/platform/intelligence/executive-predictive/types";

export function staffingSlope(signals: HistoricalSignal[]): number {
  return trendSlope(subjectSignals("staffing", signals));
}

export function staffingBaseline(
  signals: HistoricalSignal[],
  createId: (prefix: string) => string
) {
  return resolveBaseline("staffing", signals, createId);
}
