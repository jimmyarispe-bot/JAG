/**
 * Part 3: composers, engine, service, index, docs for Resilience Intelligence.
 */
import fs from "node:fs";
import path from "node:path";

const DEST = path.resolve("src/lib/platform/intelligence/resilience");
const w = (name, content) => fs.writeFileSync(path.join(DEST, name), content, "utf8");

const AREAS = [
  ["organizational_resilience", "OrganizationalResilienceIntelligence"],
  ["business_continuity", "BusinessContinuityIntelligence"],
  ["disaster_recovery", "DisasterRecoveryIntelligence"],
  ["operational_recovery", "OperationalRecoveryIntelligence"],
  ["financial_resilience", "FinancialResilienceIntelligence"],
  ["workforce_resilience", "WorkforceResilienceIntelligence"],
  ["supply_chain_resilience", "SupplyChainResilienceIntelligence"],
  ["cyber_resilience", "CyberResilienceIntelligence"],
  ["infrastructure_resilience", "InfrastructureResilienceIntelligence"],
  ["vendor_resilience", "VendorResilienceIntelligence"],
  ["crisis_readiness", "CrisisReadinessIntelligence"],
  ["adaptive_capacity", "AdaptiveCapacityIntelligence"],
  ["redundancy_planning", "RedundancyPlanningIntelligence"],
  ["recovery_time_analysis", "RecoveryTimeAnalysisIntelligence"],
  ["stress_testing", "StressTestingIntelligence"],
  ["resilience_optimization", "ResilienceOptimizationIntelligence"],
  ["long_term_adaptability", "LongTermAdaptabilityIntelligence"],
];
const AREA_KEYS = AREAS.map(([a]) => a);
const snakeToCamel = (s) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

