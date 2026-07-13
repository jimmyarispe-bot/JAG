/**
 * Part 2: engines, composers, service, index, docs for Systems Intelligence.
 * Run after: node scripts/generate-systems-intelligence.mjs
 */
import fs from "node:fs";
import path from "node:path";

const DEST = path.resolve("src/lib/platform/intelligence/systems");
const w = (name, content) => fs.writeFileSync(path.join(DEST, name), content, "utf8");

const AREAS = [
  ["system_mapping", "SystemMappingIntelligence"],
  ["dependency_analysis", "DependencyAnalysisIntelligence"],
  ["feedback_loop_analysis", "FeedbackLoopAnalysisIntelligence"],
  ["constraint_identification", "ConstraintIdentificationIntelligence"],
  ["bottleneck_detection", "BottleneckDetectionIntelligence"],
  ["flow_optimization", "FlowOptimizationIntelligence"],
  ["emergent_behavior", "EmergentBehaviorIntelligence"],
  ["network_dynamics", "NetworkDynamicsIntelligence"],
  ["organizational_complexity", "OrganizationalComplexityIntelligence"],
  ["interdependency_modeling", "InterdependencyModelingIntelligence"],
  ["cascading_risk", "CascadingRiskIntelligence"],
  ["system_stability", "SystemStabilityIntelligence"],
  ["leverage_point_identification", "LeveragePointIdentificationIntelligence"],
  ["resource_flow", "ResourceFlowIntelligence"],
  ["adaptive_capacity", "AdaptiveCapacityIntelligence"],
  ["system_evolution", "SystemEvolutionIntelligence"],
  ["scenario_interaction", "ScenarioInteractionIntelligence"],
];
const snakeToCamel = (s) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

const lensBlock = (prefix) => `buildLens({
            dependencyImpact: \`${prefix} dependency impact for \${area}.\`,
            bottleneckRisk: \`${prefix} bottleneck risk for \${area}.\`,
            feedbackStability: \`${prefix} feedback stability for \${area}.\`,
            systemComplexity: \`${prefix} system complexity for \${area}.\`,
            resourceFlow: \`${prefix} resource flow for \${area}.\`,
            cascadingRisk: \`${prefix} cascading risk for \${area}.\`,
            adaptability: \`${prefix} adaptability for \${area}.\`,
            longTermSystemHealth: \`Long-term system health ${prefix.toLowerCase()} for \${area}.\`,
          })`;

w("systems-forecast-engine.ts", `import type { SystemsForecastEngineContract } from "@/lib/platform/intelligence/systems/contracts";
import { buildLens, clamp, outlookFromScore } from "@/lib/platform/intelligence/systems/models";
import { SYSTEMS_AREAS, type SystemsForecastSuite } from "@/lib/platform/intelligence/systems/types";

export class SystemsForecastEngine implements SystemsForecastEngineContract {
  assess(input: Parameters<SystemsForecastEngineContract["assess"]>[0]): SystemsForecastSuite {
    const forecasts = SYSTEMS_AREAS.map((area) => {
      const baseline = input.areas[area].score;
      const forecast = clamp(baseline + (input.baseline.forecastMaturity - 65) * .15);
      return {
        id: input.createId("sys-forecast"),
        area,
        horizon: "medium" as const,
        baseline,
        forecast,
        low: clamp(forecast - 8),
        high: clamp(forecast + 8),
        confidence: "medium" as const,
        lenses: ${lensBlock("Forecast")},
        narrative: \`\${area} forecast \${Math.round(forecast)} from baseline \${Math.round(baseline)}.\`,
      };
    });
    const maturityScore = clamp(input.baseline.forecastMaturity);
    return {
      forecasts,
      outlook: outlookFromScore(maturityScore),
      maturityScore,
      narrative: \`Systems forecast maturity \${Math.round(maturityScore)}.\`,
    };
  }
}
`);

w("systems-trend-engine.ts", `import type { SystemsTrendEngineContract } from "@/lib/platform/intelligence/systems/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/systems/models";
import { SYSTEMS_AREAS, type SystemsTrendSuite } from "@/lib/platform/intelligence/systems/types";

export class SystemsTrendEngine implements SystemsTrendEngineContract {
  assess(input: Parameters<SystemsTrendEngineContract["assess"]>[0]): SystemsTrendSuite {
    const trends = SYSTEMS_AREAS.map((area, index) => {
      const score = input.areas[area].score;
      const direction = score >= 72 ? "improving" as const : score >= 58 ? "stable" as const : "worsening" as const;
      return {
        id: input.createId("sys-trend"),
        area,
        title: \`\${area.replaceAll("_", " ")} trend\`,
        direction,
        magnitude: clamp(Math.abs(score - 65) + index),
        confidence: "medium" as const,
        lenses: ${lensBlock("Trend")},
        narrative: \`\${area} is \${direction} at magnitude \${Math.round(Math.abs(score - 65))}.\`,
      };
    });
    return {
      trends,
      improvingCount: trends.filter(t => t.direction === "improving").length,
      worseningCount: trends.filter(t => t.direction === "worsening").length,
      narrative: \`Systems trends: \${trends.filter(t => t.direction === "improving").length} improving, \${trends.filter(t => t.direction === "worsening").length} worsening.\`,
    };
  }
}
`);

