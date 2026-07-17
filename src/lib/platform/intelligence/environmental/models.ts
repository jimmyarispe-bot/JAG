import type { GraphScope } from "@/lib/platform/intelligence/executive-graph/types";
import type {
  EnvironmentalBaseline, EnvironmentalConfidenceLevel, EnvironmentalConfidenceScore,
  EnvironmentalHealthStatus, EnvironmentalLens, EnvironmentalOutlook, EnvironmentalPriorityBand,
  EnvironmentalRequest,
} from "@/lib/platform/intelligence/environmental/types";
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
export function statusFromScore(score: number): EnvironmentalHealthStatus { return sharedStatusFromScore(score); }
export function priorityFromScore(score: number): EnvironmentalPriorityBand { return priorityFromScoreLowUrgent(score); }
export function levelFromValue(value: number): EnvironmentalConfidenceLevel { return sharedLevelFromValue(value); }
export function outlookFromScore(score: number, volatility = 0): EnvironmentalOutlook {
  return outlookFromScoreConfigured(score, volatility, {
    volatileLabel: "volatile",
    high: { min: OUTLOOK_THRESHOLDS_STANDARD.high, label: "resilient" },
    mid: { min: OUTLOOK_THRESHOLDS_STANDARD.mid, label: "stable" },
    low: { min: OUTLOOK_THRESHOLDS_STANDARD.low, label: "stressed" },
    fallback: "uncertain",
  });
}
export function buildConfidence(
  factors: Array<{ key: string; label: string; contribution: number }>
): EnvironmentalConfidenceScore {
  return buildConfidenceAverage(factors) as EnvironmentalConfidenceScore;
}
export function buildLens(lens: EnvironmentalLens): EnvironmentalLens {
  return {
    climateRisk: lens.climateRisk,
    facilityExposure: lens.facilityExposure,
    infrastructureResilience: lens.infrastructureResilience,
    resourceAvailability: lens.resourceAvailability,
    sustainabilityImpact: lens.sustainabilityImpact,
    regulatoryExposure: lens.regulatoryExposure,
    insuranceRisk: lens.insuranceRisk,
    longTermEnvironmentalOutlook: lens.longTermEnvironmentalOutlook,
  };
}
export const defaultCreateId = sharedDefaultCreateId;
export const defaultPeriodLabel = periodLabelQuarter;
export const emptyEnvironmentalScope = (): GraphScope => emptyGraphScope();
const lightScore = sharedLightScore;

export function defaultEnvironmentalBaseline(): EnvironmentalBaseline {
  return {
    organizationHealthScore: 72, executionScore: 68,
    areaScores: {
      climate: 58,
      weather_risk: 59,
      natural_disaster: 60,
      environmental_regulation: 61,
      sustainability: 62,
      energy: 63,
      water_resources: 64,
      air_quality: 65,
      waste_management: 58,
      carbon_emissions: 59,
      biodiversity: 60,
      infrastructure_resilience: 61,
      facility_risk: 62,
      supply_chain_environmental_risk: 63,
      insurance_exposure: 64,
      environmental_funding: 65,
      esg_impact: 58,
    },
    climateRisk: 52, facilityExposure: 54, resourceAvailability: 63,
    sustainabilityMaturity: 64, regulatoryExposure: 48, insurancePressure: 55,
    infrastructureResilience: 60, forecastMaturity: 60, scenarioMaturity: 58, evidenceCoverage: 62,
  };
}