w("resilience-intelligence.ts", `import { buildLens, clamp, priorityFromScore, statusFromScore } from "@/lib/platform/intelligence/resilience/models";
import type {
  ResilienceArea, ResilienceAreaSuite, ResilienceBaseline, ResilienceDashboard,
  ResilienceForecastSuite, ResilienceHealthScore, ResilienceOpportunityRecord,
  ResilienceRecommendationRecord, ResilienceRiskRecord, ResilienceScenarioSuite,
  ResilienceScore, ResilienceAnalysisSuite,
} from "@/lib/platform/intelligence/resilience/types";
import { RESILIENCE_AREAS } from "@/lib/platform/intelligence/resilience/types";

export const score = (key: string, label: string, value: number): ResilienceScore => {
  const v = clamp(value);
  return { key, label, value: v, status: statusFromScore(v), band: priorityFromScore(v), narrative: \`\${label} is \${statusFromScore(v)} at \${Math.round(v)}.\` };
};

const lens = (area: string, value: number) => buildLens({
  organizationalReadiness: \`\${area} organizational readiness scored \${Math.round(value)}.\`,
  recoveryCapability: \`Recovery capability linked to \${area}.\`,
  operationalStability: \`Operational stability around \${area}.\`,
  financialStability: \`Financial stability relative to \${area} conditions.\`,
  workforceStability: \`Workforce stability reading for \${area}.\`,
  infrastructureReadiness: \`Infrastructure readiness implications of \${area}.\`,
  adaptiveCapacity: \`Adaptive capacity pressure from \${area}.\`,
  longTermResilienceOutlook: \`Timing window for \${area}-linked resilience action.\`,
});

export class ResilienceIntelligence {
  composeScores(input: {
    baseline: ResilienceBaseline;
    areas: Record<ResilienceArea, ResilienceAreaSuite>;
    forecast: number;
    scenario: number;
    analysis: number;
    earlyWarning: number;
    stressTest: number;
    recovery: number;
    continuity: number;
    adaptiveCapacity: number;
  }) {
    const areaScores = Object.fromEntries(
      RESILIENCE_AREAS.map(a => [a, score(\`resilience_\${a}\`, \`\${a} Resilience Score\`, input.areas[a].score)])
    ) as Record<ResilienceArea, ResilienceScore>;
    const overall =
      RESILIENCE_AREAS.reduce((s, a) => s + areaScores[a].value, 0) / RESILIENCE_AREAS.length * .5 +
      input.baseline.organizationalReadiness * .1 +
      input.baseline.recoveryCapability * .1 +
      input.baseline.adaptiveCapacity * .08 +
      input.forecast * .08 +
      input.scenario * .07 +
      input.earlyWarning * .04 +
      input.stressTest * .03;
    return {
      healthScore: score("resilience_health", "Resilience Health Score", overall),
      areaScores,
      forecastScore: score("resilience_forecast", "Forecast Score", input.forecast),
      scenarioScore: score("resilience_scenario", "Scenario Score", input.scenario),
      analysisScore: score("resilience_analysis", "Analysis Score", input.analysis),
      earlyWarningScore: score("resilience_early_warning", "Early Warning Score", input.earlyWarning),
      stressTestScore: score("resilience_stress_test", "Stress Test Score", input.stressTest),
      recoveryScore: score("resilience_recovery", "Recovery Score", input.recovery),
      continuityScore: score("resilience_continuity", "Continuity Score", input.continuity),
      adaptiveCapacityScore: score("resilience_adaptive_capacity", "Adaptive Capacity Score", input.adaptiveCapacity),
    };
  }
}

export class ResilienceRecommendationComposer {
  constructor(private createId: (prefix: string) => string) {}
  compose(
    areas: Record<ResilienceArea, ResilienceAreaSuite>,
    analysis: ResilienceAnalysisSuite,
    scenarios: ResilienceScenarioSuite,
    now: Date,
  ): ResilienceRecommendationRecord[] {
    return [...RESILIENCE_AREAS]
      .sort((a, b) => areas[a].score - areas[b].score)
      .slice(0, 6)
      .map((area, index) => ({
        id: this.createId("rsl-rec"),
        title: \`Address \${area.replaceAll("_", " ")} resilience exposure\`,
        priority: priorityFromScore(areas[area].score),
        evidenceRefs: analysis.analyses.slice(0, 2).map(a => a.id).concat(scenarios.scenarios.slice(0, 1).map(s => s.id)),
        confidenceScore: .68,
        owner: index ? "resilience-owner" : "executive-team",
        dueDate: new Date(now.getTime() + (30 + index * 14) * 86400000).toISOString(),
        rationale: areas[area].narrative,
        action: \`Run a resilience response cycle for \${area.replaceAll("_", " ")}.\`,
        lenses: lens(area, areas[area].score),
        narrative: \`Prioritize \${area} resilience response.\`,
      }));
  }
}

export function composeRisksOpportunities(
  areas: Record<ResilienceArea, ResilienceAreaSuite>,
  createId: (prefix: string) => string,
): { risks: ResilienceRiskRecord[]; opportunities: ResilienceOpportunityRecord[] } {
  const ordered = [...RESILIENCE_AREAS].sort((a, b) => areas[a].score - areas[b].score);
  return {
    risks: ordered.slice(0, 5).map(a => ({
      id: createId("rsl-risk"),
      title: \`\${a.replaceAll("_", " ")} resilience pressure\`,
      area: a,
      severity: priorityFromScore(areas[a].score),
      score: 100 - areas[a].score,
      mitigation: \`Strengthen monitoring and resilience playbooks for \${a.replaceAll("_", " ")}.\`,
      lenses: lens(a, areas[a].score),
      narrative: areas[a].narrative,
    })),
    opportunities: ordered.slice(-5).reverse().map(a => ({
      id: createId("rsl-opp"),
      title: \`Capture \${a.replaceAll("_", " ")} resilience advantage\`,
      area: a,
      priority: priorityFromScore(100 - areas[a].score),
      score: areas[a].score,
      lenses: lens(a, areas[a].score),
      narrative: areas[a].narrative,
    })),
  };
}

export function composeHealth(
  scores: ReturnType<ResilienceIntelligence["composeScores"]>,
  baseline: ResilienceBaseline,
  forecasts: ResilienceForecastSuite,
): ResilienceHealthScore {
  const areaScores = Object.fromEntries(RESILIENCE_AREAS.map(a => [a, scores.areaScores[a].value])) as Record<ResilienceArea, number>;
  return {
    overallScore: scores.healthScore.value,
    status: scores.healthScore.status,
    outlook: forecasts.outlook,
    areaScores,
    continuityScore: scores.continuityScore.value,
    recoveryScore: scores.recoveryScore.value,
    adaptiveScore: scores.adaptiveCapacityScore.value,
    stressTestScore: scores.stressTestScore.value,
    forecastScore: scores.forecastScore.value,
    scenarioScore: scores.scenarioScore.value,
    lenses: lens("organization", scores.healthScore.value),
    narrative: scores.healthScore.narrative,
  };
}

export function composeDashboard(
  now: Date,
  health: ResilienceHealthScore,
  baseline: ResilienceBaseline,
  risks: ResilienceRiskRecord[],
  opportunities: ResilienceOpportunityRecord[],
): ResilienceDashboard {
  return {
    generatedAt: now.toISOString(),
    headline: \`Executive Resilience Overview: health \${Math.round(health.overallScore)}  -  \${health.status} (\${health.outlook})\`,
    overall: health.overallScore,
    areaScores: health.areaScores,
    outlook: health.outlook,
    organizationalReadiness: baseline.organizationalReadiness,
    recoveryCapability: baseline.recoveryCapability,
    adaptiveCapacity: baseline.adaptiveCapacity,
    topRisks: risks.map(r => r.title),
    topOpportunities: opportunities.map(o => o.title),
    narrative: health.narrative,
  };
}

export function composeResilienceHealth(
  scores: ReturnType<ResilienceIntelligence["composeScores"]>,
  baseline: ResilienceBaseline,
  forecasts: ResilienceForecastSuite,
) {
  return composeHealth(scores, baseline, forecasts);
}

export const resilienceLens = lens;
`);

