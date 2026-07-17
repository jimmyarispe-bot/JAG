import type { GraphScope } from "@/lib/platform/intelligence/executive-graph/types";
import type {
  PoliticalBaseline, PoliticalConfidenceLevel, PoliticalConfidenceScore,
  PoliticalHealthStatus, PoliticalLens, PoliticalOutlook, PoliticalPriorityBand,
  PoliticalRequest,
} from "@/lib/platform/intelligence/political/types";
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
export function statusFromScore(score: number): PoliticalHealthStatus { return sharedStatusFromScore(score); }
export function priorityFromScore(score: number): PoliticalPriorityBand { return priorityFromScoreLowUrgent(score); }
export function levelFromValue(value: number): PoliticalConfidenceLevel { return sharedLevelFromValue(value); }
export function outlookFromScore(score: number, volatility = 0): PoliticalOutlook {
  return outlookFromScoreConfigured(score, volatility, {
    volatileLabel: "volatile",
    high: { min: OUTLOOK_THRESHOLDS_STANDARD.high, label: "constructive" },
    mid: { min: OUTLOOK_THRESHOLDS_STANDARD.mid, label: "stable" },
    low: { min: OUTLOOK_THRESHOLDS_STANDARD.low, label: "contested" },
    fallback: "uncertain",
  });
}
export function buildConfidence(
  factors: Array<{ key: string; label: string; contribution: number }>
): PoliticalConfidenceScore {
  return buildConfidenceAverage(factors) as PoliticalConfidenceScore;
}
export function buildLens(lens: PoliticalLens): PoliticalLens {
  return {
    legislativeImpact: lens.legislativeImpact,
    regulatoryRisk: lens.regulatoryRisk,
    governmentFundingOpportunity: lens.governmentFundingOpportunity,
    taxExposure: lens.taxExposure,
    politicalStability: lens.politicalStability,
    tradeImpact: lens.tradeImpact,
    compliancePressure: lens.compliancePressure,
    strategicTiming: lens.strategicTiming,
  };
}
export const defaultCreateId = sharedDefaultCreateId;
export const defaultPeriodLabel = periodLabelQuarter;
export const emptyPoliticalScope = (): GraphScope => emptyGraphScope();
const lightScore = sharedLightScore;

export function defaultPoliticalBaseline(): PoliticalBaseline {
  return {
    organizationHealthScore: 72, executionScore: 68,
    areaScores: {
      legislative: 58,
      regulatory: 59,
      government_policy: 60,
      elections_leadership: 61,
      public_funding: 62,
      tax_policy: 63,
      education_policy: 64,
      healthcare_policy: 65,
      labor_employment_policy: 58,
      international_relations: 59,
      trade_tariffs: 60,
      immigration_policy: 61,
      judicial_decisions: 62,
      government_contracting: 63,
      public_sentiment: 64,
      lobbying_advocacy: 65,
      geopolitical_risk: 58,
    },
    legislativePressure: 52, regulatoryBurden: 54, fundingOpportunity: 63,
    politicalStability: 64, geopoliticalRisk: 48, compliancePressure: 55,
    forecastMaturity: 60, scenarioMaturity: 58, evidenceCoverage: 62,
  };
}