w("systems-scenario-engine.ts", `import type { SystemsScenarioEngineContract } from "@/lib/platform/intelligence/systems/contracts";
import { buildLens, clamp, priorityFromScore } from "@/lib/platform/intelligence/systems/models";
import { SYSTEMS_SCENARIOS, type SystemsScenarioSuite } from "@/lib/platform/intelligence/systems/types";

export class SystemsScenarioEngine implements SystemsScenarioEngineContract {
  assess(input: Parameters<SystemsScenarioEngineContract["assess"]>[0]): SystemsScenarioSuite {
    const scenarios = SYSTEMS_SCENARIOS.map((kind, index) => {
      const pressure = 100 - input.baseline.areaScores.cascading_risk;
      const probability = clamp((35 + index * 3 + pressure * .25) / 100, 0, 1);
      const organizationalImpact = clamp(55 + pressure * .3 + index);
      return {
        id: input.createId("sys-scenario"),
        kind,
        title: kind.replaceAll("_", " "),
        probability,
        severity: priorityFromScore(100 - organizationalImpact),
        organizationalImpact,
        dependencyImpact: clamp(input.baseline.dependencyImpact - index * 2),
        cascadingImpact: clamp(input.baseline.cascadingRisk - index * 2),
        monitors: [\`monitor:\${kind}\`, "monitor:cascading-risk"],
        lenses: buildLens({
          dependencyImpact: \`Scenario dependency impact for \${kind}.\`,
          bottleneckRisk: \`Scenario bottleneck risk for \${kind}.\`,
          feedbackStability: \`Scenario feedback stability for \${kind}.\`,
          systemComplexity: \`Scenario system complexity for \${kind}.\`,
          resourceFlow: \`Scenario resource flow for \${kind}.\`,
          cascadingRisk: \`Scenario cascading risk for \${kind}.\`,
          adaptability: \`Scenario adaptability for \${kind}.\`,
          longTermSystemHealth: \`Long-term system health under \${kind}.\`,
        }),
        narrative: \`\${kind} probability \${Math.round(probability * 100)}% with impact \${Math.round(organizationalImpact)}.\`,
      };
    });
    const primary = [...scenarios].sort((a, b) => b.probability * b.organizationalImpact - a.probability * a.organizationalImpact)[0]!;
    return {
      scenarios,
      primaryScenario: primary.kind,
      monitoredCount: scenarios.length,
      narrative: \`Primary systems scenario \${primary.kind.replaceAll("_", " ")}.\`,
    };
  }
}
`);

w("systems-analysis-engine.ts", `import type { SystemsAnalysisEngineContract } from "@/lib/platform/intelligence/systems/contracts";
import { buildLens, clamp } from "@/lib/platform/intelligence/systems/models";
import { SYSTEMS_ANALYSIS_KINDS, type SystemsAnalysisSuite } from "@/lib/platform/intelligence/systems/types";

export class SystemsAnalysisEngine implements SystemsAnalysisEngineContract {
  assess(input: Parameters<SystemsAnalysisEngineContract["assess"]>[0]): SystemsAnalysisSuite {
    const scoreFor = (kind: (typeof SYSTEMS_ANALYSIS_KINDS)[number]) => {
      switch (kind) {
        case "trends": return clamp(70 - (100 - input.baseline.forecastMaturity) * .2);
        case "forecasts": return clamp(input.forecasts.maturityScore);
        case "scenario_planning": return clamp(input.baseline.scenarioMaturity);
        case "dependency_impact": return clamp(input.baseline.dependencyImpact);
        case "bottleneck_risk": return clamp(input.baseline.bottleneckRisk);
        case "feedback_stability": return clamp(input.baseline.feedbackStability);
        case "system_complexity": return clamp(input.baseline.systemComplexity);
        case "resource_flow": return clamp(input.baseline.resourceFlow);
        case "cascading_risk": return clamp(input.baseline.cascadingRisk);
        case "adaptability": return clamp(input.baseline.adaptability);
        case "leverage_points": return clamp(input.baseline.areaScores.leverage_point_identification);
        case "early_warning": return clamp(input.baseline.longTermSystemHealth);
        default: return 65;
      }
    };
    const analyses = SYSTEMS_ANALYSIS_KINDS.map((kind) => {
      const score = scoreFor(kind);
      return {
        id: input.createId("sys-analysis"),
        kind,
        title: \`\${kind.replaceAll("_", " ")} analysis\`,
        score,
        status: score >= 75 ? "favorable" as const : score >= 60 ? "improving" as const : "at_risk" as const,
        lenses: buildLens({
          dependencyImpact: \`Dependency impact through \${kind}.\`,
          bottleneckRisk: \`Bottleneck risk reading for \${kind}.\`,
          feedbackStability: \`Feedback stability for \${kind}.\`,
          systemComplexity: \`System complexity around \${kind}.\`,
          resourceFlow: \`Resource flow of \${kind}.\`,
          cascadingRisk: \`Cascading risk in \${kind}.\`,
          adaptability: \`Adaptability for \${kind}.\`,
          longTermSystemHealth: \`Long-term system health via \${kind}.\`,
        }),
        narrative: \`\${kind} analysis scored \${Math.round(score)}.\`,
      };
    });
    const maturityScore = clamp(analyses.reduce((s, a) => s + a.score, 0) / analyses.length);
    return {
      analyses,
      kindsCovered: [...SYSTEMS_ANALYSIS_KINDS],
      maturityScore,
      narrative: \`Systems analysis maturity \${Math.round(maturityScore)} across \${analyses.length} kinds.\`,
    };
  }
}
`);

