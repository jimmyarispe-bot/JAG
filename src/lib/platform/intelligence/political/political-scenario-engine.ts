import type { PoliticalScenarioEngineContract } from "@/lib/platform/intelligence/political/contracts";
import { buildLens, clamp, priorityFromScore } from "@/lib/platform/intelligence/political/models";
import { POLITICAL_SCENARIOS, type PoliticalScenarioSuite } from "@/lib/platform/intelligence/political/types";

const SCENARIO_TITLES: Record<(typeof POLITICAL_SCENARIOS)[number], string> = {
  legislative_shock: "Legislative shock",
  regulatory_tightening: "Regulatory tightening",
  election_turnover: "Election turnover",
  funding_freeze: "Public funding freeze",
  tax_reform: "Tax reform wave",
  trade_conflict: "Trade conflict escalation",
  immigration_policy_shift: "Immigration policy shift",
  judicial_reversal: "Judicial reversal",
  geopolitical_crisis: "Geopolitical crisis",
  public_sentiment_swing: "Public sentiment swing",
};

export class PoliticalScenarioEngine implements PoliticalScenarioEngineContract {
  assess(input: Parameters<PoliticalScenarioEngineContract["assess"]>[0]): PoliticalScenarioSuite {
    const pressure = (input.baseline.legislativePressure + input.baseline.regulatoryBurden + input.baseline.geopoliticalRisk) / 3;
    const scenarios = POLITICAL_SCENARIOS.map((kind, index) => {
      const elevated = ["legislative_shock", "regulatory_tightening", "funding_freeze", "geopolitical_crisis"].includes(kind);
      const baseProb = clamp(25 + (index % 5) * 8 + (pressure > 55 && elevated ? 12 : 0));
      const organizationalImpact = clamp(40 + pressure / 2 + index);
      const fundingImpact = clamp(organizationalImpact + (100 - input.baseline.fundingOpportunity) / 5);
      const complianceImpact = clamp(organizationalImpact + input.baseline.compliancePressure / 5);
      return {
        id: input.createId("pol-scenario"),
        kind,
        title: SCENARIO_TITLES[kind],
        probability: baseProb / 100,
        severity: priorityFromScore(100 - organizationalImpact),
        organizationalImpact,
        fundingImpact,
        complianceImpact,
        monitors: [`${kind}:leading`, `${kind}:lagging`, `${kind}:regional`],
        lenses: buildLens({
          legislativeImpact: `${SCENARIO_TITLES[kind]} probability ${Math.round(baseProb)}%.`,
          regulatoryRisk: `Regulatory cascade risk under ${kind.replaceAll("_", " ")}.`,
          governmentFundingOpportunity: `Funding impact score ${Math.round(fundingImpact)}.`,
          taxExposure: `Fiscal exposure under ${kind.replaceAll("_", " ")}.`,
          politicalStability: `Stability stress from ${SCENARIO_TITLES[kind]}.`,
          tradeImpact: `Trade exposure if ${kind.replaceAll("_", " ")} materializes.`,
          compliancePressure: `Compliance load score ${Math.round(complianceImpact)}.`,
          strategicTiming: `Pre-position contingency playbooks for ${kind.replaceAll("_", " ")}.`,
        }),
        narrative: `${SCENARIO_TITLES[kind]} monitored at ${Math.round(baseProb)}% probability.`,
      };
    });
    const primary = [...scenarios].sort((a, b) => b.probability - a.probability)[0]!;
    return {
      scenarios,
      primaryScenario: primary.kind,
      monitoredCount: scenarios.length,
      narrative: `Primary scenario ${primary.title}; ${scenarios.length} political scenarios monitored.`,
    };
  }
}
