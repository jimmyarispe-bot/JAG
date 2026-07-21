import type { ScenarioKind } from "@/lib/platform/intelligence/executive-predictive/types";

export const CUSTOM_CASE_KIND: ScenarioKind = "custom";

export function customCaseNarrative(
  label: string,
  period: string,
  narrative?: string
): string {
  return (
    narrative ??
    `Custom scenario "${label}" for ${period}: leadership-defined perturbation of the expected path.`
  );
}