w("dependency-engine.ts", `import type { DependencyEngineContract } from "@/lib/platform/intelligence/systems/contracts";
import type { DependencySuite } from "@/lib/platform/intelligence/systems/types";

export class DependencyEngine implements DependencyEngineContract {
  assess(input: Parameters<DependencyEngineContract["assess"]>[0]): DependencySuite {
    const suite = input.areas.dependency_analysis;
    const records = suite.records.map(record => ({
      id: input.createId("sys-dependency"),
      title: record.title,
      strength: record.score,
      lenses: record.lenses,
      narrative: \`Dependency analysis: \${record.title} at \${Math.round(record.score)}.\`,
    }));
    return {
      records,
      score: suite.score,
      dependencyIndex: input.baseline.dependencyImpact,
      narrative: \`Dependency suite index \${Math.round(input.baseline.dependencyImpact)}.\`,
    };
  }
}
`);

w("feedback-loop-engine.ts", `import type { FeedbackLoopEngineContract } from "@/lib/platform/intelligence/systems/contracts";
import type { FeedbackLoopSuite } from "@/lib/platform/intelligence/systems/types";

export class FeedbackLoopEngine implements FeedbackLoopEngineContract {
  assess(input: Parameters<FeedbackLoopEngineContract["assess"]>[0]): FeedbackLoopSuite {
    const suite = input.areas.feedback_loop_analysis;
    const records = suite.records.map(record => ({
      id: input.createId("sys-feedback"),
      title: record.title,
      stability: record.score,
      lenses: record.lenses,
      narrative: \`Feedback loop analysis: \${record.title} at \${Math.round(record.score)}.\`,
    }));
    return {
      records,
      score: suite.score,
      feedbackIndex: input.baseline.feedbackStability,
      narrative: \`Feedback loop suite index \${Math.round(input.baseline.feedbackStability)}.\`,
    };
  }
}
`);

w("constraint-engine.ts", `import type { ConstraintEngineContract } from "@/lib/platform/intelligence/systems/contracts";
import type { ConstraintSuite } from "@/lib/platform/intelligence/systems/types";

export class ConstraintEngine implements ConstraintEngineContract {
  assess(input: Parameters<ConstraintEngineContract["assess"]>[0]): ConstraintSuite {
    const suite = input.areas.constraint_identification;
    const records = suite.records.map(record => ({
      id: input.createId("sys-constraint"),
      title: record.title,
      tightness: record.score,
      lenses: record.lenses,
      narrative: \`Constraint analysis: \${record.title} at \${Math.round(record.score)}.\`,
    }));
    return {
      records,
      score: suite.score,
      constraintIndex: input.baseline.areaScores.constraint_identification,
      narrative: \`Constraint suite index \${Math.round(input.baseline.areaScores.constraint_identification)}.\`,
    };
  }
}
`);

w("bottleneck-engine.ts", `import type { BottleneckEngineContract } from "@/lib/platform/intelligence/systems/contracts";
import type { BottleneckSuite } from "@/lib/platform/intelligence/systems/types";

export class BottleneckEngine implements BottleneckEngineContract {
  assess(input: Parameters<BottleneckEngineContract["assess"]>[0]): BottleneckSuite {
    const suite = input.areas.bottleneck_detection;
    const records = suite.records.map(record => ({
      id: input.createId("sys-bottleneck"),
      title: record.title,
      saturation: record.score,
      lenses: record.lenses,
      narrative: \`Bottleneck analysis: \${record.title} at \${Math.round(record.score)}.\`,
    }));
    return {
      records,
      score: suite.score,
      bottleneckIndex: input.baseline.bottleneckRisk,
      narrative: \`Bottleneck suite index \${Math.round(input.baseline.bottleneckRisk)}.\`,
    };
  }
}
`);

w("network-dynamics-engine.ts", `import type { NetworkDynamicsEngineContract } from "@/lib/platform/intelligence/systems/contracts";
import type { NetworkDynamicsSuite } from "@/lib/platform/intelligence/systems/types";

export class NetworkDynamicsEngine implements NetworkDynamicsEngineContract {
  assess(input: Parameters<NetworkDynamicsEngineContract["assess"]>[0]): NetworkDynamicsSuite {
    const suite = input.areas.network_dynamics;
    const records = suite.records.map(record => ({
      id: input.createId("sys-network"),
      title: record.title,
      dynamics: record.score,
      lenses: record.lenses,
      narrative: \`Network dynamics: \${record.title} at \${Math.round(record.score)}.\`,
    }));
    return {
      records,
      score: suite.score,
      networkIndex: input.baseline.areaScores.network_dynamics,
      narrative: \`Network dynamics suite index \${Math.round(input.baseline.areaScores.network_dynamics)}.\`,
    };
  }
}
`);

w("early-warning-engine.ts", `import type { EarlyWarningEngineContract } from "@/lib/platform/intelligence/systems/contracts";
import { clamp, priorityFromScore } from "@/lib/platform/intelligence/systems/models";
import type { EarlyWarningSuite } from "@/lib/platform/intelligence/systems/types";

export class EarlyWarningEngine implements EarlyWarningEngineContract {
  assess(input: Parameters<EarlyWarningEngineContract["assess"]>[0]): EarlyWarningSuite {
    const worsening = input.trends.trends.filter(t => t.direction === "worsening").slice(0, 4);
    const hot = input.scenarios.scenarios.slice(0, 3);
    const alerts = [
      ...worsening.map(t => ({
        id: input.createId("sys-alert"),
        title: \`Trend alert: \${t.area}\`,
        severity: priorityFromScore(100 - t.magnitude),
        source: "trends",
        score: clamp(100 - t.magnitude),
        lenses: t.lenses,
        narrative: t.narrative,
      })),
      ...hot.map(s => ({
        id: input.createId("sys-alert"),
        title: \`Scenario alert: \${s.kind}\`,
        severity: s.severity,
        source: "scenarios",
        score: clamp(100 - s.organizationalImpact),
        lenses: s.lenses,
        narrative: s.narrative,
      })),
    ];
    const score = clamp(alerts.length ? alerts.reduce((s, a) => s + a.score, 0) / alerts.length : input.baseline.longTermSystemHealth);
    return {
      alerts,
      score,
      alertCount: alerts.length,
      narrative: \`Systems early warning suite with \${alerts.length} alerts.\`,
    };
  }
}
`);

