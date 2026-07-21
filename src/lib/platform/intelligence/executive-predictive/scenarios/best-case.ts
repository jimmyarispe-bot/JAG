import type { ScenarioKind } from "@/lib/platform/intelligence/executive-predictive/types";

export const BEST_CASE_KIND: ScenarioKind = "best";
export const BEST_CASE_MAGNITUDE = 0.12;
export const BEST_CASE_LABEL = "Best case";

export function bestCaseNarrative(period: string): string {
  return `Best case for ${period}: favorable enrollment and collections outweigh operational friction.`;
}
