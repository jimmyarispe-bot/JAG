import type { EconomicScenarioEngineContract } from "@/lib/platform/intelligence/economic/contracts";
import { buildLens, clamp, priorityFromScore } from "@/lib/platform/intelligence/economic/models";
import { ECONOMIC_SCENARIOS, type EconomicScenarioSuite } from "@/lib/platform/intelligence/economic/types";

const SCENARIO_TITLES: Record<(typeof ECONOMIC_SCENARIOS)[number], string> = {
  expansion: "Expansion environment",
  recession: "Recession environment",
  high_inflation: "High inflation shock",
  low_inflation: "Low inflation environment",
  rapid_growth: "Rapid growth surge",
  labor_shortage: "Labor shortage",
  supply_chain_disruption: "Supply chain disruption",
  interest_rate_shock: "Interest rate shock",
  government_policy_change: "Government policy change",
  regional_economic_shift: "Regional economic shift",
};

export class EconomicScenarioEngine implements EconomicScenarioEngineContract {
  assess(input: Parameters<EconomicScenarioEngineContract["assess"]>[0]): EconomicScenarioSuite {
    const pressure = (input.baseline.inflationPressure + input.baseline.costPressure + (100 - input.baseline.laborAvailability)) / 3;
    const scenarios = ECONOMIC_SCENARIOS.map((kind, index) => {
      const baseProb = clamp(25 + (index % 5) * 8 + (pressure > 55 && ["recession", "high_inflation", "labor_shortage", "interest_rate_shock"].includes(kind) ? 12 : 0));
      const organizationalImpact = clamp(40 + pressure / 2 + index);
      const financialImpact = clamp(organizationalImpact + input.baseline.pricingPressure / 5);
      const operationalImpact = clamp(organizationalImpact + input.baseline.costPressure / 5);
      return {
        id: input.createId("eco-scenario"),
        kind,
        title: SCENARIO_TITLES[kind],
        probability: baseProb / 100,
        severity: priorityFromScore(100 - organizationalImpact),
        organizationalImpact,
        financialImpact,
        operationalImpact,
        monitors: [`${kind}:leading`, `${kind}:lagging`, `${kind}:regional`],
        lenses: buildLens({
          economicForces: `${SCENARIO_TITLES[kind]} probability ${Math.round(baseProb)}%.`,
          evidenceSupports: `${input.forecasts.narrative} ${input.areas.inflation.narrative}`,
          confidenceLevel: input.baseline.scenarioMaturity >= 70 ? "high" : "medium",
          organizationalAreas: "Strategy, workforce, funding, operations, and pricing.",
          financialImplications: `Estimated financial impact score ${Math.round(financialImpact)}.`,
          operationalImplications: `Estimated operational impact score ${Math.round(operationalImpact)}.`,
          strategicOptions: `Pre-position contingency playbooks for ${kind.replaceAll("_", " ")}.`,
          scenariosToMonitor: SCENARIO_TITLES[kind],
        }),
        narrative: `${SCENARIO_TITLES[kind]} monitored at ${Math.round(baseProb)}% probability.`,
      };
    });
    const primary = [...scenarios].sort((a, b) => b.probability - a.probability)[0]!;
    return {
      scenarios,
      primaryScenario: primary.kind,
      monitoredCount: scenarios.length,
      narrative: `Primary scenario ${primary.title}; ${scenarios.length} macroeconomic scenarios monitored.`,
    };
  }
}
