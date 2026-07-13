import type { CompetitiveScenarioEngineContract } from "@/lib/platform/intelligence/competitive/contracts";
import { buildLens, clamp, priorityFromScore } from "@/lib/platform/intelligence/competitive/models";
import { COMPETITIVE_SCENARIOS, type CompetitiveScenarioSuite } from "@/lib/platform/intelligence/competitive/types";

const SCENARIO_TITLES: Record<(typeof COMPETITIVE_SCENARIOS)[number], string> = {
  peer_tuition_war: "Peer tuition war",
  new_campus_entry: "New campus market entry",
  program_launch_race: "Program launch race",
  talent_poaching: "Faculty and talent poaching",
  substitute_disruption: "Substitute provider disruption",
  network_consolidation: "Network consolidation wave",
  brand_reputation_shift: "Brand and reputation shift",
  enrollment_yield_shock: "Enrollment yield shock",
  partnership_defection: "Key partnership defection",
  pricing_aid_escalation: "Pricing and aid escalation",
};

export class CompetitiveScenarioEngine implements CompetitiveScenarioEngineContract {
  assess(input: Parameters<CompetitiveScenarioEngineContract["assess"]>[0]): CompetitiveScenarioSuite {
    const pressure = (input.baseline.competitivePressure + input.baseline.threatLevel + (100 - input.baseline.differentiationStrength)) / 3;
    const scenarios = COMPETITIVE_SCENARIOS.map((kind, index) => {
      const baseProb = clamp(25 + (index % 5) * 8 + (pressure > 55 && ["peer_tuition_war", "substitute_disruption", "enrollment_yield_shock", "pricing_aid_escalation"].includes(kind) ? 12 : 0));
      const enrollmentImpact = clamp(40 + pressure / 2 + index);
      const revenueImpact = clamp(enrollmentImpact + (100 - input.baseline.differentiationStrength) / 5);
      const brandImpact = clamp(enrollmentImpact + (100 - input.baseline.brandStrength) / 5);
      return {
        id: input.createId("cmp-scenario"),
        kind,
        title: SCENARIO_TITLES[kind],
        probability: baseProb / 100,
        severity: priorityFromScore(100 - enrollmentImpact),
        enrollmentImpact,
        revenueImpact,
        brandImpact,
        monitors: [`${kind}:leading`, `${kind}:lagging`, `${kind}:regional`],
        lenses: buildLens({
          competitiveThreatExists: `${SCENARIO_TITLES[kind]} probability ${Math.round(baseProb)}%.`,
          evidenceSupports: `${input.forecasts.narrative} ${input.areas.direct_peer_schools.narrative}`,
          competitorsInvolved: `Peers and substitutes active in ${kind.replaceAll("_", " ")} scenario.`,
          ourDifferentiation: `Differentiation strength ${Math.round(input.baseline.differentiationStrength)} moderates scenario impact.`,
          enrollmentOrRevenueImpact: `Estimated enrollment impact score ${Math.round(enrollmentImpact)}.`,
          responseOptions: `Pre-position contingency playbooks for ${kind.replaceAll("_", " ")}.`,
          organizationalCapabilitiesRequired: `Strategy, admissions, marketing, and academic response capabilities.`,
          signalsToMonitor: SCENARIO_TITLES[kind],
        }),
        narrative: `${SCENARIO_TITLES[kind]} monitored at ${Math.round(baseProb)}% probability.`,
      };
    });
    const primary = [...scenarios].sort((a, b) => b.probability - a.probability)[0]!;
    return {
      scenarios,
      primaryScenario: primary.kind,
      monitoredCount: scenarios.length,
      narrative: `Primary scenario ${primary.title}; ${scenarios.length} competitive scenarios monitored.`,
    };
  }
}
