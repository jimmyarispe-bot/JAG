import type { ReputationScenarioEngineContract } from "@/lib/platform/intelligence/reputation/contracts";
import { buildLens, clamp, priorityFromScore } from "@/lib/platform/intelligence/reputation/models";
import { REPUTATION_SCENARIOS, type ReputationScenarioSuite } from "@/lib/platform/intelligence/reputation/types";

const SCENARIO_TITLES: Record<(typeof REPUTATION_SCENARIOS)[number], string> = {
  trust_collapse: "Trust collapse",
  brand_crisis: "Brand crisis",
  media_firestorm: "Media firestorm",
  misinformation_surge: "Misinformation surge",
  executive_scandal: "Executive scandal",
  regulatory_censure: "Regulatory censure",
  community_backlash: "Community backlash",
  partner_disavowal: "Partner disavowal",
  donor_confidence_shock: "Donor confidence shock",
  narrative_reversal: "Narrative reversal",
};

export class ReputationScenarioEngine implements ReputationScenarioEngineContract {
  assess(input: Parameters<ReputationScenarioEngineContract["assess"]>[0]): ReputationScenarioSuite {
    const pressure = (input.baseline.crisisRisk + input.baseline.mediaExposure + (100 - input.baseline.trustLevel)) / 3;
    const scenarios = REPUTATION_SCENARIOS.map((kind, index) => {
      const elevated = ["trust_collapse", "brand_crisis", "media_firestorm", "misinformation_surge"].includes(kind);
      const baseProb = clamp(25 + (index % 5) * 8 + (pressure > 55 && elevated ? 12 : 0));
      const organizationalImpact = clamp(40 + pressure / 2 + index);
      const trustImpact = clamp(organizationalImpact + (100 - input.baseline.trustLevel) / 5);
      const mediaImpact = clamp(organizationalImpact + input.baseline.mediaExposure / 5);
      return {
        id: input.createId("rep-scenario"),
        kind,
        title: SCENARIO_TITLES[kind],
        probability: baseProb / 100,
        severity: priorityFromScore(100 - organizationalImpact),
        organizationalImpact,
        trustImpact,
        mediaImpact,
        monitors: [`${kind}:leading`, `${kind}:lagging`, `${kind}:narrative`],
        lenses: buildLens({
          trustLevel: `${SCENARIO_TITLES[kind]} probability ${Math.round(baseProb)}%.`,
          publicPerception: `Perception cascade risk under ${kind.replaceAll("_", " ")}.`,
          brandStrength: `Brand impact score ${Math.round(trustImpact)}.`,
          mediaExposure: `Media stress under ${kind.replaceAll("_", " ")}.`,
          crisisRisk: `Crisis stress from ${SCENARIO_TITLES[kind]}.`,
          narrativeMomentum: `Narrative exposure if ${kind.replaceAll("_", " ")} materializes.`,
          credibility: `Credibility load score ${Math.round(mediaImpact)}.`,
          longTermReputationOutlook: `Pre-position contingency playbooks for ${kind.replaceAll("_", " ")}.`,
        }),
        narrative: `${SCENARIO_TITLES[kind]} monitored at ${Math.round(baseProb)}% probability.`,
      };
    });
    const primary = [...scenarios].sort((a, b) => b.probability - a.probability)[0]!;
    return {
      scenarios,
      primaryScenario: primary.kind,
      monitoredCount: scenarios.length,
      narrative: `Primary scenario ${primary.title}; ${scenarios.length} reputation scenarios monitored.`,
    };
  }
}
