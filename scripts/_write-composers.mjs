import fs from "node:fs";
import path from "node:path";
const DEST = path.resolve("src/lib/platform/intelligence/ethical");
const w = (n, c) => fs.writeFileSync(path.join(DEST, n), c, "utf8");

w("ethical-intelligence.ts", `import { buildLens, clamp, priorityFromScore, statusFromScore } from "@/lib/platform/intelligence/ethical/models";
import type {
  EthicalArea, EthicalAreaSuite, EthicalBaseline, EthicalDashboard,
  EthicalForecastSuite, EthicalHealthScore, EthicalOpportunityRecord,
  EthicalRecommendationRecord, EthicalRiskRecord, EthicalScenarioSuite,
  EthicalScore, EthicalAnalysisSuite,
} from "@/lib/platform/intelligence/ethical/types";
import { ETHICAL_AREAS } from "@/lib/platform/intelligence/ethical/types";

export const score = (key: string, label: string, value: number): EthicalScore => {
  const v = clamp(value);
  return { key, label, value: v, status: statusFromScore(v), band: priorityFromScore(v), narrative: \`\${label} is \${statusFromScore(v)} at \${Math.round(v)}.\` };
};

const lens = (area: string, value: number) => buildLens({
  valuesAlignment: \`\${area} values alignment scored \${Math.round(value)}.\`,
  fairness: \`Fairness linked to \${area}.\`,
  transparency: \`Transparency around \${area}.\`,
  accountability: \`Accountability relative to \${area} conditions.\`,
  humanImpact: \`Human impact reading for \${area}.\`,
  biasRisk: \`Bias risk implications of \${area}.\`,
  governanceIntegrity: \`Governance integrity pressure from \${area}.\`,
  longTermEthicalOutlook: \`Timing window for \${area}-linked ethical action.\`,
});

export class EthicalIntelligence {
  composeScores(input: {
    baseline: EthicalBaseline;
    areas: Record<EthicalArea, EthicalAreaSuite>;
    forecast: number;
    scenario: number;
    analysis: number;
    earlyWarning: number;
    valuesAlignment: number;
    fairness: number;
    humanImpact: number;
    aiEthics: number;
    governanceEthics: number;
  }) {
    const areaScores = Object.fromEntries(
      ETHICAL_AREAS.map(a => [a, score(\`ethical_\${a}\`, \`\${a} Ethical Score\`, input.areas[a].score)])
    ) as Record<EthicalArea, EthicalScore>;
    const overall =
      ETHICAL_AREAS.reduce((s, a) => s + areaScores[a].value, 0) / ETHICAL_AREAS.length * .5 +
      input.baseline.valuesAlignment * .1 +
      input.baseline.fairness * .1 +
      input.baseline.humanImpact * .08 +
      input.forecast * .08 +
      input.scenario * .07 +
      input.earlyWarning * .04 +
      input.governanceEthics * .03;
    return {
      healthScore: score("ethical_health", "Ethical Health Score", overall),
      areaScores,
      forecastScore: score("ethical_forecast", "Forecast Score", input.forecast),
      scenarioScore: score("ethical_scenario", "Scenario Score", input.scenario),
      analysisScore: score("ethical_analysis", "Analysis Score", input.analysis),
      earlyWarningScore: score("ethical_early_warning", "Early Warning Score", input.earlyWarning),
      valuesAlignmentEngineScore: score("ethical_values_alignment_engine", "Values Alignment Engine Score", input.valuesAlignment),
      fairnessEngineScore: score("ethical_fairness_engine", "Fairness Engine Score", input.fairness),
      humanImpactEngineScore: score("ethical_human_impact_engine", "Human Impact Engine Score", input.humanImpact),
      aiEthicsEngineScore: score("ethical_ai_ethics_engine", "AI Ethics Engine Score", input.aiEthics),
      governanceEthicsEngineScore: score("ethical_governance_ethics_engine", "Governance Ethics Engine Score", input.governanceEthics),
    };
  }
}

export class EthicalRecommendationComposer {
  constructor(private createId: (prefix: string) => string) {}
  compose(
    areas: Record<EthicalArea, EthicalAreaSuite>,
    analysis: EthicalAnalysisSuite,
    scenarios: EthicalScenarioSuite,
    now: Date,
  ): EthicalRecommendationRecord[] {
    return [...ETHICAL_AREAS]
      .sort((a, b) => areas[a].score - areas[b].score)
      .slice(0, 6)
      .map((area, index) => ({
        id: this.createId("eth-rec"),
        title: \`Address \${area.replaceAll("_", " ")} ethical exposure\`,
        priority: priorityFromScore(areas[area].score),
        evidenceRefs: analysis.analyses.slice(0, 2).map(a => a.id).concat(scenarios.scenarios.slice(0, 1).map(s => s.id)),
        confidenceScore: .68,
        owner: index ? "ethical-owner" : "executive-team",
        dueDate: new Date(now.getTime() + (30 + index * 14) * 86400000).toISOString(),
        rationale: areas[area].narrative,
        action: \`Run an ethical response cycle for \${area.replaceAll("_", " ")}.\`,
        lenses: lens(area, areas[area].score),
        narrative: \`Prioritize \${area} ethical response.\`,
      }));
  }
}

export function composeRisksOpportunities(
  areas: Record<EthicalArea, EthicalAreaSuite>,
  createId: (prefix: string) => string,
): { risks: EthicalRiskRecord[]; opportunities: EthicalOpportunityRecord[] } {
  const ordered = [...ETHICAL_AREAS].sort((a, b) => areas[a].score - areas[b].score);
  return {
    risks: ordered.slice(0, 5).map(a => ({
      id: createId("eth-risk"),
      title: \`\${a.replaceAll("_", " ")} ethical pressure\`,
      area: a,
      severity: priorityFromScore(areas[a].score),
      score: 100 - areas[a].score,
      mitigation: \`Strengthen monitoring and ethics playbooks for \${a.replaceAll("_", " ")}.\`,
      lenses: lens(a, areas[a].score),
      narrative: areas[a].narrative,
    })),
    opportunities: ordered.slice(-5).reverse().map(a => ({
      id: createId("eth-opp"),
      title: \`Capture \${a.replaceAll("_", " ")} ethical advantage\`,
      area: a,
      priority: priorityFromScore(100 - areas[a].score),
      score: areas[a].score,
      lenses: lens(a, areas[a].score),
      narrative: areas[a].narrative,
    })),
  };
}

export function composeHealth(
  scores: ReturnType<EthicalIntelligence["composeScores"]>,
  baseline: EthicalBaseline,
  forecasts: EthicalForecastSuite,
): EthicalHealthScore {
  const areaScores = Object.fromEntries(ETHICAL_AREAS.map(a => [a, scores.areaScores[a].value])) as Record<EthicalArea, number>;
  return {
    overallScore: scores.healthScore.value,
    status: scores.healthScore.status,
    outlook: forecasts.outlook,
    areaScores,
    valuesScore: scores.areaScores.values_alignment.value,
    fairnessScore: scores.areaScores.fairness.value,
    humanImpactScore: scores.areaScores.human_impact.value,
    governanceScore: scores.areaScores.governance_ethics.value,
    forecastScore: scores.forecastScore.value,
    scenarioScore: scores.scenarioScore.value,
    lenses: lens("organization", scores.healthScore.value),
    narrative: scores.healthScore.narrative,
  };
}

export function composeDashboard(
  now: Date,
  health: EthicalHealthScore,
  baseline: EthicalBaseline,
  risks: EthicalRiskRecord[],
  opportunities: EthicalOpportunityRecord[],
): EthicalDashboard {
  return {
    generatedAt: now.toISOString(),
    headline: \`Executive Ethics Overview: health \${Math.round(health.overallScore)}  -  \${health.status} (\${health.outlook})\`,
    overall: health.overallScore,
    areaScores: health.areaScores,
    outlook: health.outlook,
    valuesAlignment: baseline.valuesAlignment,
    fairness: baseline.fairness,
    humanImpact: baseline.humanImpact,
    topRisks: risks.map(r => r.title),
    topOpportunities: opportunities.map(o => o.title),
    narrative: health.narrative,
  };
}

export function composeEthicalHealth(
  scores: ReturnType<EthicalIntelligence["composeScores"]>,
  baseline: EthicalBaseline,
  forecasts: EthicalForecastSuite,
) {
  return composeHealth(scores, baseline, forecasts);
}

export const ethicalLens = lens;
`);

