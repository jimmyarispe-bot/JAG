import type { CompetitiveDependencies, CompetitiveEngine as Contract } from "@/lib/platform/intelligence/competitive/contracts";
import { defaultCreateId, defaultPeriodLabel, deriveCompetitiveBaseline, emptyCompetitiveScope, buildConfidence } from "@/lib/platform/intelligence/competitive/models";
import { COMPETITIVE_AREAS, COMPETITIVE_INTELLIGENCE_VERSION, type CompetitiveArea, type CompetitiveAreaSuite, type CompetitiveRequest, type CompetitiveResult } from "@/lib/platform/intelligence/competitive/types";
import { DirectPeerSchoolsIntelligence } from "@/lib/platform/intelligence/competitive/direct-peer-schools-intelligence";
import { IndirectSubstitutesIntelligence } from "@/lib/platform/intelligence/competitive/indirect-substitutes-intelligence";
import { TuitionAidPositioningIntelligence } from "@/lib/platform/intelligence/competitive/tuition-aid-positioning-intelligence";
import { ProgramCurriculumDifferentiationIntelligence } from "@/lib/platform/intelligence/competitive/program-curriculum-differentiation-intelligence";
import { EnrollmentAdmissionsDynamicsIntelligence } from "@/lib/platform/intelligence/competitive/enrollment-admissions-dynamics-intelligence";
import { RegionalMarketShareIntelligence } from "@/lib/platform/intelligence/competitive/regional-market-share-intelligence";
import { TalentFacultyCompetitionIntelligence } from "@/lib/platform/intelligence/competitive/talent-faculty-competition-intelligence";
import { BrandReputationChoiceDriversIntelligence } from "@/lib/platform/intelligence/competitive/brand-reputation-choice-drivers-intelligence";
import { PartnershipAllianceLandscapeIntelligence } from "@/lib/platform/intelligence/competitive/partnership-alliance-landscape-intelligence";
import { TechnologyDeliveryModelsIntelligence } from "@/lib/platform/intelligence/competitive/technology-delivery-models-intelligence";
import { ExpansionLaunchSignalsIntelligence } from "@/lib/platform/intelligence/competitive/expansion-launch-signals-intelligence";
import { ConsolidationNetworkStrategyIntelligence } from "@/lib/platform/intelligence/competitive/consolidation-network-strategy-intelligence";
import { CompetitiveForecastEngine } from "@/lib/platform/intelligence/competitive/competitive-forecast-engine";
import { CompetitiveScenarioEngine } from "@/lib/platform/intelligence/competitive/competitive-scenario-engine";
import { CompetitiveTrendEngine } from "@/lib/platform/intelligence/competitive/competitive-trend-engine";
import { CompetitiveAnalysisEngine } from "@/lib/platform/intelligence/competitive/competitive-analysis-engine";
import { CompetitiveKnowledgeContributionEngine } from "@/lib/platform/intelligence/competitive/knowledge-contribution";
import { ClosedLearningLoop } from "@/lib/platform/intelligence/competitive/closed-learning-loop";
import { CompetitiveReasoner } from "@/lib/platform/intelligence/competitive/competitive-reasoner";
import {
  CompetitiveIntelligence, CompetitiveRecommendationComposer, composeDashboard, composeHealth,
  composeRisksOpportunities, competitiveLens,
} from "@/lib/platform/intelligence/competitive/competitive-intelligence";
import { CompetitiveProjection } from "@/lib/platform/intelligence/competitive/projection";
import { CompetitiveRepositoryStore } from "@/lib/platform/intelligence/competitive/repository";
import { CompetitiveRegistryStore } from "@/lib/platform/intelligence/competitive/competitive-registry";
import { CompetitiveQueries } from "@/lib/platform/intelligence/competitive/projection";

export class CompetitiveIntelligenceEngineImpl implements Contract {
  readonly repository; readonly registry; readonly queries;
  private now; private createId; private areas; private forecasts; private scenarios; private trends; private analysis; private reasoner;

