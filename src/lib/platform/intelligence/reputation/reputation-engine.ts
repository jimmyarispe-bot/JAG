import type { ReputationDependencies, ReputationEngine as Contract } from "@/lib/platform/intelligence/reputation/contracts";
import { defaultCreateId, defaultPeriodLabel, deriveReputationBaseline, emptyReputationScope, buildConfidence } from "@/lib/platform/intelligence/reputation/models";
import { REPUTATION_AREAS, REPUTATION_INTELLIGENCE_VERSION, type ReputationArea, type ReputationAreaSuite, type ReputationRequest, type ReputationResult } from "@/lib/platform/intelligence/reputation/types";
import { BrandReputationIntelligence } from "@/lib/platform/intelligence/reputation/brand-reputation-intelligence";
import { OrganizationalTrustIntelligence } from "@/lib/platform/intelligence/reputation/organizational-trust-intelligence";
import { PublicPerceptionIntelligence } from "@/lib/platform/intelligence/reputation/public-perception-intelligence";
import { CustomerReputationIntelligence } from "@/lib/platform/intelligence/reputation/customer-reputation-intelligence";
import { EmployeeReputationIntelligence } from "@/lib/platform/intelligence/reputation/employee-reputation-intelligence";
import { ExecutiveReputationIntelligence } from "@/lib/platform/intelligence/reputation/executive-reputation-intelligence";
import { MediaIntelligenceAreaIntelligence } from "@/lib/platform/intelligence/reputation/media-intelligence-intelligence";
import { PressCoverageIntelligence } from "@/lib/platform/intelligence/reputation/press-coverage-intelligence";
import { SocialNarrativeIntelligence } from "@/lib/platform/intelligence/reputation/social-narrative-intelligence";
import { CommunityReputationIntelligence } from "@/lib/platform/intelligence/reputation/community-reputation-intelligence";
import { PartnerReputationIntelligence } from "@/lib/platform/intelligence/reputation/partner-reputation-intelligence";
import { InvestorDonorConfidenceIntelligence } from "@/lib/platform/intelligence/reputation/investor-donor-confidence-intelligence";
import { RegulatoryReputationIntelligence } from "@/lib/platform/intelligence/reputation/regulatory-reputation-intelligence";
import { CrisisReputationIntelligence } from "@/lib/platform/intelligence/reputation/crisis-reputation-intelligence";
import { MisinformationDetectionIntelligence } from "@/lib/platform/intelligence/reputation/misinformation-detection-intelligence";
import { ReputationRecoveryIntelligence } from "@/lib/platform/intelligence/reputation/reputation-recovery-intelligence";
import { CredibilityIntelligence } from "@/lib/platform/intelligence/reputation/credibility-intelligence";
import { ReputationForecastEngine } from "@/lib/platform/intelligence/reputation/reputation-forecast-engine";
import { ReputationScenarioEngine } from "@/lib/platform/intelligence/reputation/reputation-scenario-engine";
import { ReputationTrendEngine } from "@/lib/platform/intelligence/reputation/reputation-trend-engine";
import { ReputationAnalysisEngine } from "@/lib/platform/intelligence/reputation/reputation-analysis-engine";
import { TrustEngine } from "@/lib/platform/intelligence/reputation/trust-engine";
import { SentimentEngine } from "@/lib/platform/intelligence/reputation/sentiment-engine";
import { NarrativeAnalysisEngine } from "@/lib/platform/intelligence/reputation/narrative-analysis-engine";
import { MediaIntelligenceEngine } from "@/lib/platform/intelligence/reputation/media-intelligence-engine";
import { CrisisDetectionEngine } from "@/lib/platform/intelligence/reputation/crisis-detection-engine";
import { EarlyWarningEngine } from "@/lib/platform/intelligence/reputation/early-warning-engine";
import { ReputationKnowledgeContributionEngine } from "@/lib/platform/intelligence/reputation/knowledge-contribution";
import { ClosedLearningLoop } from "@/lib/platform/intelligence/reputation/closed-learning-loop";
import { ReputationReasoner } from "@/lib/platform/intelligence/reputation/reputation-reasoner";
import {
  ReputationIntelligence, ReputationRecommendationComposer, composeDashboard, composeHealth,
  composeRisksOpportunities, reputationLens,
} from "@/lib/platform/intelligence/reputation/reputation-intelligence";
import { ReputationProjection } from "@/lib/platform/intelligence/reputation/projection";
import { ReputationRepositoryStore } from "@/lib/platform/intelligence/reputation/repository";
import { ReputationRegistryStore } from "@/lib/platform/intelligence/reputation/reputation-registry";
import { ReputationQueries } from "@/lib/platform/intelligence/reputation/projection";

