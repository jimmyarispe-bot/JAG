import type { GraphScope } from "@/lib/platform/intelligence/executive-graph/types";
import type {
  EthicalBaseline, EthicalConfidenceLevel, EthicalConfidenceScore,
  EthicalHealthStatus, EthicalLens, EthicalOutlook, EthicalPriorityBand,
  EthicalRequest,
} from "@/lib/platform/intelligence/ethical/types";
import { ETHICAL_AREAS } from "@/lib/platform/intelligence/ethical/types";
import {
  OUTLOOK_THRESHOLDS_STANDARD,
  buildConfidenceAverage,
  clamp as sharedClamp,
  defaultCreateId as sharedDefaultCreateId,
  emptyGraphScope,
  levelFromValue as sharedLevelFromValue,
  lightScoreClamped as sharedLightScore,
  outlookFromScoreConfigured,
  periodLabelIsoMonth,
  priorityFromScoreLowUrgent,
  statusFromScore as sharedStatusFromScore,
} from "@/lib/platform/intelligence/common";


export const clamp = sharedClamp;
export function statusFromScore(score: number): EthicalHealthStatus { return sharedStatusFromScore(score); }
export function priorityFromScore(score: number): EthicalPriorityBand { return priorityFromScoreLowUrgent(score); }
export function levelFromValue(value: number): EthicalConfidenceLevel { return sharedLevelFromValue(value); }
export function outlookFromScore(score: number, volatility = 0): EthicalOutlook {
  return outlookFromScoreConfigured(score, volatility, {
    volatileLabel: "volatile",
    high: { min: OUTLOOK_THRESHOLDS_STANDARD.high, label: "principled" },
    mid: { min: OUTLOOK_THRESHOLDS_STANDARD.mid, label: "stable" },
    low: { min: OUTLOOK_THRESHOLDS_STANDARD.low, label: "contested" },
    fallback: "uncertain",
  });
}
export function buildConfidence(
  factors: Array<{ key: string; label: string; contribution: number }>
): EthicalConfidenceScore {
  return buildConfidenceAverage(factors) as EthicalConfidenceScore;
}
export function buildLens(partial: Partial<EthicalLens> = {}): EthicalLens {
  return {
    valuesAlignment: partial.valuesAlignment ?? "Values alignment requires confirmation.",
    fairness: partial.fairness ?? "Fairness requires confirmation.",
    transparency: partial.transparency ?? "Transparency requires confirmation.",
    accountability: partial.accountability ?? "Accountability requires confirmation.",
    humanImpact: partial.humanImpact ?? "Human impact requires confirmation.",
    biasRisk: partial.biasRisk ?? "Bias risk requires confirmation.",
    governanceIntegrity: partial.governanceIntegrity ?? "Governance integrity requires confirmation.",
    longTermEthicalOutlook: partial.longTermEthicalOutlook ?? "Long-term ethical outlook requires confirmation.",
  };
}
export const defaultCreateId = sharedDefaultCreateId;
export const defaultPeriodLabel = periodLabelIsoMonth;
export const emptyEthicalScope = (): GraphScope => emptyGraphScope();

export function defaultEthicalBaseline(): EthicalBaseline {
  const areaScores = Object.fromEntries(ETHICAL_AREAS.map(a => [a, 68])) as EthicalBaseline["areaScores"];
  return {
    organizationHealthScore: 72,
    executionScore: 70,
    areaScores,
    valuesAlignment: 68,
    fairness: 68,
    transparency: 68,
    accountability: 68,
    humanImpact: 68,
    biasRisk: 68,
    governanceIntegrity: 68,
    longTermEthicalOutlook: 68,
    forecastMaturity: 65,
    scenarioMaturity: 64,
    evidenceCoverage: 66,
  };
}

const lightScore = sharedLightScore;