const areaImports = AREAS.map(([area, cls]) =>
  `import { ${cls} } from "@/lib/platform/intelligence/resilience/${area.replaceAll("_", "-")}-intelligence";`
).join("\n");
const areaInit = AREAS.map(([area, cls]) => `      ${area}: new ${cls}(),`).join("\n");
// adaptiveCapacityScore shared: area assignment skipped, engine score assigned
const areaScoreAssign = AREA_KEYS.filter(a => a !== "adaptive_capacity").map(a =>
  `      ${snakeToCamel(a)}Score: scores.areaScores.${a},`
).join("\n");

w("resilience-engine.ts", `import type { ResilienceDependencies, ResilienceEngine as Contract } from "@/lib/platform/intelligence/resilience/contracts";
import { defaultCreateId, defaultPeriodLabel, deriveResilienceBaseline, emptyResilienceScope, buildConfidence } from "@/lib/platform/intelligence/resilience/models";
import { RESILIENCE_AREAS, RESILIENCE_INTELLIGENCE_VERSION, type ResilienceArea, type ResilienceAreaSuite, type ResilienceRequest, type ResilienceResult } from "@/lib/platform/intelligence/resilience/types";
${areaImports}
import { ResilienceForecastEngine } from "@/lib/platform/intelligence/resilience/resilience-forecast-engine";
import { ResilienceScenarioEngine } from "@/lib/platform/intelligence/resilience/resilience-scenario-engine";
import { ResilienceTrendEngine } from "@/lib/platform/intelligence/resilience/resilience-trend-engine";
import { ResilienceAnalysisEngine } from "@/lib/platform/intelligence/resilience/resilience-analysis-engine";
import { StressTestEngine } from "@/lib/platform/intelligence/resilience/stress-test-engine";
import { RecoveryEngine } from "@/lib/platform/intelligence/resilience/recovery-engine";
import { ContinuityEngine } from "@/lib/platform/intelligence/resilience/continuity-engine";
import { AdaptiveCapacityEngine } from "@/lib/platform/intelligence/resilience/adaptive-capacity-engine";
import { EarlyWarningEngine } from "@/lib/platform/intelligence/resilience/early-warning-engine";
import { ResilienceKnowledgeContributionEngine } from "@/lib/platform/intelligence/resilience/knowledge-contribution";
import { ClosedLearningLoop } from "@/lib/platform/intelligence/resilience/closed-learning-loop";
import { ResilienceReasoner } from "@/lib/platform/intelligence/resilience/resilience-reasoner";
import {
  ResilienceIntelligence, ResilienceRecommendationComposer, composeDashboard, composeHealth,
  composeRisksOpportunities, resilienceLens,
} from "@/lib/platform/intelligence/resilience/resilience-intelligence";
import { ResilienceProjection } from "@/lib/platform/intelligence/resilience/projection";
import { ResilienceRepositoryStore } from "@/lib/platform/intelligence/resilience/repository";
import { ResilienceRegistryStore } from "@/lib/platform/intelligence/resilience/resilience-registry";
import { ResilienceQueries } from "@/lib/platform/intelligence/resilience/projection";

export class ResilienceIntelligenceEngineImpl implements Contract {
  readonly repository; readonly registry; readonly queries;
  private now; private createId; private areas; private forecasts; private scenarios; private trends; private analysis;
  private stressTest; private recovery; private continuity; private adaptiveCapacity; private earlyWarning; private reasoner;

  constructor(d: ResilienceDependencies = {}) {
    this.now = d.now ?? (() => new Date());
    this.createId = d.createId ?? defaultCreateId;
    this.repository = d.repository ?? new ResilienceRepositoryStore();
    this.registry = d.registry ?? new ResilienceRegistryStore();
    this.queries = new ResilienceQueries();
    this.areas = {
${areaInit}
      ...d.areaIntelligence,
    };
    this.forecasts = d.forecastEngine ?? new ResilienceForecastEngine();
    this.scenarios = d.scenarioEngine ?? new ResilienceScenarioEngine();
    this.trends = d.trendEngine ?? new ResilienceTrendEngine();
    this.analysis = d.analysisEngine ?? new ResilienceAnalysisEngine();
    this.stressTest = d.stressTestEngine ?? new StressTestEngine();
    this.recovery = d.recoveryEngine ?? new RecoveryEngine();
    this.continuity = d.continuityEngine ?? new ContinuityEngine();
    this.adaptiveCapacity = d.adaptiveCapacityEngine ?? new AdaptiveCapacityEngine();
    this.earlyWarning = d.earlyWarningEngine ?? new EarlyWarningEngine();
    this.reasoner = d.reasoner ?? new ResilienceReasoner();
  }

  build(request: ResilienceRequest): ResilienceResult {
    const now = this.now();
    const baseline = deriveResilienceBaseline(request);
    const createId = this.createId;
    const scope = request.scope ?? emptyResilienceScope();
    const areaSuites = Object.fromEntries(
      RESILIENCE_AREAS.map(area => [area, this.areas[area]!.assess({ baseline, now, createId })])
    ) as Record<ResilienceArea, ResilienceAreaSuite>;

    const trendSuite = this.trends.assess({ baseline, areas: areaSuites, now, createId });
    const forecastSuite = this.forecasts.assess({ baseline, areas: areaSuites, now, createId });
    const scenarioSuite = this.scenarios.assess({ baseline, areas: areaSuites, forecasts: forecastSuite, now, createId });
    const analysisSuite = this.analysis.assess({ baseline, areas: areaSuites, forecasts: forecastSuite, scenarios: scenarioSuite, now, createId });
    const stressTestSuite = this.stressTest.assess({ baseline, areas: areaSuites, now, createId });
    const recoverySuite = this.recovery.assess({ baseline, areas: areaSuites, now, createId });
    const continuitySuite = this.continuity.assess({ baseline, areas: areaSuites, now, createId });
    const adaptiveCapacitySuite = this.adaptiveCapacity.assess({ baseline, areas: areaSuites, now, createId });
    const earlyWarningSuite = this.earlyWarning.assess({ baseline, trends: trendSuite, scenarios: scenarioSuite, now, createId });
    const knowledgeContribution = new ResilienceKnowledgeContributionEngine().contribute({ forecasts: forecastSuite, scenarios: scenarioSuite, now, createId });
    const confidence = buildConfidence([
      { key: "evidence", label: "Evidence coverage", contribution: baseline.evidenceCoverage / 100 },
      { key: "forecast", label: "Forecast maturity", contribution: forecastSuite.maturityScore / 100 },
      { key: "scenario", label: "Scenario maturity", contribution: baseline.scenarioMaturity / 100 },
    ]);
    const reasoning = this.reasoner.reason({ request, trends: trendSuite, forecasts: forecastSuite, scenarios: scenarioSuite, confidence });
    const intelligence = new ResilienceIntelligence();
    const scores = intelligence.composeScores({
      baseline,
      areas: areaSuites,
      forecast: forecastSuite.maturityScore,
      scenario: baseline.scenarioMaturity,
      analysis: analysisSuite.maturityScore,
      earlyWarning: earlyWarningSuite.score,
      stressTest: stressTestSuite.score,
      recovery: recoverySuite.score,
      continuity: continuitySuite.score,
      adaptiveCapacity: adaptiveCapacitySuite.score,
    });
    const { risks, opportunities } = composeRisksOpportunities(areaSuites, createId);
    const recommendations = new ResilienceRecommendationComposer(createId).compose(areaSuites, analysisSuite, scenarioSuite, now);
    const health = composeHealth(scores, baseline, forecastSuite);
    const dashboard = composeDashboard(now, health, baseline, risks, opportunities);
    const commonLens = resilienceLens("organization", health.overallScore);

    const businessContinuityDashboard = {
      generatedAt: now.toISOString(),
      headline: \`Business continuity index \${Math.round(continuitySuite.continuityIndex)}\`,
      score: continuitySuite.score,
      continuityIndex: continuitySuite.continuityIndex,
      signals: continuitySuite.records.slice(0, 4).map(r => r.title),
      narrative: continuitySuite.narrative,
    };
    const disasterRecoveryDashboard = {
      generatedAt: now.toISOString(),
      headline: \`Disaster recovery index \${Math.round(recoverySuite.recoveryIndex)}\`,
      score: recoverySuite.score,
      recoveryIndex: recoverySuite.recoveryIndex,
      signals: recoverySuite.records.map(r => r.narrative),
      narrative: recoverySuite.narrative,
    };
    const operationalStabilityDashboard = {
      generatedAt: now.toISOString(),
      headline: \`Operational stability \${Math.round(baseline.operationalStability)}\`,
      score: areaSuites.operational_recovery.score,
      stabilityIndex: baseline.operationalStability,
      signals: areaSuites.operational_recovery.records.map(r => r.signal),
      narrative: areaSuites.operational_recovery.narrative,
    };
    const financialResilienceDashboard = {
      generatedAt: now.toISOString(),
      headline: \`Financial resilience \${Math.round(baseline.financialStability)}\`,
      score: areaSuites.financial_resilience.score,
      financialIndex: baseline.financialStability,
      signals: areaSuites.financial_resilience.records.map(r => r.signal),
      narrative: areaSuites.financial_resilience.narrative,
    };
    const cyberInfrastructureDashboard = {
      generatedAt: now.toISOString(),
      headline: \`Cyber and infrastructure readiness \${Math.round(baseline.infrastructureReadiness)}\`,
      score: clampAvg(areaSuites.cyber_resilience.score, areaSuites.infrastructure_resilience.score),
      cyberIndex: baseline.infrastructureReadiness,
      signals: [...areaSuites.cyber_resilience.records, ...areaSuites.infrastructure_resilience.records].slice(0, 4).map(r => r.signal),
      narrative: \`Cyber \${Math.round(areaSuites.cyber_resilience.score)}; infrastructure \${Math.round(areaSuites.infrastructure_resilience.score)}.\`,
    };
    const stressTestingDashboard = {
      generatedAt: now.toISOString(),
      headline: \`Stress testing index \${Math.round(stressTestSuite.stressIndex)}\`,
      score: stressTestSuite.score,
      stressIndex: stressTestSuite.stressIndex,
      signals: stressTestSuite.records.map(r => r.narrative),
      narrative: stressTestSuite.narrative,
    };
    const forecastDashboard = {
      generatedAt: now.toISOString(),
      headline: \`Resilience Forecast: \${forecastSuite.outlook}\`,
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
      continuityScore: continuitySuite.score,
      recoveryScore: recoverySuite.score,
      adaptiveScore: adaptiveCapacitySuite.score,
      recommendations: recommendations.map(r => r.title),
      lenses: commonLens,
      narrative: "Board assurance on continuity, recovery, adaptive capacity, and long-term resilience.",
    };
    const closedLearningLoop = new ClosedLearningLoop().contribute({ trends: trendSuite, scenarios: scenarioSuite, recommendations, now, createId });
    const projection = new ResilienceProjection().project({
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
      id: createId("rsl-history"),
      requestId: request.requestId,
      scope,
      status: "assessed" as const,
      healthScore: health.overallScore,
      generatedAt: now.toISOString(),
      summary: brief.headline,
      metadata: request.metadata ?? {},
    };

    const result: ResilienceResult = {
      requestId: request.requestId,
      version: RESILIENCE_INTELLIGENCE_VERSION,
      generatedAt: now.toISOString(),
      periodLabel: request.periodLabel ?? defaultPeriodLabel(now),
      scope,
      baseline,
      healthScore: scores.healthScore,
${areaScoreAssign}
      adaptiveCapacityScore: scores.adaptiveCapacityScore,
      forecastScore: scores.forecastScore,
      scenarioScore: scores.scenarioScore,
      analysisScore: scores.analysisScore,
      earlyWarningScore: scores.earlyWarningScore,
      stressTestScore: scores.stressTestScore,
      recoveryScore: scores.recoveryScore,
      continuityScore: scores.continuityScore,
      health,
      dashboard,
      businessContinuityDashboard,
      disasterRecoveryDashboard,
      operationalStabilityDashboard,
      financialResilienceDashboard,
      cyberInfrastructureDashboard,
      stressTestingDashboard,
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
      stressTestSuite,
      recoverySuite,
      continuitySuite,
      adaptiveCapacitySuite,
      earlyWarningSuite,
      knowledgeContribution,
      closedLearningLoop,
      reasoning,
      projection,
      historyRecord,
      confidence,
      requestMetadata: { ...(request.metadata ?? {}), registryPublishers: this.registry.list().length },
    };

    this.registry.register("resilience", "resilience_intelligence");
    this.repository.save(result);
    this.repository.saveHistory(historyRecord);
    return result;
  }
}

function clampAvg(a: number, b: number) { return (a + b) / 2; }

export {
  ResilienceIntelligenceEngineImpl as ResilienceIntelligenceEngine,
  ResilienceIntelligenceEngineImpl as ResilienceEngine,
  ResilienceIntelligenceEngineImpl as ResilienceEngineImpl,
};
`);

