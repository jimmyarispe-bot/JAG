/**
 * Part 3: composers, engine, service, index, docs for Collective Intelligence.
 */
import fs from "node:fs";
import path from "node:path";

const DEST = path.resolve("src/lib/platform/intelligence/collective");
const w = (name, content) => fs.writeFileSync(path.join(DEST, name), content, "utf8");
const PKG = "@/lib/platform/intelligence/collective";

const AREAS = [
  ["collective_reasoning", "CollectiveReasoningIntelligence"],
  ["consensus_analysis", "ConsensusAnalysisIntelligence"],
  ["distributed_expertise", "DistributedExpertiseIntelligence"],
  ["collaborative_intelligence", "CollaborativeIntelligence"],
  ["multi_domain_synthesis", "MultiDomainSynthesisIntelligence"],
  ["cross_functional_intelligence", "CrossFunctionalIntelligence"],
  ["organizational_alignment", "OrganizationalAlignmentIntelligence"],
  ["team_decision_intelligence", "TeamDecisionIntelligence"],
  ["expert_weighting", "ExpertWeightingIntelligence"],
  ["perspective_diversity", "PerspectiveDiversityIntelligence"],
  ["conflict_resolution", "ConflictResolutionIntelligence"],
  ["collaborative_learning", "CollaborativeLearningIntelligence"],
  ["organizational_coordination", "OrganizationalCoordinationIntelligence"],
  ["shared_decision_quality", "SharedDecisionQualityIntelligence"],
  ["collective_opportunity_detection", "CollectiveOpportunityDetectionIntelligence"],
  ["collective_risk_assessment", "CollectiveRiskAssessmentIntelligence"],
  ["collective_intelligence_evolution", "CollectiveIntelligenceEvolutionIntelligence"],
];
const AREA_KEYS = AREAS.map(([a]) => a);
const snakeToCamel = (s) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
const areaFile = (area) => area.replaceAll("_", "-") + "-intelligence";

