import type { ScenarioKind } from "@/lib/platform/intelligence/executive-predictive/types";

export const WORST_CASE_KIND: ScenarioKind = "worst";
export const WORST_CASE_MAGNITUDE = -0.14;
export const WORST_CASE_LABEL = "Worst case";

export function worstCaseNarrative(period: string): string {
  return `Worst case for ${period}: compounding risk signals degrade enrollment, cash, and capacity.`;
}
