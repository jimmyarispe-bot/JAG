import type { PoliticalDependencies, PoliticalEngine as Contract } from "@/lib/platform/intelligence/political/contracts";
import { defaultCreateId, defaultPeriodLabel, derivePoliticalBaseline, emptyPoliticalScope, buildConfidence } from "@/lib/platform/intelligence/political/models";
import { POLITICAL_AREAS, POLITICAL_INTELLIGENCE_VERSION, type PoliticalArea, type PoliticalAreaSuite, type PoliticalRequest, type PoliticalResult } from "@/lib/platform/intelligence/political/types";
import { LegislativeIntelligence } from "@/lib/platform/intelligence/political/legislative-intelligence";
import { RegulatoryIntelligence } from "@/lib/platform/intelligence/political/regulatory-intelligence";
import { GovernmentPolicyIntelligence } from "@/lib/platform/intelligence/political/government-policy-intelligence";
import { ElectionsLeadershipIntelligence } from "@/lib/platform/intelligence/political/elections-leadership-intelligence";
import { PublicFundingIntelligence } from "@/lib/platform/intelligence/political/public-funding-intelligence";
import { TaxPolicyIntelligence } from "@/lib/platform/intelligence/political/tax-policy-intelligence";
import { EducationPolicyIntelligence } from "@/lib/platform/intelligence/political/education-policy-intelligence";
import { HealthcarePolicyIntelligence } from "@/lib/platform/intelligence/political/healthcare-policy-intelligence";
import { LaborEmploymentPolicyIntelligence } from "@/lib/platform/intelligence/political/labor-employment-policy-intelligence";
import { InternationalRelationsIntelligence } from "@/lib/platform/intelligence/political/international-relations-intelligence";
import { TradeTariffsIntelligence } from "@/lib/platform/intelligence/political/trade-tariffs-intelligence";
import { ImmigrationPolicyIntelligence } from "@/lib/platform/intelligence/political/immigration-policy-intelligence";
import { JudicialDecisionsIntelligence } from "@/lib/platform/intelligence/political/judicial-decisions-intelligence";
import { GovernmentContractingIntelligence } from "@/lib/platform/intelligence/political/government-contracting-intelligence";
import { PublicSentimentIntelligence } from "@/lib/platform/intelligence/political/public-sentiment-intelligence";
import { LobbyingAdvocacyIntelligence } from "@/lib/platform/intelligence/political/lobbying-advocacy-intelligence";
import { GeopoliticalRiskIntelligence } from "@/lib/platform/intelligence/political/geopolitical-risk-intelligence";
import { PoliticalForecastEngine } from "@/lib/platform/intelligence/political/political-forecast-engine";
import { PoliticalScenarioEngine } from "@/lib/platform/intelligence/political/political-scenario-engine";
import { PoliticalTrendEngine } from "@/lib/platform/intelligence/political/political-trend-engine";
import { PoliticalAnalysisEngine } from "@/lib/platform/intelligence/political/political-analysis-engine";
import { LegislativeTrackingEngine } from "@/lib/platform/intelligence/political/legislative-tracking-engine";
import { RegulatoryImpactEngine } from "@/lib/platform/intelligence/political/regulatory-impact-engine";
import { PoliticalRiskEngine } from "@/lib/platform/intelligence/political/political-risk-engine";
import { GovernmentFundingEngine } from "@/lib/platform/intelligence/political/government-funding-engine";
import { EarlyWarningEngine } from "@/lib/platform/intelligence/political/early-warning-engine";
import { PoliticalKnowledgeContributionEngine } from "@/lib/platform/intelligence/political/knowledge-contribution";
import { ClosedLearningLoop } from "@/lib/platform/intelligence/political/closed-learning-loop";
import { PoliticalReasoner } from "@/lib/platform/intelligence/political/political-reasoner";
import {
  PoliticalIntelligence, PoliticalRecommendationComposer, composeDashboard, composeHealth,
  composeRisksOpportunities, politicalLens,
} from "@/lib/platform/intelligence/political/political-intelligence";
import { PoliticalProjection } from "@/lib/platform/intelligence/political/projection";
import { PoliticalRepositoryStore } from "@/lib/platform/intelligence/political/repository";
import { PoliticalRegistryStore } from "@/lib/platform/intelligence/political/political-registry";
import { PoliticalQueries } from "@/lib/platform/intelligence/political/projection";

