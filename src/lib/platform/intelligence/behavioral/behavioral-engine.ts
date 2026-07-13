import type { BehavioralDependencies, BehavioralEngine as Contract } from "@/lib/platform/intelligence/behavioral/contracts";
import { defaultCreateId, defaultPeriodLabel, deriveBehavioralBaseline, emptyBehavioralScope, buildConfidence } from "@/lib/platform/intelligence/behavioral/models";
import { BEHAVIORAL_AREAS, BEHAVIORAL_INTELLIGENCE_VERSION, type BehavioralArea, type BehavioralAreaSuite, type BehavioralRequest, type BehavioralResult } from "@/lib/platform/intelligence/behavioral/types";
import { DecisionBehaviorIntelligence } from "@/lib/platform/intelligence/behavioral/decision-behavior-intelligence";
import { CognitiveBiasIntelligence } from "@/lib/platform/intelligence/behavioral/cognitive-bias-intelligence";
import { MotivationIntelligence } from "@/lib/platform/intelligence/behavioral/motivation-intelligence";
import { IncentiveModelingIntelligence } from "@/lib/platform/intelligence/behavioral/incentive-modeling-intelligence";
import { OrganizationalChangeIntelligence } from "@/lib/platform/intelligence/behavioral/organizational-change-intelligence";
import { ChangeResistanceIntelligence } from "@/lib/platform/intelligence/behavioral/change-resistance-intelligence";
import { LeadershipBehaviorIntelligence } from "@/lib/platform/intelligence/behavioral/leadership-behavior-intelligence";
import { TeamDynamicsIntelligence } from "@/lib/platform/intelligence/behavioral/team-dynamics-intelligence";
import { CollaborationIntelligence } from "@/lib/platform/intelligence/behavioral/collaboration-intelligence";
import { CommunicationPatternsIntelligence } from "@/lib/platform/intelligence/behavioral/communication-patterns-intelligence";
import { ConflictBehaviorIntelligence } from "@/lib/platform/intelligence/behavioral/conflict-behavior-intelligence";
import { CustomerBehaviorIntelligence } from "@/lib/platform/intelligence/behavioral/customer-behavior-intelligence";
import { EmployeeBehaviorIntelligence } from "@/lib/platform/intelligence/behavioral/employee-behavior-intelligence";
import { LearningAdaptationIntelligence } from "@/lib/platform/intelligence/behavioral/learning-adaptation-intelligence";
import { AdoptionForecastingIntelligence } from "@/lib/platform/intelligence/behavioral/adoption-forecasting-intelligence";
import { BehavioralRiskIntelligence } from "@/lib/platform/intelligence/behavioral/behavioral-risk-intelligence";
import { BehavioralOpportunityIntelligence } from "@/lib/platform/intelligence/behavioral/behavioral-opportunity-intelligence";
import { BehavioralForecastEngine } from "@/lib/platform/intelligence/behavioral/behavioral-forecast-engine";
import { BehavioralScenarioEngine } from "@/lib/platform/intelligence/behavioral/behavioral-scenario-engine";
import { BehavioralTrendEngine } from "@/lib/platform/intelligence/behavioral/behavioral-trend-engine";
import { BehavioralAnalysisEngine } from "@/lib/platform/intelligence/behavioral/behavioral-analysis-engine";
import { DecisionModelingEngine } from "@/lib/platform/intelligence/behavioral/decision-modeling-engine";
import { CognitiveBiasEngine } from "@/lib/platform/intelligence/behavioral/cognitive-bias-engine";
import { MotivationEngine } from "@/lib/platform/intelligence/behavioral/motivation-engine";
import { CollaborationEngine } from "@/lib/platform/intelligence/behavioral/collaboration-engine";
import { ChangeAdoptionEngine } from "@/lib/platform/intelligence/behavioral/change-adoption-engine";
import { EarlyWarningEngine } from "@/lib/platform/intelligence/behavioral/early-warning-engine";
import { BehavioralKnowledgeContributionEngine } from "@/lib/platform/intelligence/behavioral/knowledge-contribution";
import { ClosedLearningLoop } from "@/lib/platform/intelligence/behavioral/closed-learning-loop";
import { BehavioralReasoner } from "@/lib/platform/intelligence/behavioral/behavioral-reasoner";
import {
  BehavioralIntelligence, BehavioralRecommendationComposer, composeDashboard, composeHealth,
  composeRisksOpportunities, behavioralLens,
} from "@/lib/platform/intelligence/behavioral/behavioral-intelligence";
import { BehavioralProjection } from "@/lib/platform/intelligence/behavioral/projection";
import { BehavioralRepositoryStore } from "@/lib/platform/intelligence/behavioral/repository";
import { BehavioralRegistryStore } from "@/lib/platform/intelligence/behavioral/behavioral-registry";
import { BehavioralQueries } from "@/lib/platform/intelligence/behavioral/projection";

