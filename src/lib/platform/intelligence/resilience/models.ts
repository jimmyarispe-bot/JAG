import type { GraphScope } from "@/lib/platform/intelligence/executive-graph/types";
import type {
  ResilienceBaseline, ResilienceConfidenceLevel, ResilienceConfidenceScore,
  ResilienceHealthStatus, ResilienceLens, ResilienceOutlook, ResiliencePriorityBand,
  ResilienceRequest,
} from "@/lib/platform/intelligence/resilience/types";
import { RESILIENCE_AREAS } from "@/lib/platform/intelligence/resilience/types";
import {
  OUTLOOK_THRESHOLDS_ELEVATED,
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
export function statusFromScore(score: number): ResilienceHealthStatus { return sharedStatusFromScore(score); }
export function priorityFromScore(score: number): ResiliencePriorityBand { return priorityFromScoreLowUrgent(score); }
export function levelFromValue(value: number): ResilienceConfidenceLevel { return sharedLevelFromValue(value); }
export function outlookFromScore(score: number, volatility = 0): ResilienceOutlook {
  return outlookFromScoreConfigured(score, volatility, {
    volatileLabel: "volatile",
    high: { min: OUTLOOK_THRESHOLDS_ELEVATED.high, label: "hardened" },
    mid: { min: OUTLOOK_THRESHOLDS_ELEVATED.mid, label: "stable" },
    low: { min: OUTLOOK_THRESHOLDS_ELEVATED.low, label: "fragile" },
    fallback: "uncertain",
  });
}
export function buildConfidence(
  factors: Array<{ key: string; label: string; contribution: number }>
): ResilienceConfidenceScore {
  return buildConfidenceAverage(factors) as ResilienceConfidenceScore;
}
export function buildLens(partial: Partial<ResilienceLens> = {}): ResilienceLens {
  return {
    organizationalReadiness: partial.organizationalReadiness ?? "Organizational readiness requires confirmation.",
    recoveryCapability: partial.recoveryCapability ?? "Recovery capability requires confirmation.",
    operationalStability: partial.operationalStability ?? "Operational stability requires confirmation.",
    financialStability: partial.financialStability ?? "Financial stability requires confirmation.",
    workforceStability: partial.workforceStability ?? "Workforce stability requires confirmation.",
    infrastructureReadiness: partial.infrastructureReadiness ?? "Infrastructure readiness requires confirmation.",
    adaptiveCapacity: partial.adaptiveCapacity ?? "Adaptive capacity requires confirmation.",
    longTermResilienceOutlook: partial.longTermResilienceOutlook ?? "Long-term resilience outlook requires confirmation.",
  };
}
export const defaultCreateId = sharedDefaultCreateId;
export const defaultPeriodLabel = periodLabelIsoMonth;
export const emptyResilienceScope = (): GraphScope => emptyGraphScope();

export function defaultResilienceBaseline(): ResilienceBaseline {
  const areaScores = Object.fromEntries(RESILIENCE_AREAS.map(a => [a, 68])) as ResilienceBaseline["areaScores"];
  return {
    organizationHealthScore: 72,
    executionScore: 70,
    areaScores,
    organizationalReadiness: 68,
    recoveryCapability: 68,
    operationalStability: 68,
    financialStability: 68,
    workforceStability: 68,
    infrastructureReadiness: 68,
    adaptiveCapacity: 68,
    longTermResilienceOutlook: 68,
    forecastMaturity: 65,
    scenarioMaturity: 64,
    evidenceCoverage: 66,
  };
}

const lightScore = sharedLightScore;

export function deriveResilienceBaseline(request: ResilienceRequest): ResilienceBaseline {
  const base = defaultResilienceBaseline();
  const health = lightScore(
    request.oiosResult?.health.score ?? request.graphInput?.organizationHealth?.overallScore,
    base.organizationHealthScore,
  );
  const systems = lightScore(request.systemsResult?.healthScore?.value, 70);
  const systemsAdapt = lightScore(request.systemsResult?.adaptability, systems);
  const operations = lightScore(request.operationsResult?.healthScore?.value ?? request.operationsResult?.throughputScore?.value, 70);
  const legal = lightScore(request.legalComplianceRiskResult?.healthScore?.value, 70);
  const legalCompliance = lightScore(request.legalComplianceRiskResult?.complianceScore?.value, legal);
  const predictive = lightScore(request.predictiveResult?.predictiveScore?.value ?? request.predictiveResult?.healthScore?.value, base.forecastMaturity);
  const decision = lightScore(request.decisionResult?.confidence?.value, 70);
  const economic = lightScore(request.economicResult?.economicScore?.value ?? request.economicResult?.healthScore?.value, 70);
  const opportunity = lightScore(request.opportunityResult?.opportunityScore?.value ?? request.opportunityResult?.healthScore?.value, 70);
  // Technology/Security soft-read via operations (tech delivery) and legal-compliance-risk (cyber/security risk).
  const techProxy = operations;
  const securityProxy = clamp((legal + legalCompliance) / 2);

  const areaScores = { ...base.areaScores };
  areaScores.organizational_resilience = clamp((systems + decision + health) / 3);
  areaScores.business_continuity = clamp((operations + systems + decision) / 3);
  areaScores.disaster_recovery = clamp((operations + techProxy + predictive) / 3);
  areaScores.operational_recovery = clamp((operations + systemsAdapt + decision) / 3);
  areaScores.financial_resilience = clamp((economic + decision + health) / 3);
  areaScores.workforce_resilience = clamp((operations + decision + predictive) / 3);
  areaScores.supply_chain_resilience = clamp((operations + economic + systems) / 3);
  areaScores.cyber_resilience = clamp((securityProxy + techProxy + systems) / 3);
  areaScores.infrastructure_resilience = clamp((techProxy + operations + systems) / 3);
  areaScores.vendor_resilience = clamp((operations + economic + legal) / 3);
  areaScores.crisis_readiness = clamp((decision + systems + predictive) / 3);
  areaScores.adaptive_capacity = clamp((systemsAdapt + predictive + decision) / 3);
  areaScores.redundancy_planning = clamp((operations + systems + decision) / 3);
  areaScores.recovery_time_analysis = clamp((areaScores.disaster_recovery + areaScores.operational_recovery + predictive) / 3);
  areaScores.stress_testing = clamp((predictive + systems + decision) / 3);
  areaScores.resilience_optimization = clamp((areaScores.organizational_resilience + opportunity + decision) / 3);
  areaScores.long_term_adaptability = clamp((areaScores.adaptive_capacity + predictive + health) / 3);

  return {
    ...base,
    organizationHealthScore: clamp(health),
    executionScore: clamp(request.oiosResult?.baseline.executionScore ?? base.executionScore),
    areaScores,
    organizationalReadiness: clamp(areaScores.organizational_resilience),
    recoveryCapability: clamp((areaScores.disaster_recovery + areaScores.operational_recovery + areaScores.recovery_time_analysis) / 3),
    operationalStability: clamp(areaScores.operational_recovery),
    financialStability: clamp(areaScores.financial_resilience),
    workforceStability: clamp(areaScores.workforce_resilience),
    infrastructureReadiness: clamp((areaScores.infrastructure_resilience + areaScores.cyber_resilience) / 2),
    adaptiveCapacity: clamp(areaScores.adaptive_capacity),
    longTermResilienceOutlook: clamp((areaScores.long_term_adaptability + areaScores.adaptive_capacity + predictive) / 3),
    forecastMaturity: clamp(predictive),
    scenarioMaturity: clamp((predictive + areaScores.stress_testing) / 2),
    evidenceCoverage: clamp((systems + operations + legal + economic) / 4),
    ...request.baselineOverrides,
  };
}

export const resilienceModels = {
  clamp, statusFromScore, priorityFromScore, levelFromValue, outlookFromScore,
  buildConfidence, buildLens, defaultCreateId, defaultPeriodLabel, emptyResilienceScope,
  defaultResilienceBaseline, deriveResilienceBaseline,
};
export class ResilienceModels {
  static clamp = clamp; static buildLens = buildLens; static derive = deriveResilienceBaseline;
  static baseline = defaultResilienceBaseline; static outlook = outlookFromScore;
}