export function derivePoliticalBaseline(request: PoliticalRequest): PoliticalBaseline {
  const base = defaultPoliticalBaseline();
  const health = request.oiosResult?.health.score ?? request.graphInput?.organizationHealth?.overallScore ?? base.organizationHealthScore;
  const market = lightScore(request.marketResult?.marketScore?.value ?? request.marketResult?.healthScore?.value, base.areaScores.public_sentiment);
  const economic = lightScore(request.economicResult?.economicScore?.value ?? request.economicResult?.healthScore?.value, base.areaScores.tax_policy);
  const competitive = lightScore(request.competitiveResult?.competitiveScore?.value ?? request.competitiveResult?.healthScore?.value, base.areaScores.lobbying_advocacy);
  const competitivePressure = lightScore(request.competitiveResult?.competitivePressure?.value, 55);
  const legal = lightScore(request.legalComplianceRiskResult?.legalScore?.value ?? request.legalComplianceRiskResult?.healthScore?.value, base.areaScores.judicial_decisions);
  const compliance = lightScore(request.legalComplianceRiskResult?.complianceScore?.value, base.compliancePressure);
  const risk = lightScore(request.legalComplianceRiskResult?.riskScore?.value, base.geopoliticalRisk);
  const opportunity = lightScore(request.opportunityResult?.opportunityScore?.value ?? request.opportunityResult?.healthScore?.value, base.fundingOpportunity);
  const predictive = lightScore(request.predictiveResult?.predictiveScore?.value ?? request.predictiveResult?.healthScore?.value, base.forecastMaturity);
  const funding = lightScore(request.fundingResult?.fundingScore?.value ?? request.fundingResult?.capitalAvailability?.value ?? request.fundingResult?.healthScore?.value, base.areaScores.public_funding);

  const areaScores = { ...base.areaScores };
  areaScores.legislative = clamp((legal + compliance) / 2);
  areaScores.regulatory = clamp(compliance * .7 + legal * .3);
  areaScores.government_policy = clamp((market + economic) / 2);
  areaScores.elections_leadership = clamp(100 - competitivePressure * .4 + market * .3);
  areaScores.public_funding = clamp(funding * .6 + opportunity * .4);
  areaScores.tax_policy = clamp(economic);
  areaScores.education_policy = clamp((market + legal) / 2);
  areaScores.healthcare_policy = clamp((economic + compliance) / 2);
  areaScores.labor_employment_policy = clamp((economic + compliance) / 2);
  areaScores.international_relations = clamp((market + economic) / 2);
  areaScores.trade_tariffs = clamp(economic * .6 + market * .4);
  areaScores.immigration_policy = clamp((market + legal) / 2);
  areaScores.judicial_decisions = clamp(legal);
  areaScores.government_contracting = clamp((funding + opportunity) / 2);
  areaScores.public_sentiment = clamp(market);
  areaScores.lobbying_advocacy = clamp((competitive + opportunity) / 2);
  areaScores.geopolitical_risk = clamp(100 - risk * .5 + (100 - competitivePressure) * .2);

  const legislativePressure = clamp(100 - areaScores.legislative);
  const regulatoryBurden = clamp(100 - areaScores.regulatory);
  const fundingOpportunity = clamp(areaScores.public_funding);
  const politicalStability = clamp((areaScores.elections_leadership + areaScores.public_sentiment + areaScores.government_policy) / 3);
  const geopoliticalRisk = clamp(100 - areaScores.geopolitical_risk);
  const compliancePressure = clamp((regulatoryBurden + (100 - areaScores.judicial_decisions)) / 2);

  return {
    ...base,
    organizationHealthScore: clamp(lightScore(health, 72)),
    executionScore: clamp(request.oiosResult?.baseline.executionScore ?? base.executionScore),
    areaScores,
    legislativePressure,
    regulatoryBurden,
    fundingOpportunity,
    politicalStability,
    geopoliticalRisk,
    compliancePressure,
    forecastMaturity: clamp(predictive),
    scenarioMaturity: clamp((predictive + areaScores.legislative) / 2),
    evidenceCoverage: clamp((market + economic + legal + competitive) / 4),
    ...request.baselineOverrides,
  };
}

export const politicalModels = {
  clamp, statusFromScore, priorityFromScore, levelFromValue, outlookFromScore,
  buildConfidence, buildLens, defaultCreateId, defaultPeriodLabel, emptyPoliticalScope,
  defaultPoliticalBaseline, derivePoliticalBaseline,
};
export class PoliticalModels {
  static clamp = clamp; static buildLens = buildLens; static derive = derivePoliticalBaseline;
  static baseline = defaultPoliticalBaseline; static outlook = outlookFromScore;
}
