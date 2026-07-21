import {
  resolveBaseline,
  subjectSignals,
  trendSlope,
} from "@/lib/platform/intelligence/executive-predictive/forecasting/shared";
import type { HistoricalSignal } from "@/lib/platform/intelligence/executive-predictive/types";

export function complianceSlope(signals: HistoricalSignal[]): number {
  return trendSlope(subjectSignals("compliance", signals));
}

export function complianceBaseline(
  signals: HistoricalSignal[],
  createId: (prefix: string) => string
) {
  return resolveBaseline("compliance", signals, createId);
}
