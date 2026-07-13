import type { GraphScope } from "@/lib/platform/intelligence/executive-graph/types";
import type {
  SystemsBaseline, SystemsConfidenceLevel, SystemsConfidenceScore,
  SystemsHealthStatus, SystemsLens, SystemsOutlook, SystemsPriorityBand,
  SystemsRequest,
} from "@/lib/platform/intelligence/systems/types";
import { SYSTEMS_AREAS } from "@/lib/platform/intelligence/systems/types";

export const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
export function statusFromScore(score: number): SystemsHealthStatus {
  if (score >= 85) return "excellent"; if (score >= 70) return "healthy"; if (score >= 50) return "warning"; return "critical";
}
export function priorityFromScore(score: number): SystemsPriorityBand {
  if (score < 35) return "critical"; if (score < 50) return "high"; if (score < 65) return "medium"; if (score < 80) return "low"; return "monitor";
}
export function levelFromValue(value: number): SystemsConfidenceLevel {
  if (value >= .8) return "high"; if (value >= .55) return "medium"; if (value >= .3) return "low"; return "unknown";
}
export function outlookFromScore(score: number, volatility = 0): SystemsOutlook {
  if (volatility >= 25) return "volatile";
  if (score >= 78) return "adaptive"; if (score >= 62) return "stable"; if (score >= 45) return "constrained"; return "uncertain";
}
export function buildConfidence(factors: Array<{ key: string; label: string; contribution: number }>): SystemsConfidenceScore {
  const value = Math.min(1, Math.max(0, factors.reduce((s, f) => s + f.contribution, 0) / Math.max(1, factors.length)));
  return { value, level: levelFromValue(value), factors };
}
export function buildLens(partial: Partial<SystemsLens> = {}): SystemsLens {
  return {
    dependencyImpact: partial.dependencyImpact ?? "Dependency impact requires confirmation.",
    bottleneckRisk: partial.bottleneckRisk ?? "Bottleneck risk requires confirmation.",
    feedbackStability: partial.feedbackStability ?? "Feedback stability requires confirmation.",
    systemComplexity: partial.systemComplexity ?? "System complexity requires confirmation.",
    resourceFlow: partial.resourceFlow ?? "Resource flow requires confirmation.",
    cascadingRisk: partial.cascadingRisk ?? "Cascading risk requires confirmation.",
    adaptability: partial.adaptability ?? "Adaptability requires confirmation.",
    longTermSystemHealth: partial.longTermSystemHealth ?? "Long-term system health requires confirmation.",
  };
}
export const defaultCreateId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
export const defaultPeriodLabel = (now = new Date()) => now.toISOString().slice(0, 7);
export const emptySystemsScope = (): GraphScope => ({ organizationId: null, schoolId: null });

export function defaultSystemsBaseline(): SystemsBaseline {
  const areaScores = Object.fromEntries(SYSTEMS_AREAS.map(a => [a, 68])) as SystemsBaseline["areaScores"];
  return {
    organizationHealthScore: 72,
    executionScore: 70,
    areaScores,
    dependencyImpact: 68,
    bottleneckRisk: 68,
    feedbackStability: 68,
    systemComplexity: 68,
    resourceFlow: 68,
    cascadingRisk: 68,
    adaptability: 68,
    longTermSystemHealth: 68,
    forecastMaturity: 65,
    scenarioMaturity: 64,
    evidenceCoverage: 66,
  };
}

const lightScore = (value: unknown, fallback: number) =>
  typeof value === "number" ? clamp(value <= 1 ? value * 100 : value) : fallback;

