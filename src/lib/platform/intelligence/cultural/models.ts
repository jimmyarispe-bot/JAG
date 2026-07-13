import type { GraphScope } from "@/lib/platform/intelligence/executive-graph/types";
import type {
  CulturalBaseline, CulturalConfidenceLevel, CulturalConfidenceScore,
  CulturalHealthStatus, CulturalLens, CulturalOutlook, CulturalPriorityBand,
  CulturalRequest,
} from "@/lib/platform/intelligence/cultural/types";

export const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
export function statusFromScore(score: number): CulturalHealthStatus {
  if (score >= 85) return "excellent"; if (score >= 70) return "healthy"; if (score >= 50) return "warning"; return "critical";
}
export function priorityFromScore(score: number): CulturalPriorityBand {
  if (score < 35) return "critical"; if (score < 50) return "high"; if (score < 65) return "medium"; if (score < 80) return "low"; return "monitor";
}
export function levelFromValue(value: number): CulturalConfidenceLevel {
  if (value >= .8) return "high"; if (value >= .55) return "medium"; if (value >= .3) return "low"; return "unknown";
}
export function outlookFromScore(score: number, volatility = 0): CulturalOutlook {
  if (volatility >= 25) return "volatile";
  if (score >= 78) return "cohesive"; if (score >= 62) return "stable"; if (score >= 45) return "fragmented"; return "uncertain";
}
export function buildConfidence(factors: Array<{ key: string; label: string; contribution: number }>): CulturalConfidenceScore {
  const value = Math.min(1, Math.max(0, factors.reduce((s, f) => s + f.contribution, 0) / Math.max(1, factors.length)));
  return { value, level: levelFromValue(value), factors };
}
export function buildLens(lens: CulturalLens): CulturalLens {
  return {
    missionAlignment: lens.missionAlignment,
    valuesAlignment: lens.valuesAlignment,
    culturalHealth: lens.culturalHealth,
    collaborationQuality: lens.collaborationQuality,
    innovationReadiness: lens.innovationReadiness,
    psychologicalSafety: lens.psychologicalSafety,
    engagement: lens.engagement,
    longTermCulturalOutlook: lens.longTermCulturalOutlook,
  };
}
export const defaultCreateId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
export const defaultPeriodLabel = (now = new Date()) => `${now.getUTCFullYear()}-Q${Math.floor(now.getUTCMonth() / 3) + 1}`;
export const emptyCulturalScope = (): GraphScope => ({ organizationId: null, schoolId: null });
const lightScore = (value: unknown, fallback: number) => typeof value === "number" ? (value <= 1 ? value * 100 : value) : fallback;

export function defaultCulturalBaseline(): CulturalBaseline {
  return {
    organizationHealthScore: 72, executionScore: 68,
    areaScores: {
      organizational_culture: 64,
      team_culture: 63,
      leadership_culture: 62,
      mission_alignment: 61,
      values_alignment: 60,
      employee_engagement: 59,
      collaboration_culture: 58,
      communication_culture: 57,
      innovation_culture: 64,
      learning_culture: 63,
      psychological_safety: 62,
      inclusion_belonging: 61,
      cross_cultural: 60,
      community_culture: 59,
      cultural_risk: 58,
      cultural_opportunity: 57,
      cultural_transformation: 64,
    },
    missionAlignment: 62, valuesAlignment: 61, culturalHealth: 60,
    collaborationQuality: 58, innovationReadiness: 60, psychologicalSafety: 61,
    engagement: 59,
    forecastMaturity: 60, scenarioMaturity: 58, evidenceCoverage: 62,
  };
}

