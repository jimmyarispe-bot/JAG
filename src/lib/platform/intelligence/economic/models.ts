import type { GraphScope } from "@/lib/platform/intelligence/executive-graph/types";
import type {
  EconomicBaseline, EconomicConfidenceLevel, EconomicConfidenceScore, EconomicHealthStatus,
  EconomicLens, EconomicOutlook, EconomicPriorityBand, EconomicRequest,
} from "@/lib/platform/intelligence/economic/types";
import { ECONOMIC_AREAS } from "@/lib/platform/intelligence/economic/types";
import {
  OUTLOOK_THRESHOLDS_STANDARD,
  buildConfidenceAverage,
  clamp as sharedClamp,
  defaultCreateId as sharedDefaultCreateId,
  emptyGraphScope,
  levelFromValue as sharedLevelFromValue,
  lightScore as sharedLightScore,
  outlookFromScoreConfigured,
  periodLabelQuarter,
  priorityFromScoreLowUrgent,
  statusFromScore as sharedStatusFromScore,
} from "@/lib/platform/intelligence/common";


export const clamp = sharedClamp;
export function statusFromScore(score: number): EconomicHealthStatus { return sharedStatusFromScore(score); }
export function priorityFromScore(score: number): EconomicPriorityBand { return priorityFromScoreLowUrgent(score); }
export function levelFromValue(value: number): EconomicConfidenceLevel { return sharedLevelFromValue(value); }
export function outlookFromScore(score: number, volatility = 0): EconomicOutlook {
  return outlookFromScoreConfigured(score, volatility, {
    volatileLabel: "volatile",
    high: { min: OUTLOOK_THRESHOLDS_STANDARD.high, label: "expansionary" },
    mid: { min: OUTLOOK_THRESHOLDS_STANDARD.mid, label: "stable" },
    low: { min: OUTLOOK_THRESHOLDS_STANDARD.low, label: "contractionary" },
    fallback: "uncertain",
  });
}
export function buildConfidence(
  factors: Array<{ key: string; label: string; contribution: number }>
): EconomicConfidenceScore {
  return buildConfidenceAverage(factors) as EconomicConfidenceScore;
}
export function buildLens(lens: EconomicLens): EconomicLens {
  return {
    economicForces: lens.economicForces, evidenceSupports: lens.evidenceSupports, confidenceLevel: lens.confidenceLevel,
    organizationalAreas: lens.organizationalAreas, financialImplications: lens.financialImplications,
    operationalImplications: lens.operationalImplications, strategicOptions: lens.strategicOptions,
    scenariosToMonitor: lens.scenariosToMonitor,
  };
}
export const defaultCreateId = sharedDefaultCreateId;
export const defaultPeriodLabel = periodLabelQuarter;
export const emptyEconomicScope = (): GraphScope => emptyGraphScope();
const lightScore = sharedLightScore;

export function defaultEconomicBaseline(): EconomicBaseline {
  return {
    organizationHealthScore: 72, executionScore: 68,
    areaScores: {
      inflation: 62, interest_rates: 58, gdp: 70, employment: 68, labor_market: 66, wage_trends: 64,
      housing: 60, healthcare: 63, energy: 59, supply_chains: 61, commodity_prices: 57, currency: 65,
      government_spending: 64, tax_environment: 66, consumer_spending: 69, industry_conditions: 67,
      regional_economics: 65, international_economics: 63,
    },
    inflationPressure: 58, laborAvailability: 64, fundingEnvironment: 61, costPressure: 57,
    purchasingPower: 63, pricingPressure: 55, forecastMaturity: 60, scenarioMaturity: 58, evidenceCoverage: 62,
  };
}

