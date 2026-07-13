import type { GraphScope } from "@/lib/platform/intelligence/executive-graph/types";
import type {
  WisdomBaseline, WisdomConfidenceLevel, WisdomConfidenceScore,
  WisdomHealthStatus, WisdomLens, WisdomOutlook, WisdomPriorityBand,
  WisdomRequest,
} from "@/lib/platform/intelligence/wisdom/types";
import { WISDOM_AREAS } from "@/lib/platform/intelligence/wisdom/types";

export const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
export function statusFromScore(score: number): WisdomHealthStatus {
  if (score >= 85) return "excellent"; if (score >= 70) return "healthy"; if (score >= 50) return "warning"; return "critical";
}
export function priorityFromScore(score: number): WisdomPriorityBand {
  if (score < 35) return "critical"; if (score < 50) return "high"; if (score < 65) return "medium"; if (score < 80) return "low"; return "monitor";
}
export function levelFromValue(value: number): WisdomConfidenceLevel {
  if (value >= .8) return "high"; if (value >= .55) return "medium"; if (value >= .3) return "low"; return "unknown";
}
export function outlookFromScore(score: number, volatility = 0): WisdomOutlook {
  if (volatility >= 25) return "volatile";
  if (score >= 82) return "wise"; if (score >= 68) return "stable"; if (score >= 50) return "shortsighted"; return "uncertain";
}
export function buildConfidence(factors: Array<{ key: string; label: string; contribution: number }>): WisdomConfidenceScore {
  const value = Math.min(1, Math.max(0, factors.reduce((s, f) => s + f.contribution, 0) / Math.max(1, factors.length)));
  return { value, level: levelFromValue(value), factors };
}
export function buildLens(partial: Partial<WisdomLens> = {}): WisdomLens {
  return {
    strategicValue: partial.strategicValue ?? "Strategic value requires confirmation.",
    longTermImpact: partial.longTermImpact ?? "Long-term impact requires confirmation.",
    confidenceLevel: partial.confidenceLevel ?? "Confidence level requires confirmation.",
    evidenceQuality: partial.evidenceQuality ?? "Evidence quality requires confirmation.",
    tradeOffBalance: partial.tradeOffBalance ?? "Trade-off balance requires confirmation.",
    organizationalAlignment: partial.organizationalAlignment ?? "Organizational alignment requires confirmation.",
    ethicalIntegrity: partial.ethicalIntegrity ?? "Ethical integrity requires confirmation.",
    wisdomScore: partial.wisdomScore ?? "Wisdom score requires confirmation.",
  };
}
export const defaultCreateId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
export const defaultPeriodLabel = (now = new Date()) => now.toISOString().slice(0, 7);
export const emptyWisdomScope = (): GraphScope => ({ organizationId: null, schoolId: null });

export function defaultWisdomBaseline(): WisdomBaseline {
  const areaScores = Object.fromEntries(WISDOM_AREAS.map(a => [a, 68])) as WisdomBaseline["areaScores"];
  return {
    organizationHealthScore: 72,
    executionScore: 70,
    areaScores,
    strategicValue: 68,
    longTermImpact: 68,
    confidenceLevel: 68,
    evidenceQuality: 68,
    tradeOffBalance: 68,
    organizationalAlignment: 68,
    ethicalIntegrity: 68,
    wisdomScore: 68,
    forecastMaturity: 65,
    scenarioMaturity: 64,
    evidenceCoverage: 66,
  };
}

const lightScore = (value: unknown, fallback: number) =>
  typeof value === "number" ? clamp(value <= 1 ? value * 100 : value) : fallback;