export function deriveEnvironmentalBaseline(request: EnvironmentalRequest): EnvironmentalBaseline {
  const base = defaultEnvironmentalBaseline();
  const health = request.oiosResult?.health.score ?? request.graphInput?.organizationHealth?.overallScore ?? base.organizationHealthScore;
  const political = lightScore(request.politicalResult?.politicalScore?.value ?? request.politicalResult?.healthScore?.value, base.areaScores.environmental_regulation);
  const politicalStability = lightScore(request.politicalResult?.politicalStability?.value, base.sustainabilityMaturity);
  const economic = lightScore(request.economicResult?.economicScore?.value ?? request.economicResult?.healthScore?.value, base.areaScores.energy);
  const legal = lightScore(request.legalComplianceRiskResult?.legalScore?.value ?? request.legalComplianceRiskResult?.healthScore?.value, base.areaScores.environmental_regulation);
  const compliance = lightScore(request.legalComplianceRiskResult?.complianceScore?.value, base.regulatoryExposure);
  const risk = lightScore(request.legalComplianceRiskResult?.riskScore?.value, base.climateRisk);
  const operations = lightScore(request.operationsResult?.operationsScore?.value ?? request.operationsResult?.healthScore?.value, base.areaScores.facility_risk);
  const costPressure = lightScore(request.operationsResult?.costPressure?.value, 55);
  const opportunity = lightScore(request.opportunityResult?.opportunityScore?.value ?? request.opportunityResult?.healthScore?.value, base.areaScores.environmental_funding);
  const predictive = lightScore(request.predictiveResult?.predictiveScore?.value ?? request.predictiveResult?.healthScore?.value, base.forecastMaturity);
  const market = lightScore(request.marketResult?.marketScore?.value ?? request.marketResult?.healthScore?.value, base.areaScores.supply_chain_environmental_risk);

  const areaScores = { ...base.areaScores };
  areaScores.climate = clamp((100 - risk) * .5 + politicalStability * .3 + predictive * .2);
  areaScores.weather_risk = clamp(100 - risk * .4 - costPressure * .2 + operations * .3);
  areaScores.natural_disaster = clamp(100 - risk * .5 + operations * .3);
  areaScores.environmental_regulation = clamp((legal + compliance + political) / 3);
  areaScores.sustainability = clamp((opportunity + politicalStability + market) / 3);
  areaScores.energy = clamp(economic * .6 + operations * .4);
  areaScores.water_resources = clamp((operations + (100 - costPressure)) / 2);
  areaScores.air_quality = clamp((compliance + market) / 2);
  areaScores.waste_management = clamp((operations + compliance) / 2);
  areaScores.carbon_emissions = clamp((economic + compliance + market) / 3);
  areaScores.biodiversity = clamp((market + opportunity) / 2);
  areaScores.infrastructure_resilience = clamp(operations * .6 + (100 - risk) * .4);
  areaScores.facility_risk = clamp(operations * .7 + (100 - risk) * .3);
  areaScores.supply_chain_environmental_risk = clamp((operations + market + (100 - costPressure)) / 3);
  areaScores.insurance_exposure = clamp(100 - risk * .5 + compliance * .3);
  areaScores.environmental_funding = clamp(opportunity * .6 + political * .4);
  areaScores.esg_impact = clamp((market + opportunity + compliance) / 3);

  const climateRisk = clamp(100 - areaScores.climate);
  const facilityExposure = clamp(100 - areaScores.facility_risk);
  const resourceAvailability = clamp((areaScores.water_resources + areaScores.energy + areaScores.air_quality) / 3);
  const sustainabilityMaturity = clamp(areaScores.sustainability);
  const regulatoryExposure = clamp(100 - areaScores.environmental_regulation);
  const insurancePressure = clamp(100 - areaScores.insurance_exposure);
  const infrastructureResilience = clamp(areaScores.infrastructure_resilience);

  return {
    ...base,
    organizationHealthScore: clamp(lightScore(health, 72)),
    executionScore: clamp(request.oiosResult?.baseline.executionScore ?? base.executionScore),
    areaScores,
    climateRisk,
    facilityExposure,
    resourceAvailability,
    sustainabilityMaturity,
    regulatoryExposure,
    insurancePressure,
    infrastructureResilience,
    forecastMaturity: clamp(predictive),
    scenarioMaturity: clamp((predictive + areaScores.climate) / 2),
    evidenceCoverage: clamp((political + economic + legal + operations) / 4),
    ...request.baselineOverrides,
  };
}

export const environmentalModels = {
  clamp, statusFromScore, priorityFromScore, levelFromValue, outlookFromScore,
  buildConfidence, buildLens, defaultCreateId, defaultPeriodLabel, emptyEnvironmentalScope,
  defaultEnvironmentalBaseline, deriveEnvironmentalBaseline,
};
export class EnvironmentalModels {
  static clamp = clamp; static buildLens = buildLens; static derive = deriveEnvironmentalBaseline;
  static baseline = defaultEnvironmentalBaseline; static outlook = outlookFromScore;
}