w("knowledge-contribution.ts", `import type { SystemsForecastSuite, SystemsKnowledgeContribution, SystemsScenarioSuite } from "@/lib/platform/intelligence/systems/types";

/**
 * Systems knowledge contribution drafts for Knowledge Intelligence soft-read
 * and downstream learning.
 */
export class SystemsKnowledgeContributionEngine {
  contribute(input: {
    forecasts: SystemsForecastSuite;
    scenarios: SystemsScenarioSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): SystemsKnowledgeContribution {
    const artifacts = [
      ...input.forecasts.forecasts.slice(0, 4).map(forecast => ({
        id: input.createId("sys-knowledge"),
        type: "systems_forecast",
        title: forecast.narrative,
        confidence: forecast.forecast / 100,
        sourceRef: forecast.id,
        validated: forecast.confidence === "high" || forecast.confidence === "medium",
        metadata: { area: forecast.area, capturedAt: input.now.toISOString() },
      })),
      ...input.scenarios.scenarios.slice(0, 4).map(scenario => ({
        id: input.createId("sys-knowledge"),
        type: "systems_scenario",
        title: scenario.title,
        confidence: scenario.probability,
        sourceRef: scenario.id,
        validated: scenario.probability >= .35,
        metadata: { kind: scenario.kind, capturedAt: input.now.toISOString() },
      })),
    ];
    return {
      artifacts,
      contributionScore: artifacts.reduce((s, a) => s + a.confidence, 0) / Math.max(1, artifacts.length) * 100,
      validatedCount: artifacts.filter(a => a.validated).length,
      narrative: \`\${artifacts.length} systems learning drafts prepared for Knowledge and decision domains.\`,
    };
  }
}
`);

w("closed-learning-loop.ts", `import type {
  ClosedLearningLoopContribution,
  SystemsRecommendationRecord,
  SystemsScenarioSuite,
  SystemsTrendSuite,
} from "@/lib/platform/intelligence/systems/types";

export class ClosedLearningLoop {
  contribute(input: {
    trends: SystemsTrendSuite;
    scenarios: SystemsScenarioSuite;
    recommendations: SystemsRecommendationRecord[];
    now: Date;
    createId: (prefix: string) => string;
  }): ClosedLearningLoopContribution {
    const worsening = input.trends.trends.filter(t => t.direction === "worsening");
    return {
      id: input.createId("sys-learning"),
      destinations: ["operations", "legal-compliance-risk", "predictive", "executive-decision", "economic", "behavioral", "opportunity"],
      lessons: input.trends.trends.slice(0, 5).map(t => t.narrative),
      improvementActions: input.recommendations.map(r => r.action),
      decisionSignals: worsening.slice(0, 4).map(t => \`\${t.area}:\${t.direction}\`),
      forecastSignals: input.scenarios.scenarios.slice(0, 4).map(s => \`\${s.kind}:\${Math.round(s.probability * 100)}\`),
      contributedAt: input.now.toISOString(),
      narrative: "Systems evidence feeds Operations, Legal Compliance Risk, Predictive, Executive Decision, Economic, Behavioral, and Opportunity Intelligence.",
    };
  }
}
`);

w("systems-reasoner.ts", `import type { SystemsReasonerContract } from "@/lib/platform/intelligence/systems/contracts";
import type { SystemsReasoningResult } from "@/lib/platform/intelligence/systems/types";

export class SystemsReasoner implements SystemsReasonerContract {
  reason(input: Parameters<SystemsReasonerContract["reason"]>[0]): SystemsReasoningResult {
    const connectedForces = input.trends.trends
      .slice()
      .sort((a, b) => b.magnitude - a.magnitude)
      .slice(0, 6)
      .map(t => t.title);
    const evidenceGaps = input.forecasts.forecasts
      .filter(f => f.confidence === "low" || f.confidence === "unknown")
      .slice(0, 6)
      .map(f => f.narrative);
    return {
      answer: input.request.question ??
        \`Systems outlook is \${input.forecasts.outlook} with primary scenario \${input.scenarios.primaryScenario.replaceAll("_", " ")}.\`,
      connectedForces,
      evidenceGaps,
      confidence: input.confidence,
      narrative: \`Reasoning used \${input.trends.trends.length} trends, \${input.forecasts.forecasts.length} forecasts, and \${input.scenarios.scenarios.length} scenarios.\`,
    };
  }
}
`);

