import { clamp } from "@/lib/platform/intelligence/decision-intelligence/scoring/math";

export function scoreUrgency(input: {
  issueSeverity?: number;
  impactIfDelayed?: boolean;
}): number {
  let u = input.issueSeverity ?? 50;
  if (input.impactIfDelayed) u += 15;
  return Math.round(clamp(u));
}