w("collective-intelligence.ts", `import { buildLens, clamp, priorityFromScore, statusFromScore } from "${PKG}/models";
import type {
  CollectiveArea, CollectiveAreaSuite, CollectiveBaseline, CollectiveDashboard,
  CollectiveForecastSuite, CollectiveHealthScore, CollectiveOpportunityRecord,
  CollectiveRecommendationRecord, CollectiveRiskRecord, CollectiveScenarioSuite,
  CollectiveScore, CollectiveAnalysisSuite,
} from "${PKG}/types";
import { COLLECTIVE_AREAS } from "${PKG}/types";

export const score = (key: string, label: string, value: number): CollectiveScore => {
  const v = clamp(value);
  return { key, label, value: v, status: statusFromScore(v), band: priorityFromScore(v), narrative: \`\${label} is \${statusFromScore(v)} at \${Math.round(v)}.\` };
};

const lens = (area: string, value: number) => buildLens({
  consensusStrength: \`\${area} consensus strength scored \${Math.round(value)}.\`,
  expertiseCoverage: \`Expertise coverage linked to \${area}.\`,
  perspectiveDiversity: \`Perspective diversity relative to \${area} conditions.\`,
  crossDomainAgreement: \`Cross-domain agreement reading for \${area}.\`,
  organizationalAlignment: \`Organizational alignment associated with \${area}.\`,
  collaborationQuality: \`Collaboration quality pressure from \${area}.\`,
  collectiveConfidence: \`Collective confidence in \${area}.\`,
  longTermCollectiveValue: \`Timing window for \${area}-linked collective intelligence action.\`,
});

export class CollectiveIntelligence {
  composeScores(input: {
    baseline: CollectiveBaseline;
    areas: Record<CollectiveArea, CollectiveAreaSuite>;
    forecast: number;
    scenario: number;
    analysis: number;
    earlyWarning: number;
    consensusEngine: number;
    distributedExpertiseEngine: number;
    crossDomainSynthesis: number;
    collaborationEngine: number;
    conflictResolutionEngine: number;
  }) {
    const areaScores = Object.fromEntries(
      COLLECTIVE_AREAS.map(a => [a, score(\`collective_\${a}\`, \`\${a} Collective Score\`, input.areas[a].score)])
    ) as Record<CollectiveArea, CollectiveScore>;
    const overall =
      COLLECTIVE_AREAS.reduce((s, a) => s + areaScores[a].value, 0) / COLLECTIVE_AREAS.length * .5 +
      input.baseline.consensusStrength * .1 +
      input.baseline.collaborationQuality * .1 +
      input.baseline.collectiveConfidence * .08 +
      input.forecast * .08 +
      input.scenario * .07 +
      input.earlyWarning * .04 +
      input.consensusEngine * .03;
    return {
      healthScore: score("collective_health", "Collective Intelligence Health Score", overall),
      areaScores,
      forecastScore: score("collective_forecast", "Forecast Score", input.forecast),
      scenarioScore: score("collective_scenario", "Scenario Score", input.scenario),
      analysisScore: score("collective_analysis", "Analysis Score", input.analysis),
      earlyWarningScore: score("collective_early_warning", "Early Warning Score", input.earlyWarning),
      consensusEngineScore: score("collective_consensus_engine", "Consensus Engine Score", input.consensusEngine),
      distributedExpertiseEngineScore: score("collective_distributed_expertise_engine", "Distributed Expertise Engine Score", input.distributedExpertiseEngine),
      crossDomainSynthesisScore: score("collective_cross_domain_synthesis", "Cross Domain Synthesis Score", input.crossDomainSynthesis),
      collaborationEngineScore: score("collective_collaboration_engine", "Collaboration Engine Score", input.collaborationEngine),
      conflictResolutionEngineScore: score("collective_conflict_resolution_engine", "Conflict Resolution Engine Score", input.conflictResolutionEngine),
    };
  }
}

export class CollectiveRecommendationComposer {
  constructor(private createId: (prefix: string) => string) {}
  compose(
    areas: Record<CollectiveArea, CollectiveAreaSuite>,
    analysis: CollectiveAnalysisSuite,
    scenarios: CollectiveScenarioSuite,
    now: Date,
  ): CollectiveRecommendationRecord[] {
    return [...COLLECTIVE_AREAS]
      .sort((a, b) => areas[a].score - areas[b].score)
      .slice(0, 6)
      .map((area, index) => ({
        id: this.createId("col-rec"),
        title: \`Address \${area.replaceAll("_", " ")} collective intelligence exposure\`,
        priority: priorityFromScore(areas[area].score),
        evidenceRefs: analysis.analyses.slice(0, 2).map(a => a.id).concat(scenarios.scenarios.slice(0, 1).map(s => s.id)),
        confidenceScore: .68,
        owner: index ? "collective-owner" : "executive-team",
        dueDate: new Date(now.getTime() + (30 + index * 14) * 86400000).toISOString(),
        rationale: areas[area].narrative,
        action: \`Run a collective intelligence response cycle for \${area.replaceAll("_", " ")}.\`,
        lenses: lens(area, areas[area].score),
        narrative: \`Prioritize \${area} collective intelligence response.\`,
      }));
  }
}

export function composeRisksOpportunities(
  areas: Record<CollectiveArea, CollectiveAreaSuite>,
  createId: (prefix: string) => string,
): { risks: CollectiveRiskRecord[]; opportunities: CollectiveOpportunityRecord[] } {
  const ordered = [...COLLECTIVE_AREAS].sort((a, b) => areas[a].score - areas[b].score);
  return {
    risks: ordered.slice(0, 5).map(a => ({
      id: createId("col-risk"),
      title: \`\${a.replaceAll("_", " ")} collective intelligence pressure\`,
      area: a,
      severity: priorityFromScore(areas[a].score),
      score: 100 - areas[a].score,
      mitigation: \`Strengthen monitoring and collective playbooks for \${a.replaceAll("_", " ")}.\`,
      lenses: lens(a, areas[a].score),
      narrative: areas[a].narrative,
    })),
    opportunities: ordered.slice(-5).reverse().map(a => ({
      id: createId("col-opp"),
      title: \`Capture \${a.replaceAll("_", " ")} collective intelligence advantage\`,
      area: a,
      priority: priorityFromScore(100 - areas[a].score),
      score: areas[a].score,
      lenses: lens(a, areas[a].score),
      narrative: areas[a].narrative,
    })),
  };
}

export function composeHealth(
  scores: ReturnType<CollectiveIntelligence["composeScores"]>,
  baseline: CollectiveBaseline,
  forecasts: CollectiveForecastSuite,
): CollectiveHealthScore {
  const areaScores = Object.fromEntries(COLLECTIVE_AREAS.map(a => [a, scores.areaScores[a].value])) as Record<CollectiveArea, number>;
  return {
    overallScore: scores.healthScore.value,
    status: scores.healthScore.status,
    outlook: forecasts.outlook,
    areaScores,
    consensusEngineScore: scores.consensusEngineScore.value,
    collaborationEngineScore: scores.collaborationEngineScore.value,
    crossDomainSynthesisScore: scores.crossDomainSynthesisScore.value,
    forecastScore: scores.forecastScore.value,
    scenarioScore: scores.scenarioScore.value,
    lenses: lens("organization", scores.healthScore.value),
    narrative: scores.healthScore.narrative,
  };
}

export function composeDashboard(
  now: Date,
  health: CollectiveHealthScore,
  baseline: CollectiveBaseline,
  risks: CollectiveRiskRecord[],
  opportunities: CollectiveOpportunityRecord[],
): CollectiveDashboard {
  return {
    generatedAt: now.toISOString(),
    headline: \`Executive Collective Overview: health \${Math.round(health.overallScore)} - \${health.status} (\${health.outlook})\`,
    overall: health.overallScore,
    areaScores: health.areaScores,
    outlook: health.outlook,
    consensusStrength: baseline.consensusStrength,
    collaborationQuality: baseline.collaborationQuality,
    collectiveConfidence: baseline.collectiveConfidence,
    topRisks: risks.map(r => r.title),
    topOpportunities: opportunities.map(o => o.title),
    narrative: health.narrative,
  };
}

export const collectiveLens = lens;
`);

