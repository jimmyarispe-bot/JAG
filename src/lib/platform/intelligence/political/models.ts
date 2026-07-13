import type { GraphScope } from "@/lib/platform/intelligence/executive-graph/types";
import type {
  PoliticalBaseline, PoliticalConfidenceLevel, PoliticalConfidenceScore,
  PoliticalHealthStatus, PoliticalLens, PoliticalOutlook, PoliticalPriorityBand,
  PoliticalRequest,
} from "@/lib/platform/intelligence/political/types";

export const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
export function statusFromScore(score: number): PoliticalHealthStatus {
  if (score >= 85) return "excellent"; if (score >= 70) return "healthy"; if (score >= 50) return "warning"; return "critical";
}
export function priorityFromScore(score: number): PoliticalPriorityBand {
  if (score < 35) return "critical"; if (score < 50) return "high"; if (score < 65) return "medium"; if (score < 80) return "low"; return "monitor";
}
export function levelFromValue(value: number): PoliticalConfidenceLevel {
  if (value >= .8) return "high"; if (value >= .55) return "medium"; if (value >= .3) return "low"; return "unknown";
}
export function outlookFromScore(score: number, volatility = 0): PoliticalOutlook {
  if (volatility >= 25) return "volatile";
  if (score >= 78) return "constructive"; if (score >= 62) return "stable"; if (score >= 45) return "contested"; return "uncertain";
}
export function buildConfidence(factors: Array<{ key: string; label: string; contribution: number }>): PoliticalConfidenceScore {
  const value = Math.min(1, Math.max(0, factors.reduce((s, f) => s + f.contribution, 0) / Math.max(1, factors.length)));
  return { value, level: levelFromValue(value), factors };
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
export const defaultCreateId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
export const defaultPeriodLabel = (now = new Date()) => `${now.getUTCFullYear()}-Q${Math.floor(now.getUTCMonth() / 3) + 1}`;
export const emptyPoliticalScope = (): GraphScope => ({ organizationId: null, schoolId: null });
const lightScore = (value: unknown, fallback: number) => typeof value === "number" ? (value <= 1 ? value * 100 : value) : fallback;

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
