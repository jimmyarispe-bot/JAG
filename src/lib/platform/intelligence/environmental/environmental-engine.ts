import type { EnvironmentalDependencies, EnvironmentalEngine as Contract } from "@/lib/platform/intelligence/environmental/contracts";
import { defaultCreateId, defaultPeriodLabel, deriveEnvironmentalBaseline, emptyEnvironmentalScope, buildConfidence } from "@/lib/platform/intelligence/environmental/models";
import { ENVIRONMENTAL_AREAS, ENVIRONMENTAL_INTELLIGENCE_VERSION, type EnvironmentalArea, type EnvironmentalAreaSuite, type EnvironmentalRequest, type EnvironmentalResult } from "@/lib/platform/intelligence/environmental/types";
import { ClimateIntelligence } from "@/lib/platform/intelligence/environmental/climate-intelligence";
import { WeatherRiskIntelligence } from "@/lib/platform/intelligence/environmental/weather-risk-intelligence";
import { NaturalDisasterIntelligence } from "@/lib/platform/intelligence/environmental/natural-disaster-intelligence";
import { EnvironmentalRegulationIntelligence } from "@/lib/platform/intelligence/environmental/environmental-regulation-intelligence";
import { SustainabilityIntelligence } from "@/lib/platform/intelligence/environmental/sustainability-intelligence";
import { EnergyIntelligence } from "@/lib/platform/intelligence/environmental/energy-intelligence";
import { WaterResourcesIntelligence } from "@/lib/platform/intelligence/environmental/water-resources-intelligence";
import { AirQualityIntelligence } from "@/lib/platform/intelligence/environmental/air-quality-intelligence";
import { WasteManagementIntelligence } from "@/lib/platform/intelligence/environmental/waste-management-intelligence";
import { CarbonEmissionsIntelligence } from "@/lib/platform/intelligence/environmental/carbon-emissions-intelligence";
import { BiodiversityIntelligence } from "@/lib/platform/intelligence/environmental/biodiversity-intelligence";
import { InfrastructureResilienceIntelligence } from "@/lib/platform/intelligence/environmental/infrastructure-resilience-intelligence";
import { FacilityRiskIntelligence } from "@/lib/platform/intelligence/environmental/facility-risk-intelligence";
import { SupplyChainEnvironmentalRiskIntelligence } from "@/lib/platform/intelligence/environmental/supply-chain-environmental-risk-intelligence";
import { InsuranceExposureIntelligence } from "@/lib/platform/intelligence/environmental/insurance-exposure-intelligence";
import { EnvironmentalFundingIntelligence } from "@/lib/platform/intelligence/environmental/environmental-funding-intelligence";
import { EsgImpactIntelligence } from "@/lib/platform/intelligence/environmental/esg-impact-intelligence";
import { EnvironmentalForecastEngine } from "@/lib/platform/intelligence/environmental/environmental-forecast-engine";
import { EnvironmentalScenarioEngine } from "@/lib/platform/intelligence/environmental/environmental-scenario-engine";
import { EnvironmentalTrendEngine } from "@/lib/platform/intelligence/environmental/environmental-trend-engine";
import { EnvironmentalAnalysisEngine } from "@/lib/platform/intelligence/environmental/environmental-analysis-engine";
import { ClimateRiskEngine } from "@/lib/platform/intelligence/environmental/climate-risk-engine";
import { DisasterImpactEngine } from "@/lib/platform/intelligence/environmental/disaster-impact-engine";
import { SustainabilityEngine } from "@/lib/platform/intelligence/environmental/sustainability-engine";
import { InfrastructureResilienceEngine } from "@/lib/platform/intelligence/environmental/infrastructure-resilience-engine";
import { EarlyWarningEngine } from "@/lib/platform/intelligence/environmental/early-warning-engine";
import { EnvironmentalKnowledgeContributionEngine } from "@/lib/platform/intelligence/environmental/knowledge-contribution";
import { ClosedLearningLoop } from "@/lib/platform/intelligence/environmental/closed-learning-loop";
import { EnvironmentalReasoner } from "@/lib/platform/intelligence/environmental/environmental-reasoner";
import {
  EnvironmentalIntelligence, EnvironmentalRecommendationComposer, composeDashboard, composeHealth,
  composeRisksOpportunities, environmentalLens,
} from "@/lib/platform/intelligence/environmental/environmental-intelligence";
import { EnvironmentalProjection } from "@/lib/platform/intelligence/environmental/projection";
import { EnvironmentalRepositoryStore } from "@/lib/platform/intelligence/environmental/repository";
import { EnvironmentalRegistryStore } from "@/lib/platform/intelligence/environmental/environmental-registry";
import { EnvironmentalQueries } from "@/lib/platform/intelligence/environmental/projection";