const areaImports = AREAS.map(([area, cls]) =>
  `import { ${cls} } from "${PKG}/${areaFile(area)}";`
).join("\n");
const areaInit = AREAS.map(([area, cls]) => `      ${area}: new ${cls}(),`).join("\n");
const areaScoreAssign = AREA_KEYS.map(a =>
  `      ${snakeToCamel(a)}Score: scores.areaScores.${a},`
).join("\n");

w("collective-engine.ts", `import type { CollectiveDependencies, CollectiveEngine as Contract } from "${PKG}/contracts";
import { defaultCreateId, defaultPeriodLabel, deriveCollectiveBaseline, emptyCollectiveScope, buildConfidence } from "${PKG}/models";
import { COLLECTIVE_AREAS, COLLECTIVE_INTELLIGENCE_VERSION, type CollectiveArea, type CollectiveAreaSuite, type CollectiveRequest, type CollectiveResult } from "${PKG}/types";
${areaImports}
import { CollectiveForecastEngine } from "${PKG}/collective-forecast-engine";
import { CollectiveScenarioEngine } from "${PKG}/collective-scenario-engine";
import { CollectiveTrendEngine } from "${PKG}/collective-trend-engine";
import { CollectiveAnalysisEngine } from "${PKG}/collective-analysis-engine";
import { ConsensusEngine } from "${PKG}/consensus-engine";
import { DistributedExpertiseEngine } from "${PKG}/distributed-expertise-engine";
import { CrossDomainSynthesisEngine } from "${PKG}/cross-domain-synthesis-engine";
import { CollaborationEngine } from "${PKG}/collaboration-engine";
import { ConflictResolutionEngine } from "${PKG}/conflict-resolution-engine";
import { EarlyWarningEngine } from "${PKG}/early-warning-engine";
import { CollectiveKnowledgeContributionEngine } from "${PKG}/knowledge-contribution";
import { ClosedLearningLoop } from "${PKG}/closed-learning-loop";
import { CollectiveReasoner } from "${PKG}/collective-reasoner";
import {
  CollectiveIntelligence, CollectiveRecommendationComposer, composeDashboard, composeHealth,
  composeRisksOpportunities, collectiveLens,
} from "${PKG}/collective-intelligence";
import { CollectiveProjection, CollectiveQueries } from "${PKG}/projection";
import { CollectiveRepositoryStore } from "${PKG}/repository";
import { CollectiveRegistryStore } from "${PKG}/collective-registry";

export class CollectiveIntelligenceEngineImpl implements Contract {
  readonly repository; readonly registry; readonly queries;
  private now; private createId; private areas; private forecasts; private scenarios; private trends; private analysis;
  private consensus; private distributedExpertise; private crossDomainSynthesis; private collaboration; private conflictResolution;
  private earlyWarning; private reasoner;

  constructor(d: CollectiveDependencies = {}) {
    this.now = d.now ?? (() => new Date());
    this.createId = d.createId ?? defaultCreateId;
    this.repository = d.repository ?? new CollectiveRepositoryStore();
    this.registry = d.registry ?? new CollectiveRegistryStore();
    this.queries = new CollectiveQueries();
    this.areas = {
${areaInit}
      ...d.areaIntelligence,
    };
    this.forecasts = d.forecastEngine ?? new CollectiveForecastEngine();
    this.scenarios = d.scenarioEngine ?? new CollectiveScenarioEngine();
    this.trends = d.trendEngine ?? new CollectiveTrendEngine();
    this.analysis = d.analysisEngine ?? new CollectiveAnalysisEngine();
    this.consensus = d.consensusEngine ?? new ConsensusEngine();
    this.distributedExpertise = d.distributedExpertiseEngine ?? new DistributedExpertiseEngine();
    this.crossDomainSynthesis = d.crossDomainSynthesisEngine ?? new CrossDomainSynthesisEngine();
    this.collaboration = d.collaborationEngine ?? new CollaborationEngine();
    this.conflictResolution = d.conflictResolutionEngine ?? new ConflictResolutionEngine();
    this.earlyWarning = d.earlyWarningEngine ?? new EarlyWarningEngine();
    this.reasoner = d.reasoner ?? new CollectiveReasoner();
  }

  build(request: CollectiveRequest): CollectiveResult {
    const now = this.now();
    const baseline = deriveCollectiveBaseline(request);
    const createId = this.createId;
    const scope = request.scope ?? emptyCollectiveScope();
    const areaSuites = Object.fromEntries(
      COLLECTIVE_AREAS.map(area => [area, this.areas[area]!.assess({ baseline, now, createId })])
    ) as Record<CollectiveArea, CollectiveAreaSuite>;

    const trendSuite = this.trends.assess({ baseline, areas: areaSuites, now, createId });
    const forecastSuite = this.forecasts.assess({ baseline, areas: areaSuites, now, createId });
    const scenarioSuite = this.scenarios.assess({ baseline, areas: areaSuites, forecasts: forecastSuite, now, createId });
    const analysisSuite = this.analysis.assess({ baseline, areas: areaSuites, forecasts: forecastSuite, scenarios: scenarioSuite, now, createId });
    const consensusSuite = this.consensus.assess({ baseline, areas: areaSuites, now, createId });
    const distributedExpertiseSuite = this.distributedExpertise.assess({ baseline, areas: areaSuites, now, createId });
    const crossDomainSynthesisSuite = this.crossDomainSynthesis.assess({ baseline, areas: areaSuites, now, createId });
    const collaborationSuite = this.collaboration.assess({ baseline, areas: areaSuites, now, createId });
    const conflictResolutionSuite = this.conflictResolution.assess({ baseline, areas: areaSuites, now, createId });
    const earlyWarningSuite = this.earlyWarning.assess({ baseline, trends: trendSuite, scenarios: scenarioSuite, now, createId });
    const knowledgeContribution = new CollectiveKnowledgeContributionEngine().contribute({ forecasts: forecastSuite, scenarios: scenarioSuite, now, createId });
    const confidence = buildConfidence([
      { key: "evidence", label: "Evidence coverage", contribution: baseline.evidenceCoverage / 100 },
      { key: "forecast", label: "Forecast maturity", contribution: forecastSuite.maturityScore / 100 },
      { key: "scenario", label: "Scenario maturity", contribution: baseline.scenarioMaturity / 100 },
    ]);
    const reasoning = this.reasoner.reason({ request, trends: trendSuite, forecasts: forecastSuite, scenarios: scenarioSuite, confidence });
    const intelligence = new CollectiveIntelligence();
    const scores = intelligence.composeScores({
      baseline,
      areas: areaSuites,
      forecast: forecastSuite.maturityScore,
      scenario: baseline.scenarioMaturity,
      analysis: analysisSuite.maturityScore,
      earlyWarning: earlyWarningSuite.score,
      consensusEngine: consensusSuite.score,
      distributedExpertiseEngine: distributedExpertiseSuite.score,
      crossDomainSynthesis: crossDomainSynthesisSuite.score,
      collaborationEngine: collaborationSuite.score,
      conflictResolutionEngine: conflictResolutionSuite.score,
    });
    const { risks, opportunities } = composeRisksOpportunities(areaSuites, createId);
    const recommendations = new CollectiveRecommendationComposer(createId).compose(areaSuites, analysisSuite, scenarioSuite, now);
    const health = composeHealth(scores, baseline, forecastSuite);
    const dashboard = composeDashboard(now, health, baseline, risks, opportunities);
    const commonLens = collectiveLens("organization", health.overallScore);

    const consensusDashboard = {
      generatedAt: now.toISOString(),
      headline: \`Consensus index \${Math.round(consensusSuite.consensusIndex)}\`,
      score: consensusSuite.score,
      consensusIndex: consensusSuite.consensusIndex,
      signals: consensusSuite.records.slice(0, 4).map(r => r.title),
      narrative: consensusSuite.narrative,
    };
    const crossDomainIntelligenceDashboard = {
      generatedAt: now.toISOString(),
      headline: \`Cross-domain synthesis \${Math.round(crossDomainSynthesisSuite.synthesisIndex)}\`,
      score: crossDomainSynthesisSuite.score,
      synthesisIndex: crossDomainSynthesisSuite.synthesisIndex,
      signals: crossDomainSynthesisSuite.records.slice(0, 4).map(r => r.title),
      narrative: crossDomainSynthesisSuite.narrative,
    };
    const expertiseNetworkDashboard = {
      generatedAt: now.toISOString(),
      headline: \`Expertise network \${Math.round(distributedExpertiseSuite.expertiseIndex)}\`,
      score: distributedExpertiseSuite.score,
      expertiseIndex: distributedExpertiseSuite.expertiseIndex,
      signals: distributedExpertiseSuite.records.map(r => r.narrative),
      narrative: distributedExpertiseSuite.narrative,
    };
    const organizationalAlignmentDashboard = {
      generatedAt: now.toISOString(),
      headline: \`Organizational alignment \${Math.round(areaSuites.organizational_alignment.score)}\`,
      score: areaSuites.organizational_alignment.score,
      alignmentIndex: areaSuites.organizational_alignment.score,
      signals: areaSuites.organizational_alignment.records.map(r => r.signal),
      narrative: areaSuites.organizational_alignment.narrative,
    };
    const collaborationHealthDashboard = {
      generatedAt: now.toISOString(),
      headline: \`Collaboration health \${Math.round(collaborationSuite.collaborationIndex)}\`,
      score: collaborationSuite.score,
      collaborationIndex: collaborationSuite.collaborationIndex,
      signals: collaborationSuite.records.map(r => r.narrative),
      narrative: collaborationSuite.narrative,
    };
    const collectiveLearningDashboard = {
      generatedAt: now.toISOString(),
      headline: \`Collaborative learning \${Math.round(areaSuites.collaborative_learning.score)}\`,
      score: areaSuites.collaborative_learning.score,
      learningIndex: areaSuites.collaborative_learning.score,
      signals: areaSuites.collaborative_learning.records.map(r => r.signal),
      narrative: areaSuites.collaborative_learning.narrative,
    };
    const forecastDashboard = {
      generatedAt: now.toISOString(),
      headline: \`Collective Forecast: \${forecastSuite.outlook}\`,
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
      consensusEngineScore: consensusSuite.score,
      collaborationEngineScore: collaborationSuite.score,
      crossDomainSynthesisScore: crossDomainSynthesisSuite.score,
      recommendations: recommendations.map(r => r.title),
      lenses: commonLens,
      narrative: "Board assurance on collective consensus strength, collaboration quality, cross-domain synthesis, and long-term collective value.",
    };
    const closedLearningLoop = new ClosedLearningLoop().contribute({ trends: trendSuite, scenarios: scenarioSuite, recommendations, now, createId });
    const projection = new CollectiveProjection().project({
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
      id: createId("col-history"),
      requestId: request.requestId,
      scope,
      status: "assessed" as const,
      healthScore: health.overallScore,
      generatedAt: now.toISOString(),
      summary: brief.headline,
      metadata: request.metadata ?? {},
    };

    const result: CollectiveResult = {
      requestId: request.requestId,
      version: COLLECTIVE_INTELLIGENCE_VERSION,
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
      consensusEngineScore: scores.consensusEngineScore,
      distributedExpertiseEngineScore: scores.distributedExpertiseEngineScore,
      crossDomainSynthesisScore: scores.crossDomainSynthesisScore,
      collaborationEngineScore: scores.collaborationEngineScore,
      conflictResolutionEngineScore: scores.conflictResolutionEngineScore,
      health,
      dashboard,
      consensusDashboard,
      crossDomainIntelligenceDashboard,
      expertiseNetworkDashboard,
      organizationalAlignmentDashboard,
      collaborationHealthDashboard,
      collectiveLearningDashboard,
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
      consensusSuite,
      distributedExpertiseSuite,
      crossDomainSynthesisSuite,
      collaborationSuite,
      conflictResolutionSuite,
      earlyWarningSuite,
      knowledgeContribution,
      closedLearningLoop,
      reasoning,
      projection,
      historyRecord,
      confidence,
      requestMetadata: { ...(request.metadata ?? {}), registryPublishers: this.registry.list().length },
    };

    this.registry.register("collective", "collective_intelligence");
    this.repository.save(result);
    this.repository.saveHistory(historyRecord);
    return result;
  }
}

export {
  CollectiveIntelligenceEngineImpl as CollectiveIntelligenceEngine,
  CollectiveIntelligenceEngineImpl as CollectiveEngine,
  CollectiveIntelligenceEngineImpl as CollectiveEngineImpl,
};
`);