export class ReputationIntelligenceEngineImpl implements Contract {
  readonly repository; readonly registry; readonly queries;
  private now; private createId; private areas; private forecasts; private scenarios; private trends; private analysis;
  private trust; private sentiment; private narrativeAnalysis; private mediaIntelligence; private crisisDetection; private earlyWarning; private reasoner;

  constructor(d: ReputationDependencies = {}) {
    this.now = d.now ?? (() => new Date());
    this.createId = d.createId ?? defaultCreateId;
    this.repository = d.repository ?? new ReputationRepositoryStore();
    this.registry = d.registry ?? new ReputationRegistryStore();
    this.queries = new ReputationQueries();
    this.areas = {
      brand_reputation: new BrandReputationIntelligence(),
      organizational_trust: new OrganizationalTrustIntelligence(),
      public_perception: new PublicPerceptionIntelligence(),
      customer_reputation: new CustomerReputationIntelligence(),
      employee_reputation: new EmployeeReputationIntelligence(),
      executive_reputation: new ExecutiveReputationIntelligence(),
      media_intelligence: new MediaIntelligenceAreaIntelligence(),
      press_coverage: new PressCoverageIntelligence(),
      social_narrative: new SocialNarrativeIntelligence(),
      community_reputation: new CommunityReputationIntelligence(),
      partner_reputation: new PartnerReputationIntelligence(),
      investor_donor_confidence: new InvestorDonorConfidenceIntelligence(),
      regulatory_reputation: new RegulatoryReputationIntelligence(),
      crisis_reputation: new CrisisReputationIntelligence(),
      misinformation_detection: new MisinformationDetectionIntelligence(),
      reputation_recovery: new ReputationRecoveryIntelligence(),
      credibility: new CredibilityIntelligence(),
      ...d.areaIntelligence,
    };
    this.forecasts = d.forecastEngine ?? new ReputationForecastEngine();
    this.scenarios = d.scenarioEngine ?? new ReputationScenarioEngine();
    this.trends = d.trendEngine ?? new ReputationTrendEngine();
    this.analysis = d.analysisEngine ?? new ReputationAnalysisEngine();
    this.trust = d.trustEngine ?? new TrustEngine();
    this.sentiment = d.sentimentEngine ?? new SentimentEngine();
    this.narrativeAnalysis = d.narrativeAnalysisEngine ?? new NarrativeAnalysisEngine();
    this.mediaIntelligence = d.mediaIntelligenceEngine ?? new MediaIntelligenceEngine();
    this.crisisDetection = d.crisisDetectionEngine ?? new CrisisDetectionEngine();
    this.earlyWarning = d.earlyWarningEngine ?? new EarlyWarningEngine();
    this.reasoner = d.reasoner ?? new ReputationReasoner();
  }

