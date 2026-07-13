/**
 * Part 3: cultural-engine, projection, repository, registry, service, index, docs.
 */
import fs from "node:fs";
import path from "node:path";

const DEST = path.resolve("src/lib/platform/intelligence/cultural");
const w = (name, content) => fs.writeFileSync(path.join(DEST, name), content, "utf8");

w("cultural-engine.ts", `import type { CulturalDependencies, CulturalEngine as Contract } from "@/lib/platform/intelligence/cultural/contracts";
import { defaultCreateId, defaultPeriodLabel, deriveCulturalBaseline, emptyCulturalScope, buildConfidence } from "@/lib/platform/intelligence/cultural/models";
import { CULTURAL_AREAS, CULTURAL_INTELLIGENCE_VERSION, type CulturalArea, type CulturalAreaSuite, type CulturalRequest, type CulturalResult } from "@/lib/platform/intelligence/cultural/types";
import { OrganizationalCultureIntelligence } from "@/lib/platform/intelligence/cultural/organizational-culture-intelligence";
import { TeamCultureIntelligence } from "@/lib/platform/intelligence/cultural/team-culture-intelligence";
import { LeadershipCultureIntelligence } from "@/lib/platform/intelligence/cultural/leadership-culture-intelligence";
import { MissionAlignmentIntelligence } from "@/lib/platform/intelligence/cultural/mission-alignment-intelligence";
import { ValuesAlignmentIntelligence } from "@/lib/platform/intelligence/cultural/values-alignment-intelligence";
import { EmployeeEngagementIntelligence } from "@/lib/platform/intelligence/cultural/employee-engagement-intelligence";
import { CollaborationCultureIntelligence } from "@/lib/platform/intelligence/cultural/collaboration-culture-intelligence";
import { CommunicationCultureIntelligence } from "@/lib/platform/intelligence/cultural/communication-culture-intelligence";
import { InnovationCultureIntelligence } from "@/lib/platform/intelligence/cultural/innovation-culture-intelligence";
import { LearningCultureIntelligence } from "@/lib/platform/intelligence/cultural/learning-culture-intelligence";
import { PsychologicalSafetyIntelligence } from "@/lib/platform/intelligence/cultural/psychological-safety-intelligence";
import { InclusionBelongingIntelligence } from "@/lib/platform/intelligence/cultural/inclusion-belonging-intelligence";
import { CrossCulturalIntelligence } from "@/lib/platform/intelligence/cultural/cross-cultural-intelligence";
import { CommunityCultureIntelligence } from "@/lib/platform/intelligence/cultural/community-culture-intelligence";
import { CulturalRiskIntelligence } from "@/lib/platform/intelligence/cultural/cultural-risk-intelligence";
import { CulturalOpportunityIntelligence } from "@/lib/platform/intelligence/cultural/cultural-opportunity-intelligence";
import { CulturalTransformationIntelligence } from "@/lib/platform/intelligence/cultural/cultural-transformation-intelligence";
import { CulturalForecastEngine } from "@/lib/platform/intelligence/cultural/cultural-forecast-engine";
import { CulturalScenarioEngine } from "@/lib/platform/intelligence/cultural/cultural-scenario-engine";
import { CulturalTrendEngine } from "@/lib/platform/intelligence/cultural/cultural-trend-engine";
import { CulturalAnalysisEngine } from "@/lib/platform/intelligence/cultural/cultural-analysis-engine";
import { CultureMappingEngine } from "@/lib/platform/intelligence/cultural/culture-mapping-engine";
import { EngagementEngine } from "@/lib/platform/intelligence/cultural/engagement-engine";
import { MissionAlignmentEngine } from "@/lib/platform/intelligence/cultural/mission-alignment-engine";
import { ValuesAlignmentEngine } from "@/lib/platform/intelligence/cultural/values-alignment-engine";
import { CollaborationEngine } from "@/lib/platform/intelligence/cultural/collaboration-engine";
import { EarlyWarningEngine } from "@/lib/platform/intelligence/cultural/early-warning-engine";
import { CulturalKnowledgeContributionEngine } from "@/lib/platform/intelligence/cultural/knowledge-contribution";
import { ClosedLearningLoop } from "@/lib/platform/intelligence/cultural/closed-learning-loop";
import { CulturalReasoner } from "@/lib/platform/intelligence/cultural/cultural-reasoner";
import {
  CulturalIntelligence, CulturalRecommendationComposer, composeDashboard, composeHealth,
  composeRisksOpportunities, culturalLens,
} from "@/lib/platform/intelligence/cultural/cultural-intelligence";
import { CulturalProjection } from "@/lib/platform/intelligence/cultural/projection";
import { CulturalRepositoryStore } from "@/lib/platform/intelligence/cultural/repository";
import { CulturalRegistryStore } from "@/lib/platform/intelligence/cultural/cultural-registry";
import { CulturalQueries } from "@/lib/platform/intelligence/cultural/projection";

export class CulturalIntelligenceEngineImpl implements Contract {
  readonly repository; readonly registry; readonly queries;
  private now; private createId; private areas; private forecasts; private scenarios; private trends; private analysis;
  private cultureMapping; private engagement; private missionAlignment; private valuesAlignment; private collaboration; private earlyWarning; private reasoner;

  constructor(d: CulturalDependencies = {}) {
    this.now = d.now ?? (() => new Date());
    this.createId = d.createId ?? defaultCreateId;
    this.repository = d.repository ?? new CulturalRepositoryStore();
    this.registry = d.registry ?? new CulturalRegistryStore();
    this.queries = new CulturalQueries();
    this.areas = {
      organizational_culture: new OrganizationalCultureIntelligence(),
      team_culture: new TeamCultureIntelligence(),
      leadership_culture: new LeadershipCultureIntelligence(),
      mission_alignment: new MissionAlignmentIntelligence(),
      values_alignment: new ValuesAlignmentIntelligence(),
      employee_engagement: new EmployeeEngagementIntelligence(),
      collaboration_culture: new CollaborationCultureIntelligence(),
      communication_culture: new CommunicationCultureIntelligence(),
      innovation_culture: new InnovationCultureIntelligence(),
      learning_culture: new LearningCultureIntelligence(),
      psychological_safety: new PsychologicalSafetyIntelligence(),
      inclusion_belonging: new InclusionBelongingIntelligence(),
      cross_cultural: new CrossCulturalIntelligence(),
      community_culture: new CommunityCultureIntelligence(),
      cultural_risk: new CulturalRiskIntelligence(),
      cultural_opportunity: new CulturalOpportunityIntelligence(),
      cultural_transformation: new CulturalTransformationIntelligence(),
      ...d.areaIntelligence,
    };
    this.forecasts = d.forecastEngine ?? new CulturalForecastEngine();
    this.scenarios = d.scenarioEngine ?? new CulturalScenarioEngine();
    this.trends = d.trendEngine ?? new CulturalTrendEngine();
    this.analysis = d.analysisEngine ?? new CulturalAnalysisEngine();
    this.cultureMapping = d.cultureMappingEngine ?? new CultureMappingEngine();
    this.engagement = d.engagementEngine ?? new EngagementEngine();
    this.missionAlignment = d.missionAlignmentEngine ?? new MissionAlignmentEngine();
    this.valuesAlignment = d.valuesAlignmentEngine ?? new ValuesAlignmentEngine();
    this.collaboration = d.collaborationEngine ?? new CollaborationEngine();
    this.earlyWarning = d.earlyWarningEngine ?? new EarlyWarningEngine();
    this.reasoner = d.reasoner ?? new CulturalReasoner();
  }

  build(request: CulturalRequest): CulturalResult {
    const now = this.now();
    const baseline = deriveCulturalBaseline(request);
    const createId = this.createId;
    const scope = request.scope ?? emptyCulturalScope();
    const areaSuites = Object.fromEntries(
      CULTURAL_AREAS.map(area => [area, this.areas[area]!.assess({ baseline, now, createId })])
    ) as Record<CulturalArea, CulturalAreaSuite>;

    const trendSuite = this.trends.assess({ baseline, areas: areaSuites, now, createId });
    const forecastSuite = this.forecasts.assess({ baseline, areas: areaSuites, now, createId });
    const scenarioSuite = this.scenarios.assess({ baseline, areas: areaSuites, forecasts: forecastSuite, now, createId });
    const analysisSuite = this.analysis.assess({ baseline, areas: areaSuites, forecasts: forecastSuite, scenarios: scenarioSuite, now, createId });
    const cultureMappingSuite = this.cultureMapping.assess({ baseline, areas: areaSuites, now, createId });
    const engagementSuite = this.engagement.assess({ baseline, areas: areaSuites, now, createId });
    const missionAlignmentSuite = this.missionAlignment.assess({ baseline, areas: areaSuites, now, createId });
    const valuesAlignmentSuite = this.valuesAlignment.assess({ baseline, areas: areaSuites, now, createId });
    const collaborationSuite = this.collaboration.assess({ baseline, areas: areaSuites, now, createId });
    const earlyWarningSuite = this.earlyWarning.assess({ baseline, trends: trendSuite, scenarios: scenarioSuite, now, createId });
    const knowledgeContribution = new CulturalKnowledgeContributionEngine().contribute({ forecasts: forecastSuite, scenarios: scenarioSuite, now, createId });
    const confidence = buildConfidence([
      { key: "evidence", label: "Evidence coverage", contribution: baseline.evidenceCoverage / 100 },
      { key: "forecast", label: "Forecast maturity", contribution: forecastSuite.maturityScore / 100 },
      { key: "scenario", label: "Scenario maturity", contribution: baseline.scenarioMaturity / 100 },
    ]);
    const reasoning = this.reasoner.reason({ request, trends: trendSuite, forecasts: forecastSuite, scenarios: scenarioSuite, confidence });
    const intelligence = new CulturalIntelligence();
    const scores = intelligence.composeScores({
      baseline,
      areas: areaSuites,
      forecast: forecastSuite.maturityScore,
      scenario: baseline.scenarioMaturity,
      analysis: analysisSuite.maturityScore,
      earlyWarning: earlyWarningSuite.score,
      cultureMapping: cultureMappingSuite.score,
      engagement: engagementSuite.score,
      missionAlignment: missionAlignmentSuite.score,
      valuesAlignment: valuesAlignmentSuite.score,
    });
    const { risks, opportunities } = composeRisksOpportunities(areaSuites, createId);
    const recommendations = new CulturalRecommendationComposer(createId).compose(areaSuites, analysisSuite, scenarioSuite, now);
    const health = composeHealth(scores, baseline, forecastSuite);
    const dashboard = composeDashboard(now, health, baseline, risks, opportunities);
    const commonLens = culturalLens("organization", health.overallScore);

    const organizationalCultureDashboard = {
      generatedAt: now.toISOString(),
      headline: \`Culture index \${Math.round(cultureMappingSuite.cultureIndex)}\`,
      score: cultureMappingSuite.score,
      cultureIndex: cultureMappingSuite.cultureIndex,
      signals: cultureMappingSuite.records.slice(0, 4).map(r => r.title),
      narrative: cultureMappingSuite.narrative,
    };
    const missionValuesDashboard = {
      generatedAt: now.toISOString(),
      headline: \`Mission \${Math.round(baseline.missionAlignment)} / Values \${Math.round(baseline.valuesAlignment)}\`,
      score: (missionAlignmentSuite.score + valuesAlignmentSuite.score) / 2,
      missionAlignment: baseline.missionAlignment,
      valuesAlignment: baseline.valuesAlignment,
      signals: [...missionAlignmentSuite.records, ...valuesAlignmentSuite.records].slice(0, 4).map(r => r.title),
      narrative: \`\${missionAlignmentSuite.narrative} \${valuesAlignmentSuite.narrative}\`,
    };
    const employeeEngagementDashboard = {
      generatedAt: now.toISOString(),
      headline: \`Engagement \${Math.round(baseline.engagement)}\`,
      score: engagementSuite.score,
      engagement: baseline.engagement,
      signals: engagementSuite.records.map(r => r.narrative),
      narrative: engagementSuite.narrative,
    };
    const collaborationDashboard = {
      generatedAt: now.toISOString(),
      headline: \`Collaboration index \${Math.round(collaborationSuite.collaborationIndex)}\`,
      score: collaborationSuite.score,
      collaborationIndex: collaborationSuite.collaborationIndex,
      signals: collaborationSuite.records.map(r => r.narrative),
      narrative: collaborationSuite.narrative,
    };
    const innovationCultureDashboard = {
      generatedAt: now.toISOString(),
      headline: \`Innovation readiness \${Math.round(baseline.innovationReadiness)}\`,
      score: areaSuites.innovation_culture.score,
      innovationReadiness: baseline.innovationReadiness,
      signals: areaSuites.innovation_culture.records.map(r => r.signal),
      narrative: areaSuites.innovation_culture.narrative,
    };
    const culturalTransformationDashboard = {
      generatedAt: now.toISOString(),
      headline: \`Transformation score \${Math.round(areaSuites.cultural_transformation.score)}\`,
      score: areaSuites.cultural_transformation.score,
      transformationScore: areaSuites.cultural_transformation.score,
      signals: areaSuites.cultural_transformation.records.map(r => r.signal),
      narrative: areaSuites.cultural_transformation.narrative,
    };
    const forecastDashboard = {
      generatedAt: now.toISOString(),
      headline: \`Cultural Forecast: \${forecastSuite.outlook}\`,
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
      missionScore: missionAlignmentSuite.score,
      engagementScore: engagementSuite.score,
      valuesScore: valuesAlignmentSuite.score,
      recommendations: recommendations.map(r => r.title),
      lenses: commonLens,
      narrative: "Board assurance on mission, values, engagement, and long-term cultural outlook.",
    };
    const closedLearningLoop = new ClosedLearningLoop().contribute({ trends: trendSuite, scenarios: scenarioSuite, recommendations, now, createId });
    const projection = new CulturalProjection().project({
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
      id: createId("cul-history"),
      requestId: request.requestId,
      scope,
      status: "assessed" as const,
      healthScore: health.overallScore,
      generatedAt: now.toISOString(),
      summary: brief.headline,
      metadata: request.metadata ?? {},
    };

    const result: CulturalResult = {
      requestId: request.requestId,
      version: CULTURAL_INTELLIGENCE_VERSION,
      generatedAt: now.toISOString(),
      periodLabel: request.periodLabel ?? defaultPeriodLabel(now),
      scope,
      baseline,
      healthScore: scores.healthScore,
      organizationalCultureScore: scores.areaScores.organizational_culture,
      teamCultureScore: scores.areaScores.team_culture,
      leadershipCultureScore: scores.areaScores.leadership_culture,
      missionAlignmentScore: scores.areaScores.mission_alignment,
      valuesAlignmentScore: scores.areaScores.values_alignment,
      employeeEngagementScore: scores.areaScores.employee_engagement,
      collaborationCultureScore: scores.areaScores.collaboration_culture,
      communicationCultureScore: scores.areaScores.communication_culture,
      innovationCultureScore: scores.areaScores.innovation_culture,
      learningCultureScore: scores.areaScores.learning_culture,
      psychologicalSafetyScore: scores.areaScores.psychological_safety,
      inclusionBelongingScore: scores.areaScores.inclusion_belonging,
      crossCulturalScore: scores.areaScores.cross_cultural,
      communityCultureScore: scores.areaScores.community_culture,
      culturalRiskScore: scores.areaScores.cultural_risk,
      culturalOpportunityScore: scores.areaScores.cultural_opportunity,
      culturalTransformationScore: scores.areaScores.cultural_transformation,
      forecastScore: scores.forecastScore,
      scenarioScore: scores.scenarioScore,
      analysisScore: scores.analysisScore,
      earlyWarningScore: scores.earlyWarningScore,
      cultureMappingScore: scores.cultureMappingScore,
      engagementScore: scores.engagementScore,
      health,
      dashboard,
      organizationalCultureDashboard,
      missionValuesDashboard,
      employeeEngagementDashboard,
      collaborationDashboard,
      innovationCultureDashboard,
      culturalTransformationDashboard,
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
      cultureMappingSuite,
      engagementSuite,
      missionAlignmentSuite,
      valuesAlignmentSuite,
      collaborationSuite,
      earlyWarningSuite,
      knowledgeContribution,
      closedLearningLoop,
      reasoning,
      projection,
      historyRecord,
      confidence,
      requestMetadata: { ...(request.metadata ?? {}), registryPublishers: this.registry.list().length },
    };

    this.registry.register("cultural", "cultural_intelligence");
    this.repository.save(result);
    this.repository.saveHistory(historyRecord);
    return result;
  }
}

export {
  CulturalIntelligenceEngineImpl as CulturalIntelligenceEngine,
  CulturalIntelligenceEngineImpl as CulturalEngine,
  CulturalIntelligenceEngineImpl as CulturalEngineImpl,
};
`);