w("closed-learning-loop.ts", `import type {
  ClosedLearningLoopContribution,
  EthicalRecommendationRecord,
  EthicalScenarioSuite,
  EthicalTrendSuite,
} from "@/lib/platform/intelligence/ethical/types";

export class ClosedLearningLoop {
  contribute(input: {
    trends: EthicalTrendSuite;
    scenarios: EthicalScenarioSuite;
    recommendations: EthicalRecommendationRecord[];
    now: Date;
    createId: (prefix: string) => string;
  }): ClosedLearningLoopContribution {
    const worsening = input.trends.trends.filter(t => t.direction === "worsening");
    return {
      id: input.createId("eth-learning"),
      destinations: ["cultural", "behavioral", "legal-compliance-risk", "opportunity", "executive-decision", "predictive", "reputation"],
      lessons: input.trends.trends.slice(0, 5).map(t => t.narrative),
      improvementActions: input.recommendations.map(r => r.action),
      decisionSignals: worsening.slice(0, 4).map(t => \`\${t.area}:\${t.direction}\`),
      forecastSignals: input.scenarios.scenarios.slice(0, 4).map(s => \`\${s.kind}:\${Math.round(s.probability * 100)}\`),
      contributedAt: input.now.toISOString(),
      narrative: "Ethical evidence feeds Cultural, Behavioral, Legal Compliance Risk, Opportunity, Executive Decision, Predictive, and Reputation Intelligence.",
    };
  }
}
`);

console.log("composers + closed learning written");