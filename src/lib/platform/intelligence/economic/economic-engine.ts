import type { EconomicDependencies, EconomicEngine as Contract } from "@/lib/platform/intelligence/economic/contracts";
import { defaultCreateId, defaultPeriodLabel, deriveEconomicBaseline, emptyEconomicScope, buildConfidence } from "@/lib/platform/intelligence/economic/models";
import { ECONOMIC_AREAS, ECONOMIC_INTELLIGENCE_VERSION, type EconomicArea, type EconomicAreaSuite, type EconomicRequest, type EconomicResult } from "@/lib/platform/intelligence/economic/types";
import { InflationIntelligence } from "@/lib/platform/intelligence/economic/inflation-intelligence";
import { InterestRatesIntelligence } from "@/lib/platform/intelligence/economic/interest-rates-intelligence";
import { GdpIntelligence } from "@/lib/platform/intelligence/economic/gdp-intelligence";
import { EmploymentIntelligence } from "@/lib/platform/intelligence/economic/employment-intelligence";
import { LaborMarketIntelligence } from "@/lib/platform/intelligence/economic/labor-market-intelligence";
import { WageTrendsIntelligence } from "@/lib/platform/intelligence/economic/wage-trends-intelligence";
import { HousingIntelligence } from "@/lib/platform/intelligence/economic/housing-intelligence";
import { HealthcareIntelligence } from "@/lib/platform/intelligence/economic/healthcare-intelligence";
import { EnergyIntelligence } from "@/lib/platform/intelligence/economic/energy-intelligence";
import { SupplyChainsIntelligence } from "@/lib/platform/intelligence/economic/supply-chains-intelligence";
import { CommodityPricesIntelligence } from "@/lib/platform/intelligence/economic/commodity-prices-intelligence";
import { CurrencyIntelligence } from "@/lib/platform/intelligence/economic/currency-intelligence";
import { GovernmentSpendingIntelligence } from "@/lib/platform/intelligence/economic/government-spending-intelligence";
import { TaxEnvironmentIntelligence } from "@/lib/platform/intelligence/economic/tax-environment-intelligence";
import { ConsumerSpendingIntelligence } from "@/lib/platform/intelligence/economic/consumer-spending-intelligence";
import { IndustryConditionsIntelligence } from "@/lib/platform/intelligence/economic/industry-conditions-intelligence";
import { RegionalEconomicsIntelligence } from "@/lib/platform/intelligence/economic/regional-economics-intelligence";
import { InternationalEconomicsIntelligence } from "@/lib/platform/intelligence/economic/international-economics-intelligence";
import { EconomicForecastEngine } from "@/lib/platform/intelligence/economic/economic-forecast-engine";
import { EconomicScenarioEngine } from "@/lib/platform/intelligence/economic/economic-scenario-engine";
import { EconomicTrendEngine } from "@/lib/platform/intelligence/economic/economic-trend-engine";
import { EconomicAnalysisEngine } from "@/lib/platform/intelligence/economic/economic-analysis-engine";
import { EconomicKnowledgeContributionEngine } from "@/lib/platform/intelligence/economic/knowledge-contribution";
import { ClosedLearningLoop } from "@/lib/platform/intelligence/economic/closed-learning-loop";
import { EconomicReasoner } from "@/lib/platform/intelligence/economic/economic-reasoner";
import {
  EconomicIntelligence, EconomicRecommendationComposer, composeDashboard, composeHealth,
  composeRisksOpportunities, economicLens,
} from "@/lib/platform/intelligence/economic/economic-intelligence";
import { EconomicProjection } from "@/lib/platform/intelligence/economic/projection";
import { EconomicRepositoryStore } from "@/lib/platform/intelligence/economic/repository";
import { EconomicRegistryStore } from "@/lib/platform/intelligence/economic/economic-registry";
import { EconomicQueries } from "@/lib/platform/intelligence/economic/projection";

export class EconomicIntelligenceEngineImpl implements Contract {
  readonly repository; readonly registry; readonly queries;
  private now; private createId; private areas; private forecasts; private scenarios; private trends; private analysis; private reasoner;

