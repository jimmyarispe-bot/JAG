/**
 * Financial ROI score — soft-reads initiative budget / decision ROI hints.
 */

import type { InitiativeLight } from "@/lib/platform/intelligence/portfolio-intelligence/types";

export function scoreRoi(initiative: InitiativeLight, decisionRoiHint?: number): number {
  const planned = initiative.budget?.planned ?? 0;
  const actual = initiative.budget?.actual ?? 0;
  const kpi = initiative.progress?.kpiAchievement ?? 0;
  const variancePenalty = planned > 0 ? Math.min(30, Math.max(0, ((actual - planned) / planned) * 100)) : 0;
  const base = decisionRoiHint != null ? Math.round(decisionRoiHint) : Math.round(50 + kpi * 0.4);
  return Math.max(0, Math.min(100, Math.round(base - variancePenalty * 0.5)));
}
