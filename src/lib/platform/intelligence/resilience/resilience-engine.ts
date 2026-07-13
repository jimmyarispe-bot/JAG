import type { ResilienceDependencies, ResilienceEngine as Contract } from "@/lib/platform/intelligence/resilience/contracts";
import { defaultCreateId, defaultPeriodLabel, deriveResilienceBaseline, emptyResilienceScope, buildConfidence } from "@/lib/platform/intelligence/resilience/models";
import { RESILIENCE_AREAS, RESILIENCE_INTELLIGENCE_VERSION, type ResilienceArea, type ResilienceAreaSuite, type ResilienceRequest, type ResilienceResult } from "@/lib/platform/intelligence/resilience/types";
import { OrganizationalResilienceIntelligence } from "@/lib/platform/intelligence/resilience/organizational-resilience-intelligence";
import { BusinessContinuityIntelligence } from "@/lib/platform/intelligence/resilience/business-continuity-intelligence";
import { DisasterRecoveryIntelligence } from "@/lib/platform/intelligence/resilience/disaster-recovery-intelligence";
import { OperationalRecoveryIntelligence } from "@/lib/platform/intelligence/resilience/operational-recovery-intelligence";
import { FinancialResilienceIntelligence } from "@/lib/platform/intelligence/resilience/financial-resilience-intelligence";
import { WorkforceResilienceIntelligence } from "@/lib/platform/intelligence/resilience/workforce-resilience-intelligence";
import { SupplyChainResilienceIntelligence } from "@/lib/platform/intelligence/resilience/supply-chain-resilience-intelligence";
import { CyberResilienceIntelligence } from "@/lib/platform/intelligence/resilience/cyber-resilience-intelligence";
import { InfrastructureResilienceIntelligence } from "@/lib/platform/intelligence/resilience/infrastructure-resilience-intelligence";
import { VendorResilienceIntelligence } from "@/lib/platform/intelligence/resilience/vendor-resilience-intelligence";
import { CrisisReadinessIntelligence } from "@/lib/platform/intelligence/resilience/crisis-readiness-intelligence";
import { AdaptiveCapacityIntelligence } from "@/lib/platform/intelligence/resilience/adaptive-capacity-intelligence";
import { RedundancyPlanningIntelligence } from "@/lib/platform/intelligence/resilience/redundancy-planning-intelligence";
import { RecoveryTimeAnalysisIntelligence } from "@/lib/platform/intelligence/resilience/recovery-time-analysis-intelligence";
import { StressTestingIntelligence } from "@/lib/platform/intelligence/resilience/stress-testing-intelligence";
import { ResilienceOptimizationIntelligence } from "@/lib/platform/intelligence/resilience/resilience-optimization-intelligence";
import { LongTermAdaptabilityIntelligence } from "@/lib/platform/intelligence/resilience/long-term-adaptability-intelligence";
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
      organizational_resilience: new OrganizationalResilienceIntelligence(),
      business_continuity: new BusinessContinuityIntelligence(),
      disaster_recovery: new DisasterRecoveryIntelligence(),
      operational_recovery: new OperationalRecoveryIntelligence(),
      financial_resilience: new FinancialResilienceIntelligence(),
      workforce_resilience: new WorkforceResilienceIntelligence(),
      supply_chain_resilience: new SupplyChainResilienceIntelligence(),
      cyber_resilience: new CyberResilienceIntelligence(),
      infrastructure_resilience: new InfrastructureResilienceIntelligence(),
      vendor_resilience: new VendorResilienceIntelligence(),
      crisis_readiness: new CrisisReadinessIntelligence(),
      adaptive_capacity: new AdaptiveCapacityIntelligence(),
      redundancy_planning: new RedundancyPlanningIntelligence(),
      recovery_time_analysis: new RecoveryTimeAnalysisIntelligence(),
      stress_testing: new StressTestingIntelligence(),
      resilience_optimization: new ResilienceOptimizationIntelligence(),
      long_term_adaptability: new LongTermAdaptabilityIntelligence(),
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
      headline: `Business continuity index ${Math.round(continuitySuite.continuityIndex)}`,
      score: continuitySuite.score,
      continuityIndex: continuitySuite.continuityIndex,
      signals: continuitySuite.records.slice(0, 4).map(r => r.title),
      narrative: continuitySuite.narrative,
    };
    const disasterRecoveryDashboard = {
      generatedAt: now.toISOString(),
      headline: `Disaster recovery index ${Math.round(recoverySuite.recoveryIndex)}`,
      score: recoverySuite.score,
      recoveryIndex: recoverySuite.recoveryIndex,
      signals: recoverySuite.records.map(r => r.narrative),
      narrative: recoverySuite.narrative,
    };
    const operationalStabilityDashboard = {
      generatedAt: now.toISOString(),
      headline: `Operational stability ${Math.round(baseline.operationalStability)}`,
      score: areaSuites.operational_recovery.score,
      stabilityIndex: baseline.operationalStability,
      signals: areaSuites.operational_recovery.records.map(r => r.signal),
      narrative: areaSuites.operational_recovery.narrative,
    };
    const financialResilienceDashboard = {
      generatedAt: now.toISOString(),
      headline: `Financial resilience ${Math.round(baseline.financialStability)}`,
      score: areaSuites.financial_resilience.score,
      financialIndex: baseline.financialStability,
      signals: areaSuites.financial_resilience.records.map(r => r.signal),
      narrative: areaSuites.financial_resilience.narrative,
    };
    const cyberInfrastructureDashboard = {
      generatedAt: now.toISOString(),
      headline: `Cyber and infrastructure readiness ${Math.round(baseline.infrastructureReadiness)}`,
      score: clampAvg(areaSuites.cyber_resilience.score, areaSuites.infrastructure_resilience.score),
      cyberIndex: baseline.infrastructureReadiness,
      signals: [...areaSuites.cyber_resilience.records, ...areaSuites.infrastructure_resilience.records].slice(0, 4).map(r => r.signal),
      narrative: `Cyber ${Math.round(areaSuites.cyber_resilience.score)}; infrastructure ${Math.round(areaSuites.infrastructure_resilience.score)}.`,
    };
    const stressTestingDashboard = {
      generatedAt: now.toISOString(),
      headline: `Stress testing index ${Math.round(stressTestSuite.stressIndex)}`,
      score: stressTestSuite.score,
      stressIndex: stressTestSuite.stressIndex,
      signals: stressTestSuite.records.map(r => r.narrative),
      narrative: stressTestSuite.narrative,
    };
    const forecastDashboard = {
      generatedAt: now.toISOString(),
      headline: `Resilience Forecast: ${forecastSuite.outlook}`,
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
      organizationalResilienceScore: scores.areaScores.organizational_resilience,
      businessContinuityScore: scores.areaScores.business_continuity,
      disasterRecoveryScore: scores.areaScores.disaster_recovery,
      operationalRecoveryScore: scores.areaScores.operational_recovery,
      financialResilienceScore: scores.areaScores.financial_resilience,
      workforceResilienceScore: scores.areaScores.workforce_resilience,
      supplyChainResilienceScore: scores.areaScores.supply_chain_resilience,
      cyberResilienceScore: scores.areaScores.cyber_resilience,
      infrastructureResilienceScore: scores.areaScores.infrastructure_resilience,
      vendorResilienceScore: scores.areaScores.vendor_resilience,
      crisisReadinessScore: scores.areaScores.crisis_readiness,
      redundancyPlanningScore: scores.areaScores.redundancy_planning,
      recoveryTimeAnalysisScore: scores.areaScores.recovery_time_analysis,
      stressTestingScore: scores.areaScores.stress_testing,
      resilienceOptimizationScore: scores.areaScores.resilience_optimization,
      longTermAdaptabilityScore: scores.areaScores.long_term_adaptability,
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
