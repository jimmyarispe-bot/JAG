import type { SystemsDependencies, SystemsEngine as Contract } from "@/lib/platform/intelligence/systems/contracts";
import { defaultCreateId, defaultPeriodLabel, deriveSystemsBaseline, emptySystemsScope, buildConfidence } from "@/lib/platform/intelligence/systems/models";
import { SYSTEMS_AREAS, SYSTEMS_INTELLIGENCE_VERSION, type SystemsArea, type SystemsAreaSuite, type SystemsRequest, type SystemsResult } from "@/lib/platform/intelligence/systems/types";
import { SystemMappingIntelligence } from "@/lib/platform/intelligence/systems/system-mapping-intelligence";
import { DependencyAnalysisIntelligence } from "@/lib/platform/intelligence/systems/dependency-analysis-intelligence";
import { FeedbackLoopAnalysisIntelligence } from "@/lib/platform/intelligence/systems/feedback-loop-analysis-intelligence";
import { ConstraintIdentificationIntelligence } from "@/lib/platform/intelligence/systems/constraint-identification-intelligence";
import { BottleneckDetectionIntelligence } from "@/lib/platform/intelligence/systems/bottleneck-detection-intelligence";
import { FlowOptimizationIntelligence } from "@/lib/platform/intelligence/systems/flow-optimization-intelligence";
import { EmergentBehaviorIntelligence } from "@/lib/platform/intelligence/systems/emergent-behavior-intelligence";
import { NetworkDynamicsIntelligence } from "@/lib/platform/intelligence/systems/network-dynamics-intelligence";
import { OrganizationalComplexityIntelligence } from "@/lib/platform/intelligence/systems/organizational-complexity-intelligence";
import { InterdependencyModelingIntelligence } from "@/lib/platform/intelligence/systems/interdependency-modeling-intelligence";
import { CascadingRiskIntelligence } from "@/lib/platform/intelligence/systems/cascading-risk-intelligence";
import { SystemStabilityIntelligence } from "@/lib/platform/intelligence/systems/system-stability-intelligence";
import { LeveragePointIdentificationIntelligence } from "@/lib/platform/intelligence/systems/leverage-point-identification-intelligence";
import { ResourceFlowIntelligence } from "@/lib/platform/intelligence/systems/resource-flow-intelligence";
import { AdaptiveCapacityIntelligence } from "@/lib/platform/intelligence/systems/adaptive-capacity-intelligence";
import { SystemEvolutionIntelligence } from "@/lib/platform/intelligence/systems/system-evolution-intelligence";
import { ScenarioInteractionIntelligence } from "@/lib/platform/intelligence/systems/scenario-interaction-intelligence";
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
      system_mapping: new SystemMappingIntelligence(),
      dependency_analysis: new DependencyAnalysisIntelligence(),
      feedback_loop_analysis: new FeedbackLoopAnalysisIntelligence(),
      constraint_identification: new ConstraintIdentificationIntelligence(),
      bottleneck_detection: new BottleneckDetectionIntelligence(),
      flow_optimization: new FlowOptimizationIntelligence(),
      emergent_behavior: new EmergentBehaviorIntelligence(),
      network_dynamics: new NetworkDynamicsIntelligence(),
      organizational_complexity: new OrganizationalComplexityIntelligence(),
      interdependency_modeling: new InterdependencyModelingIntelligence(),
      cascading_risk: new CascadingRiskIntelligence(),
      system_stability: new SystemStabilityIntelligence(),
      leverage_point_identification: new LeveragePointIdentificationIntelligence(),
      resource_flow: new ResourceFlowIntelligence(),
      adaptive_capacity: new AdaptiveCapacityIntelligence(),
      system_evolution: new SystemEvolutionIntelligence(),
      scenario_interaction: new ScenarioInteractionIntelligence(),
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
      headline: `Dependency map index ${Math.round(dependencySuite.dependencyIndex)}`,
      score: dependencySuite.score,
      dependencyIndex: dependencySuite.dependencyIndex,
      signals: dependencySuite.records.slice(0, 4).map(r => r.title),
      narrative: dependencySuite.narrative,
    };
    const feedbackLoopsDashboard = {
      generatedAt: now.toISOString(),
      headline: `Feedback stability ${Math.round(baseline.feedbackStability)}`,
      score: feedbackLoopSuite.score,
      feedbackIndex: feedbackLoopSuite.feedbackIndex,
      signals: feedbackLoopSuite.records.map(r => r.narrative),
      narrative: feedbackLoopSuite.narrative,
    };
    const bottlenecksDashboard = {
      generatedAt: now.toISOString(),
      headline: `Bottleneck index ${Math.round(bottleneckSuite.bottleneckIndex)}`,
      score: bottleneckSuite.score,
      bottleneckIndex: bottleneckSuite.bottleneckIndex,
      signals: bottleneckSuite.records.map(r => r.narrative),
      narrative: bottleneckSuite.narrative,
    };
    const systemHealthDashboard = {
      generatedAt: now.toISOString(),
      headline: `System stability ${Math.round(areaSuites.system_stability.score)}`,
      score: areaSuites.system_stability.score,
      stabilityIndex: areaSuites.system_stability.score,
      signals: areaSuites.system_stability.records.map(r => r.signal),
      narrative: areaSuites.system_stability.narrative,
    };
    const complexityAnalysisDashboard = {
      generatedAt: now.toISOString(),
      headline: `Complexity ${Math.round(baseline.systemComplexity)}`,
      score: areaSuites.organizational_complexity.score,
      complexityIndex: baseline.systemComplexity,
      signals: areaSuites.organizational_complexity.records.map(r => r.signal),
      narrative: areaSuites.organizational_complexity.narrative,
    };
    const adaptiveCapacityDashboard = {
      generatedAt: now.toISOString(),
      headline: `Adaptive capacity ${Math.round(baseline.adaptability)}`,
      score: areaSuites.adaptive_capacity.score,
      adaptiveIndex: baseline.adaptability,
      signals: areaSuites.adaptive_capacity.records.map(r => r.signal),
      narrative: areaSuites.adaptive_capacity.narrative,
    };
    const forecastDashboard = {
      generatedAt: now.toISOString(),
      headline: `Systems Forecast: ${forecastSuite.outlook}`,
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
      systemMappingScore: scores.areaScores.system_mapping,
      dependencyAnalysisScore: scores.areaScores.dependency_analysis,
      feedbackLoopAnalysisScore: scores.areaScores.feedback_loop_analysis,
      constraintIdentificationScore: scores.areaScores.constraint_identification,
      bottleneckDetectionScore: scores.areaScores.bottleneck_detection,
      flowOptimizationScore: scores.areaScores.flow_optimization,
      emergentBehaviorScore: scores.areaScores.emergent_behavior,
      organizationalComplexityScore: scores.areaScores.organizational_complexity,
      interdependencyModelingScore: scores.areaScores.interdependency_modeling,
      cascadingRiskScore: scores.areaScores.cascading_risk,
      systemStabilityScore: scores.areaScores.system_stability,
      leveragePointIdentificationScore: scores.areaScores.leverage_point_identification,
      resourceFlowScore: scores.areaScores.resource_flow,
      adaptiveCapacityScore: scores.areaScores.adaptive_capacity,
      systemEvolutionScore: scores.areaScores.system_evolution,
      scenarioInteractionScore: scores.areaScores.scenario_interaction,
      networkDynamicsScore: scores.networkDynamicsScore,
      forecastScore: scores.forecastScore,
      scenarioScore: scores.scenarioScore,
      analysisScore: scores.analysisScore,
      earlyWarningScore: scores.earlyWarningScore,
      dependencyScore: scores.dependencyScore,
      feedbackLoopScore: scores.feedbackLoopScore,
      bottleneckScore: scores.bottleneckScore,
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