w("projection.ts", `import { buildConfidence } from "@/lib/platform/intelligence/cultural/models";
import type { CulturalProjectionResult, CulturalQueryRequest, CulturalQueryResult, CulturalResult } from "@/lib/platform/intelligence/cultural/types";

export class CulturalProjection {
  project(input: Omit<CulturalProjectionResult, "forecast">): CulturalProjectionResult {
    return { ...input, forecast: Math.min(100, input.healthScore + (input.outlook === "cohesive" ? 6 : input.outlook === "fragmented" ? -4 : 2)) };
  }
}

export class CulturalQueries {
  ask(result: CulturalResult, request: CulturalQueryRequest): CulturalQueryResult {
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
    else if (focus === "recommendations") { answer = \`\${result.recommendations.length} cultural recommendations.\`; }
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
`);

w("repository.ts", `import type { CulturalRepository } from "@/lib/platform/intelligence/cultural/contracts";
import type { CulturalHistoryRecord, CulturalResult, GraphScope } from "@/lib/platform/intelligence/cultural/types";

export class CulturalRepositoryStore implements CulturalRepository {
  private results = new Map<string, CulturalResult>();
  private history: CulturalHistoryRecord[] = [];

  save(result: CulturalResult): CulturalResult {
    this.results.set(result.requestId, result);
    return result;
  }
  get(requestId: string): CulturalResult | null {
    return this.results.get(requestId) ?? null;
  }
  list(scope?: Partial<GraphScope>): CulturalResult[] {
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
  saveHistory(record: CulturalHistoryRecord): CulturalHistoryRecord {
    this.history.push(record);
    return record;
  }
  listHistory(scope?: Partial<GraphScope>): CulturalHistoryRecord[] {
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

w("cultural-registry.ts", `import type { CulturalRegistry } from "@/lib/platform/intelligence/cultural/contracts";
import type { CulturalPublisher } from "@/lib/platform/intelligence/cultural/types";

export class CulturalRegistryStore implements CulturalRegistry {
  private publishers: CulturalPublisher[] = [];

  register(domain: string, capability: string): void {
    if (!this.publishers.some(p => p.domain === domain && p.capability === capability)) {
      this.publishers.push({ domain, capability });
    }
  }
  list(): CulturalPublisher[] {
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

w("service.ts", `import type { CulturalDependencies, CulturalIntelligenceService as Contract, CulturalRepository as Repository } from "@/lib/platform/intelligence/cultural/contracts";
import { CulturalIntelligenceEngineImpl } from "@/lib/platform/intelligence/cultural/cultural-engine";
import type { CulturalQueryRequest, CulturalQueryResult, CulturalRequest, CulturalResult } from "@/lib/platform/intelligence/cultural/types";

export interface CulturalServiceDependencies extends CulturalDependencies {}

export class CulturalIntelligenceServiceImpl implements Contract {
  private engine: CulturalIntelligenceEngineImpl;
  constructor(d: CulturalServiceDependencies = {}) {
    this.engine = (d.engine as CulturalIntelligenceEngineImpl | undefined) ?? new CulturalIntelligenceEngineImpl(d);
  }
  build(request: CulturalRequest): CulturalResult { return this.engine.build(request); }
  query(result: CulturalResult, request: CulturalQueryRequest): CulturalQueryResult { return this.engine.queries.ask(result, request); }
  repository(): Repository { return this.engine.repository; }
}

export {
  CulturalIntelligenceServiceImpl as CulturalIntelligenceService,
  CulturalIntelligenceServiceImpl as CulturalService,
  CulturalIntelligenceServiceImpl as CulturalServiceImpl,
};
`);

w("index.ts", `export * from "@/lib/platform/intelligence/cultural/types";
export type {
  CulturalDependencies,
  CulturalAreaIntelligence as CulturalAreaIntelligenceContract,
  CulturalForecastEngineContract,
  CulturalScenarioEngineContract,
  CulturalTrendEngineContract,
  CulturalAnalysisEngineContract,
  CultureMappingEngineContract,
  EngagementEngineContract,
  MissionAlignmentEngineContract,
  ValuesAlignmentEngineContract,
  CollaborationEngineContract,
  EarlyWarningEngineContract,
  CulturalReasonerContract,
  CulturalRegistry as CulturalRegistryContract,
  CulturalRepository as CulturalRepositoryContract,
  CulturalEngine as CulturalEngineContract,
  CulturalIntelligenceEngine as CulturalIntelligenceEngineContract,
  CulturalIntelligenceService as CulturalIntelligenceServiceContract,
  CulturalService as CulturalServiceContract,
} from "@/lib/platform/intelligence/cultural/contracts";
export * from "@/lib/platform/intelligence/cultural/models";
export * from "@/lib/platform/intelligence/cultural/area-factory";
export * from "@/lib/platform/intelligence/cultural/organizational-culture-intelligence";
export * from "@/lib/platform/intelligence/cultural/team-culture-intelligence";
export * from "@/lib/platform/intelligence/cultural/leadership-culture-intelligence";
export * from "@/lib/platform/intelligence/cultural/mission-alignment-intelligence";
export * from "@/lib/platform/intelligence/cultural/values-alignment-intelligence";
export * from "@/lib/platform/intelligence/cultural/employee-engagement-intelligence";
export * from "@/lib/platform/intelligence/cultural/collaboration-culture-intelligence";
export * from "@/lib/platform/intelligence/cultural/communication-culture-intelligence";
export * from "@/lib/platform/intelligence/cultural/innovation-culture-intelligence";
export * from "@/lib/platform/intelligence/cultural/learning-culture-intelligence";
export * from "@/lib/platform/intelligence/cultural/psychological-safety-intelligence";
export * from "@/lib/platform/intelligence/cultural/inclusion-belonging-intelligence";
export * from "@/lib/platform/intelligence/cultural/cross-cultural-intelligence";
export * from "@/lib/platform/intelligence/cultural/community-culture-intelligence";
export * from "@/lib/platform/intelligence/cultural/cultural-risk-intelligence";
export * from "@/lib/platform/intelligence/cultural/cultural-opportunity-intelligence";
export * from "@/lib/platform/intelligence/cultural/cultural-transformation-intelligence";
export * from "@/lib/platform/intelligence/cultural/cultural-forecast-engine";
export * from "@/lib/platform/intelligence/cultural/cultural-scenario-engine";
export * from "@/lib/platform/intelligence/cultural/cultural-trend-engine";
export * from "@/lib/platform/intelligence/cultural/cultural-analysis-engine";
export * from "@/lib/platform/intelligence/cultural/culture-mapping-engine";
export * from "@/lib/platform/intelligence/cultural/engagement-engine";
export * from "@/lib/platform/intelligence/cultural/mission-alignment-engine";
export * from "@/lib/platform/intelligence/cultural/values-alignment-engine";
export * from "@/lib/platform/intelligence/cultural/collaboration-engine";
export * from "@/lib/platform/intelligence/cultural/early-warning-engine";
export * from "@/lib/platform/intelligence/cultural/knowledge-contribution";
export * from "@/lib/platform/intelligence/cultural/closed-learning-loop";
export * from "@/lib/platform/intelligence/cultural/cultural-reasoner";
export * from "@/lib/platform/intelligence/cultural/cultural-intelligence";
export * from "@/lib/platform/intelligence/cultural/projection";
export * from "@/lib/platform/intelligence/cultural/cultural-registry";
export * from "@/lib/platform/intelligence/cultural/repository";
export * from "@/lib/platform/intelligence/cultural/cultural-engine";
export * from "@/lib/platform/intelligence/cultural/service";

import type { CulturalDependencies } from "@/lib/platform/intelligence/cultural/contracts";
import { CulturalIntelligenceEngine } from "@/lib/platform/intelligence/cultural/cultural-engine";
import { CulturalIntelligenceService } from "@/lib/platform/intelligence/cultural/service";
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

export interface CulturalStack {
  service: CulturalIntelligenceService;
  engine: CulturalIntelligenceEngine;
  organizationDna: OrganizationDnaStack | null;
  oios: OiosStack | null;
}

export interface CreateCulturalOptions extends CulturalDependencies {
  organizationDna?: OrganizationDnaStack;
  organizationDnaOptions?: CreateOrganizationDnaOptions;
  wireOrganizationDna?: boolean;
  oios?: OiosStack;
  oiosOptions?: CreateOiosOptions;
  wireOios?: boolean;
}

export function createCulturalIntelligence(options: CreateCulturalOptions = {}): CulturalStack {
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
  const engine = new CulturalIntelligenceEngine(options);
  const service = new CulturalIntelligenceService({ ...options, engine });
  return { service, engine, organizationDna, oios };
}
`);

w("README.md", `# Cultural Intelligence (Sprint 053)

**Version:** 0.1.0 | **Domain key:** \`cultural\` | **ID prefix:** \`cul-\`

Seventeen-area organizational cultural assessment for JAG. Continuously understand mission, values, engagement, psychological safety, collaboration, and cultural transformation - composing onto Behavioral (052) without regenerating that package.

## Areas (17)

organizational_culture, team_culture, leadership_culture, mission_alignment, values_alignment, employee_engagement, collaboration_culture, communication_culture, innovation_culture, learning_culture, psychological_safety, inclusion_belonging, cross_cultural, community_culture, cultural_risk, cultural_opportunity, cultural_transformation

## Entry point

\`\`\`ts
import { createCulturalIntelligence } from "@/lib/platform/intelligence/cultural";

const { service } = createCulturalIntelligence({ wireOrganizationDna: false, wireOios: false });
const result = service.build({ requestId: "cul-1", scope: { organizationId: "org-1", schoolId: "school-1" } });
\`\`\`

## Lens (8 fields)

missionAlignment · valuesAlignment · culturalHealth · collaborationQuality · innovationReadiness · psychologicalSafety · engagement · longTermCulturalOutlook

## Hard DAG

\`["behavioral"]\` - terminal platform module after Behavioral Intelligence.

## Layer

Internal-facing cultural intelligence after Internal behavioral - how mission, values, and shared norms sustain collaboration and long-term health.
`);

w("ARCHITECTURE.md", `# Cultural Intelligence Architecture (Sprint 053)

## Placement

Internal-facing domain after Behavioral (052). Hard DAG dependency: \`["behavioral"]\`. Soft-reads Behavioral, Stakeholder, Human Capital, Executive Decision, Opportunity, Knowledge, and Predictive via leaf light types only.

## Package layout

- \`types.ts\` / \`contracts.ts\` / \`models.ts\` - leaf-safe contracts and baseline derivation
- \`area-factory.ts\` + 17 \`*-intelligence.ts\` area assessors
- Specialized engines: CultureMapping, Engagement, MissionAlignment, ValuesAlignment, Collaboration, EarlyWarning
- Standard engines: Analysis, Forecast, Trend, Scenario
- Composers in \`cultural-intelligence.ts\`; orchestration in \`cultural-engine.ts\`
- \`createCulturalIntelligence\` factory in \`index.ts\`

## Soft integrations

No circular imports. \`CulturalRequest\` accepts \`BehavioralResultLight\` and peer light types only.

## Closed learning

Destinations: behavioral, stakeholder, human-capital, opportunity, knowledge, executive-decision, predictive.
`);

w("VERIFICATION.md", `# Cultural Intelligence Verification (Sprint 053)

## Checks

1. \`npx tsc --noEmit\`
2. \`npx vitest run tests/unit/intelligence/cultural.test.ts\`
3. Pipeline order ends with \`behavioral\`, \`cultural\`
4. OIOS registry marks \`cultural\` active with deps \`["organization-dna", "behavioral"]\`

## Expected

- 17 area suites, 12 analysis kinds, 10 scenarios
- CulturalLens eight fields on recommendations
- Closed learning destinations length 7 including behavioral and knowledge
`);

w("CHANGELOG.md", `# Cultural Intelligence Changelog

## 0.1.0 - Sprint 053

- Initial Cultural Intelligence domain package
- Seventeen cultural areas with specialized mapping, engagement, mission, values, and collaboration engines
- Terminal platform module after Behavioral Intelligence
`);

console.log("Part 3 complete. File count:", fs.readdirSync(DEST).length);