export class PoliticalIntelligenceEngineImpl implements Contract {
  readonly repository; readonly registry; readonly queries;
  private now; private createId; private areas; private forecasts; private scenarios; private trends; private analysis;
  private legislativeTracking; private regulatoryImpact; private politicalRisk; private governmentFunding; private earlyWarning; private reasoner;

  constructor(d: PoliticalDependencies = {}) {
    this.now = d.now ?? (() => new Date());
    this.createId = d.createId ?? defaultCreateId;
    this.repository = d.repository ?? new PoliticalRepositoryStore();
    this.registry = d.registry ?? new PoliticalRegistryStore();
    this.queries = new PoliticalQueries();
    this.areas = {
      legislative: new LegislativeIntelligence(),
      regulatory: new RegulatoryIntelligence(),
      government_policy: new GovernmentPolicyIntelligence(),
      elections_leadership: new ElectionsLeadershipIntelligence(),
      public_funding: new PublicFundingIntelligence(),
      tax_policy: new TaxPolicyIntelligence(),
      education_policy: new EducationPolicyIntelligence(),
      healthcare_policy: new HealthcarePolicyIntelligence(),
      labor_employment_policy: new LaborEmploymentPolicyIntelligence(),
      international_relations: new InternationalRelationsIntelligence(),
      trade_tariffs: new TradeTariffsIntelligence(),
      immigration_policy: new ImmigrationPolicyIntelligence(),
      judicial_decisions: new JudicialDecisionsIntelligence(),
      government_contracting: new GovernmentContractingIntelligence(),
      public_sentiment: new PublicSentimentIntelligence(),
      lobbying_advocacy: new LobbyingAdvocacyIntelligence(),
      geopolitical_risk: new GeopoliticalRiskIntelligence(),
      ...d.areaIntelligence,
    };
    this.forecasts = d.forecastEngine ?? new PoliticalForecastEngine();
    this.scenarios = d.scenarioEngine ?? new PoliticalScenarioEngine();
    this.trends = d.trendEngine ?? new PoliticalTrendEngine();
    this.analysis = d.analysisEngine ?? new PoliticalAnalysisEngine();
    this.legislativeTracking = d.legislativeTrackingEngine ?? new LegislativeTrackingEngine();
    this.regulatoryImpact = d.regulatoryImpactEngine ?? new RegulatoryImpactEngine();
    this.politicalRisk = d.politicalRiskEngine ?? new PoliticalRiskEngine();
    this.governmentFunding = d.governmentFundingEngine ?? new GovernmentFundingEngine();
    this.earlyWarning = d.earlyWarningEngine ?? new EarlyWarningEngine();
    this.reasoner = d.reasoner ?? new PoliticalReasoner();
  }