export function deriveSystemsBaseline(request: SystemsRequest): SystemsBaseline {
  const base = defaultSystemsBaseline();
  const health = lightScore(
    request.oiosResult?.health.score ?? request.graphInput?.organizationHealth?.overallScore,
    base.organizationHealthScore,
  );
  const operations = lightScore(request.operationsResult?.healthScore?.value ?? request.operationsResult?.throughputScore?.value, 70);
  const legal = lightScore(request.legalComplianceRiskResult?.healthScore?.value, 70);
  const legalCompliance = lightScore(request.legalComplianceRiskResult?.complianceScore?.value, legal);
  const predictive = lightScore(request.predictiveResult?.predictiveScore?.value ?? request.predictiveResult?.healthScore?.value, base.forecastMaturity);
  const decision = lightScore(request.decisionResult?.confidence?.value, 70);
  const economic = lightScore(request.economicResult?.economicScore?.value ?? request.economicResult?.healthScore?.value, 70);
  const behavioral = lightScore(request.behavioralResult?.healthScore?.value, 70);
  const ethical = lightScore(request.ethicalResult?.healthScore?.value, 70);
  const ethicalFairness = lightScore(request.ethicalResult?.fairnessScore?.value, ethical);
  const opportunity = lightScore(request.opportunityResult?.opportunityScore?.value ?? request.opportunityResult?.healthScore?.value, 70);

  const areaScores = { ...base.areaScores };
  areaScores.system_mapping = clamp((operations + decision + ethical) / 3);
  areaScores.dependency_analysis = clamp((operations + economic + decision) / 3);
  areaScores.feedback_loop_analysis = clamp((behavioral + ethical + operations) / 3);
  areaScores.constraint_identification = clamp((legal + legalCompliance + operations) / 3);
  areaScores.bottleneck_detection = clamp((operations + economic + predictive) / 3);
  areaScores.flow_optimization = clamp((operations + opportunity + decision) / 3);
  areaScores.emergent_behavior = clamp((behavioral + ethical + predictive) / 3);
  areaScores.network_dynamics = clamp((operations + behavioral + economic) / 3);
  areaScores.organizational_complexity = clamp((decision + ethical + legal) / 3);
  areaScores.interdependency_modeling = clamp((areaScores.dependency_analysis + areaScores.network_dynamics + decision) / 3);
  areaScores.cascading_risk = clamp(100 - ((100 - areaScores.bottleneck_detection) * .35 + (100 - areaScores.dependency_analysis) * .35 + (100 - ethicalFairness) * .3));
  areaScores.system_stability = clamp((areaScores.feedback_loop_analysis + areaScores.system_mapping + ethical) / 3);
  areaScores.leverage_point_identification = clamp((decision + opportunity + areaScores.system_mapping) / 3);
  areaScores.resource_flow = clamp((operations + economic + opportunity) / 3);
  areaScores.adaptive_capacity = clamp((behavioral + predictive + opportunity) / 3);
  areaScores.system_evolution = clamp((predictive + opportunity + areaScores.adaptive_capacity) / 3);
  areaScores.scenario_interaction = clamp((predictive + areaScores.cascading_risk + decision) / 3);

  return {
    ...base,
    organizationHealthScore: clamp(health),
    executionScore: clamp(request.oiosResult?.baseline.executionScore ?? base.executionScore),
    areaScores,
    dependencyImpact: clamp(areaScores.dependency_analysis),
    bottleneckRisk: clamp(areaScores.bottleneck_detection),
    feedbackStability: clamp(areaScores.feedback_loop_analysis),
    systemComplexity: clamp(areaScores.organizational_complexity),
    resourceFlow: clamp(areaScores.resource_flow),
    cascadingRisk: clamp(areaScores.cascading_risk),
    adaptability: clamp(areaScores.adaptive_capacity),
    longTermSystemHealth: clamp((areaScores.system_stability + areaScores.adaptive_capacity + predictive) / 3),
    forecastMaturity: clamp(predictive),
    scenarioMaturity: clamp((predictive + areaScores.scenario_interaction) / 2),
    evidenceCoverage: clamp((operations + ethical + legal + behavioral) / 4),
    ...request.baselineOverrides,
  };
}

export const systemsModels = {
  clamp, statusFromScore, priorityFromScore, levelFromValue, outlookFromScore,
  buildConfidence, buildLens, defaultCreateId, defaultPeriodLabel, emptySystemsScope,
  defaultSystemsBaseline, deriveSystemsBaseline,
};
export class SystemsModels {
  static clamp = clamp; static buildLens = buildLens; static derive = deriveSystemsBaseline;
  static baseline = defaultSystemsBaseline; static outlook = outlookFromScore;
}
