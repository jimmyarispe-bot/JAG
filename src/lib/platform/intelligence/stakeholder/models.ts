import type { GraphScope } from "@/lib/platform/intelligence/executive-graph/types";
import type {
  StakeholderBaseline, StakeholderConfidenceLevel, StakeholderConfidenceScore,
  StakeholderHealthStatus, StakeholderLens, StakeholderOutlook, StakeholderPriorityBand,
  StakeholderRequest,
} from "@/lib/platform/intelligence/stakeholder/types";

export const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
export function statusFromScore(score: number): StakeholderHealthStatus {
  if (score >= 85) return "excellent"; if (score >= 70) return "healthy"; if (score >= 50) return "warning"; return "critical";
}
export function priorityFromScore(score: number): StakeholderPriorityBand {
  if (score < 35) return "critical"; if (score < 50) return "high"; if (score < 65) return "medium"; if (score < 80) return "low"; return "monitor";
}
export function levelFromValue(value: number): StakeholderConfidenceLevel {
  if (value >= .8) return "high"; if (value >= .55) return "medium"; if (value >= .3) return "low"; return "unknown";
}
export function outlookFromScore(score: number, volatility = 0): StakeholderOutlook {
  if (volatility >= 25) return "volatile";
  if (score >= 78) return "aligned"; if (score >= 62) return "stable"; if (score >= 45) return "strained"; return "uncertain";
}
export function buildConfidence(factors: Array<{ key: string; label: string; contribution: number }>): StakeholderConfidenceScore {
  const value = Math.min(1, Math.max(0, factors.reduce((s, f) => s + f.contribution, 0) / Math.max(1, factors.length)));
  return { value, level: levelFromValue(value), factors };
}
export function buildLens(lens: StakeholderLens): StakeholderLens {
  return {
    influence: lens.influence,
    interest: lens.interest,
    trust: lens.trust,
    engagement: lens.engagement,
    satisfaction: lens.satisfaction,
    relationshipStrength: lens.relationshipStrength,
    collaborationOpportunity: lens.collaborationOpportunity,
    strategicImportance: lens.strategicImportance,
  };
}
export const defaultCreateId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
export const defaultPeriodLabel = (now = new Date()) => `${now.getUTCFullYear()}-Q${Math.floor(now.getUTCMonth() / 3) + 1}`;
export const emptyStakeholderScope = (): GraphScope => ({ organizationId: null, schoolId: null });
const lightScore = (value: unknown, fallback: number) => typeof value === "number" ? (value <= 1 ? value * 100 : value) : fallback;

export function defaultStakeholderBaseline(): StakeholderBaseline {
  return {
    organizationHealthScore: 72, executionScore: 68,
    areaScores: {
      stakeholder_identification: 61,
      stakeholder_mapping: 62,
      influence_analysis: 60,
      interest_analysis: 63,
      engagement: 64,
      communication: 65,
      trust_relationship: 58,
      board_stakeholders: 59,
      investor_donor: 60,
      customer_stakeholders: 66,
      employee_stakeholders: 64,
      partner_stakeholders: 62,
      community_stakeholders: 61,
      government_stakeholders: 58,
      satisfaction_sentiment: 63,
      conflict_detection: 57,
      collaboration_opportunities: 65,
    },
    influencePressure: 48, interestAlignment: 62, trustLevel: 60,
    engagementQuality: 64, satisfactionIndex: 63, relationshipStrength: 61,
    collaborationPotential: 65, strategicImportance: 68,
    forecastMaturity: 60, scenarioMaturity: 58, evidenceCoverage: 62,
  };
}