  constructor(d: CompetitiveDependencies = {}) {
    this.now = d.now ?? (() => new Date());
    this.createId = d.createId ?? defaultCreateId;
    this.repository = d.repository ?? new CompetitiveRepositoryStore();
    this.registry = d.registry ?? new CompetitiveRegistryStore();
    this.queries = new CompetitiveQueries();
    this.areas = {
      direct_peer_schools: new DirectPeerSchoolsIntelligence(),
      indirect_substitutes: new IndirectSubstitutesIntelligence(),
      tuition_aid_positioning: new TuitionAidPositioningIntelligence(),
      program_curriculum_differentiation: new ProgramCurriculumDifferentiationIntelligence(),
      enrollment_admissions_dynamics: new EnrollmentAdmissionsDynamicsIntelligence(),
      regional_market_share: new RegionalMarketShareIntelligence(),
      talent_faculty_competition: new TalentFacultyCompetitionIntelligence(),
      brand_reputation_choice_drivers: new BrandReputationChoiceDriversIntelligence(),
      partnership_alliance_landscape: new PartnershipAllianceLandscapeIntelligence(),
      technology_delivery_models: new TechnologyDeliveryModelsIntelligence(),
      expansion_launch_signals: new ExpansionLaunchSignalsIntelligence(),
      consolidation_network_strategy: new ConsolidationNetworkStrategyIntelligence(),
      ...d.areaIntelligence,
    };
    this.forecasts = d.forecastEngine ?? new CompetitiveForecastEngine();
    this.scenarios = d.scenarioEngine ?? new CompetitiveScenarioEngine();
    this.trends = d.trendEngine ?? new CompetitiveTrendEngine();
    this.analysis = d.analysisEngine ?? new CompetitiveAnalysisEngine();
    this.reasoner = d.reasoner ?? new CompetitiveReasoner();
  }

