import { clamp } from "@/lib/platform/intelligence/decision-intelligence/scoring/math";

/** ROI proxy: expected impact vs effort (higher better). */
export function scoreRoi(expectedImpact: number, effort: number): number {
  const denom = Math.max(effort, 10);
  return Math.round(clamp((expectedImpact / denom) * 70));
}
