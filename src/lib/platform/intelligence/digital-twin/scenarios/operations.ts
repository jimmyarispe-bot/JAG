import type { ScenarioDefinition } from "@/lib/platform/intelligence/digital-twin/types";

export function expandVirtualScenario(createId: (p: string) => string): ScenarioDefinition {
  return {
    id: createId("sc-virtual"),
    kind: "expand_virtual",
    label: "Expand virtual services",
    description: "Grow virtual program capacity with lower facilities load.",
    parameters: { virtualCapacityPct: 25, techInvestment: 80_000 },
  };
}
