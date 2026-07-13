import type { EnvironmentalScenarioEngineContract } from "@/lib/platform/intelligence/environmental/contracts";
import { buildLens, clamp, priorityFromScore } from "@/lib/platform/intelligence/environmental/models";
import { ENVIRONMENTAL_SCENARIOS, type EnvironmentalScenarioSuite } from "@/lib/platform/intelligence/environmental/types";

const SCENARIO_TITLES: Record<(typeof ENVIRONMENTAL_SCENARIOS)[number], string> = {
  extreme_heat: "Extreme heat",
  flooding: "Flooding",
  drought: "Drought",
  wildfire: "Wildfire",
  severe_storm: "Severe storm",
  regulatory_tightening: "Regulatory tightening",
  energy_shortage: "Energy shortage",
  water_stress: "Water stress",
  carbon_pricing_shock: "Carbon pricing shock",
  biodiversity_loss: "Biodiversity loss",
};

export class EnvironmentalScenarioEngine implements EnvironmentalScenarioEngineContract {
  assess(input: Parameters<EnvironmentalScenarioEngineContract["assess"]>[0]): EnvironmentalScenarioSuite {
    const pressure = (input.baseline.climateRisk + input.baseline.facilityExposure + input.baseline.regulatoryExposure) / 3;
    const scenarios = ENVIRONMENTAL_SCENARIOS.map((kind, index) => {
      const elevated = ["extreme_heat", "flooding", "wildfire", "carbon_pricing_shock"].includes(kind);
      const baseProb = clamp(25 + (index % 5) * 8 + (pressure > 55 && elevated ? 12 : 0));
      const organizationalImpact = clamp(40 + pressure / 2 + index);
      const facilityImpact = clamp(organizationalImpact + input.baseline.facilityExposure / 5);
      const resourceImpact = clamp(organizationalImpact + (100 - input.baseline.resourceAvailability) / 5);
      return {
        id: input.createId("env-scenario"),
        kind,
        title: SCENARIO_TITLES[kind],
        probability: baseProb / 100,
        severity: priorityFromScore(100 - organizationalImpact),
        organizationalImpact,
        facilityImpact,
        resourceImpact,
        monitors: [`${kind}:leading`, `${kind}:lagging`, `${kind}:regional`],
        lenses: buildLens({
          climateRisk: `${SCENARIO_TITLES[kind]} probability ${Math.round(baseProb)}%.`,
          facilityExposure: `Facility cascade risk under ${kind.replaceAll("_", " ")}.`,
          infrastructureResilience: `Infrastructure impact score ${Math.round(facilityImpact)}.`,
          resourceAvailability: `Resource stress under ${kind.replaceAll("_", " ")}.`,
          sustainabilityImpact: `Sustainability stress from ${SCENARIO_TITLES[kind]}.`,
          regulatoryExposure: `Regulatory exposure if ${kind.replaceAll("_", " ")} materializes.`,
          insuranceRisk: `Insurance load score ${Math.round(resourceImpact)}.`,
          longTermEnvironmentalOutlook: `Pre-position contingency playbooks for ${kind.replaceAll("_", " ")}.`,
        }),
        narrative: `${SCENARIO_TITLES[kind]} monitored at ${Math.round(baseProb)}% probability.`,
      };
    });
    const primary = [...scenarios].sort((a, b) => b.probability - a.probability)[0]!;
    return {
      scenarios,
      primaryScenario: primary.kind,
      monitoredCount: scenarios.length,
      narrative: `Primary scenario ${primary.title}; ${scenarios.length} environmental scenarios monitored.`,
    };
  }
}
