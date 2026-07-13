import type { StakeholderDependencies, StakeholderEngine as Contract } from "@/lib/platform/intelligence/stakeholder/contracts";
import { defaultCreateId, defaultPeriodLabel, deriveStakeholderBaseline, emptyStakeholderScope, buildConfidence } from "@/lib/platform/intelligence/stakeholder/models";
import { STAKEHOLDER_AREAS, STAKEHOLDER_INTELLIGENCE_VERSION, type StakeholderArea, type StakeholderAreaSuite, type StakeholderRequest, type StakeholderResult } from "@/lib/platform/intelligence/stakeholder/types";
import { StakeholderIdentificationIntelligence } from "@/lib/platform/intelligence/stakeholder/stakeholder-identification-intelligence";
import { StakeholderMappingIntelligence } from "@/lib/platform/intelligence/stakeholder/stakeholder-mapping-intelligence";
import { InfluenceAnalysisIntelligence } from "@/lib/platform/intelligence/stakeholder/influence-analysis-intelligence";
import { InterestAnalysisIntelligence } from "@/lib/platform/intelligence/stakeholder/interest-analysis-intelligence";
import { EngagementIntelligence } from "@/lib/platform/intelligence/stakeholder/engagement-intelligence";
import { CommunicationIntelligence } from "@/lib/platform/intelligence/stakeholder/communication-intelligence";
import { TrustRelationshipIntelligence } from "@/lib/platform/intelligence/stakeholder/trust-relationship-intelligence";
import { BoardStakeholdersIntelligence } from "@/lib/platform/intelligence/stakeholder/board-stakeholders-intelligence";
import { InvestorDonorIntelligence } from "@/lib/platform/intelligence/stakeholder/investor-donor-intelligence";
import { CustomerStakeholdersIntelligence } from "@/lib/platform/intelligence/stakeholder/customer-stakeholders-intelligence";
import { EmployeeStakeholdersIntelligence } from "@/lib/platform/intelligence/stakeholder/employee-stakeholders-intelligence";
import { PartnerStakeholdersIntelligence } from "@/lib/platform/intelligence/stakeholder/partner-stakeholders-intelligence";
import { CommunityStakeholdersIntelligence } from "@/lib/platform/intelligence/stakeholder/community-stakeholders-intelligence";
import { GovernmentStakeholdersIntelligence } from "@/lib/platform/intelligence/stakeholder/government-stakeholders-intelligence";
import { SatisfactionSentimentIntelligence } from "@/lib/platform/intelligence/stakeholder/satisfaction-sentiment-intelligence";
import { ConflictDetectionIntelligence } from "@/lib/platform/intelligence/stakeholder/conflict-detection-intelligence";
import { CollaborationOpportunitiesIntelligence } from "@/lib/platform/intelligence/stakeholder/collaboration-opportunities-intelligence";
import { StakeholderForecastEngine } from "@/lib/platform/intelligence/stakeholder/stakeholder-forecast-engine";
import { StakeholderScenarioEngine } from "@/lib/platform/intelligence/stakeholder/stakeholder-scenario-engine";
import { StakeholderTrendEngine } from "@/lib/platform/intelligence/stakeholder/stakeholder-trend-engine";
import { StakeholderAnalysisEngine } from "@/lib/platform/intelligence/stakeholder/stakeholder-analysis-engine";
import { StakeholderMappingEngine } from "@/lib/platform/intelligence/stakeholder/stakeholder-mapping-engine";
import { InfluenceEngine } from "@/lib/platform/intelligence/stakeholder/influence-engine";
import { RelationshipEngine } from "@/lib/platform/intelligence/stakeholder/relationship-engine";
import { SentimentEngine } from "@/lib/platform/intelligence/stakeholder/sentiment-engine";
import { EngagementEngine } from "@/lib/platform/intelligence/stakeholder/engagement-engine";
import { ConflictDetectionEngine } from "@/lib/platform/intelligence/stakeholder/conflict-detection-engine";
import { EarlyWarningEngine } from "@/lib/platform/intelligence/stakeholder/early-warning-engine";
import { StakeholderKnowledgeContributionEngine } from "@/lib/platform/intelligence/stakeholder/knowledge-contribution";
import { ClosedLearningLoop } from "@/lib/platform/intelligence/stakeholder/closed-learning-loop";
import { StakeholderReasoner } from "@/lib/platform/intelligence/stakeholder/stakeholder-reasoner";
import {
  StakeholderIntelligence, StakeholderRecommendationComposer, composeDashboard, composeHealth,
  composeRisksOpportunities, stakeholderLens,
} from "@/lib/platform/intelligence/stakeholder/stakeholder-intelligence";
import { StakeholderProjection } from "@/lib/platform/intelligence/stakeholder/projection";
import { StakeholderRepositoryStore } from "@/lib/platform/intelligence/stakeholder/repository";
import { StakeholderRegistryStore } from "@/lib/platform/intelligence/stakeholder/stakeholder-registry";
import { StakeholderQueries } from "@/lib/platform/intelligence/stakeholder/projection";

