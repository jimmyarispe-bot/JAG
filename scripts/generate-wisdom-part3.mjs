/**
 * Part 3: composers, engine, service, index, docs for Wisdom Intelligence.
 */
import fs from "node:fs";
import path from "node:path";

const DEST = path.resolve("src/lib/platform/intelligence/wisdom");
const w = (name, content) => fs.writeFileSync(path.join(DEST, name), content, "utf8");
const PKG = "@/lib/platform/intelligence/wisdom";

const AREAS = [
  ["executive_judgment", "ExecutiveJudgmentIntelligence"],
  ["strategic_reasoning", "StrategicReasoningIntelligence"],
  ["trade_off_analysis", "TradeOffAnalysisIntelligence"],
  ["long_term_thinking", "LongTermThinkingIntelligence"],
  ["cross_domain_synthesis", "CrossDomainSynthesisIntelligence"],
  ["decision_quality_assessment", "DecisionQualityAssessmentIntelligence"],
  ["uncertainty_analysis", "UncertaintyAnalysisIntelligence"],
  ["confidence_calibration", "ConfidenceCalibrationIntelligence"],
  ["organizational_prioritization", "OrganizationalPrioritizationIntelligence"],
  ["mission_alignment", "MissionAlignmentIntelligence"],
  ["values_alignment", "ValuesAlignmentIntelligence"],
  ["ethical_judgment", "EthicalJudgmentIntelligence"],
  ["strategic_timing", "StrategicTimingIntelligence"],
  ["opportunity_cost_analysis", "OpportunityCostAnalysisIntelligence"],
  ["executive_recommendation_validation", "ExecutiveRecommendationValidationIntelligence"],
  ["organizational_judgment_evolution", "OrganizationalJudgmentEvolutionIntelligence"],
  ["institutional_wisdom", "InstitutionalWisdomIntelligence"],
];
const AREA_KEYS = AREAS.map(([a]) => a);
const snakeToCamel = (s) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
const areaFile = (area) => area.replaceAll("_", "-") + "-intelligence";