export function deriveStakeholderBaseline(request: StakeholderRequest): StakeholderBaseline {
  const base = defaultStakeholderBaseline();
  const health = request.oiosResult?.health.score ?? request.graphInput?.organizationHealth?.overallScore ?? base.organizationHealthScore;
  const customer = lightScore(request.customerResult?.customerScore?.value ?? request.customerResult?.healthScore?.value, base.areaScores.customer_stakeholders);
  const humanCapital = lightScore(request.humanCapitalResult?.humanCapitalScore?.value ?? request.humanCapitalResult?.healthScore?.value, base.areaScores.employee_stakeholders);
  const political = lightScore(request.politicalResult?.politicalScore?.value ?? request.politicalResult?.healthScore?.value, base.areaScores.government_stakeholders);
  const politicalStability = lightScore(request.politicalResult?.politicalStability?.value, base.trustLevel);
  const competitive = lightScore(request.competitiveResult?.competitiveScore?.value ?? request.competitiveResult?.healthScore?.value, base.areaScores.partner_stakeholders);
  const environmental = lightScore(request.environmentalResult?.environmentalScore?.value ?? request.environmentalResult?.healthScore?.value, base.areaScores.community_stakeholders);
  const sustainability = lightScore(request.environmentalResult?.sustainabilityScore?.value, base.collaborationPotential);
  const opportunity = lightScore(request.opportunityResult?.opportunityScore?.value ?? request.opportunityResult?.healthScore?.value, base.areaScores.collaboration_opportunities);
  const predictive = lightScore(request.predictiveResult?.predictiveScore?.value ?? request.predictiveResult?.healthScore?.value, base.forecastMaturity);
  const decision = lightScore(request.decisionResult?.confidence?.value, 70);

  const areaScores = { ...base.areaScores };
  areaScores.stakeholder_identification = clamp((customer + humanCapital + political) / 3);
  areaScores.stakeholder_mapping = clamp((areaScores.stakeholder_identification + competitive) / 2);
  areaScores.influence_analysis = clamp((political + competitive + decision) / 3);
  areaScores.interest_analysis = clamp((customer + opportunity + politicalStability) / 3);
  areaScores.engagement = clamp((customer + humanCapital + opportunity) / 3);
  areaScores.communication = clamp((areaScores.engagement + politicalStability) / 2);
  areaScores.trust_relationship = clamp((politicalStability + humanCapital + customer) / 3);
  areaScores.board_stakeholders = clamp((decision + politicalStability + opportunity) / 3);
  areaScores.investor_donor = clamp((opportunity + decision + competitive) / 3);
  areaScores.customer_stakeholders = clamp(customer);
  areaScores.employee_stakeholders = clamp(humanCapital);
  areaScores.partner_stakeholders = clamp((competitive + opportunity) / 2);
  areaScores.community_stakeholders = clamp((environmental + sustainability + political) / 3);
  areaScores.government_stakeholders = clamp((political + politicalStability) / 2);
  areaScores.satisfaction_sentiment = clamp((customer + humanCapital + areaScores.trust_relationship) / 3);
  areaScores.conflict_detection = clamp(100 - ((100 - areaScores.trust_relationship) * .5 + (100 - areaScores.interest_analysis) * .5) / 1);
  areaScores.collaboration_opportunities = clamp((opportunity + competitive + sustainability) / 3);

  const influencePressure = clamp(100 - areaScores.influence_analysis);
  const interestAlignment = clamp(areaScores.interest_analysis);
  const trustLevel = clamp(areaScores.trust_relationship);
  const engagementQuality = clamp(areaScores.engagement);
  const satisfactionIndex = clamp(areaScores.satisfaction_sentiment);
  const relationshipStrength = clamp((areaScores.trust_relationship + areaScores.partner_stakeholders) / 2);
  const collaborationPotential = clamp(areaScores.collaboration_opportunities);
  const strategicImportance = clamp((areaScores.board_stakeholders + areaScores.investor_donor + areaScores.influence_analysis) / 3);

  return {
    ...base,
    organizationHealthScore: clamp(lightScore(health, 72)),
    executionScore: clamp(request.oiosResult?.baseline.executionScore ?? base.executionScore),
    areaScores,
    influencePressure,
    interestAlignment,
    trustLevel,
    engagementQuality,
    satisfactionIndex,
    relationshipStrength,
    collaborationPotential,
    strategicImportance,
    forecastMaturity: clamp(predictive),
    scenarioMaturity: clamp((predictive + areaScores.influence_analysis) / 2),
    evidenceCoverage: clamp((customer + humanCapital + political + environmental) / 4),
    ...request.baselineOverrides,
  };
}

export const stakeholderModels = {
  clamp, statusFromScore, priorityFromScore, levelFromValue, outlookFromScore,
  buildConfidence, buildLens, defaultCreateId, defaultPeriodLabel, emptyStakeholderScope,
  defaultStakeholderBaseline, deriveStakeholderBaseline,
};
export class StakeholderModels {
  static clamp = clamp; static buildLens = buildLens; static derive = deriveStakeholderBaseline;
  static baseline = defaultStakeholderBaseline; static outlook = outlookFromScore;
}