w("projection.ts", `import { buildConfidence, outlookFromScore } from "${PKG}/models";
import type { CollectiveProjectionResult, CollectiveQueryRequest, CollectiveQueryResult, CollectiveResult } from "${PKG}/types";

export class CollectiveProjection {
  project(input: Omit<CollectiveProjectionResult, "forecast">): CollectiveProjectionResult {
    const outlookBoost = input.outlook === "aligned" ? 6 : input.outlook === "contested" ? -4 : input.outlook === "stable" ? 2 : 0;
    return { ...input, forecast: Math.min(100, input.healthScore + outlookBoost) };
  }
}

export class CollectiveQueries {
  ask(result: CollectiveResult, request: CollectiveQueryRequest): CollectiveQueryResult {
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
    else if (focus === "recommendations") { answer = \`\${result.recommendations.length} collective intelligence recommendations.\`; }
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

w("repository.ts", `import type { CollectiveRepository } from "${PKG}/contracts";
import type { CollectiveHistoryRecord, CollectiveResult, GraphScope } from "${PKG}/types";

export class CollectiveRepositoryStore implements CollectiveRepository {
  private results = new Map<string, CollectiveResult>();
  private history: CollectiveHistoryRecord[] = [];

  save(result: CollectiveResult): CollectiveResult {
    this.results.set(result.requestId, result);
    return result;
  }
  get(requestId: string): CollectiveResult | null {
    return this.results.get(requestId) ?? null;
  }
  list(scope?: Partial<GraphScope>): CollectiveResult[] {
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
  saveHistory(record: CollectiveHistoryRecord): CollectiveHistoryRecord {
    this.history.push(record);
    return record;
  }
  listHistory(scope?: Partial<GraphScope>): CollectiveHistoryRecord[] {
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

w("collective-registry.ts", `import type { CollectiveRegistry } from "${PKG}/contracts";
import type { CollectivePublisher } from "${PKG}/types";

export class CollectiveRegistryStore implements CollectiveRegistry {
  private publishers: CollectivePublisher[] = [];

  register(domain: string, capability: string): void {
    if (!this.publishers.some(p => p.domain === domain && p.capability === capability)) {
      this.publishers.push({ domain, capability });
    }
  }
  list(): CollectivePublisher[] {
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

w("service.ts", `import type { CollectiveDependencies, CollectiveIntelligenceService as Contract, CollectiveRepository as Repository } from "${PKG}/contracts";
import { CollectiveIntelligenceEngineImpl } from "${PKG}/collective-engine";
import type { CollectiveQueryRequest, CollectiveQueryResult, CollectiveRequest, CollectiveResult } from "${PKG}/types";

export interface CollectiveServiceDependencies extends CollectiveDependencies {}

export class CollectiveIntelligenceServiceImpl implements Contract {
  private engine: CollectiveIntelligenceEngineImpl;
  constructor(d: CollectiveServiceDependencies = {}) {
    this.engine = (d.engine as CollectiveIntelligenceEngineImpl | undefined) ?? new CollectiveIntelligenceEngineImpl(d);
  }
  build(request: CollectiveRequest): CollectiveResult { return this.engine.build(request); }
  query(result: CollectiveResult, request: CollectiveQueryRequest): CollectiveQueryResult { return this.engine.queries.ask(result, request); }
  repository(): Repository { return this.engine.repository; }
}

export {
  CollectiveIntelligenceServiceImpl as CollectiveIntelligenceService,
  CollectiveIntelligenceServiceImpl as CollectiveService,
  CollectiveIntelligenceServiceImpl as CollectiveServiceImpl,
};
`);

const areaExports = AREA_KEYS.map(a =>
  `export * from "${PKG}/${areaFile(a)}";`
).join("\n");

w("index.ts", `export * from "${PKG}/types";
export type {
  CollectiveDependencies,
  CollectiveAreaIntelligence as CollectiveAreaIntelligenceContract,
  CollectiveForecastEngineContract,
  CollectiveScenarioEngineContract,
  CollectiveTrendEngineContract,
  CollectiveAnalysisEngineContract,
  ConsensusEngineContract,
  DistributedExpertiseEngineContract,
  CrossDomainSynthesisEngineContract,
  CollaborationEngineContract,
  ConflictResolutionEngineContract,
  EarlyWarningEngineContract,
  CollectiveReasonerContract,
  CollectiveRegistry as CollectiveRegistryContract,
  CollectiveRepository as CollectiveRepositoryContract,
  CollectiveEngine as CollectiveEngineContract,
  CollectiveIntelligenceEngine as CollectiveIntelligenceEngineContract,
  CollectiveIntelligenceService as CollectiveIntelligenceServiceContract,
  CollectiveService as CollectiveServiceContract,
} from "${PKG}/contracts";
export * from "${PKG}/models";
export * from "${PKG}/area-factory";
${areaExports}
export * from "${PKG}/collective-forecast-engine";
export * from "${PKG}/collective-scenario-engine";
export * from "${PKG}/collective-trend-engine";
export * from "${PKG}/collective-analysis-engine";
export * from "${PKG}/consensus-engine";
export * from "${PKG}/distributed-expertise-engine";
export * from "${PKG}/cross-domain-synthesis-engine";
export * from "${PKG}/collaboration-engine";
export * from "${PKG}/conflict-resolution-engine";
export * from "${PKG}/early-warning-engine";
export * from "${PKG}/knowledge-contribution";
export * from "${PKG}/closed-learning-loop";
export * from "${PKG}/collective-reasoner";
export * from "${PKG}/collective-intelligence";
export * from "${PKG}/projection";
export * from "${PKG}/collective-registry";
export * from "${PKG}/repository";
export * from "${PKG}/collective-engine";
export * from "${PKG}/service";

import type { CollectiveDependencies } from "${PKG}/contracts";
import { CollectiveIntelligenceEngine } from "${PKG}/collective-engine";
import { CollectiveIntelligenceService } from "${PKG}/service";
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

export interface CollectiveStack {
  service: CollectiveIntelligenceService;
  engine: CollectiveIntelligenceEngine;
  organizationDna: OrganizationDnaStack | null;
  oios: OiosStack | null;
}

export interface CreateCollectiveOptions extends CollectiveDependencies {
  organizationDna?: OrganizationDnaStack;
  organizationDnaOptions?: CreateOrganizationDnaOptions;
  wireOrganizationDna?: boolean;
  oios?: OiosStack;
  oiosOptions?: CreateOiosOptions;
  wireOios?: boolean;
}

export function createCollectiveIntelligence(options: CreateCollectiveOptions = {}): CollectiveStack {
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
  const engine = new CollectiveIntelligenceEngine(options);
  const service = new CollectiveIntelligenceService({ ...options, engine });
  return { service, engine, organizationDna, oios };
}
`);

w("README.md", `# Collective Intelligence (Sprint 059)

**Version:** 0.1.0 | **Domain key:** \`collective\` | **ID prefix:** \`col-\`

Collaborative reasoning and multi-domain synthesis layer after institutional-memory. Aggregates multi-domain
recommendations and redistributes synthesized learning across the platform.

## Hard DAG

\`["institutional-memory"]\` - collaborative reasoning and multi-domain synthesis layer after Institutional Memory Intelligence.

## Layer

Collaborative reasoning / multi-domain synthesis after institutional-memory. Soft-reads all upstream domains and
synthesizes consensus, expertise distribution, and cross-domain agreement into actionable collective intelligence.

## Areas (17)

collective_reasoning, consensus_analysis, distributed_expertise, collaborative_intelligence, multi_domain_synthesis,
cross_functional_intelligence, organizational_alignment, team_decision_intelligence, expert_weighting,
perspective_diversity, conflict_resolution, collaborative_learning, organizational_coordination,
shared_decision_quality, collective_opportunity_detection, collective_risk_assessment, collective_intelligence_evolution

## Entry point

\`\`\`ts
import { createCollectiveIntelligence } from "@/lib/platform/intelligence/collective";

const { service } = createCollectiveIntelligence({ wireOrganizationDna: false, wireOios: false });
const result = service.build({ requestId: "col-1", scope: { organizationId: "org-1", schoolId: "school-1" } });
\`\`\`

## Lens (8 fields)

consensusStrength - expertiseCoverage - perspectiveDiversity - crossDomainAgreement - organizationalAlignment - collaborationQuality - collectiveConfidence - longTermCollectiveValue

## Closed learning destinations (7)

institutional-memory, knowledge, executive-decision, opportunity, predictive, stakeholder, organizational-improvement
`);

w("ARCHITECTURE.md", `# Collective Intelligence Architecture

## Placement

- Domain key: \`collective\`
- Package: \`src/lib/platform/intelligence/collective/\`
- Pipeline: collaborative synthesis after \`institutional-memory\`
- Hard DAG: \`["institutional-memory"]\`
- Soft reads: institutional-memory, knowledge, decision, predictive, behavioral, cultural, stakeholder, systems,
  opportunity, ecosystem, resilience, ethical, market, competitive, humanCapital, operations

## Package layout

Leaf-safe \`types\` / \`contracts\`, \`models\`, area factory + 17 area modules,
specialized engines (ConsensusEngine, DistributedExpertiseEngine, CrossDomainSynthesisEngine,
CollaborationEngine, ConflictResolutionEngine, EarlyWarningEngine),
standard engines (CollectiveForecastEngine, CollectiveTrendEngine, CollectiveScenarioEngine, CollectiveAnalysisEngine),
composers, projection, repository, registry, service, \`createCollectiveIntelligence\`.

## Specialized suites on CollectiveResult

consensusSuite, distributedExpertiseSuite, crossDomainSynthesisSuite, collaborationSuite,
conflictResolutionSuite, earlyWarningSuite, plus trend/forecast/scenario/analysis suites.

## Score fields with Engine suffix

- consensusEngineScore (area has consensusAnalysisScore)
- distributedExpertiseEngineScore (area has distributedExpertiseScore)
- crossDomainSynthesisScore
- collaborationEngineScore (area has collaborativeIntelligenceScore)
- conflictResolutionEngineScore (area has conflictResolutionScore)

## Closed learning

Collaborative synthesis layer that aggregates multi-domain recommendations and redistributes synthesized learning.

Destinations: institutional-memory, knowledge, executive-decision, opportunity, predictive, stakeholder, organizational-improvement.

## Health formula

avg(areas)*0.5 + consensusStrength*0.1 + collaborationQuality*0.1 + collectiveConfidence*0.08 +
forecast*0.08 + scenario*0.07 + earlyWarning*0.04 + consensusEngine*0.03
`);

w("VERIFICATION.md", `# Collective Intelligence Verification

## Commands

\`\`\`
npx tsc --noEmit
npx vitest run tests/unit/intelligence/collective.test.ts
\`\`\`

## Checks

1. Result version is 0.1.0 with all 17 area and engine scores populated.
2. Analysis kinds and scenarios cover COLLECTIVE_ANALYSIS_KINDS / COLLECTIVE_SCENARIOS.
3. Recommendations carry the eight-field CollectiveLens; IDs use \`col-\` prefix.
4. Closed learning destinations match the seven redistribution domains.
5. Platform module order ends \`institutional-memory\`, \`collective\`.
6. Scenario records use organizationalImpact, consensusImpact, expertiseImpact fields.
7. Outlooks use: aligned, stable, contested, volatile, uncertain.
`);

w("CHANGELOG.md", `# Collective Intelligence Changelog

## 0.1.0 - Sprint 059

- Initial Collective Intelligence package (17 areas, 10 scenarios, 12 analysis kinds).
- Collaborative synthesis layer after Institutional Memory; hard DAG ["institutional-memory"].
- Specialized engines: ConsensusEngine, DistributedExpertiseEngine, CrossDomainSynthesisEngine,
  CollaborationEngine, ConflictResolutionEngine, EarlyWarningEngine.
- Standard engines: CollectiveForecastEngine, CollectiveTrendEngine, CollectiveScenarioEngine, CollectiveAnalysisEngine.
- Soft integrations from institutional-memory, knowledge, decision, predictive, behavioral, cultural, stakeholder,
  systems, opportunity, ecosystem, resilience, ethical, market, competitive, humanCapital, operations.
- Health formula: avg(areas)*0.5 + consensusStrength*0.1 + collaborationQuality*0.1 + collectiveConfidence*0.08 +
  forecast*0.08 + scenario*0.07 + earlyWarning*0.04 + consensusEngine*0.03.
- Closed learning redistributes synthesized insights to institutional-memory, knowledge, executive-decision,
  opportunity, predictive, stakeholder, organizational-improvement.
- CollectiveLens: consensusStrength, expertiseCoverage, perspectiveDiversity, crossDomainAgreement,
  organizationalAlignment, collaborationQuality, collectiveConfidence, longTermCollectiveValue.
- Outlooks: aligned, stable, contested, volatile, uncertain.
`);

console.log("Part 3 complete. Files:", fs.readdirSync(DEST).length);