export function deriveCulturalBaseline(request: CulturalRequest): CulturalBaseline {
  const base = defaultCulturalBaseline();
  const health = request.oiosResult?.health.score ?? request.graphInput?.organizationHealth?.overallScore ?? base.organizationHealthScore;
  const behavioral = lightScore(request.behavioralResult?.healthScore?.value, base.culturalHealth);
  const behDecision = lightScore(request.behavioralResult?.decisionBehaviorScore?.value, base.missionAlignment);
  const behMotivation = lightScore(request.behavioralResult?.motivationScore?.value, base.engagement);
  const behCollaboration = lightScore(request.behavioralResult?.collaborationScore?.value, base.collaborationQuality);
  const stakeholder = lightScore(request.stakeholderResult?.stakeholderScore?.value ?? request.stakeholderResult?.healthScore?.value, base.collaborationQuality);
  const stakeholderTrust = lightScore(request.stakeholderResult?.trustLevel, stakeholder);
  const stakeholderEngagement = lightScore(request.stakeholderResult?.engagementQuality, base.engagement);
  const humanCapital = lightScore(request.humanCapitalResult?.humanCapitalScore?.value ?? request.humanCapitalResult?.healthScore?.value, base.areaScores.employee_engagement);
  const hcEngagement = lightScore(request.humanCapitalResult?.engagementScore?.value, stakeholderEngagement);
  const hcLeadership = lightScore(request.humanCapitalResult?.leadershipScore?.value, base.areaScores.leadership_culture);
  const opportunity = lightScore(request.opportunityResult?.opportunityScore?.value ?? request.opportunityResult?.healthScore?.value, base.areaScores.cultural_opportunity);
  const predictive = lightScore(request.predictiveResult?.predictiveScore?.value ?? request.predictiveResult?.healthScore?.value, base.forecastMaturity);
  const decision = lightScore(request.decisionResult?.confidence?.value, 70);
  const knowledge = lightScore(request.knowledgeResult?.knowledgeScore?.value ?? request.knowledgeResult?.coverageScore?.value ?? request.knowledgeResult?.healthScore?.value, base.areaScores.learning_culture);

  const areaScores = { ...base.areaScores };
  areaScores.organizational_culture = clamp((behavioral + stakeholderTrust + decision) / 3);
  areaScores.team_culture = clamp((humanCapital + behCollaboration + stakeholder) / 3);
  areaScores.leadership_culture = clamp((hcLeadership + decision + behDecision) / 3);
  areaScores.mission_alignment = clamp((behDecision + decision + knowledge) / 3);
  areaScores.values_alignment = clamp((areaScores.mission_alignment + stakeholderTrust + behavioral) / 3);
  areaScores.employee_engagement = clamp((hcEngagement + stakeholderEngagement + behMotivation) / 3);
  areaScores.collaboration_culture = clamp((behCollaboration + stakeholder + areaScores.team_culture) / 3);
  areaScores.communication_culture = clamp((areaScores.collaboration_culture + knowledge + knowledge) / 3);
  areaScores.innovation_culture = clamp((opportunity + knowledge + areaScores.collaboration_culture) / 3);
  areaScores.learning_culture = clamp((knowledge + predictive + areaScores.innovation_culture) / 3);
  areaScores.psychological_safety = clamp((areaScores.team_culture + areaScores.employee_engagement + (100 - (100 - behavioral) * .4)) / 3);
  areaScores.inclusion_belonging = clamp((stakeholder + areaScores.psychological_safety + hcEngagement) / 3);
  areaScores.cross_cultural = clamp((areaScores.inclusion_belonging + stakeholder + knowledge) / 3);
  areaScores.community_culture = clamp((stakeholder + areaScores.organizational_culture + areaScores.inclusion_belonging) / 3);
  areaScores.cultural_risk = clamp(100 - ((100 - areaScores.psychological_safety) * .35 + (100 - areaScores.values_alignment) * .35 + (100 - areaScores.employee_engagement) * .3));
  areaScores.cultural_opportunity = clamp((opportunity + areaScores.innovation_culture + areaScores.learning_culture) / 3);
  areaScores.cultural_transformation = clamp((areaScores.mission_alignment + areaScores.employee_engagement + predictive) / 3);

  return {
    ...base,
    organizationHealthScore: clamp(lightScore(health, 72)),
    executionScore: clamp(request.oiosResult?.baseline.executionScore ?? base.executionScore),
    areaScores,
    missionAlignment: clamp(areaScores.mission_alignment),
    valuesAlignment: clamp(areaScores.values_alignment),
    culturalHealth: clamp(areaScores.organizational_culture),
    collaborationQuality: clamp(areaScores.collaboration_culture),
    innovationReadiness: clamp(areaScores.innovation_culture),
    psychologicalSafety: clamp(areaScores.psychological_safety),
    engagement: clamp(areaScores.employee_engagement),
    forecastMaturity: clamp(predictive),
    scenarioMaturity: clamp((predictive + areaScores.cultural_risk) / 2),
    evidenceCoverage: clamp((behavioral + stakeholder + humanCapital + knowledge) / 4),
    ...request.baselineOverrides,
  };
}

export const culturalModels = {
  clamp, statusFromScore, priorityFromScore, levelFromValue, outlookFromScore,
  buildConfidence, buildLens, defaultCreateId, defaultPeriodLabel, emptyCulturalScope,
  defaultCulturalBaseline, deriveCulturalBaseline,
};
export class CulturalModels {
  static clamp = clamp; static buildLens = buildLens; static derive = deriveCulturalBaseline;
  static baseline = defaultCulturalBaseline; static outlook = outlookFromScore;
}