  build(request: ReputationRequest): ReputationResult {
    const now = this.now();
    const baseline = deriveReputationBaseline(request);
    const createId = this.createId;
    const scope = request.scope ?? emptyReputationScope();
    const areaSuites = Object.fromEntries(
      REPUTATION_AREAS.map(area => [area, this.areas[area]!.assess({ baseline, now, createId })])
    ) as Record<ReputationArea, ReputationAreaSuite>;

    const trendSuite = this.trends.assess({ baseline, areas: areaSuites, now, createId });
    const forecastSuite = this.forecasts.assess({ baseline, areas: areaSuites, now, createId });
    const scenarioSuite = this.scenarios.assess({ baseline, areas: areaSuites, forecasts: forecastSuite, now, createId });
    const analysisSuite = this.analysis.assess({ baseline, areas: areaSuites, forecasts: forecastSuite, scenarios: scenarioSuite, now, createId });
    const trustSuite = this.trust.assess({ baseline, areas: areaSuites, now, createId });
    const sentimentSuite = this.sentiment.assess({ baseline, areas: areaSuites, now, createId });
    const narrativeAnalysisSuite = this.narrativeAnalysis.assess({ baseline, areas: areaSuites, now, createId });
    const mediaIntelligenceSuite = this.mediaIntelligence.assess({ baseline, areas: areaSuites, now, createId });
    const crisisDetectionSuite = this.crisisDetection.assess({ baseline, areas: areaSuites, now, createId });
    const earlyWarningSuite = this.earlyWarning.assess({ baseline, trends: trendSuite, scenarios: scenarioSuite, now, createId });
    const knowledgeContribution = new ReputationKnowledgeContributionEngine().contribute({ forecasts: forecastSuite, scenarios: scenarioSuite, now, createId });
    const confidence = buildConfidence([
      { key: "evidence", label: "Evidence coverage", contribution: baseline.evidenceCoverage / 100 },
      { key: "forecast", label: "Forecast maturity", contribution: forecastSuite.maturityScore / 100 },
      { key: "scenario", label: "Scenario maturity", contribution: baseline.scenarioMaturity / 100 },
    ]);
    const reasoning = this.reasoner.reason({ request, trends: trendSuite, forecasts: forecastSuite, scenarios: scenarioSuite, confidence });
    const intelligence = new ReputationIntelligence();
    const scores = intelligence.composeScores({
      baseline,
      areas: areaSuites,
      forecast: forecastSuite.maturityScore,
      scenario: baseline.scenarioMaturity,
      analysis: analysisSuite.maturityScore,
      earlyWarning: earlyWarningSuite.score,
      trust: trustSuite.score,
      sentiment: sentimentSuite.score,
      media: mediaIntelligenceSuite.score,
      crisis: crisisDetectionSuite.score,
    });
    const { risks, opportunities } = composeRisksOpportunities(areaSuites, createId);
    const recommendations = new ReputationRecommendationComposer(createId).compose(areaSuites, analysisSuite, scenarioSuite, now);
    const health = composeHealth(scores, baseline, forecastSuite);
    const dashboard = composeDashboard(now, health, baseline, risks, opportunities);
    const commonLens = reputationLens("organization", health.overallScore);

    const trustDashboard = {
      generatedAt: now.toISOString(),
      headline: `Trust index ${Math.round(trustSuite.trustIndex)}`,
      score: trustSuite.score,
      trustIndex: trustSuite.trustIndex,
      signals: trustSuite.records.slice(0, 4).map(r => r.title),
      narrative: trustSuite.narrative,
    };
    const brandReputationDashboard = {
      generatedAt: now.toISOString(),
      headline: `Brand strength ${Math.round(baseline.brandStrength)}`,
      score: areaSuites.brand_reputation.score,
      brandStrength: baseline.brandStrength,
      signals: areaSuites.brand_reputation.records.map(r => r.signal),
      narrative: areaSuites.brand_reputation.narrative,
    };
    const mediaIntelligenceDashboard = {
      generatedAt: now.toISOString(),
      headline: `Media exposure index ${Math.round(mediaIntelligenceSuite.exposureIndex)}`,
      score: mediaIntelligenceSuite.score,
      exposureIndex: mediaIntelligenceSuite.exposureIndex,
      signals: mediaIntelligenceSuite.records.map(r => r.narrative),
      narrative: mediaIntelligenceSuite.narrative,
    };
    const narrativeAnalysisDashboard = {
      generatedAt: now.toISOString(),
      headline: `Narrative momentum ${Math.round(narrativeAnalysisSuite.momentumIndex)}`,
      score: narrativeAnalysisSuite.score,
      momentumIndex: narrativeAnalysisSuite.momentumIndex,
      signals: narrativeAnalysisSuite.records.map(r => r.narrative),
      narrative: narrativeAnalysisSuite.narrative,
    };
    const crisisMonitoringDashboard = {
      generatedAt: now.toISOString(),
      headline: `Crisis index ${Math.round(crisisDetectionSuite.crisisIndex)}`,
      score: crisisDetectionSuite.score,
      crisisIndex: crisisDetectionSuite.crisisIndex,
      signals: crisisDetectionSuite.records.map(r => r.narrative),
      narrative: crisisDetectionSuite.narrative,
    };
    const reputationRecoveryDashboard = {
      generatedAt: now.toISOString(),
      headline: `Recovery capacity ${Math.round(baseline.recoveryCapacity)}`,
      score: areaSuites.reputation_recovery.score,
      recoveryCapacity: baseline.recoveryCapacity,
      signals: areaSuites.reputation_recovery.records.map(r => r.signal),
      narrative: areaSuites.reputation_recovery.narrative,
    };
    const forecastDashboard = {
      generatedAt: now.toISOString(),
      headline: `Reputation Forecast: ${forecastSuite.outlook}`,
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
      trustScore: trustSuite.score,
      mediaScore: mediaIntelligenceSuite.score,
      crisisScore: crisisDetectionSuite.score,
      recommendations: recommendations.map(r => r.title),
      lenses: commonLens,
      narrative: "Board assurance on trust, media, crisis, and long-term reputation outlook.",
    };
    const closedLearningLoop = new ClosedLearningLoop().contribute({ trends: trendSuite, scenarios: scenarioSuite, recommendations, now, createId });
    const projection = new ReputationProjection().project({
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
      id: createId("rep-history"),
      requestId: request.requestId,
      scope,
      status: "assessed" as const,
      healthScore: health.overallScore,
      generatedAt: now.toISOString(),
      summary: brief.headline,
      metadata: request.metadata ?? {},
    };

    const result: ReputationResult = {
      requestId: request.requestId,
      version: REPUTATION_INTELLIGENCE_VERSION,
      generatedAt: now.toISOString(),
      periodLabel: request.periodLabel ?? defaultPeriodLabel(now),
      scope,
      baseline,
      healthScore: scores.healthScore,
      brandReputationScore: scores.areaScores.brand_reputation,
      organizationalTrustScore: scores.areaScores.organizational_trust,
      publicPerceptionScore: scores.areaScores.public_perception,
      customerReputationScore: scores.areaScores.customer_reputation,
      employeeReputationScore: scores.areaScores.employee_reputation,
      executiveReputationScore: scores.areaScores.executive_reputation,
      mediaIntelligenceScore: scores.areaScores.media_intelligence,
      pressCoverageScore: scores.areaScores.press_coverage,
      socialNarrativeScore: scores.areaScores.social_narrative,
      communityReputationScore: scores.areaScores.community_reputation,
      partnerReputationScore: scores.areaScores.partner_reputation,
      investorDonorConfidenceScore: scores.areaScores.investor_donor_confidence,
      regulatoryReputationScore: scores.areaScores.regulatory_reputation,
      crisisReputationScore: scores.areaScores.crisis_reputation,
      misinformationDetectionScore: scores.areaScores.misinformation_detection,
      reputationRecoveryScore: scores.areaScores.reputation_recovery,
      credibilityScore: scores.areaScores.credibility,
      forecastScore: scores.forecastScore,
      scenarioScore: scores.scenarioScore,
      analysisScore: scores.analysisScore,
      earlyWarningScore: scores.earlyWarningScore,
      trustScore: scores.trustScore,
      sentimentScore: scores.sentimentScore,
      mediaScore: scores.mediaScore,
      crisisScore: scores.crisisScore,
      health,
      dashboard,
      trustDashboard,
      brandReputationDashboard,
      mediaIntelligenceDashboard,
      narrativeAnalysisDashboard,
      crisisMonitoringDashboard,
      reputationRecoveryDashboard,
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
      trustSuite,
      sentimentSuite,
      narrativeAnalysisSuite,
      mediaIntelligenceSuite,
      crisisDetectionSuite,
      earlyWarningSuite,
      knowledgeContribution,
      closedLearningLoop,
      reasoning,
      projection,
      historyRecord,
      confidence,
      requestMetadata: { ...(request.metadata ?? {}), registryPublishers: this.registry.list().length },
    };

    this.registry.register("reputation", "reputation_intelligence");
    this.repository.save(result);
    this.repository.saveHistory(historyRecord);
    return result;
  }
}

export {
  ReputationIntelligenceEngineImpl as ReputationIntelligenceEngine,
  ReputationIntelligenceEngineImpl as ReputationEngine,
  ReputationIntelligenceEngineImpl as ReputationEngineImpl,
};
