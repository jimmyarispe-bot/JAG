import type { ScenarioDefinition } from "@/lib/platform/intelligence/digital-twin/types";

export function increaseEnrollmentScenario(
  createId: (p: string) => string,
  pct = 20
): ScenarioDefinition {
  return {
    id: createId("sc-enroll"),
    kind: "increase_enrollment",
    label: `Increase enrollment by ${pct}%`,
    description: `Model a ${pct}% enrollment lift and cascading staffing/finance effects.`,
    parameters: { enrollmentLiftPct: pct },
  };
}