export class BehavioralIntelligenceEngineImpl implements Contract {
  readonly repository; readonly registry; readonly queries;
  private now; private createId; private areas; private forecasts; private scenarios; private trends; private analysis;
  private decisionModeling; private cognitiveBias; private motivation; private collaboration; private changeAdoption; private earlyWarning; private reasoner;

  constructor(d: BehavioralDependencies = {}) {
    this.now = d.now ?? (() => new Date());
    this.createId = d.createId ?? defaultCreateId;
    this.repository = d.repository ?? new BehavioralRepositoryStore();
    this.registry = d.registry ?? new BehavioralRegistryStore();
    this.queries = new BehavioralQueries();
    this.areas = {
      decision_behavior: new DecisionBehaviorIntelligence(),
      cognitive_bias: new CognitiveBiasIntelligence(),
      motivation: new MotivationIntelligence(),
      incentive_modeling: new IncentiveModelingIntelligence(),
      organizational_change: new OrganizationalChangeIntelligence(),
      change_resistance: new ChangeResistanceIntelligence(),
      leadership_behavior: new LeadershipBehaviorIntelligence(),
      team_dynamics: new TeamDynamicsIntelligence(),
      collaboration: new CollaborationIntelligence(),
      communication_patterns: new CommunicationPatternsIntelligence(),
      conflict_behavior: new ConflictBehaviorIntelligence(),
      customer_behavior: new CustomerBehaviorIntelligence(),
      employee_behavior: new EmployeeBehaviorIntelligence(),
      learning_adaptation: new LearningAdaptationIntelligence(),
      adoption_forecasting: new AdoptionForecastingIntelligence(),
      behavioral_risk: new BehavioralRiskIntelligence(),
      behavioral_opportunity: new BehavioralOpportunityIntelligence(),
      ...d.areaIntelligence,
    };
    this.forecasts = d.forecastEngine ?? new BehavioralForecastEngine();
    this.scenarios = d.scenarioEngine ?? new BehavioralScenarioEngine();
    this.trends = d.trendEngine ?? new BehavioralTrendEngine();
    this.analysis = d.analysisEngine ?? new BehavioralAnalysisEngine();
    this.decisionModeling = d.decisionModelingEngine ?? new DecisionModelingEngine();
    this.cognitiveBias = d.cognitiveBiasEngine ?? new CognitiveBiasEngine();
    this.motivation = d.motivationEngine ?? new MotivationEngine();
    this.collaboration = d.collaborationEngine ?? new CollaborationEngine();
    this.changeAdoption = d.changeAdoptionEngine ?? new ChangeAdoptionEngine();
    this.earlyWarning = d.earlyWarningEngine ?? new EarlyWarningEngine();
    this.reasoner = d.reasoner ?? new BehavioralReasoner();
  }

