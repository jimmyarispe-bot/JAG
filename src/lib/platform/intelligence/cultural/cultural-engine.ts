import type { CulturalDependencies, CulturalEngine as Contract } from "@/lib/platform/intelligence/cultural/contracts";
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
      headline: `Culture index ${Math.round(cultureMappingSuite.cultureIndex)}`,
      score: cultureMappingSuite.score,
      cultureIndex: cultureMappingSuite.cultureIndex,
      signals: cultureMappingSuite.records.slice(0, 4).map(r => r.title),
      narrative: cultureMappingSuite.narrative,
    };
    const missionValuesDashboard = {
      generatedAt: now.toISOString(),
      headline: `Mission ${Math.round(baseline.missionAlignment)} / Values ${Math.round(baseline.valuesAlignment)}`,
      score: (missionAlignmentSuite.score + valuesAlignmentSuite.score) / 2,
      missionAlignment: baseline.missionAlignment,
      valuesAlignment: baseline.valuesAlignment,
      signals: [...missionAlignmentSuite.records, ...valuesAlignmentSuite.records].slice(0, 4).map(r => r.title),
      narrative: `${missionAlignmentSuite.narrative} ${valuesAlignmentSuite.narrative}`,
    };
    const employeeEngagementDashboard = {
      generatedAt: now.toISOString(),
      headline: `Engagement ${Math.round(baseline.engagement)}`,
      score: engagementSuite.score,
      engagement: baseline.engagement,
      signals: engagementSuite.records.map(r => r.narrative),
      narrative: engagementSuite.narrative,
    };
    const collaborationDashboard = {
      generatedAt: now.toISOString(),
      headline: `Collaboration index ${Math.round(collaborationSuite.collaborationIndex)}`,
      score: collaborationSuite.score,
      collaborationIndex: collaborationSuite.collaborationIndex,
      signals: collaborationSuite.records.map(r => r.narrative),
      narrative: collaborationSuite.narrative,
    };
    const innovationCultureDashboard = {
      generatedAt: now.toISOString(),
      headline: `Innovation readiness ${Math.round(baseline.innovationReadiness)}`,
      score: areaSuites.innovation_culture.score,
      innovationReadiness: baseline.innovationReadiness,
      signals: areaSuites.innovation_culture.records.map(r => r.signal),
      narrative: areaSuites.innovation_culture.narrative,
    };
    const culturalTransformationDashboard = {
      generatedAt: now.toISOString(),
      headline: `Transformation score ${Math.round(areaSuites.cultural_transformation.score)}`,
      score: areaSuites.cultural_transformation.score,
      transformationScore: areaSuites.cultural_transformation.score,
      signals: areaSuites.cultural_transformation.records.map(r => r.signal),
      narrative: areaSuites.cultural_transformation.narrative,
    };
    const forecastDashboard = {
      generatedAt: now.toISOString(),
      headline: `Cultural Forecast: ${forecastSuite.outlook}`,
      score: forecastSuite.maturityScore,
      outlook: forecastSuite.outlook,
      signals: forecastSuite.forecasts.slice(0, 4).map(f => f.narrative),
      narrative: forecastSuite.narrative,
    };
    const brief = {
      generatedAt: now.toISOString(),
      headline: dashboard.headline,
      summary: `${forecastSuite.narrative} ${scenarioSuite.narrative}`,
      healthScore: health.overallScore,
      outlook: forecastSuite.outlook,
      topRecommendations: recommendations.map(r => r.title),
      topRisks: risks.map(r => r.title),
      lenses: commonLens,
      narrative: dashboard.narrative,
    };
    const boardReport = {
      generatedAt: now.toISOString(),
      headline: `Board Report: ${dashboard.headline}`,
      assuranceSummary: `Evidence coverage ${Math.round(baseline.evidenceCoverage)}; primary scenario ${scenarioSuite.primaryScenario.replaceAll("_", " ")}.`,
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
