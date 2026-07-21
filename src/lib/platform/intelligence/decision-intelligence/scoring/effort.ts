import { clamp } from "@/lib/platform/intelligence/decision-intelligence/scoring/math";

/** Higher = more effort (worse for overall unless inverted later). */
export function scoreEffort(category: string): number {
  const map: Record<string, number> = {
    hire: 75,
    reallocate: 45,
    virtual: 55,
    reduce_scope: 40,
    delay: 25,
    automate: 60,
    invest: 70,
    partner: 65,
    monitor: 20,
  };
  return Math.round(clamp(map[category] ?? 50));
}