  build(request: CompetitiveRequest): CompetitiveResult {
    const now = this.now();
    const baseline = deriveCompetitiveBaseline(request);
    const createId = this.createId;
    const scope = request.scope ?? emptyCompetitiveScope();
    const areaSuites = Object.fromEntries(
      COMPETITIVE_AREAS.map(area => [area, this.areas[area]!.assess({ baseline, now, createId })])
    ) as Record<CompetitiveArea, CompetitiveAreaSuite>;

    const trendSuite = this.trends.assess({ baseline, areas: areaSuites, now, createId });
    const forecastSuite = this.forecasts.assess({ baseline, areas: areaSuites, now, createId });
    const scenarioSuite = this.scenarios.assess({ baseline, areas: areaSuites, forecasts: forecastSuite, now, createId });
    const analysisSuite = this.analysis.assess({ baseline, areas: areaSuites, forecasts: forecastSuite, scenarios: scenarioSuite, now, createId });
    const knowledgeContribution = new CompetitiveKnowledgeContributionEngine().contribute({ forecasts: forecastSuite, scenarios: scenarioSuite, now, createId });
    const confidence = buildConfidence([
      { key: "evidence", label: "Evidence coverage", contribution: baseline.evidenceCoverage / 100 },
      { key: "forecast", label: "Forecast maturity", contribution: forecastSuite.maturityScore / 100 },
      { key: "scenario", label: "Scenario maturity", contribution: baseline.scenarioMaturity / 100 },
    ]);
    const reasoning = this.reasoner.reason({ request, trends: trendSuite, forecasts: forecastSuite, scenarios: scenarioSuite, confidence });
    const intelligence = new CompetitiveIntelligence();
    const scores = intelligence.composeScores({
      baseline,
      areas: areaSuites,
      forecast: forecastSuite.maturityScore,
      scenario: baseline.scenarioMaturity,
      analysis: analysisSuite.maturityScore,
    });
    const { risks, opportunities } = composeRisksOpportunities(areaSuites, createId);
    const recommendations = new CompetitiveRecommendationComposer(createId).compose(areaSuites, analysisSuite, scenarioSuite, now);
    const health = composeHealth(scores, baseline, forecastSuite);
    const dashboard = composeDashboard(now, health, baseline, risks, opportunities);
    const commonLens = competitiveLens("organization", health.overallScore);

    const outlookDashboard = {
      generatedAt: now.toISOString(),
      headline: `Competitive outlook ${forecastSuite.outlook}`,
      outlook: forecastSuite.outlook,
      overall: health.overallScore,
      primaryScenario: scenarioSuite.primaryScenario,
      narrative: scenarioSuite.narrative,
    };
    const threatDashboard = {
      generatedAt: now.toISOString(),
      headline: `Threat level ${Math.round(baseline.threatLevel)} from direct peers`,
      score: areaSuites.direct_peer_schools.score,
      threatLevel: baseline.threatLevel,
      signals: areaSuites.direct_peer_schools.records.map(r => r.signal),
      narrative: areaSuites.direct_peer_schools.narrative,
    };
    const differentiationDashboard = {
      generatedAt: now.toISOString(),
      headline: `Differentiation strength ${Math.round(baseline.differentiationStrength)}`,
      score: areaSuites.program_curriculum_differentiation.score,
      differentiationStrength: baseline.differentiationStrength,
      brandStrength: baseline.brandStrength,
      signals: areaSuites.brand_reputation_choice_drivers.records.map(r => r.signal),
      narrative: areaSuites.program_curriculum_differentiation.narrative,
    };
    const signalMonitoringDashboard = {
      generatedAt: now.toISOString(),
      headline: `Signal monitoring: ${trendSuite.trends.length} competitive signals tracked`,
      score: clampScore(100 - baseline.competitivePressure),
      signalCount: trendSuite.trends.length,
      activeThreats: risks.length,
      signals: [areaSuites.expansion_launch_signals.narrative, areaSuites.consolidation_network_strategy.narrative],
      narrative: trendSuite.narrative,
    };
    const forecastDashboard = {
      generatedAt: now.toISOString(),
      headline: forecastSuite.narrative,
      outlook: forecastSuite.outlook,
      maturityScore: forecastSuite.maturityScore,
      forecasts: forecastSuite.forecasts.slice(0, 6).map(f => f.narrative),
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
      headline: `Board Competitive Report: ${dashboard.headline}`,
      assuranceSummary: `Evidence coverage ${Math.round(baseline.evidenceCoverage)}; primary scenario ${scenarioSuite.primaryScenario.replaceAll("_", " ")}.`,
      healthScore: health.overallScore,
      outlook: forecastSuite.outlook,
      threatScore: clampScore(100 - baseline.threatLevel),
      differentiationScore: baseline.differentiationStrength,
      marketSharePosition: baseline.marketSharePosition,
      recommendations: recommendations.map(r => r.title),
      lenses: commonLens,
      narrative: "Board assurance on competitive exposure, peer landscape, differentiation, and market position.",
    };
    const closedLearningLoop = new ClosedLearningLoop().contribute({ trends: trendSuite, scenarios: scenarioSuite, recommendations, now, createId });
    const projection = new CompetitiveProjection().project({
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
      id: createId("cmp-history"),
      requestId: request.requestId,
      scope,
      status: "assessed" as const,
      healthScore: health.overallScore,
      generatedAt: now.toISOString(),
      summary: brief.headline,
      metadata: request.metadata ?? {},
    };

    const result: CompetitiveResult = {
      requestId: request.requestId,
      version: COMPETITIVE_INTELLIGENCE_VERSION,
      generatedAt: now.toISOString(),
      periodLabel: request.periodLabel ?? defaultPeriodLabel(now),
      scope,
      baseline,
      healthScore: scores.healthScore,
      directPeerSchoolsScore: scores.areaScores.direct_peer_schools,
      indirectSubstitutesScore: scores.areaScores.indirect_substitutes,
      tuitionAidPositioningScore: scores.areaScores.tuition_aid_positioning,
      programCurriculumDifferentiationScore: scores.areaScores.program_curriculum_differentiation,
      enrollmentAdmissionsDynamicsScore: scores.areaScores.enrollment_admissions_dynamics,
      regionalMarketShareScore: scores.areaScores.regional_market_share,
      talentFacultyCompetitionScore: scores.areaScores.talent_faculty_competition,
      brandReputationChoiceDriversScore: scores.areaScores.brand_reputation_choice_drivers,
      partnershipAllianceLandscapeScore: scores.areaScores.partnership_alliance_landscape,
      technologyDeliveryModelsScore: scores.areaScores.technology_delivery_models,
      expansionLaunchSignalsScore: scores.areaScores.expansion_launch_signals,
      consolidationNetworkStrategyScore: scores.areaScores.consolidation_network_strategy,
      forecastScore: scores.forecastScore,
      scenarioScore: scores.scenarioScore,
      analysisScore: scores.analysisScore,
      health,
      dashboard,
      outlookDashboard,
      threatDashboard,
      differentiationDashboard,
      signalMonitoringDashboard,
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
      knowledgeContribution,
      closedLearningLoop,
      reasoning,
      projection,
      historyRecord,
      confidence,
      requestMetadata: { ...(request.metadata ?? {}), registryPublishers: this.registry.list().length },
    };

    this.registry.register("competitive", "competitive_intelligence");
    this.repository.save(result);
    this.repository.saveHistory(historyRecord);
    return result;
  }
}

function clampScore(v: number) { return Math.min(100, Math.max(0, v)); }

export {
  CompetitiveIntelligenceEngineImpl as CompetitiveIntelligenceEngine,
  CompetitiveIntelligenceEngineImpl as CompetitiveEngine,
  CompetitiveIntelligenceEngineImpl as CompetitiveEngineImpl,
};
