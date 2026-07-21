import { clamp } from "@/lib/platform/intelligence/synthesis/scoring/math";

export function rootCauseConfidence(
  evidenceCount: number,
  domainCount: number,
  hasContradiction: boolean
): number {
  let c = 0.35 + Math.min(evidenceCount, 6) * 0.08 + Math.min(domainCount, 5) * 0.05;
  if (hasContradiction) c -= 0.12;
  return clamp(c * 100) / 100;
}
