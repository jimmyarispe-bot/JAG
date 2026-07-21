import type { ScenarioDefinition } from "@/lib/platform/intelligence/digital-twin/types";

export function reduceBudgetScenario(
  createId: (p: string) => string,
  pct = 8
): ScenarioDefinition {
  return {
    id: createId("sc-budget"),
    kind: "reduce_budget",
    label: `Reduce budget by ${pct}%`,
    description: `Apply a ${pct}% operating budget reduction across the portfolio.`,
    parameters: { reductionPct: pct },
  };
}