export function deriveEthicalBaseline(request: EthicalRequest): EthicalBaseline {
  const base = defaultEthicalBaseline();
  const health = lightScore(
    request.oiosResult?.health.score ?? request.graphInput?.organizationHealth?.overallScore,
    base.organizationHealthScore,
  );
  const cultural = lightScore(request.culturalResult?.healthScore?.value, 70);
  const culturalValues = lightScore(request.culturalResult?.valuesAlignmentScore?.value, base.valuesAlignment);
  const behavioral = lightScore(request.behavioralResult?.healthScore?.value, 70);
  const legal = lightScore(request.legalComplianceRiskResult?.healthScore?.value, 70);
  const legalCompliance = lightScore(request.legalComplianceRiskResult?.complianceScore?.value, legal);
  const decision = lightScore(request.decisionResult?.confidence?.value, 70);
  const opportunity = lightScore(request.opportunityResult?.opportunityScore?.value ?? request.opportunityResult?.healthScore?.value, base.areaScores.ethical_opportunity);
  const predictive = lightScore(request.predictiveResult?.predictiveScore?.value ?? request.predictiveResult?.healthScore?.value, base.forecastMaturity);
  const reputation = lightScore(request.reputationResult?.reputationScore?.value ?? request.reputationResult?.healthScore?.value, 70);
  const reputationTrust = lightScore(request.reputationResult?.trustScore?.value, reputation);

  const areaScores = { ...base.areaScores };
  areaScores.ethical_decision_analysis = clamp((decision + cultural + behavioral) / 3);
  areaScores.values_alignment = clamp((culturalValues + cultural + reputationTrust) / 3);
  areaScores.fairness = clamp((behavioral + legalCompliance + reputation) / 3);
  areaScores.transparency = clamp((reputationTrust + cultural + decision) / 3);
  areaScores.accountability = clamp((legal + decision + cultural) / 3);
  areaScores.human_impact = clamp((behavioral + reputation + cultural) / 3);
  areaScores.ai_ethics = clamp((decision + predictive + legalCompliance) / 3);
  areaScores.responsible_automation = clamp((areaScores.ai_ethics + decision + behavioral) / 3);
  areaScores.bias_discrimination = clamp((areaScores.fairness + legal + behavioral) / 3);
  areaScores.governance_ethics = clamp((legal + legalCompliance + decision) / 3);
  areaScores.privacy_data_ethics = clamp((legalCompliance + reputationTrust + areaScores.transparency) / 3);
  areaScores.sustainability_ethics = clamp((opportunity + cultural + reputation) / 3);
  areaScores.social_responsibility = clamp((reputation + cultural + opportunity) / 3);
  areaScores.ethical_risk = clamp(100 - ((100 - areaScores.bias_discrimination) * .35 + (100 - areaScores.accountability) * .35 + (100 - areaScores.human_impact) * .3));
  areaScores.ethical_opportunity = clamp((opportunity + areaScores.values_alignment + areaScores.social_responsibility) / 3);
  areaScores.ethical_stewardship = clamp((areaScores.governance_ethics + areaScores.values_alignment + cultural) / 3);
  areaScores.recommendation_validation = clamp((decision + predictive + areaScores.accountability) / 3);

  return {
    ...base,
    organizationHealthScore: clamp(health),
    executionScore: clamp(request.oiosResult?.baseline.executionScore ?? base.executionScore),
    areaScores,
    valuesAlignment: clamp(areaScores.values_alignment),
    fairness: clamp(areaScores.fairness),
    transparency: clamp(areaScores.transparency),
    accountability: clamp(areaScores.accountability),
    humanImpact: clamp(areaScores.human_impact),
    biasRisk: clamp(areaScores.bias_discrimination),
    governanceIntegrity: clamp(areaScores.governance_ethics),
    longTermEthicalOutlook: clamp((areaScores.ethical_stewardship + areaScores.values_alignment + predictive) / 3),
    forecastMaturity: clamp(predictive),
    scenarioMaturity: clamp((predictive + areaScores.ethical_risk) / 2),
    evidenceCoverage: clamp((cultural + behavioral + legal + reputation) / 4),
    ...request.baselineOverrides,
  };
}

export const ethicalModels = {
  clamp, statusFromScore, priorityFromScore, levelFromValue, outlookFromScore,
  buildConfidence, buildLens, defaultCreateId, defaultPeriodLabel, emptyEthicalScope,
  defaultEthicalBaseline, deriveEthicalBaseline,
};
export class EthicalModels {
  static clamp = clamp; static buildLens = buildLens; static derive = deriveEthicalBaseline;
  static baseline = defaultEthicalBaseline; static outlook = outlookFromScore;
}