  constructor(d: EconomicDependencies = {}) {
    this.now = d.now ?? (() => new Date());
    this.createId = d.createId ?? defaultCreateId;
    this.repository = d.repository ?? new EconomicRepositoryStore();
    this.registry = d.registry ?? new EconomicRegistryStore();
    this.queries = new EconomicQueries();
    this.areas = {
      inflation: new InflationIntelligence(),
      interest_rates: new InterestRatesIntelligence(),
      gdp: new GdpIntelligence(),
      employment: new EmploymentIntelligence(),
      labor_market: new LaborMarketIntelligence(),
      wage_trends: new WageTrendsIntelligence(),
      housing: new HousingIntelligence(),
      healthcare: new HealthcareIntelligence(),
      energy: new EnergyIntelligence(),
      supply_chains: new SupplyChainsIntelligence(),
      commodity_prices: new CommodityPricesIntelligence(),
      currency: new CurrencyIntelligence(),
      government_spending: new GovernmentSpendingIntelligence(),
      tax_environment: new TaxEnvironmentIntelligence(),
      consumer_spending: new ConsumerSpendingIntelligence(),
      industry_conditions: new IndustryConditionsIntelligence(),
      regional_economics: new RegionalEconomicsIntelligence(),
      international_economics: new InternationalEconomicsIntelligence(),
      ...d.areaIntelligence,
    };
    this.forecasts = d.forecastEngine ?? new EconomicForecastEngine();
    this.scenarios = d.scenarioEngine ?? new EconomicScenarioEngine();
    this.trends = d.trendEngine ?? new EconomicTrendEngine();
    this.analysis = d.analysisEngine ?? new EconomicAnalysisEngine();
    this.reasoner = d.reasoner ?? new EconomicReasoner();
  }