export class StakeholderIntelligenceEngineImpl implements Contract {
  readonly repository; readonly registry; readonly queries;
  private now; private createId; private areas; private forecasts; private scenarios; private trends; private analysis;
  private stakeholderMapping; private influence; private relationship; private sentiment; private engagement; private conflictDetection; private earlyWarning; private reasoner;

  constructor(d: StakeholderDependencies = {}) {
    this.now = d.now ?? (() => new Date());
    this.createId = d.createId ?? defaultCreateId;
    this.repository = d.repository ?? new StakeholderRepositoryStore();
    this.registry = d.registry ?? new StakeholderRegistryStore();
    this.queries = new StakeholderQueries();
    this.areas = {
      stakeholder_identification: new StakeholderIdentificationIntelligence(),
      stakeholder_mapping: new StakeholderMappingIntelligence(),
      influence_analysis: new InfluenceAnalysisIntelligence(),
      interest_analysis: new InterestAnalysisIntelligence(),
      engagement: new EngagementIntelligence(),
      communication: new CommunicationIntelligence(),
      trust_relationship: new TrustRelationshipIntelligence(),
      board_stakeholders: new BoardStakeholdersIntelligence(),
      investor_donor: new InvestorDonorIntelligence(),
      customer_stakeholders: new CustomerStakeholdersIntelligence(),
      employee_stakeholders: new EmployeeStakeholdersIntelligence(),
      partner_stakeholders: new PartnerStakeholdersIntelligence(),
      community_stakeholders: new CommunityStakeholdersIntelligence(),
      government_stakeholders: new GovernmentStakeholdersIntelligence(),
      satisfaction_sentiment: new SatisfactionSentimentIntelligence(),
      conflict_detection: new ConflictDetectionIntelligence(),
      collaboration_opportunities: new CollaborationOpportunitiesIntelligence(),
      ...d.areaIntelligence,
    };
    this.forecasts = d.forecastEngine ?? new StakeholderForecastEngine();
    this.scenarios = d.scenarioEngine ?? new StakeholderScenarioEngine();
    this.trends = d.trendEngine ?? new StakeholderTrendEngine();
    this.analysis = d.analysisEngine ?? new StakeholderAnalysisEngine();
    this.stakeholderMapping = d.stakeholderMappingEngine ?? new StakeholderMappingEngine();
    this.influence = d.influenceEngine ?? new InfluenceEngine();
    this.relationship = d.relationshipEngine ?? new RelationshipEngine();
    this.sentiment = d.sentimentEngine ?? new SentimentEngine();
    this.engagement = d.engagementEngine ?? new EngagementEngine();
    this.conflictDetection = d.conflictDetectionEngine ?? new ConflictDetectionEngine();
    this.earlyWarning = d.earlyWarningEngine ?? new EarlyWarningEngine();
    this.reasoner = d.reasoner ?? new StakeholderReasoner();
  }