w("projection.ts", `import { buildConfidence, outlookFromScore } from "@/lib/platform/intelligence/resilience/models";
import type { ResilienceProjectionResult, ResilienceQueryRequest, ResilienceQueryResult, ResilienceResult } from "@/lib/platform/intelligence/resilience/types";

export class ResilienceProjection {
  project(input: Omit<ResilienceProjectionResult, "forecast">): ResilienceProjectionResult {
    const outlookBoost = input.outlook === "hardened" ? 6 : input.outlook === "fragile" ? -4 : input.outlook === "stable" ? 2 : 0;
    return { ...input, forecast: Math.min(100, input.healthScore + outlookBoost) };
  }
}

export class ResilienceQueries {
  ask(result: ResilienceResult, request: ResilienceQueryRequest): ResilienceQueryResult {
    const focus = request.focus ?? "general";
    const max = request.maxResults ?? 5;
    let answer = result.brief.headline;
    let references: string[] = result.recommendations.slice(0, max).map(r => r.title);
    if (focus === "trends") { answer = result.trendSuite.narrative; references = result.trendSuite.trends.slice(0, max).map(t => t.title); }
    else if (focus === "forecasts") { answer = result.forecastSuite.narrative; references = result.forecastSuite.forecasts.slice(0, max).map(f => f.narrative); }
    else if (focus === "scenarios") { answer = result.scenarioSuite.narrative; references = result.scenarioSuite.scenarios.slice(0, max).map(s => s.title); }
    else if (focus === "analysis") { answer = result.analysisSuite.narrative; references = result.analysisSuite.analyses.slice(0, max).map(a => a.title); }
    else if (focus === "reasoning") { answer = result.reasoning.answer; references = result.reasoning.connectedForces.slice(0, max); }
    else if (focus === "learning") { answer = result.closedLearningLoop.narrative; references = result.closedLearningLoop.lessons.slice(0, max); }
    else if (focus === "early_warning") { answer = result.earlyWarningSuite.narrative; references = result.earlyWarningSuite.alerts.slice(0, max).map(a => a.title); }
    else if (focus === "recommendations") { answer = \`\${result.recommendations.length} resilience recommendations.\`; }
    else if (focus in result.areaSuites) {
      const suite = result.areaSuites[focus as keyof typeof result.areaSuites];
      answer = suite.narrative;
      references = suite.records.slice(0, max).map(r => r.title);
    }
    return {
      question: request.question,
      focus,
      answer,
      references,
      confidence: buildConfidence([
        { key: "result", label: "Result confidence", contribution: result.confidence.value },
        { key: "focus", label: "Focus specificity", contribution: focus === "general" ? .6 : .85 },
      ]),
    };
  }
}

void outlookFromScore;
`);