w("wisdom-intelligence.ts", `import { buildLens, clamp, priorityFromScore, statusFromScore } from "${PKG}/models";
import type {
  WisdomArea, WisdomAreaSuite, WisdomBaseline, WisdomDashboard,
  WisdomForecastSuite, WisdomHealthScore, WisdomOpportunityRecord,
  WisdomRecommendationRecord, WisdomRiskRecord, WisdomScenarioSuite,
  WisdomScore, WisdomAnalysisSuite,
} from "${PKG}/types";
import { WISDOM_AREAS } from "${PKG}/types";

export const score = (key: string, label: string, value: number): WisdomScore => {
  const v = clamp(value);
  return { key, label, value: v, status: statusFromScore(v), band: priorityFromScore(v), narrative: \`\${label} is \${statusFromScore(v)} at \${Math.round(v)}.\` };
};

const lens = (area: string, value: number) => buildLens({
  strategicValue: \`\${area} strategic value scored \${Math.round(value)}.\`,
  longTermImpact: \`Long-term impact linked to \${area}.\`,
  confidenceLevel: \`Confidence level relative to \${area} conditions.\`,
  evidenceQuality: \`Evidence quality reading for \${area}.\`,
  tradeOffBalance: \`Trade-off balance associated with \${area}.\`,
  organizationalAlignment: \`Organizational alignment pressure from \${area}.\`,
  ethicalIntegrity: \`Ethical integrity in \${area}.\`,
  wisdomScore: \`Timing window for \${area}-linked wisdom intelligence action.\`,
});

export class WisdomIntelligence {
  composeScores(input: {
    baseline: WisdomBaseline;
    areas: Record<WisdomArea, WisdomAreaSuite>;
    forecast: number;
    scenario: number;
    analysis: number;
    earlyWarning: number;
    strategicReasoningEngine: number;
    crossDomainSynthesisEngine: number;
    tradeOffEngine: number;
    uncertaintyEngine: number;
    executiveJudgmentEngine: number;
    confidenceEngine: number;
  }) {
    const areaScores = Object.fromEntries(
      WISDOM_AREAS.map(a => [a, score(\`wisdom_\${a}\`, \`\${a} Wisdom Score\`, input.areas[a].score)])
    ) as Record<WisdomArea, WisdomScore>;
    const overall =
      WISDOM_AREAS.reduce((s, a) => s + areaScores[a].value, 0) / WISDOM_AREAS.length * .5 +
      input.baseline.strategicValue * .1 +
      input.baseline.longTermImpact * .1 +
      input.baseline.wisdomScore * .08 +
      input.forecast * .08 +
      input.scenario * .07 +
      input.earlyWarning * .04 +
      input.executiveJudgmentEngine * .03;
    return {
      healthScore: score("wisdom_health", "Wisdom Intelligence Health Score", overall),
      areaScores,
      forecastScore: score("wisdom_forecast", "Forecast Score", input.forecast),
      scenarioScore: score("wisdom_scenario", "Scenario Score", input.scenario),
      analysisScore: score("wisdom_analysis", "Analysis Score", input.analysis),
      earlyWarningScore: score("wisdom_early_warning", "Early Warning Score", input.earlyWarning),
      strategicReasoningEngineScore: score("wisdom_strategic_reasoning_engine", "Strategic Reasoning Engine Score", input.strategicReasoningEngine),
      crossDomainSynthesisEngineScore: score("wisdom_cross_domain_synthesis_engine", "Cross Domain Synthesis Engine Score", input.crossDomainSynthesisEngine),
      tradeOffEngineScore: score("wisdom_trade_off_engine", "Trade Off Engine Score", input.tradeOffEngine),
      uncertaintyEngineScore: score("wisdom_uncertainty_engine", "Uncertainty Engine Score", input.uncertaintyEngine),
      executiveJudgmentEngineScore: score("wisdom_executive_judgment_engine", "Executive Judgment Engine Score", input.executiveJudgmentEngine),
      confidenceEngineScore: score("wisdom_confidence_engine", "Confidence Engine Score", input.confidenceEngine),
    };
  }
}

export class WisdomRecommendationComposer {
  constructor(private createId: (prefix: string) => string) {}
  compose(
    areas: Record<WisdomArea, WisdomAreaSuite>,
    analysis: WisdomAnalysisSuite,
    scenarios: WisdomScenarioSuite,
    now: Date,
  ): WisdomRecommendationRecord[] {
    return [...WISDOM_AREAS]
      .sort((a, b) => areas[a].score - areas[b].score)
      .slice(0, 6)
      .map((area, index) => ({
        id: this.createId("wis-rec"),
        title: \`Address \${area.replaceAll("_", " ")} wisdom intelligence exposure\`,
        priority: priorityFromScore(areas[area].score),
        evidenceRefs: analysis.analyses.slice(0, 2).map(a => a.id).concat(scenarios.scenarios.slice(0, 1).map(s => s.id)),
        confidenceScore: .68,
        owner: index ? "wisdom-owner" : "executive-team",
        dueDate: new Date(now.getTime() + (30 + index * 14) * 86400000).toISOString(),
        rationale: areas[area].narrative,
        action: \`Run a wisdom intelligence response cycle for \${area.replaceAll("_", " ")}.\`,
        lenses: lens(area, areas[area].score),
        narrative: \`Prioritize \${area} wisdom intelligence response.\`,
      }));
  }
}

export function composeRisksOpportunities(
  areas: Record<WisdomArea, WisdomAreaSuite>,
  createId: (prefix: string) => string,
): { risks: WisdomRiskRecord[]; opportunities: WisdomOpportunityRecord[] } {
  const ordered = [...WISDOM_AREAS].sort((a, b) => areas[a].score - areas[b].score);
  return {
    risks: ordered.slice(0, 5).map(a => ({
      id: createId("wis-risk"),
      title: \`\${a.replaceAll("_", " ")} wisdom intelligence pressure\`,
      area: a,
      severity: priorityFromScore(areas[a].score),
      score: 100 - areas[a].score,
      mitigation: \`Strengthen monitoring and wisdom playbooks for \${a.replaceAll("_", " ")}.\`,
      lenses: lens(a, areas[a].score),
      narrative: areas[a].narrative,
    })),
    opportunities: ordered.slice(-5).reverse().map(a => ({
      id: createId("wis-opp"),
      title: \`Capture \${a.replaceAll("_", " ")} wisdom intelligence advantage\`,
      area: a,
      priority: priorityFromScore(100 - areas[a].score),
      score: areas[a].score,
      lenses: lens(a, areas[a].score),
      narrative: areas[a].narrative,
    })),
  };
}

export function composeHealth(
  scores: ReturnType<WisdomIntelligence["composeScores"]>,
  baseline: WisdomBaseline,
  forecasts: WisdomForecastSuite,
): WisdomHealthScore {
  const areaScores = Object.fromEntries(WISDOM_AREAS.map(a => [a, scores.areaScores[a].value])) as Record<WisdomArea, number>;
  return {
    overallScore: scores.healthScore.value,
    status: scores.healthScore.status,
    outlook: forecasts.outlook,
    areaScores,
    executiveJudgmentScore: scores.executiveJudgmentEngineScore.value,
    strategicReasoningScore: scores.strategicReasoningEngineScore.value,
    crossDomainSynthesisScore: scores.crossDomainSynthesisEngineScore.value,
    forecastScore: scores.forecastScore.value,
    scenarioScore: scores.scenarioScore.value,
    lenses: lens("organization", scores.healthScore.value),
    narrative: scores.healthScore.narrative,
  };
}

export function composeDashboard(
  now: Date,
  health: WisdomHealthScore,
  baseline: WisdomBaseline,
  risks: WisdomRiskRecord[],
  opportunities: WisdomOpportunityRecord[],
): WisdomDashboard {
  return {
    generatedAt: now.toISOString(),
    headline: \`Executive Wisdom Overview: health \${Math.round(health.overallScore)} - \${health.status} (\${health.outlook})\`,
    overall: health.overallScore,
    areaScores: health.areaScores,
    outlook: health.outlook,
    strategicValue: baseline.strategicValue,
    longTermImpact: baseline.longTermImpact,
    wisdomScore: baseline.wisdomScore,
    topRisks: risks.map(r => r.title),
    topOpportunities: opportunities.map(o => o.title),
    narrative: health.narrative,
  };
}

export const wisdomLens = lens;
`);