  build(request: BehavioralRequest): BehavioralResult {
    const now = this.now();
    const baseline = deriveBehavioralBaseline(request);
    const createId = this.createId;
    const scope = request.scope ?? emptyBehavioralScope();
    const areaSuites = Object.fromEntries(
      BEHAVIORAL_AREAS.map(area => [area, this.areas[area]!.assess({ baseline, now, createId })])
    ) as Record<BehavioralArea, BehavioralAreaSuite>;

    const trendSuite = this.trends.assess({ baseline, areas: areaSuites, now, createId });
    const forecastSuite = this.forecasts.assess({ baseline, areas: areaSuites, now, createId });
    const scenarioSuite = this.scenarios.assess({ baseline, areas: areaSuites, forecasts: forecastSuite, now, createId });
    const analysisSuite = this.analysis.assess({ baseline, areas: areaSuites, forecasts: forecastSuite, scenarios: scenarioSuite, now, createId });
    const decisionModelingSuite = this.decisionModeling.assess({ baseline, areas: areaSuites, now, createId });
    const cognitiveBiasSuite = this.cognitiveBias.assess({ baseline, areas: areaSuites, now, createId });
    const motivationSuite = this.motivation.assess({ baseline, areas: areaSuites, now, createId });
    const collaborationSuite = this.collaboration.assess({ baseline, areas: areaSuites, now, createId });
    const changeAdoptionSuite = this.changeAdoption.assess({ baseline, areas: areaSuites, now, createId });
    const earlyWarningSuite = this.earlyWarning.assess({ baseline, trends: trendSuite, scenarios: scenarioSuite, now, createId });
    const knowledgeContribution = new BehavioralKnowledgeContributionEngine().contribute({ forecasts: forecastSuite, scenarios: scenarioSuite, now, createId });
    const confidence = buildConfidence([
      { key: "evidence", label: "Evidence coverage", contribution: baseline.evidenceCoverage / 100 },
      { key: "forecast", label: "Forecast maturity", contribution: forecastSuite.maturityScore / 100 },
      { key: "scenario", label: "Scenario maturity", contribution: baseline.scenarioMaturity / 100 },
    ]);
    const reasoning = this.reasoner.reason({ request, trends: trendSuite, forecasts: forecastSuite, scenarios: scenarioSuite, confidence });
    const intelligence = new BehavioralIntelligence();
    const scores = intelligence.composeScores({
      baseline,
      areas: areaSuites,
      forecast: forecastSuite.maturityScore,
      scenario: baseline.scenarioMaturity,
      analysis: analysisSuite.maturityScore,
      earlyWarning: earlyWarningSuite.score,
      decisionModeling: decisionModelingSuite.score,
      motivation: motivationSuite.score,
      collaboration: collaborationSuite.score,
      changeAdoption: changeAdoptionSuite.score,
    });
    const { risks, opportunities } = composeRisksOpportunities(areaSuites, createId);
    const recommendations = new BehavioralRecommendationComposer(createId).compose(areaSuites, analysisSuite, scenarioSuite, now);
    const health = composeHealth(scores, baseline, forecastSuite);
    const dashboard = composeDashboard(now, health, baseline, risks, opportunities);
    const commonLens = behavioralLens("organization", health.overallScore);

    const decisionIntelligenceDashboard = {
      generatedAt: now.toISOString(),
      headline: `Decision index ${Math.round(decisionModelingSuite.decisionIndex)}`,
      score: decisionModelingSuite.score,
      decisionIndex: decisionModelingSuite.decisionIndex,
      signals: decisionModelingSuite.records.slice(0, 4).map(r => r.title),
      narrative: decisionModelingSuite.narrative,
    };
    const organizationalChangeDashboard = {
      generatedAt: now.toISOString(),
      headline: `Change resistance ${Math.round(baseline.changeResistance)}`,
      score: areaSuites.organizational_change.score,
      changeResistance: baseline.changeResistance,
      signals: areaSuites.organizational_change.records.map(r => r.signal),
      narrative: areaSuites.organizational_change.narrative,
    };
    const leadershipDashboard = {
      generatedAt: now.toISOString(),
      headline: `Leadership readiness ${Math.round(baseline.leadershipReadiness)}`,
      score: areaSuites.leadership_behavior.score,
      leadershipReadiness: baseline.leadershipReadiness,
      signals: areaSuites.leadership_behavior.records.map(r => r.signal),
      narrative: areaSuites.leadership_behavior.narrative,
    };
    const teamDynamicsDashboard = {
      generatedAt: now.toISOString(),
      headline: `Team cohesion ${Math.round(baseline.teamCohesion)}`,
      score: areaSuites.team_dynamics.score,
      teamCohesion: baseline.teamCohesion,
      signals: areaSuites.team_dynamics.records.map(r => r.signal),
      narrative: areaSuites.team_dynamics.narrative,
    };
    const collaborationDashboard = {
      generatedAt: now.toISOString(),
      headline: `Collaboration index ${Math.round(collaborationSuite.collaborationIndex)}`,
      score: collaborationSuite.score,
      collaborationIndex: collaborationSuite.collaborationIndex,
      signals: collaborationSuite.records.map(r => r.narrative),
      narrative: collaborationSuite.narrative,
    };
    const adoptionForecastDashboard = {
      generatedAt: now.toISOString(),
      headline: `Adoption probability ${Math.round(baseline.adoptionProbability)}`,
      score: changeAdoptionSuite.score,
      adoptionProbability: baseline.adoptionProbability,
      signals: changeAdoptionSuite.records.map(r => r.narrative),
      narrative: changeAdoptionSuite.narrative,
    };
    const outlookDashboard = {
      generatedAt: now.toISOString(),
      headline: `Behavioral Outlook: ${forecastSuite.outlook}`,
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
      decisionScore: decisionModelingSuite.score,
      motivationScore: motivationSuite.score,
      adoptionScore: changeAdoptionSuite.score,
      recommendations: recommendations.map(r => r.title),
      lenses: commonLens,
      narrative: "Board assurance on decisions, motivation, adoption, and long-term behavioral outlook.",
    };
    const closedLearningLoop = new ClosedLearningLoop().contribute({ trends: trendSuite, scenarios: scenarioSuite, recommendations, now, createId });
    const projection = new BehavioralProjection().project({
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
      id: createId("beh-history"),
      requestId: request.requestId,
      scope,
      status: "assessed" as const,
      healthScore: health.overallScore,
      generatedAt: now.toISOString(),
      summary: brief.headline,
      metadata: request.metadata ?? {},
    };

    const result: BehavioralResult = {
      requestId: request.requestId,
      version: BEHAVIORAL_INTELLIGENCE_VERSION,
      generatedAt: now.toISOString(),
      periodLabel: request.periodLabel ?? defaultPeriodLabel(now),
      scope,
      baseline,
      healthScore: scores.healthScore,
      decisionBehaviorScore: scores.areaScores.decision_behavior,
      cognitiveBiasScore: scores.areaScores.cognitive_bias,
      motivationScore: scores.areaScores.motivation,
      incentiveModelingScore: scores.areaScores.incentive_modeling,
      organizationalChangeScore: scores.areaScores.organizational_change,
      changeResistanceScore: scores.areaScores.change_resistance,
      leadershipBehaviorScore: scores.areaScores.leadership_behavior,
      teamDynamicsScore: scores.areaScores.team_dynamics,
      collaborationScore: scores.areaScores.collaboration,
      communicationPatternsScore: scores.areaScores.communication_patterns,
      conflictBehaviorScore: scores.areaScores.conflict_behavior,
      customerBehaviorScore: scores.areaScores.customer_behavior,
      employeeBehaviorScore: scores.areaScores.employee_behavior,
      learningAdaptationScore: scores.areaScores.learning_adaptation,
      adoptionForecastingScore: scores.areaScores.adoption_forecasting,
      behavioralRiskScore: scores.areaScores.behavioral_risk,
      behavioralOpportunityScore: scores.areaScores.behavioral_opportunity,
      forecastScore: scores.forecastScore,
      scenarioScore: scores.scenarioScore,
      analysisScore: scores.analysisScore,
      earlyWarningScore: scores.earlyWarningScore,
      decisionModelingScore: scores.decisionModelingScore,
      changeAdoptionScore: scores.changeAdoptionScore,
      health,
      dashboard,
      decisionIntelligenceDashboard,
      organizationalChangeDashboard,
      leadershipDashboard,
      teamDynamicsDashboard,
      collaborationDashboard,
      adoptionForecastDashboard,
      outlookDashboard,
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
      decisionModelingSuite,
      cognitiveBiasSuite,
      motivationSuite,
      collaborationSuite,
      changeAdoptionSuite,
      earlyWarningSuite,
      knowledgeContribution,
      closedLearningLoop,
      reasoning,
      projection,
      historyRecord,
      confidence,
      requestMetadata: { ...(request.metadata ?? {}), registryPublishers: this.registry.list().length },
    };

    this.registry.register("behavioral", "behavioral_intelligence");
    this.repository.save(result);
    this.repository.saveHistory(historyRecord);
    return result;
  }
}

export {
  BehavioralIntelligenceEngineImpl as BehavioralIntelligenceEngine,
  BehavioralIntelligenceEngineImpl as BehavioralEngine,
  BehavioralIntelligenceEngineImpl as BehavioralEngineImpl,
};