w("repository.ts", `import type { ResilienceRepository } from "@/lib/platform/intelligence/resilience/contracts";
import type { ResilienceHistoryRecord, ResilienceResult, GraphScope } from "@/lib/platform/intelligence/resilience/types";

export class ResilienceRepositoryStore implements ResilienceRepository {
  private results = new Map<string, ResilienceResult>();
  private history: ResilienceHistoryRecord[] = [];

  save(result: ResilienceResult): ResilienceResult {
    this.results.set(result.requestId, result);
    return result;
  }
  get(requestId: string): ResilienceResult | null {
    return this.results.get(requestId) ?? null;
  }
  list(scope?: Partial<GraphScope>): ResilienceResult[] {
    const all = [...this.results.values()];
    if (!scope) return all;
    return all.filter(r =>
      (scope.organizationId == null || r.scope.organizationId === scope.organizationId) &&
      (scope.schoolId == null || r.scope.schoolId === scope.schoolId)
    );
  }
  remove(requestId: string): boolean {
    return this.results.delete(requestId);
  }
  saveHistory(record: ResilienceHistoryRecord): ResilienceHistoryRecord {
    this.history.push(record);
    return record;
  }
  listHistory(scope?: Partial<GraphScope>): ResilienceHistoryRecord[] {
    if (!scope) return [...this.history];
    return this.history.filter(r =>
      (scope.organizationId == null || r.scope.organizationId === scope.organizationId) &&
      (scope.schoolId == null || r.scope.schoolId === scope.schoolId)
    );
  }
  clear(): void {
    this.results.clear();
    this.history = [];
  }
}
`);

