import type { GraphScope } from "@/lib/platform/intelligence/executive-graph/types";
import type {
  ResilienceBaseline, ResilienceConfidenceLevel, ResilienceConfidenceScore,
  ResilienceHealthStatus, ResilienceLens, ResilienceOutlook, ResiliencePriorityBand,
  ResilienceRequest,
} from "@/lib/platform/intelligence/resilience/types";
import { RESILIENCE_AREAS } from "@/lib/platform/intelligence/resilience/types";

export const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
export function statusFromScore(score: number): ResilienceHealthStatus {
  if (score >= 85) return "excellent"; if (score >= 70) return "healthy"; if (score >= 50) return "warning"; return "critical";
}
export function priorityFromScore(score: number): ResiliencePriorityBand {
  if (score < 35) return "critical"; if (score < 50) return "high"; if (score < 65) return "medium"; if (score < 80) return "low"; return "monitor";
}
export function levelFromValue(value: number): ResilienceConfidenceLevel {
  if (value >= .8) return "high"; if (value >= .55) return "medium"; if (value >= .3) return "low"; return "unknown";
}
export function outlookFromScore(score: number, volatility = 0): ResilienceOutlook {
  if (volatility >= 25) return "volatile";
  if (score >= 82) return "hardened"; if (score >= 68) return "stable"; if (score >= 50) return "fragile"; return "uncertain";
}
export function buildConfidence(factors: Array<{ key: string; label: string; contribution: number }>): ResilienceConfidenceScore {
  const value = Math.min(1, Math.max(0, factors.reduce((s, f) => s + f.contribution, 0) / Math.max(1, factors.length)));
  return { value, level: levelFromValue(value), factors };
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
export const defaultCreateId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
export const defaultPeriodLabel = (now = new Date()) => now.toISOString().slice(0, 7);
export const emptyResilienceScope = (): GraphScope => ({ organizationId: null, schoolId: null });

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

const lightScore = (value: unknown, fallback: number) =>
  typeof value === "number" ? clamp(value <= 1 ? value * 100 : value) : fallback;

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
