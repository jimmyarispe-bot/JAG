/**
 * Urgency from schedule pressure and lifecycle state.
 */

import type { InitiativeLight } from "@/lib/platform/intelligence/portfolio-intelligence/types";

export function scoreUrgency(initiative: InitiativeLight, now: Date = new Date()): number {
  let score = 40;
  const state = initiative.state ?? "proposed";
  if (state === "at_risk") score += 35;
  else if (state === "active") score += 20;
  else if (state === "planned" || state === "approved") score += 10;

  const sched = initiative.progress?.scheduleVarianceDays ?? 0;
  if (sched < 0) score += Math.min(30, Math.abs(sched));

  if (initiative.targetCompletionDate) {
    const days =
      (new Date(initiative.targetCompletionDate).getTime() - now.getTime()) /
      (1000 * 60 * 60 * 24);
    if (days < 30) score += 25;
    else if (days < 90) score += 12;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}
