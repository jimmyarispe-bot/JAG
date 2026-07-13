import type { WisdomDependencies, WisdomEngine as Contract } from "@/lib/platform/intelligence/wisdom/contracts";
import { defaultCreateId, defaultPeriodLabel, deriveWisdomBaseline, emptyWisdomScope, buildConfidence } from "@/lib/platform/intelligence/wisdom/models";
import { WISDOM_AREAS, WISDOM_INTELLIGENCE_VERSION, type WisdomArea, type WisdomAreaSuite, type WisdomRequest, type WisdomResult } from "@/lib/platform/intelligence/wisdom/types";
import { ExecutiveJudgmentIntelligence } from "@/lib/platform/intelligence/wisdom/executive-judgment-intelligence";
import { StrategicReasoningIntelligence } from "@/lib/platform/intelligence/wisdom/strategic-reasoning-intelligence";
import { TradeOffAnalysisIntelligence } from "@/lib/platform/intelligence/wisdom/trade-off-analysis-intelligence";
import { LongTermThinkingIntelligence } from "@/lib/platform/intelligence/wisdom/long-term-thinking-intelligence";
import { CrossDomainSynthesisIntelligence } from "@/lib/platform/intelligence/wisdom/cross-domain-synthesis-intelligence";
import { DecisionQualityAssessmentIntelligence } from "@/lib/platform/intelligence/wisdom/decision-quality-assessment-intelligence";
import { UncertaintyAnalysisIntelligence } from "@/lib/platform/intelligence/wisdom/uncertainty-analysis-intelligence";
import { ConfidenceCalibrationIntelligence } from "@/lib/platform/intelligence/wisdom/confidence-calibration-intelligence";
import { OrganizationalPrioritizationIntelligence } from "@/lib/platform/intelligence/wisdom/organizational-prioritization-intelligence";
import { MissionAlignmentIntelligence } from "@/lib/platform/intelligence/wisdom/mission-alignment-intelligence";
import { ValuesAlignmentIntelligence } from "@/lib/platform/intelligence/wisdom/values-alignment-intelligence";
import { EthicalJudgmentIntelligence } from "@/lib/platform/intelligence/wisdom/ethical-judgment-intelligence";
import { StrategicTimingIntelligence } from "@/lib/platform/intelligence/wisdom/strategic-timing-intelligence";
import { OpportunityCostAnalysisIntelligence } from "@/lib/platform/intelligence/wisdom/opportunity-cost-analysis-intelligence";
import { ExecutiveRecommendationValidationIntelligence } from "@/lib/platform/intelligence/wisdom/executive-recommendation-validation-intelligence";
import { OrganizationalJudgmentEvolutionIntelligence } from "@/lib/platform/intelligence/wisdom/organizational-judgment-evolution-intelligence";
import { InstitutionalWisdomIntelligence } from "@/lib/platform/intelligence/wisdom/institutional-wisdom-intelligence";
import { WisdomForecastEngine } from "@/lib/platform/intelligence/wisdom/wisdom-forecast-engine";
import { WisdomScenarioEngine } from "@/lib/platform/intelligence/wisdom/wisdom-scenario-engine";
import { WisdomTrendEngine } from "@/lib/platform/intelligence/wisdom/wisdom-trend-engine";
import { WisdomAnalysisEngine } from "@/lib/platform/intelligence/wisdom/wisdom-analysis-engine";
import { StrategicReasoningEngine } from "@/lib/platform/intelligence/wisdom/strategic-reasoning-engine";
import { CrossDomainSynthesisEngine } from "@/lib/platform/intelligence/wisdom/cross-domain-synthesis-engine";
import { TradeOffEngine } from "@/lib/platform/intelligence/wisdom/trade-off-engine";
import { UncertaintyEngine } from "@/lib/platform/intelligence/wisdom/uncertainty-engine";
import { ExecutiveJudgmentEngine } from "@/lib/platform/intelligence/wisdom/executive-judgment-engine";
import { ConfidenceEngine } from "@/lib/platform/intelligence/wisdom/confidence-engine";
import { EarlyWarningEngine } from "@/lib/platform/intelligence/wisdom/early-warning-engine";
import { WisdomKnowledgeContributionEngine } from "@/lib/platform/intelligence/wisdom/knowledge-contribution";
import { ClosedLearningLoop } from "@/lib/platform/intelligence/wisdom/closed-learning-loop";
import { WisdomReasoner } from "@/lib/platform/intelligence/wisdom/wisdom-reasoner";
import {
  WisdomIntelligence, WisdomRecommendationComposer, composeDashboard, composeHealth,
  composeRisksOpportunities, wisdomLens,
} from "@/lib/platform/intelligence/wisdom/wisdom-intelligence";
import { WisdomProjection, WisdomQueries } from "@/lib/platform/intelligence/wisdom/projection";
import { WisdomRepositoryStore } from "@/lib/platform/intelligence/wisdom/repository";
import { WisdomRegistryStore } from "@/lib/platform/intelligence/wisdom/wisdom-registry";

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
      executive_judgment: new ExecutiveJudgmentIntelligence(),
      strategic_reasoning: new StrategicReasoningIntelligence(),
      trade_off_analysis: new TradeOffAnalysisIntelligence(),
      long_term_thinking: new LongTermThinkingIntelligence(),
      cross_domain_synthesis: new CrossDomainSynthesisIntelligence(),
      decision_quality_assessment: new DecisionQualityAssessmentIntelligence(),
      uncertainty_analysis: new UncertaintyAnalysisIntelligence(),
      confidence_calibration: new ConfidenceCalibrationIntelligence(),
      organizational_prioritization: new OrganizationalPrioritizationIntelligence(),
      mission_alignment: new MissionAlignmentIntelligence(),
      values_alignment: new ValuesAlignmentIntelligence(),
      ethical_judgment: new EthicalJudgmentIntelligence(),
      strategic_timing: new StrategicTimingIntelligence(),
      opportunity_cost_analysis: new OpportunityCostAnalysisIntelligence(),
      executive_recommendation_validation: new ExecutiveRecommendationValidationIntelligence(),
      organizational_judgment_evolution: new OrganizationalJudgmentEvolutionIntelligence(),
      institutional_wisdom: new InstitutionalWisdomIntelligence(),
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
      headline: `Strategic judgment index ${Math.round(executiveJudgmentSuite.judgmentIndex)}`,
      score: executiveJudgmentSuite.score,
      judgmentIndex: executiveJudgmentSuite.judgmentIndex,
      signals: executiveJudgmentSuite.records.slice(0, 4).map(r => r.title),
      narrative: executiveJudgmentSuite.narrative,
    };
    const crossDomainSynthesisDashboard = {
      generatedAt: now.toISOString(),
      headline: `Cross-domain synthesis ${Math.round(crossDomainSynthesisSuite.synthesisIndex)}`,
      score: crossDomainSynthesisSuite.score,
      synthesisIndex: crossDomainSynthesisSuite.synthesisIndex,
      signals: crossDomainSynthesisSuite.records.slice(0, 4).map(r => r.title),
      narrative: crossDomainSynthesisSuite.narrative,
    };
    const tradeOffAnalysisDashboard = {
      generatedAt: now.toISOString(),
      headline: `Trade-off analysis ${Math.round(tradeOffSuite.balanceIndex)}`,
      score: tradeOffSuite.score,
      balanceIndex: tradeOffSuite.balanceIndex,
      signals: tradeOffSuite.records.map(r => r.narrative),
      narrative: tradeOffSuite.narrative,
    };
    const organizationalPrioritiesDashboard = {
      generatedAt: now.toISOString(),
      headline: `Organizational priorities ${Math.round(areaSuites.organizational_prioritization.score)}`,
      score: areaSuites.organizational_prioritization.score,
      priorityIndex: areaSuites.organizational_prioritization.score,
      signals: areaSuites.organizational_prioritization.records.map(r => r.signal),
      narrative: areaSuites.organizational_prioritization.narrative,
    };
    const confidenceDashboard = {
      generatedAt: now.toISOString(),
      headline: `Confidence calibration ${Math.round(confidenceSuite.calibrationIndex)}`,
      score: confidenceSuite.score,
      calibrationIndex: confidenceSuite.calibrationIndex,
      signals: confidenceSuite.records.map(r => r.narrative),
      narrative: confidenceSuite.narrative,
    };
    const longTermOutlookDashboard = {
      generatedAt: now.toISOString(),
      headline: `Long-term outlook ${Math.round(baseline.longTermImpact)}`,
      score: areaSuites.long_term_thinking.score,
      longTermImpact: baseline.longTermImpact,
      signals: areaSuites.long_term_thinking.records.map(r => r.signal),
      narrative: areaSuites.long_term_thinking.narrative,
    };
    const forecastDashboard = {
      generatedAt: now.toISOString(),
      headline: `Wisdom Forecast: ${forecastSuite.outlook}`,
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
      judgment: executiveJudgmentSuite.framework,
      narrative: dashboard.narrative,
    };
    const boardReport = {
      generatedAt: now.toISOString(),
      headline: `Board Report: ${dashboard.headline}`,
      assuranceSummary: `Evidence coverage ${Math.round(baseline.evidenceCoverage)}; primary scenario ${scenarioSuite.primaryScenario.replaceAll("_", " ")}.`,
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
      executiveJudgmentScore: scores.areaScores.executive_judgment,
      strategicReasoningScore: scores.areaScores.strategic_reasoning,
      tradeOffAnalysisScore: scores.areaScores.trade_off_analysis,
      longTermThinkingScore: scores.areaScores.long_term_thinking,
      crossDomainSynthesisScore: scores.areaScores.cross_domain_synthesis,
      decisionQualityAssessmentScore: scores.areaScores.decision_quality_assessment,
      uncertaintyAnalysisScore: scores.areaScores.uncertainty_analysis,
      confidenceCalibrationScore: scores.areaScores.confidence_calibration,
      organizationalPrioritizationScore: scores.areaScores.organizational_prioritization,
      missionAlignmentScore: scores.areaScores.mission_alignment,
      valuesAlignmentScore: scores.areaScores.values_alignment,
      ethicalJudgmentScore: scores.areaScores.ethical_judgment,
      strategicTimingScore: scores.areaScores.strategic_timing,
      opportunityCostAnalysisScore: scores.areaScores.opportunity_cost_analysis,
      executiveRecommendationValidationScore: scores.areaScores.executive_recommendation_validation,
      organizationalJudgmentEvolutionScore: scores.areaScores.organizational_judgment_evolution,
      institutionalWisdomScore: scores.areaScores.institutional_wisdom,
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