export class EnvironmentalIntelligenceEngineImpl implements Contract {
  readonly repository; readonly registry; readonly queries;
  private now; private createId; private areas; private forecasts; private scenarios; private trends; private analysis;
  private climateRisk; private disasterImpact; private sustainability; private infrastructureResilience; private earlyWarning; private reasoner;

  constructor(d: EnvironmentalDependencies = {}) {
    this.now = d.now ?? (() => new Date());
    this.createId = d.createId ?? defaultCreateId;
    this.repository = d.repository ?? new EnvironmentalRepositoryStore();
    this.registry = d.registry ?? new EnvironmentalRegistryStore();
    this.queries = new EnvironmentalQueries();
    this.areas = {
      climate: new ClimateIntelligence(),
      weather_risk: new WeatherRiskIntelligence(),
      natural_disaster: new NaturalDisasterIntelligence(),
      environmental_regulation: new EnvironmentalRegulationIntelligence(),
      sustainability: new SustainabilityIntelligence(),
      energy: new EnergyIntelligence(),
      water_resources: new WaterResourcesIntelligence(),
      air_quality: new AirQualityIntelligence(),
      waste_management: new WasteManagementIntelligence(),
      carbon_emissions: new CarbonEmissionsIntelligence(),
      biodiversity: new BiodiversityIntelligence(),
      infrastructure_resilience: new InfrastructureResilienceIntelligence(),
      facility_risk: new FacilityRiskIntelligence(),
      supply_chain_environmental_risk: new SupplyChainEnvironmentalRiskIntelligence(),
      insurance_exposure: new InsuranceExposureIntelligence(),
      environmental_funding: new EnvironmentalFundingIntelligence(),
      esg_impact: new EsgImpactIntelligence(),
      ...d.areaIntelligence,
    };
    this.forecasts = d.forecastEngine ?? new EnvironmentalForecastEngine();
    this.scenarios = d.scenarioEngine ?? new EnvironmentalScenarioEngine();
    this.trends = d.trendEngine ?? new EnvironmentalTrendEngine();
    this.analysis = d.analysisEngine ?? new EnvironmentalAnalysisEngine();
    this.climateRisk = d.climateRiskEngine ?? new ClimateRiskEngine();
    this.disasterImpact = d.disasterImpactEngine ?? new DisasterImpactEngine();
    this.sustainability = d.sustainabilityEngine ?? new SustainabilityEngine();
    this.infrastructureResilience = d.infrastructureResilienceEngine ?? new InfrastructureResilienceEngine();
    this.earlyWarning = d.earlyWarningEngine ?? new EarlyWarningEngine();
    this.reasoner = d.reasoner ?? new EnvironmentalReasoner();
  }

