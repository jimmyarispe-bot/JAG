import type { StakeholderScenarioEngineContract } from "@/lib/platform/intelligence/stakeholder/contracts";
import { buildLens, clamp, priorityFromScore } from "@/lib/platform/intelligence/stakeholder/models";
import { STAKEHOLDER_SCENARIOS, type StakeholderScenarioSuite } from "@/lib/platform/intelligence/stakeholder/types";

const SCENARIO_TITLES: Record<(typeof STAKEHOLDER_SCENARIOS)[number], string> = {
  trust_erosion: "Trust erosion",
  engagement_collapse: "Engagement collapse",
  influence_shift: "Influence shift",
  interest_conflict: "Interest conflict",
  board_turnover: "Board turnover",
  donor_withdrawal: "Donor withdrawal",
  employee_sentiment_shock: "Employee sentiment shock",
  partner_defection: "Partner defection",
  community_opposition: "Community opposition",
  government_pressure: "Government pressure",
};

export class StakeholderScenarioEngine implements StakeholderScenarioEngineContract {
  assess(input: Parameters<StakeholderScenarioEngineContract["assess"]>[0]): StakeholderScenarioSuite {
    const pressure = (input.baseline.influencePressure + (100 - input.baseline.trustLevel) + (100 - input.baseline.engagementQuality)) / 3;
    const scenarios = STAKEHOLDER_SCENARIOS.map((kind, index) => {
      const elevated = ["trust_erosion", "engagement_collapse", "donor_withdrawal", "government_pressure"].includes(kind);
      const baseProb = clamp(25 + (index % 5) * 8 + (pressure > 55 && elevated ? 12 : 0));
      const organizationalImpact = clamp(40 + pressure / 2 + index);
      const relationshipImpact = clamp(organizationalImpact + (100 - input.baseline.relationshipStrength) / 5);
      const engagementImpact = clamp(organizationalImpact + (100 - input.baseline.engagementQuality) / 5);
      return {
        id: input.createId("stk-scenario"),
        kind,
        title: SCENARIO_TITLES[kind],
        probability: baseProb / 100,
        severity: priorityFromScore(100 - organizationalImpact),
        organizationalImpact,
        relationshipImpact,
        engagementImpact,
        monitors: [`${kind}:leading`, `${kind}:lagging`, `${kind}:network`],
        lenses: buildLens({
          influence: `${SCENARIO_TITLES[kind]} probability ${Math.round(baseProb)}%.`,
          interest: `Interest cascade risk under ${kind.replaceAll("_", " ")}.`,
          trust: `Trust impact score ${Math.round(relationshipImpact)}.`,
          engagement: `Engagement stress under ${kind.replaceAll("_", " ")}.`,
          satisfaction: `Satisfaction stress from ${SCENARIO_TITLES[kind]}.`,
          relationshipStrength: `Relationship exposure if ${kind.replaceAll("_", " ")} materializes.`,
          collaborationOpportunity: `Collaboration load score ${Math.round(engagementImpact)}.`,
          strategicImportance: `Pre-position contingency playbooks for ${kind.replaceAll("_", " ")}.`,
        }),
        narrative: `${SCENARIO_TITLES[kind]} monitored at ${Math.round(baseProb)}% probability.`,
      };
    });
    const primary = [...scenarios].sort((a, b) => b.probability - a.probability)[0]!;
    return {
      scenarios,
      primaryScenario: primary.kind,
      monitoredCount: scenarios.length,
      narrative: `Primary scenario ${primary.title}; ${scenarios.length} stakeholder scenarios monitored.`,
    };
  }
}
