import { clamp } from "@/lib/platform/intelligence/decision-intelligence/scoring/math";

export function scoreExpectedImpact(input: {
  financial: number;
  operational: number;
  strategic: number;
}): number {
  return Math.round(
    clamp(input.financial * 0.35 + input.operational * 0.35 + input.strategic * 0.3)
  );
}
