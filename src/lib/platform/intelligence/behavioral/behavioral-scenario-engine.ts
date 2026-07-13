import type { BehavioralScenarioEngineContract } from "@/lib/platform/intelligence/behavioral/contracts";
import { buildLens, clamp, priorityFromScore } from "@/lib/platform/intelligence/behavioral/models";
import { BEHAVIORAL_SCENARIOS, type BehavioralScenarioSuite } from "@/lib/platform/intelligence/behavioral/types";

const SCENARIO_TITLES: Record<(typeof BEHAVIORAL_SCENARIOS)[number], string> = {
  decision_paralysis: "Decision paralysis",
  bias_cascade: "Bias cascade",
  motivation_collapse: "Motivation collapse",
  change_resistance_surge: "Change resistance surge",
  leadership_misalignment: "Leadership misalignment",
  team_fragmentation: "Team fragmentation",
  collaboration_breakdown: "Collaboration breakdown",
  adoption_stall: "Adoption stall",
  behavioral_risk_spike: "Behavioral risk spike",
  incentive_distortion: "Incentive distortion",
};

export class BehavioralScenarioEngine implements BehavioralScenarioEngineContract {
  assess(input: Parameters<BehavioralScenarioEngineContract["assess"]>[0]): BehavioralScenarioSuite {
    const pressure = (input.baseline.changeResistance + input.baseline.cognitiveBiasRisk + (100 - input.baseline.decisionConfidence)) / 3;
    const scenarios = BEHAVIORAL_SCENARIOS.map((kind, index) => {
      const elevated = ["decision_paralysis", "bias_cascade", "motivation_collapse", "change_resistance_surge"].includes(kind);
      const baseProb = clamp(25 + (index % 5) * 8 + (pressure > 55 && elevated ? 12 : 0));
      const organizationalImpact = clamp(40 + pressure / 2 + index);
      const decisionImpact = clamp(organizationalImpact + (100 - input.baseline.decisionConfidence) / 5);
      const adoptionImpact = clamp(organizationalImpact + input.baseline.changeResistance / 5);
      return {
        id: input.createId("beh-scenario"),
        kind,
        title: SCENARIO_TITLES[kind],
        probability: baseProb / 100,
        severity: priorityFromScore(100 - organizationalImpact),
        organizationalImpact,
        decisionImpact,
        adoptionImpact,
        monitors: [`${kind}:leading`, `${kind}:lagging`, `${kind}:behavioral`],
        lenses: buildLens({
          decisionConfidence: `${SCENARIO_TITLES[kind]} probability ${Math.round(baseProb)}%.`,
          cognitiveBiasRisk: `Bias cascade risk under ${kind.replaceAll("_", " ")}.`,
          motivationAlignment: `Motivation impact score ${Math.round(decisionImpact)}.`,
          adoptionProbability: `Adoption stress under ${kind.replaceAll("_", " ")}.`,
          collaborationImpact: `Collaboration stress from ${SCENARIO_TITLES[kind]}.`,
          changeResistance: `Resistance exposure if ${kind.replaceAll("_", " ")} materializes.`,
          leadershipReadiness: `Leadership load score ${Math.round(adoptionImpact)}.`,
          longTermBehavioralOutlook: `Pre-position contingency playbooks for ${kind.replaceAll("_", " ")}.`,
        }),
        narrative: `${SCENARIO_TITLES[kind]} monitored at ${Math.round(baseProb)}% probability.`,
      };
    });
    const primary = [...scenarios].sort((a, b) => b.probability - a.probability)[0]!;
    return {
      scenarios,
      primaryScenario: primary.kind,
      monitoredCount: scenarios.length,
      narrative: `Primary scenario ${primary.title}; ${scenarios.length} behavioral scenarios monitored.`,
    };
  }
}
