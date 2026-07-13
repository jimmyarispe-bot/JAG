import type { CulturalScenarioEngineContract } from "@/lib/platform/intelligence/cultural/contracts";
import { buildLens, clamp, priorityFromScore } from "@/lib/platform/intelligence/cultural/models";
import { CULTURAL_SCENARIOS, type CulturalScenarioSuite } from "@/lib/platform/intelligence/cultural/types";

const SCENARIO_TITLES: Record<(typeof CULTURAL_SCENARIOS)[number], string> = {
  culture_fragmentation: "Culture fragmentation",
  values_drift: "Values drift",
  engagement_collapse: "Engagement collapse",
  psychological_safety_failure: "Psychological safety failure",
  mission_misalignment: "Mission misalignment",
  innovation_stagnation: "Innovation stagnation",
  inclusion_backslide: "Inclusion backslide",
  collaboration_breakdown: "Collaboration breakdown",
  transformation_resistance: "Transformation resistance",
  cross_cultural_friction: "Cross-cultural friction",
};

export class CulturalScenarioEngine implements CulturalScenarioEngineContract {
  assess(input: Parameters<CulturalScenarioEngineContract["assess"]>[0]): CulturalScenarioSuite {
    const pressure = ((100 - input.baseline.psychologicalSafety) + (100 - input.baseline.valuesAlignment) + (100 - input.baseline.missionAlignment)) / 3;
    const scenarios = CULTURAL_SCENARIOS.map((kind, index) => {
      const elevated = ["culture_fragmentation", "values_drift", "engagement_collapse", "psychological_safety_failure"].includes(kind);
      const baseProb = clamp(25 + (index % 5) * 8 + (pressure > 55 && elevated ? 12 : 0));
      const organizationalImpact = clamp(40 + pressure / 2 + index);
      const missionImpact = clamp(organizationalImpact + (100 - input.baseline.missionAlignment) / 5);
      const engagementImpact = clamp(organizationalImpact + (100 - input.baseline.engagement) / 5);
      return {
        id: input.createId("cul-scenario"),
        kind,
        title: SCENARIO_TITLES[kind],
        probability: baseProb / 100,
        severity: priorityFromScore(100 - organizationalImpact),
        organizationalImpact,
        missionImpact,
        engagementImpact,
        monitors: [`${kind}:leading`, `${kind}:lagging`, `${kind}:cultural`],
        lenses: buildLens({
          missionAlignment: `${SCENARIO_TITLES[kind]} probability ${Math.round(baseProb)}%.`,
          valuesAlignment: `Values drift risk under ${kind.replaceAll("_", " ")}.`,
          culturalHealth: `Cultural health impact score ${Math.round(missionImpact)}.`,
          collaborationQuality: `Collaboration stress under ${kind.replaceAll("_", " ")}.`,
          innovationReadiness: `Innovation stress from ${SCENARIO_TITLES[kind]}.`,
          psychologicalSafety: `Safety exposure if ${kind.replaceAll("_", " ")} materializes.`,
          engagement: `Engagement load score ${Math.round(engagementImpact)}.`,
          longTermCulturalOutlook: `Pre-position contingency playbooks for ${kind.replaceAll("_", " ")}.`,
        }),
        narrative: `${SCENARIO_TITLES[kind]} monitored at ${Math.round(baseProb)}% probability.`,
      };
    });
    const primary = [...scenarios].sort((a, b) => b.probability - a.probability)[0]!;
    return {
      scenarios,
      primaryScenario: primary.kind,
      monitoredCount: scenarios.length,
      narrative: `Primary scenario ${primary.title}; ${scenarios.length} cultural scenarios monitored.`,
    };
  }
}