w("systems-intelligence.ts", `import { buildLens, clamp, priorityFromScore, statusFromScore } from "@/lib/platform/intelligence/systems/models";
import type {
  SystemsArea, SystemsAreaSuite, SystemsBaseline, SystemsDashboard,
  SystemsForecastSuite, SystemsHealthScore, SystemsOpportunityRecord,
  SystemsRecommendationRecord, SystemsRiskRecord, SystemsScenarioSuite,
  SystemsScore, SystemsAnalysisSuite,
} from "@/lib/platform/intelligence/systems/types";
import { SYSTEMS_AREAS } from "@/lib/platform/intelligence/systems/types";

export const score = (key: string, label: string, value: number): SystemsScore => {
  const v = clamp(value);
  return { key, label, value: v, status: statusFromScore(v), band: priorityFromScore(v), narrative: \`\${label} is \${statusFromScore(v)} at \${Math.round(v)}.\` };
};

const lens = (area: string, value: number) => buildLens({
  dependencyImpact: \`\${area} dependency impact scored \${Math.round(value)}.\`,
  bottleneckRisk: \`Bottleneck risk linked to \${area}.\`,
  feedbackStability: \`Feedback stability around \${area}.\`,
  systemComplexity: \`System complexity relative to \${area} conditions.\`,
  resourceFlow: \`Resource flow reading for \${area}.\`,
  cascadingRisk: \`Cascading risk implications of \${area}.\`,
  adaptability: \`Adaptability pressure from \${area}.\`,
  longTermSystemHealth: \`Timing window for \${area}-linked systems action.\`,
});

export class SystemsIntelligence {
  composeScores(input: {
    baseline: SystemsBaseline;
    areas: Record<SystemsArea, SystemsAreaSuite>;
    forecast: number;
    scenario: number;
    analysis: number;
    earlyWarning: number;
    dependency: number;
    feedbackLoop: number;
    constraint: number;
    bottleneck: number;
    networkDynamics: number;
  }) {
    const areaScores = Object.fromEntries(
      SYSTEMS_AREAS.map(a => [a, score(\`systems_\${a}\`, \`\${a} Systems Score\`, input.areas[a].score)])
    ) as Record<SystemsArea, SystemsScore>;
    const overall =
      SYSTEMS_AREAS.reduce((s, a) => s + areaScores[a].value, 0) / SYSTEMS_AREAS.length * .5 +
      input.baseline.dependencyImpact * .1 +
      input.baseline.bottleneckRisk * .1 +
      input.baseline.adaptability * .08 +
      input.forecast * .08 +
      input.scenario * .07 +
      input.earlyWarning * .04 +
      input.networkDynamics * .03;
    return {
      healthScore: score("systems_health", "Systems Health Score", overall),
      areaScores,
      forecastScore: score("systems_forecast", "Forecast Score", input.forecast),
      scenarioScore: score("systems_scenario", "Scenario Score", input.scenario),
      analysisScore: score("systems_analysis", "Analysis Score", input.analysis),
      earlyWarningScore: score("systems_early_warning", "Early Warning Score", input.earlyWarning),
      dependencyScore: score("systems_dependency", "Dependency Score", input.dependency),
      feedbackLoopScore: score("systems_feedback_loop", "Feedback Loop Score", input.feedbackLoop),
      bottleneckScore: score("systems_bottleneck", "Bottleneck Score", input.bottleneck),
      networkDynamicsScore: score("systems_network_dynamics", "Network Dynamics Score", input.networkDynamics),
      constraintScore: score("systems_constraint", "Constraint Score", input.constraint),
    };
  }
}

export class SystemsRecommendationComposer {
  constructor(private createId: (prefix: string) => string) {}
  compose(
    areas: Record<SystemsArea, SystemsAreaSuite>,
    analysis: SystemsAnalysisSuite,
    scenarios: SystemsScenarioSuite,
    now: Date,
  ): SystemsRecommendationRecord[] {
    return [...SYSTEMS_AREAS]
      .sort((a, b) => areas[a].score - areas[b].score)
      .slice(0, 6)
      .map((area, index) => ({
        id: this.createId("sys-rec"),
        title: \`Address \${area.replaceAll("_", " ")} systems exposure\`,
        priority: priorityFromScore(areas[area].score),
        evidenceRefs: analysis.analyses.slice(0, 2).map(a => a.id).concat(scenarios.scenarios.slice(0, 1).map(s => s.id)),
        confidenceScore: .68,
        owner: index ? "systems-owner" : "executive-team",
        dueDate: new Date(now.getTime() + (30 + index * 14) * 86400000).toISOString(),
        rationale: areas[area].narrative,
        action: \`Run a systems response cycle for \${area.replaceAll("_", " ")}.\`,
        lenses: lens(area, areas[area].score),
        narrative: \`Prioritize \${area} systems response.\`,
      }));
  }
}

export function composeRisksOpportunities(
  areas: Record<SystemsArea, SystemsAreaSuite>,
  createId: (prefix: string) => string,
): { risks: SystemsRiskRecord[]; opportunities: SystemsOpportunityRecord[] } {
  const ordered = [...SYSTEMS_AREAS].sort((a, b) => areas[a].score - areas[b].score);
  return {
    risks: ordered.slice(0, 5).map(a => ({
      id: createId("sys-risk"),
      title: \`\${a.replaceAll("_", " ")} systems pressure\`,
      area: a,
      severity: priorityFromScore(areas[a].score),
      score: 100 - areas[a].score,
      mitigation: \`Strengthen monitoring and systems playbooks for \${a.replaceAll("_", " ")}.\`,
      lenses: lens(a, areas[a].score),
      narrative: areas[a].narrative,
    })),
    opportunities: ordered.slice(-5).reverse().map(a => ({
      id: createId("sys-opp"),
      title: \`Capture \${a.replaceAll("_", " ")} systems advantage\`,
      area: a,
      priority: priorityFromScore(100 - areas[a].score),
      score: areas[a].score,
      lenses: lens(a, areas[a].score),
      narrative: areas[a].narrative,
    })),
  };
}

export function composeHealth(
  scores: ReturnType<SystemsIntelligence["composeScores"]>,
  baseline: SystemsBaseline,
  forecasts: SystemsForecastSuite,
): SystemsHealthScore {
  const areaScores = Object.fromEntries(SYSTEMS_AREAS.map(a => [a, scores.areaScores[a].value])) as Record<SystemsArea, number>;
  return {
    overallScore: scores.healthScore.value,
    status: scores.healthScore.status,
    outlook: forecasts.outlook,
    areaScores,
    dependencyScore: scores.dependencyScore.value,
    bottleneckScore: scores.bottleneckScore.value,
    adaptiveScore: scores.areaScores.adaptive_capacity.value,
    complexityScore: scores.areaScores.organizational_complexity.value,
    forecastScore: scores.forecastScore.value,
    scenarioScore: scores.scenarioScore.value,
    lenses: lens("organization", scores.healthScore.value),
    narrative: scores.healthScore.narrative,
  };
}

export function composeDashboard(
  now: Date,
  health: SystemsHealthScore,
  baseline: SystemsBaseline,
  risks: SystemsRiskRecord[],
  opportunities: SystemsOpportunityRecord[],
): SystemsDashboard {
  return {
    generatedAt: now.toISOString(),
    headline: \`Executive Systems Overview: health \${Math.round(health.overallScore)}  -  \${health.status} (\${health.outlook})\`,
    overall: health.overallScore,
    areaScores: health.areaScores,
    outlook: health.outlook,
    dependencyImpact: baseline.dependencyImpact,
    bottleneckRisk: baseline.bottleneckRisk,
    adaptability: baseline.adaptability,
    topRisks: risks.map(r => r.title),
    topOpportunities: opportunities.map(o => o.title),
    narrative: health.narrative,
  };
}

export function composeSystemsHealth(
  scores: ReturnType<SystemsIntelligence["composeScores"]>,
  baseline: SystemsBaseline,
  forecasts: SystemsForecastSuite,
) {
  return composeHealth(scores, baseline, forecasts);
}

export const systemsLens = lens;
`);