  build(request: PoliticalRequest): PoliticalResult {
    const now = this.now();
    const baseline = derivePoliticalBaseline(request);
    const createId = this.createId;
    const scope = request.scope ?? emptyPoliticalScope();
    const areaSuites = Object.fromEntries(
      POLITICAL_AREAS.map(area => [area, this.areas[area]!.assess({ baseline, now, createId })])
    ) as Record<PoliticalArea, PoliticalAreaSuite>;

    const trendSuite = this.trends.assess({ baseline, areas: areaSuites, now, createId });
    const forecastSuite = this.forecasts.assess({ baseline, areas: areaSuites, now, createId });
    const scenarioSuite = this.scenarios.assess({ baseline, areas: areaSuites, forecasts: forecastSuite, now, createId });
    const analysisSuite = this.analysis.assess({ baseline, areas: areaSuites, forecasts: forecastSuite, scenarios: scenarioSuite, now, createId });
    const legislativeTrackingSuite = this.legislativeTracking.assess({ baseline, areas: areaSuites, now, createId });
    const regulatoryImpactSuite = this.regulatoryImpact.assess({ baseline, areas: areaSuites, now, createId });
    const politicalRiskSuite = this.politicalRisk.assess({ baseline, areas: areaSuites, now, createId });
    const governmentFundingSuite = this.governmentFunding.assess({ baseline, areas: areaSuites, now, createId });
    const earlyWarningSuite = this.earlyWarning.assess({ baseline, trends: trendSuite, scenarios: scenarioSuite, now, createId });
    const knowledgeContribution = new PoliticalKnowledgeContributionEngine().contribute({ forecasts: forecastSuite, scenarios: scenarioSuite, now, createId });
    const confidence = buildConfidence([
      { key: "evidence", label: "Evidence coverage", contribution: baseline.evidenceCoverage / 100 },
      { key: "forecast", label: "Forecast maturity", contribution: forecastSuite.maturityScore / 100 },
      { key: "scenario", label: "Scenario maturity", contribution: baseline.scenarioMaturity / 100 },
    ]);
    const reasoning = this.reasoner.reason({ request, trends: trendSuite, forecasts: forecastSuite, scenarios: scenarioSuite, confidence });
    const intelligence = new PoliticalIntelligence();
    const scores = intelligence.composeScores({
      baseline,
      areas: areaSuites,
      forecast: forecastSuite.maturityScore,
      scenario: baseline.scenarioMaturity,
      analysis: analysisSuite.maturityScore,
      earlyWarning: earlyWarningSuite.score,
      politicalRisk: politicalRiskSuite.score,
    });
    const { risks, opportunities } = composeRisksOpportunities(areaSuites, createId);
    const recommendations = new PoliticalRecommendationComposer(createId).compose(areaSuites, analysisSuite, scenarioSuite, now);
    const health = composeHealth(scores, baseline, forecastSuite);
    const dashboard = composeDashboard(now, health, baseline, risks, opportunities);
    const commonLens = politicalLens("organization", health.overallScore);

    const outlookDashboard = {
      generatedAt: now.toISOString(),
      headline: `Government outlook ${forecastSuite.outlook}`,
      outlook: forecastSuite.outlook,
      overall: health.overallScore,
      primaryScenario: scenarioSuite.primaryScenario,
      narrative: scenarioSuite.narrative,
    };
    const regulatoryDashboard = {
      generatedAt: now.toISOString(),
      headline: `Regulatory burden ${Math.round(baseline.regulatoryBurden)}`,
      score: areaSuites.regulatory.score,
      pressure: baseline.regulatoryBurden,
      signals: areaSuites.regulatory.records.map(r => r.signal),
      narrative: regulatoryImpactSuite.narrative,
    };
    const legislativeDashboard = {
      generatedAt: now.toISOString(),
      headline: `Legislative tracking: ${legislativeTrackingSuite.activeCount} active signals`,
      score: areaSuites.legislative.score,
      activeBills: legislativeTrackingSuite.activeCount,
      signals: legislativeTrackingSuite.records.map(r => r.narrative),
      narrative: legislativeTrackingSuite.narrative,
    };
    const fundingOpportunitiesDashboard = {
      generatedAt: now.toISOString(),
      headline: `Funding opportunity index ${Math.round(baseline.fundingOpportunity)}`,
      score: areaSuites.public_funding.score,
      opportunityIndex: baseline.fundingOpportunity,
      signals: governmentFundingSuite.records.map(r => r.narrative),
      narrative: governmentFundingSuite.narrative,
    };
    const politicalRiskDashboard = {
      generatedAt: now.toISOString(),
      headline: `Political risk ${Math.round(politicalRiskSuite.aggregateRisk)}`,
      score: politicalRiskSuite.score,
      aggregateRisk: politicalRiskSuite.aggregateRisk,
      signals: politicalRiskSuite.records.slice(0, 4).map(r => r.title),
      narrative: politicalRiskSuite.narrative,
    };
    const tradeInternationalDashboard = {
      generatedAt: now.toISOString(),
      headline: `Trade and international posture ${Math.round(areaSuites.trade_tariffs.score)}`,
      score: areaSuites.trade_tariffs.score,
      tradeImpact: 100 - areaSuites.trade_tariffs.score,
      signals: [
        ...areaSuites.trade_tariffs.records.map(r => r.signal),
        ...areaSuites.international_relations.records.map(r => r.signal),
      ],
      narrative: areaSuites.trade_tariffs.narrative,
    };
    const electionImpactDashboard = {
      generatedAt: now.toISOString(),
      headline: `Election impact ${Math.round(areaSuites.elections_leadership.score)}`,
      score: areaSuites.elections_leadership.score,
      turnoverRisk: 100 - areaSuites.elections_leadership.score,
      signals: areaSuites.elections_leadership.records.map(r => r.signal),
      narrative: areaSuites.elections_leadership.narrative,
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
      headline: `Board Political Report: ${dashboard.headline}`,
      assuranceSummary: `Evidence coverage ${Math.round(baseline.evidenceCoverage)}; primary scenario ${scenarioSuite.primaryScenario.replaceAll("_", " ")}.`,
      healthScore: health.overallScore,
      outlook: forecastSuite.outlook,
      legislativeScore: areaSuites.legislative.score,
      regulatoryScore: areaSuites.regulatory.score,
      fundingOpportunity: baseline.fundingOpportunity,
      recommendations: recommendations.map(r => r.title),
      lenses: commonLens,
      narrative: "Board assurance on legislative, regulatory, funding, and geopolitical exposure.",
    };
    const closedLearningLoop = new ClosedLearningLoop().contribute({ trends: trendSuite, scenarios: scenarioSuite, recommendations, now, createId });
    const projection = new PoliticalProjection().project({
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
      id: createId("pol-history"),
      requestId: request.requestId,
      scope,
      status: "assessed" as const,
      healthScore: health.overallScore,
      generatedAt: now.toISOString(),
      summary: brief.headline,
      metadata: request.metadata ?? {},
    };

    const result: PoliticalResult = {
      requestId: request.requestId,
      version: POLITICAL_INTELLIGENCE_VERSION,
      generatedAt: now.toISOString(),
      periodLabel: request.periodLabel ?? defaultPeriodLabel(now),
      scope,
      baseline,
      healthScore: scores.healthScore,
      legislativeScore: scores.areaScores.legislative,
      regulatoryScore: scores.areaScores.regulatory,
      governmentPolicyScore: scores.areaScores.government_policy,
      electionsLeadershipScore: scores.areaScores.elections_leadership,
      publicFundingScore: scores.areaScores.public_funding,
      taxPolicyScore: scores.areaScores.tax_policy,
      educationPolicyScore: scores.areaScores.education_policy,
      healthcarePolicyScore: scores.areaScores.healthcare_policy,
      laborEmploymentPolicyScore: scores.areaScores.labor_employment_policy,
      internationalRelationsScore: scores.areaScores.international_relations,
      tradeTariffsScore: scores.areaScores.trade_tariffs,
      immigrationPolicyScore: scores.areaScores.immigration_policy,
      judicialDecisionsScore: scores.areaScores.judicial_decisions,
      governmentContractingScore: scores.areaScores.government_contracting,
      publicSentimentScore: scores.areaScores.public_sentiment,
      lobbyingAdvocacyScore: scores.areaScores.lobbying_advocacy,
      geopoliticalRiskScore: scores.areaScores.geopolitical_risk,
      forecastScore: scores.forecastScore,
      scenarioScore: scores.scenarioScore,
      analysisScore: scores.analysisScore,
      earlyWarningScore: scores.earlyWarningScore,
      politicalRiskScore: scores.politicalRiskScore,
      health,
      dashboard,
      outlookDashboard,
      regulatoryDashboard,
      legislativeDashboard,
      fundingOpportunitiesDashboard,
      politicalRiskDashboard,
      tradeInternationalDashboard,
      electionImpactDashboard,
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
      legislativeTrackingSuite,
      regulatoryImpactSuite,
      politicalRiskSuite,
      governmentFundingSuite,
      earlyWarningSuite,
      knowledgeContribution,
      closedLearningLoop,
      reasoning,
      projection,
      historyRecord,
      confidence,
      requestMetadata: { ...(request.metadata ?? {}), registryPublishers: this.registry.list().length },
    };

    this.registry.register("political", "political_intelligence");
    this.repository.save(result);
    this.repository.saveHistory(historyRecord);
    return result;
  }
}

export {
  PoliticalIntelligenceEngineImpl as PoliticalIntelligenceEngine,
  PoliticalIntelligenceEngineImpl as PoliticalEngine,
  PoliticalIntelligenceEngineImpl as PoliticalEngineImpl,
};
