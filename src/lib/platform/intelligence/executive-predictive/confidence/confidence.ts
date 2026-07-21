/**
 * Confidence model for Predictive Intelligence (Sprint 065).
 */

import type { HistoricalSignal } from "@/lib/platform/intelligence/executive-predictive/types";

export function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

export function horizonDays(horizon: string): number {
  switch (horizon) {
    case "30d":
      return 30;
    case "90d":
      return 90;
    case "180d":
      return 180;
    case "365d":
      return 365;
    default:
      return 90;
  }
}

/** Longer horizons and sparse history reduce confidence. */
export function forecastConfidence(input: {
  historyCount: number;
  horizon: string;
  signalAgreement: number;
  contradictory: boolean;
}): number {
  const historyFactor = clamp01(input.historyCount / 8);
  const horizonPenalty = clamp01(horizonDays(input.horizon) / 365) * 0.35;
  const agreement = clamp01(input.signalAgreement);
  const contradictionPenalty = input.contradictory ? 0.22 : 0;
  return clamp01(
    0.28 + historyFactor * 0.42 + agreement * 0.28 - horizonPenalty - contradictionPenalty
  );
}

export function signalAgreement(signals: HistoricalSignal[]): number {
  if (signals.length < 2) return signals.length === 1 ? 0.55 : 0.35;
  const ups = signals.filter((s) => s.direction === "up").length;
  const downs = signals.filter((s) => s.direction === "down").length;
  const dominant = Math.max(ups, downs);
  return clamp01(dominant / signals.length);
}

export function hasContradictorySignals(signals: HistoricalSignal[]): boolean {
  if (signals.length < 2) return false;
  const ups = signals.some((s) => s.direction === "up");
  const downs = signals.some((s) => s.direction === "down");
  return ups && downs;
}