  build(request: StakeholderRequest): StakeholderResult {
    const now = this.now();
    const baseline = deriveStakeholderBaseline(request);
    const createId = this.createId;
    const scope = request.scope ?? emptyStakeholderScope();
    const areaSuites = Object.fromEntries(
      STAKEHOLDER_AREAS.map(area => [area, this.areas[area]!.assess({ baseline, now, createId })])
    ) as Record<StakeholderArea, StakeholderAreaSuite>;

    const trendSuite = this.trends.assess({ baseline, areas: areaSuites, now, createId });
    const forecastSuite = this.forecasts.assess({ baseline, areas: areaSuites, now, createId });
    const scenarioSuite = this.scenarios.assess({ baseline, areas: areaSuites, forecasts: forecastSuite, now, createId });
    const analysisSuite = this.analysis.assess({ baseline, areas: areaSuites, forecasts: forecastSuite, scenarios: scenarioSuite, now, createId });
    const stakeholderMappingSuite = this.stakeholderMapping.assess({ baseline, areas: areaSuites, now, createId });
    const influenceSuite = this.influence.assess({ baseline, areas: areaSuites, now, createId });
    const relationshipSuite = this.relationship.assess({ baseline, areas: areaSuites, now, createId });
    const sentimentSuite = this.sentiment.assess({ baseline, areas: areaSuites, now, createId });
    const engagementSuite = this.engagement.assess({ baseline, areas: areaSuites, now, createId });
    const conflictDetectionSuite = this.conflictDetection.assess({ baseline, areas: areaSuites, now, createId });
    const earlyWarningSuite = this.earlyWarning.assess({ baseline, trends: trendSuite, scenarios: scenarioSuite, now, createId });
    const knowledgeContribution = new StakeholderKnowledgeContributionEngine().contribute({ forecasts: forecastSuite, scenarios: scenarioSuite, now, createId });
    const confidence = buildConfidence([
      { key: "evidence", label: "Evidence coverage", contribution: baseline.evidenceCoverage / 100 },
      { key: "forecast", label: "Forecast maturity", contribution: forecastSuite.maturityScore / 100 },
      { key: "scenario", label: "Scenario maturity", contribution: baseline.scenarioMaturity / 100 },
    ]);
    const reasoning = this.reasoner.reason({ request, trends: trendSuite, forecasts: forecastSuite, scenarios: scenarioSuite, confidence });
    const intelligence = new StakeholderIntelligence();
    const scores = intelligence.composeScores({
      baseline,
      areas: areaSuites,
      forecast: forecastSuite.maturityScore,
      scenario: baseline.scenarioMaturity,
      analysis: analysisSuite.maturityScore,
      earlyWarning: earlyWarningSuite.score,
      influence: influenceSuite.score,
      relationship: relationshipSuite.score,
      sentiment: sentimentSuite.score,
    });
    const { risks, opportunities } = composeRisksOpportunities(areaSuites, createId);
    const recommendations = new StakeholderRecommendationComposer(createId).compose(areaSuites, analysisSuite, scenarioSuite, now);
    const health = composeHealth(scores, baseline, forecastSuite);
    const dashboard = composeDashboard(now, health, baseline, risks, opportunities);
    const commonLens = stakeholderLens("organization", health.overallScore);

    const influenceMapDashboard = {
      generatedAt: now.toISOString(),
      headline: `Influence map ${Math.round(influenceSuite.influenceIndex)}`,
      score: influenceSuite.score,
      influenceIndex: influenceSuite.influenceIndex,
      signals: influenceSuite.records.slice(0, 4).map(r => r.title),
      narrative: influenceSuite.narrative,
    };
    const relationshipsDashboard = {
      generatedAt: now.toISOString(),
      headline: `Relationship strength ${Math.round(relationshipSuite.strengthIndex)}`,
      score: relationshipSuite.score,
      strengthIndex: relationshipSuite.strengthIndex,
      signals: relationshipSuite.records.map(r => r.narrative),
      narrative: relationshipSuite.narrative,
    };
    const engagementDashboard = {
      generatedAt: now.toISOString(),
      headline: `Engagement quality ${Math.round(engagementSuite.qualityIndex)}`,
      score: engagementSuite.score,
      qualityIndex: engagementSuite.qualityIndex,
      signals: engagementSuite.records.map(r => r.narrative),
      narrative: engagementSuite.narrative,
    };
    const sentimentDashboard = {
      generatedAt: now.toISOString(),
      headline: `Sentiment index ${Math.round(sentimentSuite.sentimentIndex)}`,
      score: sentimentSuite.score,
      sentimentIndex: sentimentSuite.sentimentIndex,
      signals: sentimentSuite.records.map(r => r.narrative),
      narrative: sentimentSuite.narrative,
    };
    const trustDashboard = {
      generatedAt: now.toISOString(),
      headline: `Trust level ${Math.round(baseline.trustLevel)}`,
      score: areaSuites.trust_relationship.score,
      trustLevel: baseline.trustLevel,
      signals: areaSuites.trust_relationship.records.map(r => r.signal),
      narrative: areaSuites.trust_relationship.narrative,
    };
    const collaborationOpportunitiesDashboard = {
      generatedAt: now.toISOString(),
      headline: `Collaboration opportunities ${Math.round(baseline.collaborationPotential)}`,
      score: areaSuites.collaboration_opportunities.score,
      collaborationPotential: baseline.collaborationPotential,
      signals: areaSuites.collaboration_opportunities.records.map(r => r.signal),
      narrative: areaSuites.collaboration_opportunities.narrative,
    };
    const forecastDashboard = {
      generatedAt: now.toISOString(),
      headline: `Stakeholder Forecast: ${forecastSuite.outlook}`,
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
      influenceScore: influenceSuite.score,
      trustScore: baseline.trustLevel,
      engagementScore: baseline.engagementQuality,
      recommendations: recommendations.map(r => r.title),
      lenses: commonLens,
      narrative: "Board assurance on influence, trust, engagement, and relationship exposure.",
    };
    const closedLearningLoop = new ClosedLearningLoop().contribute({ trends: trendSuite, scenarios: scenarioSuite, recommendations, now, createId });
    const projection = new StakeholderProjection().project({
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
      id: createId("stk-history"),
      requestId: request.requestId,
      scope,
      status: "assessed" as const,
      healthScore: health.overallScore,
      generatedAt: now.toISOString(),
      summary: brief.headline,
      metadata: request.metadata ?? {},
    };

    const result: StakeholderResult = {
      requestId: request.requestId,
      version: STAKEHOLDER_INTELLIGENCE_VERSION,
      generatedAt: now.toISOString(),
      periodLabel: request.periodLabel ?? defaultPeriodLabel(now),
      scope,
      baseline,
      healthScore: scores.healthScore,
      stakeholderIdentificationScore: scores.areaScores.stakeholder_identification,
      stakeholderMappingScore: scores.areaScores.stakeholder_mapping,
      influenceAnalysisScore: scores.areaScores.influence_analysis,
      interestAnalysisScore: scores.areaScores.interest_analysis,
      engagementScore: scores.areaScores.engagement,
      communicationScore: scores.areaScores.communication,
      trustRelationshipScore: scores.areaScores.trust_relationship,
      boardStakeholdersScore: scores.areaScores.board_stakeholders,
      investorDonorScore: scores.areaScores.investor_donor,
      customerStakeholdersScore: scores.areaScores.customer_stakeholders,
      employeeStakeholdersScore: scores.areaScores.employee_stakeholders,
      partnerStakeholdersScore: scores.areaScores.partner_stakeholders,
      communityStakeholdersScore: scores.areaScores.community_stakeholders,
      governmentStakeholdersScore: scores.areaScores.government_stakeholders,
      satisfactionSentimentScore: scores.areaScores.satisfaction_sentiment,
      conflictDetectionScore: scores.areaScores.conflict_detection,
      collaborationOpportunitiesScore: scores.areaScores.collaboration_opportunities,
      forecastScore: scores.forecastScore,
      scenarioScore: scores.scenarioScore,
      analysisScore: scores.analysisScore,
      earlyWarningScore: scores.earlyWarningScore,
      influenceScore: scores.influenceScore,
      relationshipScore: scores.relationshipScore,
      sentimentScore: scores.sentimentScore,
      health,
      dashboard,
      influenceMapDashboard,
      relationshipsDashboard,
      engagementDashboard,
      sentimentDashboard,
      trustDashboard,
      collaborationOpportunitiesDashboard,
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
      stakeholderMappingSuite,
      influenceSuite,
      relationshipSuite,
      sentimentSuite,
      engagementSuite,
      conflictDetectionSuite,
      earlyWarningSuite,
      knowledgeContribution,
      closedLearningLoop,
      reasoning,
      projection,
      historyRecord,
      confidence,
      requestMetadata: { ...(request.metadata ?? {}), registryPublishers: this.registry.list().length },
    };

    this.registry.register("stakeholder", "stakeholder_intelligence");
    this.repository.save(result);
    this.repository.saveHistory(historyRecord);
    return result;
  }
}

export {
  StakeholderIntelligenceEngineImpl as StakeholderIntelligenceEngine,
  StakeholderIntelligenceEngineImpl as StakeholderEngine,
  StakeholderIntelligenceEngineImpl as StakeholderEngineImpl,
};
