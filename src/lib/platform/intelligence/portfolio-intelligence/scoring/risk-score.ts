/**
 * Portfolio-facing risk score (higher = more risk).
 */

import type { InitiativeLight } from "@/lib/platform/intelligence/portfolio-intelligence/types";

export function scoreRisk(initiative: InitiativeLight): number {
  const risks = (initiative.risks ?? []).filter((r) => r.status !== "closed");
  if (risks.length === 0) {
    const health = initiative.progress?.healthScore ?? 60;
    return Math.max(0, Math.min(100, 100 - health));
  }
  const avg =
    risks.reduce((acc, r) => acc + ((r.severity ?? 50) * (r.likelihood ?? 50)) / 100, 0) /
    risks.length;
  return Math.round(Math.max(0, Math.min(100, avg)));
}
