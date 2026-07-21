import { clamp } from "@/lib/platform/intelligence/decision-intelligence/scoring/math";

export function scoreStrategicAlignment(input: {
  domains: string[];
  issueDomains: string[];
  categoryBoost?: number;
}): number {
  const overlap = input.domains.filter((d) =>
    input.issueDomains.some((i) => i.toLowerCase() === d.toLowerCase())
  ).length;
  return Math.round(clamp(50 + overlap * 12 + (input.categoryBoost ?? 0)));
}
