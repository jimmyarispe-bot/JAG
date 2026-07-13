import type { EcosystemDependencies, EcosystemEngine as Contract } from "@/lib/platform/intelligence/ecosystem/contracts";
import { defaultCreateId, defaultPeriodLabel, deriveEcosystemBaseline, emptyEcosystemScope, buildConfidence } from "@/lib/platform/intelligence/ecosystem/models";
import { ECOSYSTEM_AREAS, ECOSYSTEM_INTELLIGENCE_VERSION, type EcosystemArea, type EcosystemAreaSuite, type EcosystemRequest, type EcosystemResult } from "@/lib/platform/intelligence/ecosystem/types";
import { EcosystemMappingIntelligence } from "@/lib/platform/intelligence/ecosystem/ecosystem-mapping-intelligence";
import { StrategicPartnershipsIntelligence } from "@/lib/platform/intelligence/ecosystem/strategic-partnerships-intelligence";
import { SupplierEcosystemsIntelligence } from "@/lib/platform/intelligence/ecosystem/supplier-ecosystems-intelligence";
import { CustomerEcosystemsIntelligence } from "@/lib/platform/intelligence/ecosystem/customer-ecosystems-intelligence";
import { CommunityNetworksIntelligence } from "@/lib/platform/intelligence/ecosystem/community-networks-intelligence";
import { IndustryNetworksIntelligence } from "@/lib/platform/intelligence/ecosystem/industry-networks-intelligence";
import { TechnologyEcosystemsIntelligence } from "@/lib/platform/intelligence/ecosystem/technology-ecosystems-intelligence";
import { AcademicResearchPartnershipsIntelligence } from "@/lib/platform/intelligence/ecosystem/academic-research-partnerships-intelligence";
import { GovernmentEcosystemsIntelligence } from "@/lib/platform/intelligence/ecosystem/government-ecosystems-intelligence";
import { InvestorFundingNetworksIntelligence } from "@/lib/platform/intelligence/ecosystem/investor-funding-networks-intelligence";
import { NonprofitNgoRelationshipsIntelligence } from "@/lib/platform/intelligence/ecosystem/nonprofit-ngo-relationships-intelligence";
import { PlatformEcosystemsIntelligence } from "@/lib/platform/intelligence/ecosystem/platform-ecosystems-intelligence";
import { AllianceIntelligence } from "@/lib/platform/intelligence/ecosystem/alliance-intelligence";
import { NetworkEffectsIntelligence } from "@/lib/platform/intelligence/ecosystem/network-effects-intelligence";
import { EcosystemDependenciesIntelligence } from "@/lib/platform/intelligence/ecosystem/ecosystem-dependencies-intelligence";
import { CollaborationOpportunitiesIntelligence } from "@/lib/platform/intelligence/ecosystem/collaboration-opportunities-intelligence";
import { EcosystemRiskIntelligence } from "@/lib/platform/intelligence/ecosystem/ecosystem-risk-intelligence";
import { EcosystemForecastEngine } from "@/lib/platform/intelligence/ecosystem/ecosystem-forecast-engine";
import { EcosystemScenarioEngine } from "@/lib/platform/intelligence/ecosystem/ecosystem-scenario-engine";
import { EcosystemTrendEngine } from "@/lib/platform/intelligence/ecosystem/ecosystem-trend-engine";
import { EcosystemAnalysisEngine } from "@/lib/platform/intelligence/ecosystem/ecosystem-analysis-engine";
import { NetworkMappingEngine } from "@/lib/platform/intelligence/ecosystem/network-mapping-engine";
import { PartnershipEngine } from "@/lib/platform/intelligence/ecosystem/partnership-engine";
import { DependencyEngine } from "@/lib/platform/intelligence/ecosystem/dependency-engine";
import { CollaborationEngine } from "@/lib/platform/intelligence/ecosystem/collaboration-engine";
import { NetworkEffectEngine } from "@/lib/platform/intelligence/ecosystem/network-effect-engine";
import { EarlyWarningEngine } from "@/lib/platform/intelligence/ecosystem/early-warning-engine";
import { EcosystemKnowledgeContributionEngine } from "@/lib/platform/intelligence/ecosystem/knowledge-contribution";
import { ClosedLearningLoop } from "@/lib/platform/intelligence/ecosystem/closed-learning-loop";
import { EcosystemReasoner } from "@/lib/platform/intelligence/ecosystem/ecosystem-reasoner";
import {
  EcosystemIntelligence, EcosystemRecommendationComposer, composeDashboard, composeHealth,
  composeRisksOpportunities, ecosystemLens,
} from "@/lib/platform/intelligence/ecosystem/ecosystem-intelligence";
import { EcosystemProjection } from "@/lib/platform/intelligence/ecosystem/projection";
import { EcosystemRepositoryStore } from "@/lib/platform/intelligence/ecosystem/repository";
import { EcosystemRegistryStore } from "@/lib/platform/intelligence/ecosystem/ecosystem-registry";
import { EcosystemQueries } from "@/lib/platform/intelligence/ecosystem/projection";

