import { clamp } from "@/lib/platform/intelligence/decision-intelligence/scoring/math";

export function scoreConfidence(input: {
  evidenceCount: number;
  historicalMatches: number;
  hasContradiction: boolean;
  base?: number;
}): number {
  let c = input.base ?? 55;
  c += Math.min(input.evidenceCount, 6) * 4;
  c += Math.min(input.historicalMatches, 4) * 3;
  if (input.hasContradiction) c -= 12;
  return Math.round(clamp(c));
}