  build(request: EconomicRequest): EconomicResult {
    const now = this.now();
    const baseline = deriveEconomicBaseline(request);
    const createId = this.createId;
    const scope = request.scope ?? emptyEconomicScope();
    const areaSuites = Object.fromEntries(
      ECONOMIC_AREAS.map(area => [area, this.areas[area]!.assess({ baseline, now, createId })])
    ) as Record<EconomicArea, EconomicAreaSuite>;

    const trendSuite = this.trends.assess({ baseline, areas: areaSuites, now, createId });
    const forecastSuite = this.forecasts.assess({ baseline, areas: areaSuites, now, createId });
    const scenarioSuite = this.scenarios.assess({ baseline, areas: areaSuites, forecasts: forecastSuite, now, createId });
    const analysisSuite = this.analysis.assess({ baseline, areas: areaSuites, forecasts: forecastSuite, scenarios: scenarioSuite, now, createId });
    const knowledgeContribution = new EconomicKnowledgeContributionEngine().contribute({ forecasts: forecastSuite, scenarios: scenarioSuite, now, createId });
    const confidence = buildConfidence([
      { key: "evidence", label: "Evidence coverage", contribution: baseline.evidenceCoverage / 100 },
      { key: "forecast", label: "Forecast maturity", contribution: forecastSuite.maturityScore / 100 },
      { key: "scenario", label: "Scenario maturity", contribution: baseline.scenarioMaturity / 100 },
    ]);
    const reasoning = this.reasoner.reason({ request, trends: trendSuite, forecasts: forecastSuite, scenarios: scenarioSuite, confidence });
    const intelligence = new EconomicIntelligence();
    const scores = intelligence.composeScores({
      baseline,
      areas: areaSuites,
      forecast: forecastSuite.maturityScore,
      scenario: baseline.scenarioMaturity,
      analysis: analysisSuite.maturityScore,
    });
    const { risks, opportunities } = composeRisksOpportunities(areaSuites, createId);
    const recommendations = new EconomicRecommendationComposer(createId).compose(areaSuites, analysisSuite, scenarioSuite, now);
    const health = composeHealth(scores, baseline, forecastSuite);
    const dashboard = composeDashboard(now, health, baseline, risks, opportunities);
    const commonLens = economicLens("organization", health.overallScore);

    const outlookDashboard = {
      generatedAt: now.toISOString(),
      headline: `Economic outlook ${forecastSuite.outlook}`,
      outlook: forecastSuite.outlook,
      overall: health.overallScore,
      primaryScenario: scenarioSuite.primaryScenario,
      narrative: scenarioSuite.narrative,
    };
    const inflationDashboard = {
      generatedAt: now.toISOString(),
      headline: `Inflation score ${Math.round(areaSuites.inflation.score)}`,
      score: areaSuites.inflation.score,
      pressure: baseline.inflationPressure,
      signals: areaSuites.inflation.records.map(r => r.signal),
      narrative: areaSuites.inflation.narrative,
    };
    const laborMarketDashboard = {
      generatedAt: now.toISOString(),
      headline: `Labor market score ${Math.round(areaSuites.labor_market.score)}`,
      score: areaSuites.labor_market.score,
      availability: baseline.laborAvailability,
      wagePressure: 100 - areaSuites.wage_trends.score,
      signals: areaSuites.labor_market.records.map(r => r.signal),
      narrative: areaSuites.labor_market.narrative,
    };
    const costPressureDashboard = {
      generatedAt: now.toISOString(),
      headline: `Cost pressure ${Math.round(baseline.costPressure)}`,
      score: Math.max(0, 100 - baseline.costPressure),
      costPressure: baseline.costPressure,
      pricingPressure: baseline.pricingPressure,
      signals: [areaSuites.inflation.narrative, areaSuites.energy.narrative, areaSuites.supply_chains.narrative],
      narrative: `Cost and pricing pressure remain active organizational constraints.`,
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
      headline: `Board Economic Report: ${dashboard.headline}`,
      assuranceSummary: `Evidence coverage ${Math.round(baseline.evidenceCoverage)}; primary scenario ${scenarioSuite.primaryScenario.replaceAll("_", " ")}.`,
      healthScore: health.overallScore,
      outlook: forecastSuite.outlook,
      inflationScore: areaSuites.inflation.score,
      laborScore: areaSuites.labor_market.score,
      fundingEnvironment: baseline.fundingEnvironment,
      recommendations: recommendations.map(r => r.title),
      lenses: commonLens,
      narrative: "Board assurance on macroeconomic exposure, funding climate, and labor conditions.",
    };
    const closedLearningLoop = new ClosedLearningLoop().contribute({ trends: trendSuite, scenarios: scenarioSuite, recommendations, now, createId });
    const projection = new EconomicProjection().project({
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
      id: createId("eco-history"),
      requestId: request.requestId,
      scope,
      status: "assessed" as const,
      healthScore: health.overallScore,
      generatedAt: now.toISOString(),
      summary: brief.headline,
      metadata: request.metadata ?? {},
    };

    const result: EconomicResult = {
      requestId: request.requestId,
      version: ECONOMIC_INTELLIGENCE_VERSION,
      generatedAt: now.toISOString(),
      periodLabel: request.periodLabel ?? defaultPeriodLabel(now),
      scope,
      baseline,
      healthScore: scores.healthScore,
      inflationScore: scores.areaScores.inflation,
      interestRatesScore: scores.areaScores.interest_rates,
      gdpScore: scores.areaScores.gdp,
      employmentScore: scores.areaScores.employment,
      laborMarketScore: scores.areaScores.labor_market,
      wageTrendsScore: scores.areaScores.wage_trends,
      housingScore: scores.areaScores.housing,
      healthcareScore: scores.areaScores.healthcare,
      energyScore: scores.areaScores.energy,
      supplyChainsScore: scores.areaScores.supply_chains,
      commodityPricesScore: scores.areaScores.commodity_prices,
      currencyScore: scores.areaScores.currency,
      governmentSpendingScore: scores.areaScores.government_spending,
      taxEnvironmentScore: scores.areaScores.tax_environment,
      consumerSpendingScore: scores.areaScores.consumer_spending,
      industryConditionsScore: scores.areaScores.industry_conditions,
      regionalEconomicsScore: scores.areaScores.regional_economics,
      internationalEconomicsScore: scores.areaScores.international_economics,
      forecastScore: scores.forecastScore,
      scenarioScore: scores.scenarioScore,
      analysisScore: scores.analysisScore,
      health,
      dashboard,
      outlookDashboard,
      inflationDashboard,
      laborMarketDashboard,
      costPressureDashboard,
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

    this.registry.register("economic", "economic_intelligence");
    this.repository.save(result);
    this.repository.saveHistory(historyRecord);
    return result;
  }
}

export {
  EconomicIntelligenceEngineImpl as EconomicIntelligenceEngine,
  EconomicIntelligenceEngineImpl as EconomicEngine,
  EconomicIntelligenceEngineImpl as EconomicEngineImpl,
};