w("resilience-registry.ts", `import type { ResilienceRegistry } from "@/lib/platform/intelligence/resilience/contracts";
import type { ResiliencePublisher } from "@/lib/platform/intelligence/resilience/types";

export class ResilienceRegistryStore implements ResilienceRegistry {
  private publishers: ResiliencePublisher[] = [];

  register(domain: string, capability: string): void {
    if (!this.publishers.some(p => p.domain === domain && p.capability === capability)) {
      this.publishers.push({ domain, capability });
    }
  }
  list(): ResiliencePublisher[] {
    return [...this.publishers];
  }
  isRegistered(domain: string): boolean {
    return this.publishers.some(p => p.domain === domain);
  }
  clear(): void {
    this.publishers = [];
  }
}
`);

w("service.ts", `import type { ResilienceDependencies, ResilienceIntelligenceService as Contract, ResilienceRepository as Repository } from "@/lib/platform/intelligence/resilience/contracts";
import { ResilienceIntelligenceEngineImpl } from "@/lib/platform/intelligence/resilience/resilience-engine";
import type { ResilienceQueryRequest, ResilienceQueryResult, ResilienceRequest, ResilienceResult } from "@/lib/platform/intelligence/resilience/types";

export interface ResilienceServiceDependencies extends ResilienceDependencies {}

export class ResilienceIntelligenceServiceImpl implements Contract {
  private engine: ResilienceIntelligenceEngineImpl;
  constructor(d: ResilienceServiceDependencies = {}) {
    this.engine = (d.engine as ResilienceIntelligenceEngineImpl | undefined) ?? new ResilienceIntelligenceEngineImpl(d);
  }
  build(request: ResilienceRequest): ResilienceResult { return this.engine.build(request); }
  query(result: ResilienceResult, request: ResilienceQueryRequest): ResilienceQueryResult { return this.engine.queries.ask(result, request); }
  repository(): Repository { return this.engine.repository; }
}

export {
  ResilienceIntelligenceServiceImpl as ResilienceIntelligenceService,
  ResilienceIntelligenceServiceImpl as ResilienceService,
  ResilienceIntelligenceServiceImpl as ResilienceServiceImpl,
};
`);

