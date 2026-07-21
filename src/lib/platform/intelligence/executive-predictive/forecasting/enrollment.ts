import {
  resolveBaseline,
  subjectSignals,
  trendSlope,
} from "@/lib/platform/intelligence/executive-predictive/forecasting/shared";
import type { HistoricalSignal } from "@/lib/platform/intelligence/executive-predictive/types";

export function enrollmentSlope(signals: HistoricalSignal[]): number {
  return trendSlope(subjectSignals("enrollment", signals));
}

export function enrollmentBaseline(
  signals: HistoricalSignal[],
  createId: (prefix: string) => string
) {
  return resolveBaseline("enrollment", signals, createId);
}