const areaImports = AREAS.map(([area, cls]) =>
  `import { ${cls} } from "${PKG}/${areaFile(area)}";`
).join("\n");
const areaInit = AREAS.map(([area, cls]) => `      ${area}: new ${cls}(),`).join("\n");
const areaScoreAssign = AREA_KEYS.map(a =>
  `      ${snakeToCamel(a)}Score: scores.areaScores.${a},`
).join("\n");

w("wisdom-engine.ts", `import type { WisdomDependencies, WisdomEngine as Contract } from "${PKG}/contracts";
import { defaultCreateId, defaultPeriodLabel, deriveWisdomBaseline, emptyWisdomScope, buildConfidence } from "${PKG}/models";
import { WISDOM_AREAS, WISDOM_INTELLIGENCE_VERSION, type WisdomArea, type WisdomAreaSuite, type WisdomRequest, type WisdomResult } from "${PKG}/types";
${areaImports}
import { WisdomForecastEngine } from "${PKG}/wisdom-forecast-engine";
import { WisdomScenarioEngine } from "${PKG}/wisdom-scenario-engine";
import { WisdomTrendEngine } from "${PKG}/wisdom-trend-engine";
import { WisdomAnalysisEngine } from "${PKG}/wisdom-analysis-engine";
import { StrategicReasoningEngine } from "${PKG}/strategic-reasoning-engine";
import { CrossDomainSynthesisEngine } from "${PKG}/cross-domain-synthesis-engine";
import { TradeOffEngine } from "${PKG}/trade-off-engine";
import { UncertaintyEngine } from "${PKG}/uncertainty-engine";
import { ExecutiveJudgmentEngine } from "${PKG}/executive-judgment-engine";
import { ConfidenceEngine } from "${PKG}/confidence-engine";
import { EarlyWarningEngine } from "${PKG}/early-warning-engine";
import { WisdomKnowledgeContributionEngine } from "${PKG}/knowledge-contribution";
import { ClosedLearningLoop } from "${PKG}/closed-learning-loop";
import { WisdomReasoner } from "${PKG}/wisdom-reasoner";
import {
  WisdomIntelligence, WisdomRecommendationComposer, composeDashboard, composeHealth,
  composeRisksOpportunities, wisdomLens,
} from "${PKG}/wisdom-intelligence";
import { WisdomProjection, WisdomQueries } from "${PKG}/projection";
import { WisdomRepositoryStore } from "${PKG}/repository";
import { WisdomRegistryStore } from "${PKG}/wisdom-registry";

export class WisdomIntelligenceEngineImpl implements Contract {
  readonly repository; readonly registry; readonly queries;
  private now; private createId; private areas; private forecasts; private scenarios; private trends; private analysis;
  private strategicReasoning; private crossDomainSynthesis; private tradeOff; private uncertainty; private executiveJudgment; private confidence;
  private earlyWarning; private reasoner;

  constructor(d: WisdomDependencies = {}) {
    this.now = d.now ?? (() => new Date());
    this.createId = d.createId ?? defaultCreateId;
    this.repository = d.repository ?? new WisdomRepositoryStore();
    this.registry = d.registry ?? new WisdomRegistryStore();
    this.queries = new WisdomQueries();
    this.areas = {
${areaInit}
      ...d.areaIntelligence,
    };
    this.forecasts = d.forecastEngine ?? new WisdomForecastEngine();
    this.scenarios = d.scenarioEngine ?? new WisdomScenarioEngine();
    this.trends = d.trendEngine ?? new WisdomTrendEngine();
    this.analysis = d.analysisEngine ?? new WisdomAnalysisEngine();
    this.strategicReasoning = d.strategicReasoningEngine ?? new StrategicReasoningEngine();
    this.crossDomainSynthesis = d.crossDomainSynthesisEngine ?? new CrossDomainSynthesisEngine();
    this.tradeOff = d.tradeOffEngine ?? new TradeOffEngine();
    this.uncertainty = d.uncertaintyEngine ?? new UncertaintyEngine();
    this.executiveJudgment = d.executiveJudgmentEngine ?? new ExecutiveJudgmentEngine();
    this.confidence = d.confidenceEngine ?? new ConfidenceEngine();
    this.earlyWarning = d.earlyWarningEngine ?? new EarlyWarningEngine();
    this.reasoner = d.reasoner ?? new WisdomReasoner();
  }

  build(request: WisdomRequest): WisdomResult {
    const now = this.now();
    const baseline = deriveWisdomBaseline(request);
    const createId = this.createId;
    const scope = request.scope ?? emptyWisdomScope();
    const areaSuites = Object.fromEntries(
      WISDOM_AREAS.map(area => [area, this.areas[area]!.assess({ baseline, now, createId })])
    ) as Record<WisdomArea, WisdomAreaSuite>;

    const trendSuite = this.trends.assess({ baseline, areas: areaSuites, now, createId });
    const forecastSuite = this.forecasts.assess({ baseline, areas: areaSuites, now, createId });
    const scenarioSuite = this.scenarios.assess({ baseline, areas: areaSuites, forecasts: forecastSuite, now, createId });
    const analysisSuite = this.analysis.assess({ baseline, areas: areaSuites, forecasts: forecastSuite, scenarios: scenarioSuite, now, createId });
    const strategicReasoningSuite = this.strategicReasoning.assess({ baseline, areas: areaSuites, now, createId });
    const crossDomainSynthesisSuite = this.crossDomainSynthesis.assess({ baseline, areas: areaSuites, now, createId });
    const tradeOffSuite = this.tradeOff.assess({ baseline, areas: areaSuites, now, createId });
    const uncertaintySuite = this.uncertainty.assess({ baseline, areas: areaSuites, now, createId });
    const executiveJudgmentSuite = this.executiveJudgment.assess({ baseline, areas: areaSuites, now, createId });
    const confidenceSuite = this.confidence.assess({ baseline, areas: areaSuites, now, createId });
    const earlyWarningSuite = this.earlyWarning.assess({ baseline, trends: trendSuite, scenarios: scenarioSuite, now, createId });
    const knowledgeContribution = new WisdomKnowledgeContributionEngine().contribute({ forecasts: forecastSuite, scenarios: scenarioSuite, now, createId });
    const confidence = buildConfidence([
      { key: "evidence", label: "Evidence coverage", contribution: baseline.evidenceCoverage / 100 },
      { key: "forecast", label: "Forecast maturity", contribution: forecastSuite.maturityScore / 100 },
      { key: "scenario", label: "Scenario maturity", contribution: baseline.scenarioMaturity / 100 },
    ]);
    const reasoning = this.reasoner.reason({ request, trends: trendSuite, forecasts: forecastSuite, scenarios: scenarioSuite, confidence });
    const intelligence = new WisdomIntelligence();
    const scores = intelligence.composeScores({
      baseline,
      areas: areaSuites,
      forecast: forecastSuite.maturityScore,
      scenario: baseline.scenarioMaturity,
      analysis: analysisSuite.maturityScore,
      earlyWarning: earlyWarningSuite.score,
      strategicReasoningEngine: strategicReasoningSuite.score,
      crossDomainSynthesisEngine: crossDomainSynthesisSuite.score,
      tradeOffEngine: tradeOffSuite.score,
      uncertaintyEngine: uncertaintySuite.score,
      executiveJudgmentEngine: executiveJudgmentSuite.score,
      confidenceEngine: confidenceSuite.score,
    });
    const { risks, opportunities } = composeRisksOpportunities(areaSuites, createId);
    const recommendations = new WisdomRecommendationComposer(createId).compose(areaSuites, analysisSuite, scenarioSuite, now);
    const health = composeHealth(scores, baseline, forecastSuite);
    const dashboard = composeDashboard(now, health, baseline, risks, opportunities);
    const commonLens = wisdomLens("organization", health.overallScore);

    const strategicJudgmentDashboard = {
      generatedAt: now.toISOString(),
      headline: \`Strategic judgment index \${Math.round(executiveJudgmentSuite.judgmentIndex)}\`,
      score: executiveJudgmentSuite.score,
      judgmentIndex: executiveJudgmentSuite.judgmentIndex,
      signals: executiveJudgmentSuite.records.slice(0, 4).map(r => r.title),
      narrative: executiveJudgmentSuite.narrative,
    };
    const crossDomainSynthesisDashboard = {
      generatedAt: now.toISOString(),
      headline: \`Cross-domain synthesis \${Math.round(crossDomainSynthesisSuite.synthesisIndex)}\`,
      score: crossDomainSynthesisSuite.score,
      synthesisIndex: crossDomainSynthesisSuite.synthesisIndex,
      signals: crossDomainSynthesisSuite.records.slice(0, 4).map(r => r.title),
      narrative: crossDomainSynthesisSuite.narrative,
    };
    const tradeOffAnalysisDashboard = {
      generatedAt: now.toISOString(),
      headline: \`Trade-off analysis \${Math.round(tradeOffSuite.balanceIndex)}\`,
      score: tradeOffSuite.score,
      balanceIndex: tradeOffSuite.balanceIndex,
      signals: tradeOffSuite.records.map(r => r.narrative),
      narrative: tradeOffSuite.narrative,
    };
    const organizationalPrioritiesDashboard = {
      generatedAt: now.toISOString(),
      headline: \`Organizational priorities \${Math.round(areaSuites.organizational_prioritization.score)}\`,
      score: areaSuites.organizational_prioritization.score,
      priorityIndex: areaSuites.organizational_prioritization.score,
      signals: areaSuites.organizational_prioritization.records.map(r => r.signal),
      narrative: areaSuites.organizational_prioritization.narrative,
    };
    const confidenceDashboard = {
      generatedAt: now.toISOString(),
      headline: \`Confidence calibration \${Math.round(confidenceSuite.calibrationIndex)}\`,
      score: confidenceSuite.score,
      calibrationIndex: confidenceSuite.calibrationIndex,
      signals: confidenceSuite.records.map(r => r.narrative),
      narrative: confidenceSuite.narrative,
    };
    const longTermOutlookDashboard = {
      generatedAt: now.toISOString(),
      headline: \`Long-term outlook \${Math.round(baseline.longTermImpact)}\`,
      score: areaSuites.long_term_thinking.score,
      longTermImpact: baseline.longTermImpact,
      signals: areaSuites.long_term_thinking.records.map(r => r.signal),
      narrative: areaSuites.long_term_thinking.narrative,
    };
    const forecastDashboard = {
      generatedAt: now.toISOString(),
      headline: \`Wisdom Forecast: \${forecastSuite.outlook}\`,
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
      judgment: executiveJudgmentSuite.framework,
      narrative: dashboard.narrative,
    };
    const boardReport = {
      generatedAt: now.toISOString(),
      headline: \`Board Report: \${dashboard.headline}\`,
      assuranceSummary: \`Evidence coverage \${Math.round(baseline.evidenceCoverage)}; primary scenario \${scenarioSuite.primaryScenario.replaceAll("_", " ")}.\`,
      healthScore: health.overallScore,
      outlook: forecastSuite.outlook,
      executiveJudgmentScore: executiveJudgmentSuite.score,
      tradeOffScore: tradeOffSuite.score,
      crossDomainSynthesisScore: crossDomainSynthesisSuite.score,
      recommendations: recommendations.map(r => r.title),
      lenses: commonLens,
      narrative: "Board assurance on executive judgment, trade-off balance, cross-domain synthesis, and long-term wisdom.",
    };
    const closedLearningLoop = new ClosedLearningLoop().contribute({ trends: trendSuite, scenarios: scenarioSuite, recommendations, now, createId });
    const projection = new WisdomProjection().project({
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
      id: createId("wis-history"),
      requestId: request.requestId,
      scope,
      status: "assessed" as const,
      healthScore: health.overallScore,
      generatedAt: now.toISOString(),
      summary: brief.headline,
      metadata: request.metadata ?? {},
    };

    const result: WisdomResult = {
      requestId: request.requestId,
      version: WISDOM_INTELLIGENCE_VERSION,
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
      strategicReasoningEngineScore: scores.strategicReasoningEngineScore,
      crossDomainSynthesisEngineScore: scores.crossDomainSynthesisEngineScore,
      tradeOffEngineScore: scores.tradeOffEngineScore,
      uncertaintyEngineScore: scores.uncertaintyEngineScore,
      executiveJudgmentEngineScore: scores.executiveJudgmentEngineScore,
      confidenceEngineScore: scores.confidenceEngineScore,
      health,
      dashboard,
      strategicJudgmentDashboard,
      crossDomainSynthesisDashboard,
      tradeOffAnalysisDashboard,
      organizationalPrioritiesDashboard,
      confidenceDashboard,
      longTermOutlookDashboard,
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
      strategicReasoningSuite,
      crossDomainSynthesisSuite,
      tradeOffSuite,
      uncertaintySuite,
      executiveJudgmentSuite,
      confidenceSuite,
      earlyWarningSuite,
      knowledgeContribution,
      closedLearningLoop,
      reasoning,
      projection,
      historyRecord,
      confidence,
      requestMetadata: { ...(request.metadata ?? {}), registryPublishers: this.registry.list().length },
    };

    this.registry.register("wisdom", "wisdom_intelligence");
    this.repository.save(result);
    this.repository.saveHistory(historyRecord);
    return result;
  }
}

export {
  WisdomIntelligenceEngineImpl as WisdomIntelligenceEngine,
  WisdomIntelligenceEngineImpl as WisdomEngine,
  WisdomIntelligenceEngineImpl as WisdomEngineImpl,
};
`);