export class EcosystemIntelligenceEngineImpl implements Contract {
  readonly repository; readonly registry; readonly queries;
  private now; private createId; private areas; private forecasts; private scenarios; private trends; private analysis;
  private networkMapping; private partnership; private dependency; private collaboration; private networkEffect; private earlyWarning; private reasoner;

  constructor(d: EcosystemDependencies = {}) {
    this.now = d.now ?? (() => new Date());
    this.createId = d.createId ?? defaultCreateId;
    this.repository = d.repository ?? new EcosystemRepositoryStore();
    this.registry = d.registry ?? new EcosystemRegistryStore();
    this.queries = new EcosystemQueries();
    this.areas = {
      ecosystem_mapping: new EcosystemMappingIntelligence(),
      strategic_partnerships: new StrategicPartnershipsIntelligence(),
      supplier_ecosystems: new SupplierEcosystemsIntelligence(),
      customer_ecosystems: new CustomerEcosystemsIntelligence(),
      community_networks: new CommunityNetworksIntelligence(),
      industry_networks: new IndustryNetworksIntelligence(),
      technology_ecosystems: new TechnologyEcosystemsIntelligence(),
      academic_research_partnerships: new AcademicResearchPartnershipsIntelligence(),
      government_ecosystems: new GovernmentEcosystemsIntelligence(),
      investor_funding_networks: new InvestorFundingNetworksIntelligence(),
      nonprofit_ngo_relationships: new NonprofitNgoRelationshipsIntelligence(),
      platform_ecosystems: new PlatformEcosystemsIntelligence(),
      alliance_intelligence: new AllianceIntelligence(),
      network_effects: new NetworkEffectsIntelligence(),
      ecosystem_dependencies: new EcosystemDependenciesIntelligence(),
      collaboration_opportunities: new CollaborationOpportunitiesIntelligence(),
      ecosystem_risk: new EcosystemRiskIntelligence(),
      ...d.areaIntelligence,
    };
    this.forecasts = d.forecastEngine ?? new EcosystemForecastEngine();
    this.scenarios = d.scenarioEngine ?? new EcosystemScenarioEngine();
    this.trends = d.trendEngine ?? new EcosystemTrendEngine();
    this.analysis = d.analysisEngine ?? new EcosystemAnalysisEngine();
    this.networkMapping = d.networkMappingEngine ?? new NetworkMappingEngine();
    this.partnership = d.partnershipEngine ?? new PartnershipEngine();
    this.dependency = d.dependencyEngine ?? new DependencyEngine();
    this.collaboration = d.collaborationEngine ?? new CollaborationEngine();
    this.networkEffect = d.networkEffectEngine ?? new NetworkEffectEngine();
    this.earlyWarning = d.earlyWarningEngine ?? new EarlyWarningEngine();
    this.reasoner = d.reasoner ?? new EcosystemReasoner();
  }

