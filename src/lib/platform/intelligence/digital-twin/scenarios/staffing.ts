import type { ScenarioDefinition } from "@/lib/platform/intelligence/digital-twin/types";

export function hireTeachersScenario(
  createId: (p: string) => string,
  count = 10
): ScenarioDefinition {
  return {
    id: createId("sc-hire"),
    kind: "hire_teachers",
    label: `Hire ${count} teachers`,
    description: `Add ${count} instructional FTEs to reduce vacancy and protect quality.`,
    parameters: { hires: count, costPerHire: 65_000 },
  };
}