const areaImports = AREAS.map(([area, cls]) =>
  `import { ${cls} } from "@/lib/platform/intelligence/systems/${area.replaceAll("_", "-")}-intelligence";`
).join("\n");

const areaInit = AREAS.map(([area, cls]) => `      ${area}: new ${cls}(),`).join("\n");

const areaScoreAssign = AREAS.map(([area]) => {
  const camel = snakeToCamel(area);
  // networkDynamicsScore appears once for both area and engine - assign area here,
  // then overwrite with engine score below for the specialized engine field.
  // Actually: area network_dynamics -> networkDynamicsScore AND engine also networkDynamicsScore.
  // We'll assign area scores for all, then specialized engine scores overwrite/add.
  // For network_dynamics, area assignment and engine assignment use same key - engine wins last.
  return `      ${camel}Score: scores.areaScores.${area},`;
}).join("\n");

w("systems-engine.ts", `import type { SystemsDependencies, SystemsEngine as Contract } from "@/lib/platform/intelligence/systems/contracts";
import { defaultCreateId, defaultPeriodLabel, deriveSystemsBaseline, emptySystemsScope, buildConfidence } from "@/lib/platform/intelligence/systems/models";
import { SYSTEMS_AREAS, SYSTEMS_INTELLIGENCE_VERSION, type SystemsArea, type SystemsAreaSuite, type SystemsRequest, type SystemsResult } from "@/lib/platform/intelligence/systems/types";
${areaImports}
import { SystemsForecastEngine } from "@/lib/platform/intelligence/systems/systems-forecast-engine";
import { SystemsScenarioEngine } from "@/lib/platform/intelligence/systems/systems-scenario-engine";
import { SystemsTrendEngine } from "@/lib/platform/intelligence/systems/systems-trend-engine";
import { SystemsAnalysisEngine } from "@/lib/platform/intelligence/systems/systems-analysis-engine";
import { DependencyEngine } from "@/lib/platform/intelligence/systems/dependency-engine";
import { FeedbackLoopEngine } from "@/lib/platform/intelligence/systems/feedback-loop-engine";
import { ConstraintEngine } from "@/lib/platform/intelligence/systems/constraint-engine";
import { BottleneckEngine } from "@/lib/platform/intelligence/systems/bottleneck-engine";
import { NetworkDynamicsEngine } from "@/lib/platform/intelligence/systems/network-dynamics-engine";
import { EarlyWarningEngine } from "@/lib/platform/intelligence/systems/early-warning-engine";
import { SystemsKnowledgeContributionEngine } from "@/lib/platform/intelligence/systems/knowledge-contribution";
import { ClosedLearningLoop } from "@/lib/platform/intelligence/systems/closed-learning-loop";
import { SystemsReasoner } from "@/lib/platform/intelligence/systems/systems-reasoner";
import {
  SystemsIntelligence, SystemsRecommendationComposer, composeDashboard, composeHealth,
  composeRisksOpportunities, systemsLens,
} from "@/lib/platform/intelligence/systems/systems-intelligence";
import { SystemsProjection } from "@/lib/platform/intelligence/systems/projection";
import { SystemsRepositoryStore } from "@/lib/platform/intelligence/systems/repository";
import { SystemsRegistryStore } from "@/lib/platform/intelligence/systems/systems-registry";
import { SystemsQueries } from "@/lib/platform/intelligence/systems/projection";

export class SystemsIntelligenceEngineImpl implements Contract {
  readonly repository; readonly registry; readonly queries;
  private now; private createId; private areas; private forecasts; private scenarios; private trends; private analysis;
  private dependency; private feedbackLoop; private constraint; private bottleneck; private networkDynamics; private earlyWarning; private reasoner;

  constructor(d: SystemsDependencies = {}) {
    this.now = d.now ?? (() => new Date());
    this.createId = d.createId ?? defaultCreateId;
    this.repository = d.repository ?? new SystemsRepositoryStore();
    this.registry = d.registry ?? new SystemsRegistryStore();
    this.queries = new SystemsQueries();
    this.areas = {
${areaInit}
      ...d.areaIntelligence,
    };
    this.forecasts = d.forecastEngine ?? new SystemsForecastEngine();
    this.scenarios = d.scenarioEngine ?? new SystemsScenarioEngine();
    this.trends = d.trendEngine ?? new SystemsTrendEngine();
    this.analysis = d.analysisEngine ?? new SystemsAnalysisEngine();
    this.dependency = d.dependencyEngine ?? new DependencyEngine();
    this.feedbackLoop = d.feedbackLoopEngine ?? new FeedbackLoopEngine();
    this.constraint = d.constraintEngine ?? new ConstraintEngine();
    this.bottleneck = d.bottleneckEngine ?? new BottleneckEngine();
    this.networkDynamics = d.networkDynamicsEngine ?? new NetworkDynamicsEngine();
    this.earlyWarning = d.earlyWarningEngine ?? new EarlyWarningEngine();
    this.reasoner = d.reasoner ?? new SystemsReasoner();
  }

  build(request: SystemsRequest): SystemsResult {
    const now = this.now();
    const baseline = deriveSystemsBaseline(request);
    const createId = this.createId;
    const scope = request.scope ?? emptySystemsScope();
    const areaSuites = Object.fromEntries(
      SYSTEMS_AREAS.map(area => [area, this.areas[area]!.assess({ baseline, now, createId })])
    ) as Record<SystemsArea, SystemsAreaSuite>;

    const trendSuite = this.trends.assess({ baseline, areas: areaSuites, now, createId });
    const forecastSuite = this.forecasts.assess({ baseline, areas: areaSuites, now, createId });
    const scenarioSuite = this.scenarios.assess({ baseline, areas: areaSuites, forecasts: forecastSuite, now, createId });
    const analysisSuite = this.analysis.assess({ baseline, areas: areaSuites, forecasts: forecastSuite, scenarios: scenarioSuite, now, createId });
    const dependencySuite = this.dependency.assess({ baseline, areas: areaSuites, now, createId });
    const feedbackLoopSuite = this.feedbackLoop.assess({ baseline, areas: areaSuites, now, createId });
    const constraintSuite = this.constraint.assess({ baseline, areas: areaSuites, now, createId });
    const bottleneckSuite = this.bottleneck.assess({ baseline, areas: areaSuites, now, createId });
    const networkDynamicsSuite = this.networkDynamics.assess({ baseline, areas: areaSuites, now, createId });
    const earlyWarningSuite = this.earlyWarning.assess({ baseline, trends: trendSuite, scenarios: scenarioSuite, now, createId });
    const knowledgeContribution = new SystemsKnowledgeContributionEngine().contribute({ forecasts: forecastSuite, scenarios: scenarioSuite, now, createId });
    const confidence = buildConfidence([
      { key: "evidence", label: "Evidence coverage", contribution: baseline.evidenceCoverage / 100 },
      { key: "forecast", label: "Forecast maturity", contribution: forecastSuite.maturityScore / 100 },
      { key: "scenario", label: "Scenario maturity", contribution: baseline.scenarioMaturity / 100 },
    ]);
    const reasoning = this.reasoner.reason({ request, trends: trendSuite, forecasts: forecastSuite, scenarios: scenarioSuite, confidence });
    const intelligence = new SystemsIntelligence();
    const scores = intelligence.composeScores({
      baseline,
      areas: areaSuites,
      forecast: forecastSuite.maturityScore,
      scenario: baseline.scenarioMaturity,
      analysis: analysisSuite.maturityScore,
      earlyWarning: earlyWarningSuite.score,
      dependency: dependencySuite.score,
      feedbackLoop: feedbackLoopSuite.score,
      constraint: constraintSuite.score,
      bottleneck: bottleneckSuite.score,
      networkDynamics: networkDynamicsSuite.score,
    });
    const { risks, opportunities } = composeRisksOpportunities(areaSuites, createId);
    const recommendations = new SystemsRecommendationComposer(createId).compose(areaSuites, analysisSuite, scenarioSuite, now);
    const health = composeHealth(scores, baseline, forecastSuite);
    const dashboard = composeDashboard(now, health, baseline, risks, opportunities);
    const commonLens = systemsLens("organization", health.overallScore);

    const dependencyMapDashboard = {
      generatedAt: now.toISOString(),
      headline: \`Dependency map index \${Math.round(dependencySuite.dependencyIndex)}\`,
      score: dependencySuite.score,
      dependencyIndex: dependencySuite.dependencyIndex,
      signals: dependencySuite.records.slice(0, 4).map(r => r.title),
      narrative: dependencySuite.narrative,
    };
    const feedbackLoopsDashboard = {
      generatedAt: now.toISOString(),
      headline: \`Feedback stability \${Math.round(baseline.feedbackStability)}\`,
      score: feedbackLoopSuite.score,
      feedbackIndex: feedbackLoopSuite.feedbackIndex,
      signals: feedbackLoopSuite.records.map(r => r.narrative),
      narrative: feedbackLoopSuite.narrative,
    };
    const bottlenecksDashboard = {
      generatedAt: now.toISOString(),
      headline: \`Bottleneck index \${Math.round(bottleneckSuite.bottleneckIndex)}\`,
      score: bottleneckSuite.score,
      bottleneckIndex: bottleneckSuite.bottleneckIndex,
      signals: bottleneckSuite.records.map(r => r.narrative),
      narrative: bottleneckSuite.narrative,
    };
    const systemHealthDashboard = {
      generatedAt: now.toISOString(),
      headline: \`System stability \${Math.round(areaSuites.system_stability.score)}\`,
      score: areaSuites.system_stability.score,
      stabilityIndex: areaSuites.system_stability.score,
      signals: areaSuites.system_stability.records.map(r => r.signal),
      narrative: areaSuites.system_stability.narrative,
    };
    const complexityAnalysisDashboard = {
      generatedAt: now.toISOString(),
      headline: \`Complexity \${Math.round(baseline.systemComplexity)}\`,
      score: areaSuites.organizational_complexity.score,
      complexityIndex: baseline.systemComplexity,
      signals: areaSuites.organizational_complexity.records.map(r => r.signal),
      narrative: areaSuites.organizational_complexity.narrative,
    };
    const adaptiveCapacityDashboard = {
      generatedAt: now.toISOString(),
      headline: \`Adaptive capacity \${Math.round(baseline.adaptability)}\`,
      score: areaSuites.adaptive_capacity.score,
      adaptiveIndex: baseline.adaptability,
      signals: areaSuites.adaptive_capacity.records.map(r => r.signal),
      narrative: areaSuites.adaptive_capacity.narrative,
    };
    const forecastDashboard = {
      generatedAt: now.toISOString(),
      headline: \`Systems Forecast: \${forecastSuite.outlook}\`,
      score: forecastSuite.maturityScore,
      outlook: forecastSuite.outlook,
      signals: forecastSuite.forecasts.slice(0, 4).map(f => f.narrative),
      narrative: forecastSuite.narrative,
    };
    const brief = {
      generatedAt: now.toISOString(),
      headline: dashboard.headline,
      summary: \`\${forecastSuite.narrative} \${scenarioSuite.narrative}\`,
      healthScore: health.overallScore,
      outlook: forecastSuite.outlook,
      topRecommendations: recommendations.map(r => r.title),
      topRisks: risks.map(r => r.title),
      lenses: commonLens,
      narrative: dashboard.narrative,
    };
    const boardReport = {
      generatedAt: now.toISOString(),
      headline: \`Board Report: \${dashboard.headline}\`,
      assuranceSummary: \`Evidence coverage \${Math.round(baseline.evidenceCoverage)}; primary scenario \${scenarioSuite.primaryScenario.replaceAll("_", " ")}.\`,
      healthScore: health.overallScore,
      outlook: forecastSuite.outlook,
      dependencyScore: dependencySuite.score,
      bottleneckScore: bottleneckSuite.score,
      adaptiveScore: areaSuites.adaptive_capacity.score,
      recommendations: recommendations.map(r => r.title),
      lenses: commonLens,
      narrative: "Board assurance on dependencies, bottlenecks, adaptive capacity, and long-term system health.",
    };
    const closedLearningLoop = new ClosedLearningLoop().contribute({ trends: trendSuite, scenarios: scenarioSuite, recommendations, now, createId });
    const projection = new SystemsProjection().project({
      generatedAt: now.toISOString(),
      headline: brief.headline,
      healthScore: health.overallScore,
      areaScores: health.areaScores,
      outlook: forecastSuite.outlook,
      dashboard,
      brief,
      overallConfidence: confidence,
    });
    const historyRecord = {
      id: createId("sys-history"),
      requestId: request.requestId,
      scope,
      status: "assessed" as const,
      healthScore: health.overallScore,
      generatedAt: now.toISOString(),
      summary: brief.headline,
      metadata: request.metadata ?? {},
    };

    const result: SystemsResult = {
      requestId: request.requestId,
      version: SYSTEMS_INTELLIGENCE_VERSION,
      generatedAt: now.toISOString(),
      periodLabel: request.periodLabel ?? defaultPeriodLabel(now),
      scope,
      baseline,
      healthScore: scores.healthScore,
${areaScoreAssign}
      forecastScore: scores.forecastScore,
      scenarioScore: scores.scenarioScore,
      analysisScore: scores.analysisScore,
      earlyWarningScore: scores.earlyWarningScore,
      dependencyScore: scores.dependencyScore,
      feedbackLoopScore: scores.feedbackLoopScore,
      bottleneckScore: scores.bottleneckScore,
      networkDynamicsScore: scores.networkDynamicsScore,
      constraintScore: scores.constraintScore,
      health,
      dashboard,
      dependencyMapDashboard,
      feedbackLoopsDashboard,
      bottlenecksDashboard,
      systemHealthDashboard,
      complexityAnalysisDashboard,
      adaptiveCapacityDashboard,
      forecastDashboard,
      brief,
      boardReport,
      recommendations,
      risks,
      opportunities,
      areaSuites,
      trendSuite,
      forecastSuite,
      scenarioSuite,
      analysisSuite,
      dependencySuite,
      feedbackLoopSuite,
      constraintSuite,
      bottleneckSuite,
      networkDynamicsSuite,
      earlyWarningSuite,
      knowledgeContribution,
      closedLearningLoop,
      reasoning,
      projection,
      historyRecord,
      confidence,
      requestMetadata: { ...(request.metadata ?? {}), registryPublishers: this.registry.list().length },
    };

    this.registry.register("systems", "systems_intelligence");
    this.repository.save(result);
    this.repository.saveHistory(historyRecord);
    return result;
  }
}

export {
  SystemsIntelligenceEngineImpl as SystemsIntelligenceEngine,
  SystemsIntelligenceEngineImpl as SystemsEngine,
  SystemsIntelligenceEngineImpl as SystemsEngineImpl,
};
`);

console.log("Engines and composers written.");
