import type { GraphScope } from "@/lib/platform/intelligence/executive-graph/types";
import type {
  SystemsBaseline, SystemsConfidenceLevel, SystemsConfidenceScore,
  SystemsHealthStatus, SystemsLens, SystemsOutlook, SystemsPriorityBand,
  SystemsRequest,
} from "@/lib/platform/intelligence/systems/types";
import { SYSTEMS_AREAS } from "@/lib/platform/intelligence/systems/types";
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
export function statusFromScore(score: number): SystemsHealthStatus { return sharedStatusFromScore(score); }
export function priorityFromScore(score: number): SystemsPriorityBand { return priorityFromScoreLowUrgent(score); }
export function levelFromValue(value: number): SystemsConfidenceLevel { return sharedLevelFromValue(value); }
export function outlookFromScore(score: number, volatility = 0): SystemsOutlook {
  return outlookFromScoreConfigured(score, volatility, {
    volatileLabel: "volatile",
    high: { min: OUTLOOK_THRESHOLDS_STANDARD.high, label: "adaptive" },
    mid: { min: OUTLOOK_THRESHOLDS_STANDARD.mid, label: "stable" },
    low: { min: OUTLOOK_THRESHOLDS_STANDARD.low, label: "constrained" },
    fallback: "uncertain",
  });
}
export function buildConfidence(
  factors: Array<{ key: string; label: string; contribution: number }>
): SystemsConfidenceScore {
  return buildConfidenceAverage(factors) as SystemsConfidenceScore;
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
export const defaultCreateId = sharedDefaultCreateId;
export const defaultPeriodLabel = periodLabelIsoMonth;
export const emptySystemsScope = (): GraphScope => emptyGraphScope();

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

const lightScore = sharedLightScore;

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
