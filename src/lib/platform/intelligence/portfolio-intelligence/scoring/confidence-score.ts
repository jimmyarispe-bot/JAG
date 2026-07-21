/**
 * Prediction / execution confidence soft-read.
 */

import type {
  ExecutivePredictiveResultLight,
  InitiativeLight,
} from "@/lib/platform/intelligence/portfolio-intelligence/types";

export function scoreConfidence(
  initiative: InitiativeLight,
  predictive?: ExecutivePredictiveResultLight
): number {
  const title = (initiative.title ?? "").toLowerCase();
  const forecasts = predictive?.forecasts ?? [];
  const match = forecasts.find((f) =>
    (f.subject ?? "").toLowerCase().split(/\s+/).some((w) => w && title.includes(w))
  );
  if (match?.confidence != null) {
    return Math.round(Math.max(0, Math.min(100, match.confidence * 100)));
  }
  const health = initiative.progress?.healthScore ?? 50;
  const kpi = initiative.progress?.kpiAchievement ?? 40;
  return Math.round((health * 0.5 + kpi * 0.5));
}