w("projection.ts", `import { buildConfidence, outlookFromScore } from "${PKG}/models";
import type { WisdomProjectionResult, WisdomQueryRequest, WisdomQueryResult, WisdomResult } from "${PKG}/types";

export class WisdomProjection {
  project(input: Omit<WisdomProjectionResult, "forecast">): WisdomProjectionResult {
    const outlookBoost = input.outlook === "wise" ? 6 : input.outlook === "shortsighted" ? -4 : input.outlook === "stable" ? 2 : 0;
    return { ...input, forecast: Math.min(100, input.healthScore + outlookBoost) };
  }
}

export class WisdomQueries {
  ask(result: WisdomResult, request: WisdomQueryRequest): WisdomQueryResult {
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
    else if (focus === "recommendations") { answer = \`\${result.recommendations.length} wisdom intelligence recommendations.\`; }
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

w("repository.ts", `import type { WisdomRepository } from "${PKG}/contracts";
import type { WisdomHistoryRecord, WisdomResult, GraphScope } from "${PKG}/types";

export class WisdomRepositoryStore implements WisdomRepository {
  private results = new Map<string, WisdomResult>();
  private history: WisdomHistoryRecord[] = [];

  save(result: WisdomResult): WisdomResult {
    this.results.set(result.requestId, result);
    return result;
  }
  get(requestId: string): WisdomResult | null {
    return this.results.get(requestId) ?? null;
  }
  list(scope?: Partial<GraphScope>): WisdomResult[] {
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
  saveHistory(record: WisdomHistoryRecord): WisdomHistoryRecord {
    this.history.push(record);
    return record;
  }
  listHistory(scope?: Partial<GraphScope>): WisdomHistoryRecord[] {
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

w("wisdom-registry.ts", `import type { WisdomRegistry } from "${PKG}/contracts";
import type { WisdomPublisher } from "${PKG}/types";

export class WisdomRegistryStore implements WisdomRegistry {
  private publishers: WisdomPublisher[] = [];

  register(domain: string, capability: string): void {
    if (!this.publishers.some(p => p.domain === domain && p.capability === capability)) {
      this.publishers.push({ domain, capability });
    }
  }
  list(): WisdomPublisher[] {
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

w("service.ts", `import type { WisdomDependencies, WisdomIntelligenceService as Contract, WisdomRepository as Repository } from "${PKG}/contracts";
import { WisdomIntelligenceEngineImpl } from "${PKG}/wisdom-engine";
import type { WisdomQueryRequest, WisdomQueryResult, WisdomRequest, WisdomResult } from "${PKG}/types";

export interface WisdomServiceDependencies extends WisdomDependencies {}

export class WisdomIntelligenceServiceImpl implements Contract {
  private engine: WisdomIntelligenceEngineImpl;
  constructor(d: WisdomServiceDependencies = {}) {
    this.engine = (d.engine as WisdomIntelligenceEngineImpl | undefined) ?? new WisdomIntelligenceEngineImpl(d);
  }
  build(request: WisdomRequest): WisdomResult { return this.engine.build(request); }
  query(result: WisdomResult, request: WisdomQueryRequest): WisdomQueryResult { return this.engine.queries.ask(result, request); }
  repository(): Repository { return this.engine.repository; }
}

export {
  WisdomIntelligenceServiceImpl as WisdomIntelligenceService,
  WisdomIntelligenceServiceImpl as WisdomService,
  WisdomIntelligenceServiceImpl as WisdomServiceImpl,
};
`);

const areaExports = AREA_KEYS.map(a =>
  `export * from "${PKG}/${areaFile(a)}";`
).join("\n");

w("index.ts", `export * from "${PKG}/types";
export type {
  WisdomDependencies,
  WisdomAreaIntelligence as WisdomAreaIntelligenceContract,
  WisdomForecastEngineContract,
  WisdomScenarioEngineContract,
  WisdomTrendEngineContract,
  WisdomAnalysisEngineContract,
  StrategicReasoningEngineContract,
  CrossDomainSynthesisEngineContract,
  TradeOffEngineContract,
  UncertaintyEngineContract,
  ExecutiveJudgmentEngineContract,
  ConfidenceEngineContract,
  EarlyWarningEngineContract,
  WisdomReasonerContract,
  WisdomRegistry as WisdomRegistryContract,
  WisdomRepository as WisdomRepositoryContract,
  WisdomEngine as WisdomEngineContract,
  WisdomIntelligenceEngine as WisdomIntelligenceEngineContract,
  WisdomIntelligenceService as WisdomIntelligenceServiceContract,
  WisdomService as WisdomServiceContract,
} from "${PKG}/contracts";
export * from "${PKG}/models";
export * from "${PKG}/area-factory";
${areaExports}
export * from "${PKG}/wisdom-forecast-engine";
export * from "${PKG}/wisdom-scenario-engine";
export * from "${PKG}/wisdom-trend-engine";
export * from "${PKG}/wisdom-analysis-engine";
export * from "${PKG}/strategic-reasoning-engine";
export * from "${PKG}/cross-domain-synthesis-engine";
export * from "${PKG}/trade-off-engine";
export * from "${PKG}/uncertainty-engine";
export * from "${PKG}/executive-judgment-engine";
export * from "${PKG}/confidence-engine";
export * from "${PKG}/early-warning-engine";
export * from "${PKG}/knowledge-contribution";
export * from "${PKG}/closed-learning-loop";
export * from "${PKG}/wisdom-reasoner";
export * from "${PKG}/wisdom-intelligence";
export * from "${PKG}/projection";
export * from "${PKG}/wisdom-registry";
export * from "${PKG}/repository";
export * from "${PKG}/wisdom-engine";
export * from "${PKG}/service";

import type { WisdomDependencies } from "${PKG}/contracts";
import { WisdomIntelligenceEngine } from "${PKG}/wisdom-engine";
import { WisdomIntelligenceService } from "${PKG}/service";
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

export interface WisdomStack {
  service: WisdomIntelligenceService;
  engine: WisdomIntelligenceEngine;
  organizationDna: OrganizationDnaStack | null;
  oios: OiosStack | null;
}

export interface CreateWisdomOptions extends WisdomDependencies {
  organizationDna?: OrganizationDnaStack;
  organizationDnaOptions?: CreateOrganizationDnaOptions;
  wireOrganizationDna?: boolean;
  oios?: OiosStack;
  oiosOptions?: CreateOiosOptions;
  wireOios?: boolean;
}

export function createWisdomIntelligence(options: CreateWisdomOptions = {}): WisdomStack {
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
  const engine = new WisdomIntelligenceEngine(options);
  const service = new WisdomIntelligenceService({ ...options, engine });
  return { service, engine, organizationDna, oios };
}
`);

w("README.md", `# Wisdom Intelligence (Sprint 060)

**Version:** 0.1.0 | **Domain key:** \`wisdom\` | **ID prefix:** \`wis-\`

Final terminal synthesis layer after Collective Intelligence. Unifies judgment, trade-offs,
uncertainty, and long-term impact into executive wisdom across the OIOS graph.

## Hard DAG

\`["collective"]\` - JAG v1.0 capstone terminal after Collective Intelligence.

## Layer

Wisdom / executive judgment terminal after collective. Soft-reads collective and upstream domains
and synthesizes strategic value, trade-offs, and long-term impact into actionable wisdom.

## Areas (17)

executive_judgment, strategic_reasoning, trade_off_analysis, long_term_thinking,
cross_domain_synthesis, decision_quality_assessment, uncertainty_analysis, confidence_calibration,
organizational_prioritization, mission_alignment, values_alignment, ethical_judgment,
strategic_timing, opportunity_cost_analysis, executive_recommendation_validation,
organizational_judgment_evolution, institutional_wisdom

## Entry point

\`\`\`ts
import { createWisdomIntelligence } from "@/lib/platform/intelligence/wisdom";

const { service } = createWisdomIntelligence({ wireOrganizationDna: false, wireOios: false });
const result = service.build({ requestId: "wis-1", scope: { organizationId: "org-1", schoolId: "school-1" } });
\`\`\`

## Lens (8 fields)

strategicValue - longTermImpact - confidenceLevel - evidenceQuality - tradeOffBalance - organizationalAlignment - ethicalIntegrity - wisdomScore

## Closed learning destinations (7)

collective, institutional-memory, knowledge, executive-decision, opportunity, predictive, ethical
`);

w("ARCHITECTURE.md", `# Wisdom Intelligence Architecture

## Placement

- Domain key: \`wisdom\`
- Package: \`src/lib/platform/intelligence/wisdom/\`
- Pipeline: terminal after \`collective\`
- Hard DAG: \`["collective"]\`
- OIOS hard deps: \`["organization-dna", "collective"]\`
- Soft reads: collective, institutional-memory, knowledge, decision, predictive, ethical, systems,
  resilience, opportunity, behavioral, cultural, stakeholder, ecosystem, market, competitive,
  economic, operations, humanCapital, environmental, political, reputation

## Package layout

Leaf-safe \`types\` / \`contracts\`, \`models\`, area factory + 17 area modules,
specialized engines (StrategicReasoningEngine, CrossDomainSynthesisEngine, TradeOffEngine,
UncertaintyEngine, ExecutiveJudgmentEngine, ConfidenceEngine, EarlyWarningEngine),
standard engines (WisdomForecastEngine, WisdomTrendEngine, WisdomScenarioEngine, WisdomAnalysisEngine),
composers, projection, repository, registry, service, \`createWisdomIntelligence\`.

## Specialized suites on WisdomResult

strategicReasoningSuite, crossDomainSynthesisSuite, tradeOffSuite, uncertaintySuite,
executiveJudgmentSuite, confidenceSuite, earlyWarningSuite, plus trend/forecast/scenario/analysis suites.

## Executive Judgment Framework

whatLeadershipShouldDo, why, whyNow, whyNotAlternatives, risksRemaining, assumptions, evidence, expectedOutcome
on ExecutiveJudgmentSuite and ExecutiveWisdomBrief.

## Closed learning

Final terminal synthesis layer that unifies judgment, trade-offs, uncertainty, and long-term impact.

Destinations: collective, institutional-memory, knowledge, executive-decision, opportunity, predictive, ethical.

## Health formula

avg(areas)*0.5 + strategicValue*0.1 + longTermImpact*0.1 + wisdomScore*0.08 +
forecast*0.08 + scenario*0.07 + earlyWarning*0.04 + executiveJudgmentEngine*0.03
`);

w("VERIFICATION.md", `# Wisdom Intelligence Verification

## Commands

\`\`\`
npx tsc --noEmit
npx vitest run tests/unit/intelligence/wisdom.test.ts
\`\`\`

## Checks

1. Result version is 0.1.0 with all 17 area and engine scores populated.
2. Analysis kinds and scenarios cover WISDOM_ANALYSIS_KINDS / WISDOM_SCENARIOS.
3. Recommendations carry the eight-field WisdomLens; IDs use \`wis-\` prefix.
4. Closed learning destinations match the seven redistribution domains.
5. Platform module order ends \`collective\`, \`wisdom\`.
6. Scenario records use organizationalImpact, judgmentImpact, timingImpact fields.
7. Outlooks use: wise, stable, shortsighted, volatile, uncertain.
`);

w("CHANGELOG.md", `# Wisdom Intelligence Changelog

## 0.1.0 - Sprint 060

- Initial Wisdom Intelligence package (17 areas, 10 scenarios, 12 analysis kinds).
- JAG v1.0 capstone terminal after Collective; hard DAG ["collective"].
- Specialized engines: StrategicReasoningEngine, CrossDomainSynthesisEngine, TradeOffEngine,
  UncertaintyEngine, ExecutiveJudgmentEngine, ConfidenceEngine, EarlyWarningEngine.
- Standard engines: WisdomForecastEngine, WisdomTrendEngine, WisdomScenarioEngine, WisdomAnalysisEngine.
- Soft integrations from collective and upstream domains (leaf-safe light types).
- Health formula: avg(areas)*0.5 + strategicValue*0.1 + longTermImpact*0.1 + wisdomScore*0.08 +
  forecast*0.08 + scenario*0.07 + earlyWarning*0.04 + executiveJudgmentEngine*0.03.
- Closed learning redistributes synthesized insights to collective, institutional-memory, knowledge,
  executive-decision, opportunity, predictive, ethical.
- WisdomLens: strategicValue, longTermImpact, confidenceLevel, evidenceQuality, tradeOffBalance,
  organizationalAlignment, ethicalIntegrity, wisdomScore.
- Outlooks: wise, stable, shortsighted, volatile, uncertain.
`);

console.log("Part 3 complete. Files:", fs.readdirSync(DEST).length);