export function deriveEconomicBaseline(request: EconomicRequest): EconomicBaseline {
  const base = defaultEconomicBaseline();
  const health = request.oiosResult?.health.score ?? request.graphInput?.organizationHealth?.overallScore ?? base.organizationHealthScore;
  const market = lightScore(request.marketResult?.economicTrendScore?.value ?? request.marketResult?.marketScore?.value ?? request.marketResult?.healthScore?.value, base.areaScores.industry_conditions);
  const revenue = lightScore(request.revenueResult?.revenueScore?.value ?? request.revenueResult?.healthScore?.value, base.areaScores.consumer_spending);
  const funding = lightScore(request.fundingResult?.capitalAvailability?.value ?? request.fundingResult?.fundingScore?.value ?? request.fundingResult?.healthScore?.value, base.fundingEnvironment);
  const operations = lightScore(request.operationsResult?.costPressure?.value ?? request.operationsResult?.operationsScore?.value ?? request.operationsResult?.healthScore?.value, base.costPressure);
  const impact = lightScore(request.impactResult?.financialScore?.value ?? request.impactResult?.impactScore?.value ?? request.impactResult?.healthScore?.value, base.areaScores.gdp);
  const predictive = lightScore(request.predictiveResult?.predictiveScore?.value ?? request.predictiveResult?.healthScore?.value, base.forecastMaturity);
  const opportunity = lightScore(request.opportunityResult?.opportunityScore?.value ?? request.opportunityResult?.healthScore?.value, base.areaScores.industry_conditions);
  const businessModel = lightScore(request.businessModelResult?.businessModelScore?.value ?? request.businessModelResult?.healthScore?.value, base.areaScores.tax_environment);
  const pricing = lightScore(request.revenueResult?.pricingPressure?.value, base.pricingPressure);

  const areaScores = { ...base.areaScores };
  areaScores.industry_conditions = clamp(market * .6 + opportunity * .4);
  areaScores.consumer_spending = clamp(revenue * .7 + lightScore(health, 72) * .3);
  areaScores.gdp = clamp(impact * .5 + market * .3 + lightScore(health, 72) * .2);
  areaScores.inflation = clamp(100 - (operations * .4 + pricing * .3 + market * .3) + 40);
  areaScores.interest_rates = clamp((funding + base.areaScores.interest_rates) / 2);
  areaScores.employment = clamp((lightScore(health, 72) + areaScores.labor_market) / 2);
  areaScores.labor_market = clamp((areaScores.employment + areaScores.wage_trends) / 2 + 2);
  areaScores.wage_trends = clamp((areaScores.labor_market + areaScores.inflation) / 2);
  areaScores.supply_chains = clamp((operations + areaScores.commodity_prices) / 2);
  areaScores.commodity_prices = clamp((areaScores.energy + areaScores.supply_chains) / 2);
  areaScores.energy = clamp((operations + areaScores.commodity_prices) / 2);
  areaScores.housing = clamp((areaScores.interest_rates + areaScores.regional_economics) / 2);
  areaScores.healthcare = clamp((areaScores.wage_trends + areaScores.government_spending) / 2);
  areaScores.currency = clamp((areaScores.international_economics + funding) / 2);
  areaScores.government_spending = clamp((funding + businessModel) / 2);
  areaScores.tax_environment = clamp(businessModel);
  areaScores.regional_economics = clamp((market + areaScores.gdp) / 2);
  areaScores.international_economics = clamp((market + areaScores.currency) / 2);

  const inflationPressure = clamp(100 - areaScores.inflation + 20);
  const costPressure = clamp((inflationPressure + (100 - operations) + pricing) / 3);
  const laborAvailability = clamp(areaScores.labor_market);
  const purchasingPower = clamp(100 - inflationPressure * .6 + revenue * .4);
  const pricingPressure = clamp(pricing);
  const fundingEnvironment = clamp(funding);

  return {
    ...base,
    organizationHealthScore: clamp(lightScore(health, 72)),
    executionScore: clamp(request.oiosResult?.baseline.executionScore ?? base.executionScore),
    areaScores,
    inflationPressure,
    laborAvailability,
    fundingEnvironment,
    costPressure,
    purchasingPower,
    pricingPressure,
    forecastMaturity: clamp(predictive),
    scenarioMaturity: clamp((predictive + areaScores.gdp) / 2),
    evidenceCoverage: clamp((market + funding + operations + impact) / 4),
    ...request.baselineOverrides,
  };
}

export const economicModels = {
  clamp, statusFromScore, priorityFromScore, levelFromValue, outlookFromScore,
  buildConfidence, buildLens, defaultCreateId, defaultPeriodLabel, emptyEconomicScope,
  defaultEconomicBaseline, deriveEconomicBaseline,
};
export class EconomicModels {
  static clamp = clamp; static buildLens = buildLens; static derive = deriveEconomicBaseline;
  static baseline = defaultEconomicBaseline; static outlook = outlookFromScore;
}