export function deriveWisdomBaseline(request: WisdomRequest): WisdomBaseline {
  const base = defaultWisdomBaseline();
  const health = lightScore(
    request.oiosResult?.health.score ?? request.graphInput?.organizationHealth?.overallScore,
    base.organizationHealthScore,
  );
  const collective = lightScore(
    request.collectiveResult?.healthScore?.value ?? request.collectiveResult?.collectiveConfidence ?? request.collectiveResult?.baseline?.collectiveConfidence,
    70,
  );
  const institutionalMemory = lightScore(
    request.institutionalMemoryResult?.healthScore?.value ?? request.institutionalMemoryResult?.institutionalMemoryScore?.value,
    70,
  );
  const knowledge = lightScore(
    request.knowledgeResult?.knowledgeScore?.value ?? request.knowledgeResult?.healthScore?.value,
    70,
  );
  const decision = lightScore(request.decisionResult?.confidence?.value, 70);
  const predictive = lightScore(request.predictiveResult?.predictiveScore?.value ?? request.predictiveResult?.healthScore?.value, base.forecastMaturity);
  const ethical = lightScore(request.ethicalResult?.ethicalScore?.value ?? request.ethicalResult?.healthScore?.value, 70);
  const systems = lightScore(request.systemsResult?.healthScore?.value, 70);
  const resilience = lightScore(request.resilienceResult?.healthScore?.value ?? request.resilienceResult?.adaptiveCapacity, 70);
  const opportunity = lightScore(request.opportunityResult?.opportunityScore?.value ?? request.opportunityResult?.healthScore?.value, 70);
  const behavioral = lightScore(request.behavioralResult?.behavioralScore?.value ?? request.behavioralResult?.healthScore?.value, 70);
  const cultural = lightScore(request.culturalResult?.culturalScore?.value ?? request.culturalResult?.healthScore?.value, 70);
  const stakeholder = lightScore(request.stakeholderResult?.healthScore?.value ?? request.stakeholderResult?.engagementScore?.value, 70);
  const ecosystem = lightScore(request.ecosystemResult?.ecosystemScore?.value ?? request.ecosystemResult?.healthScore?.value, 70);
  const market = lightScore(request.marketResult?.marketScore?.value ?? request.marketResult?.healthScore?.value, 70);
  const competitive = lightScore(request.competitiveResult?.competitiveScore?.value ?? request.competitiveResult?.healthScore?.value, 70);
  const economic = lightScore(request.economicResult?.economicScore?.value ?? request.economicResult?.healthScore?.value, 70);
  const operations = lightScore(request.operationsResult?.operationsScore?.value ?? request.operationsResult?.healthScore?.value, 70);
  const humanCapital = lightScore(request.humanCapitalResult?.humanCapitalScore?.value ?? request.humanCapitalResult?.healthScore?.value, 70);
  const environmental = lightScore(request.environmentalResult?.environmentalScore?.value ?? request.environmentalResult?.healthScore?.value, 70);
  const political = lightScore(request.politicalResult?.politicalScore?.value ?? request.politicalResult?.healthScore?.value, 70);
  const reputation = lightScore(request.reputationResult?.reputationScore?.value ?? request.reputationResult?.healthScore?.value, 70);

  const areaScores = { ...base.areaScores };
  areaScores.executive_judgment = clamp((collective + decision + ethical) / 3);
  areaScores.strategic_reasoning = clamp((decision + predictive + collective) / 3);
  areaScores.trade_off_analysis = clamp((opportunity + economic + decision) / 3);
  areaScores.long_term_thinking = clamp((predictive + institutionalMemory + resilience) / 3);
  areaScores.cross_domain_synthesis = clamp((collective + systems + knowledge) / 3);
  areaScores.decision_quality_assessment = clamp((decision + collective + knowledge) / 3);
  areaScores.uncertainty_analysis = clamp((predictive + systems + resilience) / 3);
  areaScores.confidence_calibration = clamp((decision + knowledge + collective) / 3);
  areaScores.organizational_prioritization = clamp((opportunity + decision + cultural) / 3);
  areaScores.mission_alignment = clamp((cultural + ethical + stakeholder) / 3);
  areaScores.values_alignment = clamp((ethical + cultural + reputation) / 3);
  areaScores.ethical_judgment = clamp((ethical + cultural + decision) / 3);
  areaScores.strategic_timing = clamp((opportunity + market + predictive) / 3);
  areaScores.opportunity_cost_analysis = clamp((opportunity + economic + competitive) / 3);
  areaScores.executive_recommendation_validation = clamp((collective + decision + knowledge) / 3);
  areaScores.organizational_judgment_evolution = clamp((institutionalMemory + collective + predictive) / 3);
  areaScores.institutional_wisdom = clamp((institutionalMemory + knowledge + collective) / 3);

  const strategicValue = clamp(areaScores.strategic_reasoning);
  const longTermImpact = clamp(areaScores.long_term_thinking);
  const confidenceLevel = clamp(areaScores.confidence_calibration);
  const evidenceQuality = clamp((knowledge + institutionalMemory + collective) / 3);
  const tradeOffBalance = clamp(areaScores.trade_off_analysis);
  const organizationalAlignment = clamp((areaScores.mission_alignment + areaScores.values_alignment) / 2);
  const ethicalIntegrity = clamp(areaScores.ethical_judgment);
  const wisdomScore = clamp((strategicValue + longTermImpact + tradeOffBalance + ethicalIntegrity + confidenceLevel) / 5);

  return {
    ...base,
    organizationHealthScore: clamp(health),
    executionScore: clamp(request.oiosResult?.baseline.executionScore ?? base.executionScore),
    areaScores,
    strategicValue,
    longTermImpact,
    confidenceLevel,
    evidenceQuality,
    tradeOffBalance,
    organizationalAlignment,
    ethicalIntegrity,
    wisdomScore,
    forecastMaturity: clamp(predictive),
    scenarioMaturity: clamp((predictive + areaScores.uncertainty_analysis) / 2),
    evidenceCoverage: clamp((collective + institutionalMemory + knowledge + ethical + systems + resilience + opportunity + behavioral + cultural + stakeholder + ecosystem + market + operations + humanCapital + environmental + political + reputation + economic) / 18),
    ...request.baselineOverrides,
  };
}

export const wisdomModels = {
  clamp, statusFromScore, priorityFromScore, levelFromValue, outlookFromScore,
  buildConfidence, buildLens, defaultCreateId, defaultPeriodLabel, emptyWisdomScope,
  defaultWisdomBaseline, deriveWisdomBaseline,
};
export class WisdomModels {
  static clamp = clamp; static buildLens = buildLens; static derive = deriveWisdomBaseline;
  static baseline = defaultWisdomBaseline; static outlook = outlookFromScore;
}