const areaExports = AREA_KEYS.map(a =>
  `export * from "@/lib/platform/intelligence/resilience/${a.replaceAll("_", "-")}-intelligence";`
).join("\n");

w("index.ts", `export * from "@/lib/platform/intelligence/resilience/types";
export type {
  ResilienceDependencies,
  ResilienceAreaIntelligence as ResilienceAreaIntelligenceContract,
  ResilienceForecastEngineContract,
  ResilienceScenarioEngineContract,
  ResilienceTrendEngineContract,
  ResilienceAnalysisEngineContract,
  StressTestEngineContract,
  RecoveryEngineContract,
  ContinuityEngineContract,
  AdaptiveCapacityEngineContract,
  EarlyWarningEngineContract,
  ResilienceReasonerContract,
  ResilienceRegistry as ResilienceRegistryContract,
  ResilienceRepository as ResilienceRepositoryContract,
  ResilienceEngine as ResilienceEngineContract,
  ResilienceIntelligenceEngine as ResilienceIntelligenceEngineContract,
  ResilienceIntelligenceService as ResilienceIntelligenceServiceContract,
  ResilienceService as ResilienceServiceContract,
} from "@/lib/platform/intelligence/resilience/contracts";
export * from "@/lib/platform/intelligence/resilience/models";
export * from "@/lib/platform/intelligence/resilience/area-factory";
${areaExports}
export * from "@/lib/platform/intelligence/resilience/resilience-forecast-engine";
export * from "@/lib/platform/intelligence/resilience/resilience-scenario-engine";
export * from "@/lib/platform/intelligence/resilience/resilience-trend-engine";
export * from "@/lib/platform/intelligence/resilience/resilience-analysis-engine";
export * from "@/lib/platform/intelligence/resilience/stress-test-engine";
export * from "@/lib/platform/intelligence/resilience/recovery-engine";
export * from "@/lib/platform/intelligence/resilience/continuity-engine";
export * from "@/lib/platform/intelligence/resilience/adaptive-capacity-engine";
export * from "@/lib/platform/intelligence/resilience/early-warning-engine";
export * from "@/lib/platform/intelligence/resilience/knowledge-contribution";
export * from "@/lib/platform/intelligence/resilience/closed-learning-loop";
export * from "@/lib/platform/intelligence/resilience/resilience-reasoner";
export * from "@/lib/platform/intelligence/resilience/resilience-intelligence";
export * from "@/lib/platform/intelligence/resilience/projection";
export * from "@/lib/platform/intelligence/resilience/resilience-registry";
export * from "@/lib/platform/intelligence/resilience/repository";
export * from "@/lib/platform/intelligence/resilience/resilience-engine";
export * from "@/lib/platform/intelligence/resilience/service";

import type { ResilienceDependencies } from "@/lib/platform/intelligence/resilience/contracts";
import { ResilienceIntelligenceEngine } from "@/lib/platform/intelligence/resilience/resilience-engine";
import { ResilienceIntelligenceService } from "@/lib/platform/intelligence/resilience/service";
import {
  createOrganizationDnaIntelligence,
  type CreateOrganizationDnaOptions,
  type OrganizationDnaStack,
} from "@/lib/platform/intelligence/organization-dna";
import {
  createOiosOperatingSystem,
  type CreateOiosOptions,
  type OiosStack,
} from "@/lib/platform/oios";

export interface ResilienceStack {
  service: ResilienceIntelligenceService;
  engine: ResilienceIntelligenceEngine;
  organizationDna: OrganizationDnaStack | null;
  oios: OiosStack | null;
}

export interface CreateResilienceOptions extends ResilienceDependencies {
  organizationDna?: OrganizationDnaStack;
  organizationDnaOptions?: CreateOrganizationDnaOptions;
  wireOrganizationDna?: boolean;
  oios?: OiosStack;
  oiosOptions?: CreateOiosOptions;
  wireOios?: boolean;
}

export function createResilienceIntelligence(options: CreateResilienceOptions = {}): ResilienceStack {
  const organizationDna =
    options.organizationDna ??
    (options.wireOrganizationDna === false
      ? null
      : createOrganizationDnaIntelligence({
          ...options.organizationDnaOptions,
          wireGraphAnalyzer: false,
          wireDecision: false,
          wirePredictive: false,
          wireBoardGovernance: false,
        }));
  const oios =
    options.oios ??
    (options.wireOios === false
      ? null
      : createOiosOperatingSystem({
          ...options.oiosOptions,
          organizationDnaStack: options.oiosOptions?.organizationDnaStack ?? organizationDna ?? undefined,
          wireOrganizationDna: false,
        }));
  const engine = new ResilienceIntelligenceEngine(options);
  const service = new ResilienceIntelligenceService({ ...options, engine });
  return { service, engine, organizationDna, oios };
}
`);