  build(request: EnvironmentalRequest): EnvironmentalResult {
    const now = this.now();
    const baseline = deriveEnvironmentalBaseline(request);
    const createId = this.createId;
    const scope = request.scope ?? emptyEnvironmentalScope();
    const areaSuites = Object.fromEntries(
      ENVIRONMENTAL_AREAS.map(area => [area, this.areas[area]!.assess({ baseline, now, createId })])
    ) as Record<EnvironmentalArea, EnvironmentalAreaSuite>;

    const trendSuite = this.trends.assess({ baseline, areas: areaSuites, now, createId });
    const forecastSuite = this.forecasts.assess({ baseline, areas: areaSuites, now, createId });
    const scenarioSuite = this.scenarios.assess({ baseline, areas: areaSuites, forecasts: forecastSuite, now, createId });
    const analysisSuite = this.analysis.assess({ baseline, areas: areaSuites, forecasts: forecastSuite, scenarios: scenarioSuite, now, createId });
    const climateRiskSuite = this.climateRisk.assess({ baseline, areas: areaSuites, now, createId });
    const disasterImpactSuite = this.disasterImpact.assess({ baseline, areas: areaSuites, now, createId });
    const sustainabilitySuite = this.sustainability.assess({ baseline, areas: areaSuites, now, createId });
    const infrastructureResilienceSuite = this.infrastructureResilience.assess({ baseline, areas: areaSuites, now, createId });
    const earlyWarningSuite = this.earlyWarning.assess({ baseline, trends: trendSuite, scenarios: scenarioSuite, now, createId });
    const knowledgeContribution = new EnvironmentalKnowledgeContributionEngine().contribute({ forecasts: forecastSuite, scenarios: scenarioSuite, now, createId });
    const confidence = buildConfidence([
      { key: "evidence", label: "Evidence coverage", contribution: baseline.evidenceCoverage / 100 },
      { key: "forecast", label: "Forecast maturity", contribution: forecastSuite.maturityScore / 100 },
      { key: "scenario", label: "Scenario maturity", contribution: baseline.scenarioMaturity / 100 },
    ]);
    const reasoning = this.reasoner.reason({ request, trends: trendSuite, forecasts: forecastSuite, scenarios: scenarioSuite, confidence });
    const intelligence = new EnvironmentalIntelligence();
    const scores = intelligence.composeScores({
      baseline,
      areas: areaSuites,
      forecast: forecastSuite.maturityScore,
      scenario: baseline.scenarioMaturity,
      analysis: analysisSuite.maturityScore,
      earlyWarning: earlyWarningSuite.score,
      climateRisk: climateRiskSuite.score,
      disasterImpact: disasterImpactSuite.score,
    });
    const { risks, opportunities } = composeRisksOpportunities(areaSuites, createId);
    const recommendations = new EnvironmentalRecommendationComposer(createId).compose(areaSuites, analysisSuite, scenarioSuite, now);
    const health = composeHealth(scores, baseline, forecastSuite);
    const dashboard = composeDashboard(now, health, baseline, risks, opportunities);
    const commonLens = environmentalLens("organization", health.overallScore);

    const outlookDashboard = {
      generatedAt: now.toISOString(),
      headline: `Long-term outlook ${forecastSuite.outlook}`,
      outlook: forecastSuite.outlook,
      overall: health.overallScore,
      primaryScenario: scenarioSuite.primaryScenario,
      narrative: scenarioSuite.narrative,
    };
    const climateDashboard = {
      generatedAt: now.toISOString(),
      headline: `Climate risk ${Math.round(climateRiskSuite.aggregateRisk)}`,
      score: climateRiskSuite.score,
      aggregateRisk: climateRiskSuite.aggregateRisk,
      signals: climateRiskSuite.records.slice(0, 4).map(r => r.title),
      narrative: climateRiskSuite.narrative,
    };
    const disasterRiskDashboard = {
      generatedAt: now.toISOString(),
      headline: `Disaster impact index ${Math.round(disasterImpactSuite.impactIndex)}`,
      score: disasterImpactSuite.score,
      impactIndex: disasterImpactSuite.impactIndex,
      signals: disasterImpactSuite.records.map(r => r.narrative),
      narrative: disasterImpactSuite.narrative,
    };
    const sustainabilityDashboard = {
      generatedAt: now.toISOString(),
      headline: `Sustainability maturity ${Math.round(sustainabilitySuite.maturityIndex)}`,
      score: sustainabilitySuite.score,
      maturityIndex: sustainabilitySuite.maturityIndex,
      signals: sustainabilitySuite.records.map(r => r.narrative),
      narrative: sustainabilitySuite.narrative,
    };
    const infrastructureDashboard = {
      generatedAt: now.toISOString(),
      headline: `Infrastructure resilience ${Math.round(infrastructureResilienceSuite.resilienceIndex)}`,
      score: infrastructureResilienceSuite.score,
      resilienceIndex: infrastructureResilienceSuite.resilienceIndex,
      signals: infrastructureResilienceSuite.records.map(r => r.narrative),
      narrative: infrastructureResilienceSuite.narrative,
    };
    const resourceMonitoringDashboard = {
      generatedAt: now.toISOString(),
      headline: `Resource availability ${Math.round(baseline.resourceAvailability)}`,
      score: (areaSuites.water_resources.score + areaSuites.energy.score + areaSuites.air_quality.score) / 3,
      resourceAvailability: baseline.resourceAvailability,
      signals: [
        ...areaSuites.water_resources.records.map(r => r.signal),
        ...areaSuites.energy.records.map(r => r.signal),
      ],
      narrative: areaSuites.water_resources.narrative,
    };
    const esgOverviewDashboard = {
      generatedAt: now.toISOString(),
      headline: `ESG impact ${Math.round(areaSuites.esg_impact.score)}`,
      score: areaSuites.esg_impact.score,
      esgPressure: 100 - areaSuites.esg_impact.score,
      signals: areaSuites.esg_impact.records.map(r => r.signal),
      narrative: areaSuites.esg_impact.narrative,
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
      headline: `Board Environmental Report: ${dashboard.headline}`,
      assuranceSummary: `Evidence coverage ${Math.round(baseline.evidenceCoverage)}; primary scenario ${scenarioSuite.primaryScenario.replaceAll("_", " ")}.`,
      healthScore: health.overallScore,
      outlook: forecastSuite.outlook,
      climateScore: areaSuites.climate.score,
      sustainabilityScore: areaSuites.sustainability.score,
      infrastructureResilience: baseline.infrastructureResilience,
      recommendations: recommendations.map(r => r.title),
      lenses: commonLens,
      narrative: "Board assurance on climate, disaster, sustainability, and infrastructure exposure.",
    };
    const closedLearningLoop = new ClosedLearningLoop().contribute({ trends: trendSuite, scenarios: scenarioSuite, recommendations, now, createId });
    const projection = new EnvironmentalProjection().project({
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
      id: createId("env-history"),
      requestId: request.requestId,
      scope,
      status: "assessed" as const,
      healthScore: health.overallScore,
      generatedAt: now.toISOString(),
      summary: brief.headline,
      metadata: request.metadata ?? {},
    };

    const result: EnvironmentalResult = {
      requestId: request.requestId,
      version: ENVIRONMENTAL_INTELLIGENCE_VERSION,
      generatedAt: now.toISOString(),
      periodLabel: request.periodLabel ?? defaultPeriodLabel(now),
      scope,
      baseline,
      healthScore: scores.healthScore,
      climateScore: scores.areaScores.climate,
      weatherRiskScore: scores.areaScores.weather_risk,
      naturalDisasterScore: scores.areaScores.natural_disaster,
      environmentalRegulationScore: scores.areaScores.environmental_regulation,
      sustainabilityScore: scores.areaScores.sustainability,
      energyScore: scores.areaScores.energy,
      waterResourcesScore: scores.areaScores.water_resources,
      airQualityScore: scores.areaScores.air_quality,
      wasteManagementScore: scores.areaScores.waste_management,
      carbonEmissionsScore: scores.areaScores.carbon_emissions,
      biodiversityScore: scores.areaScores.biodiversity,
      infrastructureResilienceScore: scores.areaScores.infrastructure_resilience,
      facilityRiskScore: scores.areaScores.facility_risk,
      supplyChainEnvironmentalRiskScore: scores.areaScores.supply_chain_environmental_risk,
      insuranceExposureScore: scores.areaScores.insurance_exposure,
      environmentalFundingScore: scores.areaScores.environmental_funding,
      esgImpactScore: scores.areaScores.esg_impact,
      forecastScore: scores.forecastScore,
      scenarioScore: scores.scenarioScore,
      analysisScore: scores.analysisScore,
      earlyWarningScore: scores.earlyWarningScore,
      climateRiskScore: scores.climateRiskScore,
      disasterImpactScore: scores.disasterImpactScore,
      health,
      dashboard,
      outlookDashboard,
      climateDashboard,
      disasterRiskDashboard,
      sustainabilityDashboard,
      infrastructureDashboard,
      resourceMonitoringDashboard,
      esgOverviewDashboard,
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
      climateRiskSuite,
      disasterImpactSuite,
      sustainabilitySuite,
      infrastructureResilienceSuite,
      earlyWarningSuite,
      knowledgeContribution,
      closedLearningLoop,
      reasoning,
      projection,
      historyRecord,
      confidence,
      requestMetadata: { ...(request.metadata ?? {}), registryPublishers: this.registry.list().length },
    };

    this.registry.register("environmental", "environmental_intelligence");
    this.repository.save(result);
    this.repository.saveHistory(historyRecord);
    return result;
  }
}

export {
  EnvironmentalIntelligenceEngineImpl as EnvironmentalIntelligenceEngine,
  EnvironmentalIntelligenceEngineImpl as EnvironmentalEngine,
  EnvironmentalIntelligenceEngineImpl as EnvironmentalEngineImpl,
};