  build(request: EcosystemRequest): EcosystemResult {
    const now = this.now();
    const baseline = deriveEcosystemBaseline(request);
    const createId = this.createId;
    const scope = request.scope ?? emptyEcosystemScope();
    const areaSuites = Object.fromEntries(
      ECOSYSTEM_AREAS.map(area => [area, this.areas[area]!.assess({ baseline, now, createId })])
    ) as Record<EcosystemArea, EcosystemAreaSuite>;

    const trendSuite = this.trends.assess({ baseline, areas: areaSuites, now, createId });
    const forecastSuite = this.forecasts.assess({ baseline, areas: areaSuites, now, createId });
    const scenarioSuite = this.scenarios.assess({ baseline, areas: areaSuites, forecasts: forecastSuite, now, createId });
    const analysisSuite = this.analysis.assess({ baseline, areas: areaSuites, forecasts: forecastSuite, scenarios: scenarioSuite, now, createId });
    const networkMappingSuite = this.networkMapping.assess({ baseline, areas: areaSuites, now, createId });
    const partnershipSuite = this.partnership.assess({ baseline, areas: areaSuites, now, createId });
    const dependencySuite = this.dependency.assess({ baseline, areas: areaSuites, now, createId });
    const collaborationSuite = this.collaboration.assess({ baseline, areas: areaSuites, now, createId });
    const networkEffectSuite = this.networkEffect.assess({ baseline, areas: areaSuites, now, createId });
    const earlyWarningSuite = this.earlyWarning.assess({ baseline, trends: trendSuite, scenarios: scenarioSuite, now, createId });
    const knowledgeContribution = new EcosystemKnowledgeContributionEngine().contribute({ forecasts: forecastSuite, scenarios: scenarioSuite, now, createId });
    const confidence = buildConfidence([
      { key: "evidence", label: "Evidence coverage", contribution: baseline.evidenceCoverage / 100 },
      { key: "forecast", label: "Forecast maturity", contribution: forecastSuite.maturityScore / 100 },
      { key: "scenario", label: "Scenario maturity", contribution: baseline.scenarioMaturity / 100 },
    ]);
    const reasoning = this.reasoner.reason({ request, trends: trendSuite, forecasts: forecastSuite, scenarios: scenarioSuite, confidence });
    const intelligence = new EcosystemIntelligence();
    const scores = intelligence.composeScores({
      baseline,
      areas: areaSuites,
      forecast: forecastSuite.maturityScore,
      scenario: baseline.scenarioMaturity,
      analysis: analysisSuite.maturityScore,
      earlyWarning: earlyWarningSuite.score,
      networkMapping: networkMappingSuite.score,
      partnership: partnershipSuite.score,
      dependency: dependencySuite.score,
      collaboration: collaborationSuite.score,
      networkEffect: networkEffectSuite.score,
    });
    const { risks, opportunities } = composeRisksOpportunities(areaSuites, createId);
    const recommendations = new EcosystemRecommendationComposer(createId).compose(areaSuites, analysisSuite, scenarioSuite, now);
    const health = composeHealth(scores, baseline, forecastSuite);
    const dashboard = composeDashboard(now, health, baseline, risks, opportunities);
    const commonLens = ecosystemLens("organization", health.overallScore);

    const ecosystemMapDashboard = {
      generatedAt: now.toISOString(),
      headline: `Ecosystem map index ${Math.round(networkMappingSuite.mappingIndex)}`,
      score: networkMappingSuite.score,
      mappingIndex: networkMappingSuite.mappingIndex,
      signals: networkMappingSuite.records.slice(0, 4).map(r => r.title),
      narrative: networkMappingSuite.narrative,
    };
    const strategicPartnershipsDashboard = {
      generatedAt: now.toISOString(),
      headline: `Strategic partnerships index ${Math.round(partnershipSuite.partnershipIndex)}`,
      score: partnershipSuite.score,
      partnershipIndex: partnershipSuite.partnershipIndex,
      signals: partnershipSuite.records.map(r => r.narrative),
      narrative: partnershipSuite.narrative,
    };
    const alliancesDashboard = {
      generatedAt: now.toISOString(),
      headline: `Alliances ${Math.round(areaSuites.alliance_intelligence.score)}`,
      score: areaSuites.alliance_intelligence.score,
      allianceIndex: areaSuites.alliance_intelligence.score,
      signals: areaSuites.alliance_intelligence.records.map(r => r.signal),
      narrative: areaSuites.alliance_intelligence.narrative,
    };
    const dependenciesDashboard = {
      generatedAt: now.toISOString(),
      headline: `Dependencies index ${Math.round(dependencySuite.dependencyIndex)}`,
      score: dependencySuite.score,
      dependencyIndex: dependencySuite.dependencyIndex,
      signals: dependencySuite.records.map(r => r.narrative),
      narrative: dependencySuite.narrative,
    };
    const collaborationOpportunitiesDashboard = {
      generatedAt: now.toISOString(),
      headline: `Collaboration opportunities ${Math.round(collaborationSuite.collaborationIndex)}`,
      score: collaborationSuite.score,
      collaborationIndex: collaborationSuite.collaborationIndex,
      signals: collaborationSuite.records.map(r => r.narrative),
      narrative: collaborationSuite.narrative,
    };
    const ecosystemHealthDashboard = {
      generatedAt: now.toISOString(),
      headline: `Ecosystem health ${Math.round(baseline.ecosystemHealth)}`,
      score: baseline.ecosystemHealth,
      healthIndex: baseline.ecosystemHealth,
      signals: [...areaSuites.ecosystem_mapping.records, ...areaSuites.ecosystem_risk.records].slice(0, 4).map(r => r.signal),
      narrative: `Ecosystem health ${Math.round(baseline.ecosystemHealth)}; risk ${Math.round(areaSuites.ecosystem_risk.score)}.`,
    };
    const forecastDashboard = {
      generatedAt: now.toISOString(),
      headline: `Ecosystem Forecast: ${forecastSuite.outlook}`,
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
      partnershipScore: partnershipSuite.score,
      dependencyScore: dependencySuite.score,
      networkEffectScore: networkEffectSuite.score,
      recommendations: recommendations.map(r => r.title),
      lenses: commonLens,
      narrative: "Board assurance on partnerships, dependencies, network effects, and long-term ecosystem position.",
    };
    const closedLearningLoop = new ClosedLearningLoop().contribute({ trends: trendSuite, scenarios: scenarioSuite, recommendations, now, createId });
    const projection = new EcosystemProjection().project({
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
      id: createId("esm-history"),
      requestId: request.requestId,
      scope,
      status: "assessed" as const,
      healthScore: health.overallScore,
      generatedAt: now.toISOString(),
      summary: brief.headline,
      metadata: request.metadata ?? {},
    };

    const result: EcosystemResult = {
      requestId: request.requestId,
      version: ECOSYSTEM_INTELLIGENCE_VERSION,
      generatedAt: now.toISOString(),
      periodLabel: request.periodLabel ?? defaultPeriodLabel(now),
      scope,
      baseline,
      healthScore: scores.healthScore,
      ecosystemMappingScore: scores.areaScores.ecosystem_mapping,
      strategicPartnershipsScore: scores.areaScores.strategic_partnerships,
      supplierEcosystemsScore: scores.areaScores.supplier_ecosystems,
      customerEcosystemsScore: scores.areaScores.customer_ecosystems,
      communityNetworksScore: scores.areaScores.community_networks,
      industryNetworksScore: scores.areaScores.industry_networks,
      technologyEcosystemsScore: scores.areaScores.technology_ecosystems,
      academicResearchPartnershipsScore: scores.areaScores.academic_research_partnerships,
      governmentEcosystemsScore: scores.areaScores.government_ecosystems,
      investorFundingNetworksScore: scores.areaScores.investor_funding_networks,
      nonprofitNgoRelationshipsScore: scores.areaScores.nonprofit_ngo_relationships,
      platformEcosystemsScore: scores.areaScores.platform_ecosystems,
      allianceIntelligenceScore: scores.areaScores.alliance_intelligence,
      networkEffectsScore: scores.areaScores.network_effects,
      ecosystemDependenciesScore: scores.areaScores.ecosystem_dependencies,
      collaborationOpportunitiesScore: scores.areaScores.collaboration_opportunities,
      ecosystemRiskScore: scores.areaScores.ecosystem_risk,
      forecastScore: scores.forecastScore,
      scenarioScore: scores.scenarioScore,
      analysisScore: scores.analysisScore,
      earlyWarningScore: scores.earlyWarningScore,
      networkMappingScore: scores.networkMappingScore,
      partnershipScore: scores.partnershipScore,
      dependencyScore: scores.dependencyScore,
      collaborationScore: scores.collaborationScore,
      networkEffectScore: scores.networkEffectScore,
      health,
      dashboard,
      ecosystemMapDashboard,
      strategicPartnershipsDashboard,
      alliancesDashboard,
      dependenciesDashboard,
      collaborationOpportunitiesDashboard,
      ecosystemHealthDashboard,
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
      networkMappingSuite,
      partnershipSuite,
      dependencySuite,
      collaborationSuite,
      networkEffectSuite,
      earlyWarningSuite,
      knowledgeContribution,
      closedLearningLoop,
      reasoning,
      projection,
      historyRecord,
      confidence,
      requestMetadata: { ...(request.metadata ?? {}), registryPublishers: this.registry.list().length },
    };

    this.registry.register("ecosystem", "ecosystem_intelligence");
    this.repository.save(result);
    this.repository.saveHistory(historyRecord);
    return result;
  }
}

export {
  EcosystemIntelligenceEngineImpl as EcosystemIntelligenceEngine,
  EcosystemIntelligenceEngineImpl as EcosystemEngine,
  EcosystemIntelligenceEngineImpl as EcosystemEngineImpl,
};