w("README.md", `# Resilience Intelligence (Sprint 056)

**Version:** 0.1.0 | **Domain key:** \`resilience\` | **ID prefix:** \`rsl-\`

Seventeen-area organizational resilience assessment for JAG. Evaluate readiness, recovery, continuity, and adaptive capacity so leadership can strengthen the institution against disruption - composing onto Systems (055) without regenerating that package.

## Areas (17)

organizational_resilience, business_continuity, disaster_recovery, operational_recovery, financial_resilience, workforce_resilience, supply_chain_resilience, cyber_resilience, infrastructure_resilience, vendor_resilience, crisis_readiness, adaptive_capacity, redundancy_planning, recovery_time_analysis, stress_testing, resilience_optimization, long_term_adaptability

## Entry point

\`\`\`ts
import { createResilienceIntelligence } from "@/lib/platform/intelligence/resilience";

const { service } = createResilienceIntelligence({ wireOrganizationDna: false, wireOios: false });
const result = service.build({ requestId: "rsl-1", scope: { organizationId: "org-1", schoolId: "school-1" } });
\`\`\`

## Lens (8 fields)

organizationalReadiness · recoveryCapability · operationalStability · financialStability · workforceStability · infrastructureReadiness · adaptiveCapacity · longTermResilienceOutlook

## Hard DAG

\`["systems"]\` - terminal platform module after Systems Intelligence.

## Layer

Internal/adaptive capacity after Systems - how readiness, recovery, and long-term adaptability harden the institution.
`);

w("ARCHITECTURE.md", `# Resilience Intelligence Architecture

## Placement

- Domain key: \`resilience\`
- Pipeline: terminal after \`systems\`
- Hard DAG: \`["systems"]\`
- OIOS hard deps: \`["organization-dna", "systems"]\`
- Soft reads: systems, operations, legal-compliance-risk, economic, executive-decision, predictive
- Technology/Security: no standalone technology or security intelligence packages exist. Soft-read \`OperationsResultLight\` (tech delivery / operational posture) and \`LegalComplianceRiskResultLight\` (cyber and security risk) as proxies. Document soft-reads only; do not invent technology/security packages.

## Package layout

Leaf-safe \`types\` / \`contracts\`, \`models\`, area factory + 17 area modules, specialized engines (stress-test, recovery, continuity, adaptive-capacity, early-warning), standard forecast/trend/scenario/analysis engines, composers, projection, repository, registry, service, \`createResilienceIntelligence\`.

## Suites on ResilienceResult

stressTestSuite, recoverySuite, continuitySuite, adaptiveCapacitySuite, earlyWarningSuite, plus trend/forecast/scenario/analysis suites.

## Closed learning

Destinations: systems, operations, legal-compliance-risk, economic, executive-decision, predictive, opportunity.
`);

w("VERIFICATION.md", `# Resilience Intelligence Verification

## Commands

\`\`\`
npx tsc --noEmit
npx vitest run tests/unit/intelligence/resilience.test.ts tests/unit/intelligence/systems.test.ts tests/unit/intelligence/ethical.test.ts tests/unit/intelligence/infrastructure.test.ts tests/unit/intelligence/oios-core.test.ts
\`\`\`

## Checks

1. Result version is 0.1.0 with all area and engine scores populated.
2. Analysis kinds and scenarios cover RESILIENCE_ANALYSIS_KINDS / RESILIENCE_SCENARIOS.
3. Recommendations carry the eight-field ResilienceLens; IDs use \`rsl-\` prefix.
4. Closed learning destinations match the seven soft-integration domains.
5. Platform module order ends \`ethical\`, \`systems\`, \`resilience\`.
`);

w("CHANGELOG.md", `# Resilience Intelligence Changelog

## 0.1.0 - Sprint 056

- Initial Resilience Intelligence package (17 areas, 10 scenarios, 12 analysis kinds).
- Specialized engines: StressTest, Recovery, Continuity, AdaptiveCapacity, EarlyWarning.
- Soft integrations from systems, operations, legal-compliance-risk, predictive, decision, economic.
- Technology/Security soft-read via operations and legal-compliance-risk proxies.
- Terminal platform module after Systems Intelligence.
`);

console.log("Part 3 complete. Files:", fs.readdirSync(DEST).length);
