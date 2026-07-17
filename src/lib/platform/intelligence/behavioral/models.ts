import type { GraphScope } from "@/lib/platform/intelligence/executive-graph/types";
import type {
  BehavioralBaseline, BehavioralConfidenceLevel, BehavioralConfidenceScore,
  BehavioralHealthStatus, BehavioralLens, BehavioralOutlook, BehavioralPriorityBand,
  BehavioralRequest,
} from "@/lib/platform/intelligence/behavioral/types";
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
export function statusFromScore(score: number): BehavioralHealthStatus { return sharedStatusFromScore(score); }
export function priorityFromScore(score: number): BehavioralPriorityBand { return priorityFromScoreLowUrgent(score); }
export function levelFromValue(value: number): BehavioralConfidenceLevel { return sharedLevelFromValue(value); }
export function outlookFromScore(score: number, volatility = 0): BehavioralOutlook {
  return outlookFromScoreConfigured(score, volatility, {
    volatileLabel: "volatile",
    high: { min: OUTLOOK_THRESHOLDS_STANDARD.high, label: "adaptive" },
    mid: { min: OUTLOOK_THRESHOLDS_STANDARD.mid, label: "stable" },
    low: { min: OUTLOOK_THRESHOLDS_STANDARD.low, label: "resistant" },
    fallback: "uncertain",
  });
}
export function buildConfidence(
  factors: Array<{ key: string; label: string; contribution: number }>
): BehavioralConfidenceScore {
  return buildConfidenceAverage(factors) as BehavioralConfidenceScore;
}
export function buildLens(lens: BehavioralLens): BehavioralLens {
  return {
    decisionConfidence: lens.decisionConfidence,
    cognitiveBiasRisk: lens.cognitiveBiasRisk,
    motivationAlignment: lens.motivationAlignment,
    adoptionProbability: lens.adoptionProbability,
    collaborationImpact: lens.collaborationImpact,
    changeResistance: lens.changeResistance,
    leadershipReadiness: lens.leadershipReadiness,
    longTermBehavioralOutlook: lens.longTermBehavioralOutlook,
  };
}
export const defaultCreateId = sharedDefaultCreateId;
export const defaultPeriodLabel = periodLabelQuarter;
export const emptyBehavioralScope = (): GraphScope => emptyGraphScope();
const lightScore = sharedLightScore;

export function defaultBehavioralBaseline(): BehavioralBaseline {
  return {
    organizationHealthScore: 72, executionScore: 68,
    areaScores: {
      decision_behavior: 64,
      cognitive_bias: 63,
      motivation: 62,
      incentive_modeling: 61,
      organizational_change: 60,
      change_resistance: 59,
      leadership_behavior: 58,
      team_dynamics: 57,
      collaboration: 64,
      communication_patterns: 63,
      conflict_behavior: 62,
      customer_behavior: 61,
      employee_behavior: 60,
      learning_adaptation: 59,
      adoption_forecasting: 58,
      behavioral_risk: 57,
      behavioral_opportunity: 64,
    },
    decisionConfidence: 62, cognitiveBiasRisk: 42, motivationAlignment: 61,
    adoptionProbability: 58, collaborationImpact: 60, changeResistance: 44,
    leadershipReadiness: 61, teamCohesion: 60,
    forecastMaturity: 60, scenarioMaturity: 58, evidenceCoverage: 62,
  };
}

export function deriveBehavioralBaseline(request: BehavioralRequest): BehavioralBaseline {
  const base = defaultBehavioralBaseline();
  const health = request.oiosResult?.health.score ?? request.graphInput?.organizationHealth?.overallScore ?? base.organizationHealthScore;
  const stakeholder = lightScore(request.stakeholderResult?.stakeholderScore?.value ?? request.stakeholderResult?.healthScore?.value, base.collaborationImpact);
  const stakeholderTrust = lightScore(request.stakeholderResult?.trustLevel, stakeholder);
  const stakeholderEngagement = lightScore(request.stakeholderResult?.engagementQuality, base.motivationAlignment);
  const reputation = lightScore(request.reputationResult?.reputationScore?.value ?? request.reputationResult?.healthScore?.value, base.leadershipReadiness);
  const reputationTrust = lightScore(request.reputationResult?.trustLevel, reputation);
  const brandStrength = lightScore(request.reputationResult?.brandStrength, base.decisionConfidence);
  const crisisRisk = lightScore(request.reputationResult?.crisisRisk, base.cognitiveBiasRisk);
  const humanCapital = lightScore(request.humanCapitalResult?.humanCapitalScore?.value ?? request.humanCapitalResult?.healthScore?.value, base.areaScores.employee_behavior);
  const hcEngagement = lightScore(request.humanCapitalResult?.engagementScore?.value, stakeholderEngagement);
  const hcLeadership = lightScore(request.humanCapitalResult?.leadershipScore?.value, base.leadershipReadiness);
  const customer = lightScore(request.customerResult?.customerScore?.value ?? request.customerResult?.healthScore?.value, base.areaScores.customer_behavior);
  const customerEngagement = lightScore(request.customerResult?.engagementScore?.value, base.adoptionProbability);
  const customerBehavior = lightScore(request.customerResult?.behaviorScore?.value, customer);
  const opportunity = lightScore(request.opportunityResult?.opportunityScore?.value ?? request.opportunityResult?.healthScore?.value, base.areaScores.behavioral_opportunity);
  const predictive = lightScore(request.predictiveResult?.predictiveScore?.value ?? request.predictiveResult?.healthScore?.value, base.forecastMaturity);
  const decision = lightScore(request.decisionResult?.confidence?.value, 70);
  const knowledge = lightScore(request.knowledgeResult?.knowledgeScore?.value ?? request.knowledgeResult?.coverageScore?.value ?? request.knowledgeResult?.healthScore?.value, base.areaScores.learning_adaptation);

  const areaScores = { ...base.areaScores };
  areaScores.decision_behavior = clamp((decision + brandStrength + stakeholderTrust) / 3);
  areaScores.cognitive_bias = clamp(100 - ((crisisRisk + (100 - decision) + (100 - reputationTrust)) / 3));
  areaScores.motivation = clamp((hcEngagement + stakeholderEngagement + humanCapital) / 3);
  areaScores.incentive_modeling = clamp((opportunity + areaScores.motivation + decision) / 3);
  areaScores.organizational_change = clamp((humanCapital + knowledge + opportunity) / 3);
  areaScores.change_resistance = clamp(100 - ((100 - areaScores.organizational_change) * .5 + crisisRisk * .3 + (100 - hcEngagement) * .2));
  areaScores.leadership_behavior = clamp((hcLeadership + decision + reputationTrust) / 3);
  areaScores.team_dynamics = clamp((humanCapital + stakeholder + areaScores.leadership_behavior) / 3);
  areaScores.collaboration = clamp((stakeholder + stakeholderEngagement + areaScores.team_dynamics) / 3);
  areaScores.communication_patterns = clamp((areaScores.collaboration + reputation + knowledge) / 3);
  areaScores.conflict_behavior = clamp((areaScores.team_dynamics + areaScores.communication_patterns + (100 - crisisRisk)) / 3);
  areaScores.customer_behavior = clamp((customer + customerBehavior + customerEngagement) / 3);
  areaScores.employee_behavior = clamp((humanCapital + hcEngagement + areaScores.motivation) / 2);
  areaScores.learning_adaptation = clamp((knowledge + predictive + areaScores.organizational_change) / 3);
  areaScores.adoption_forecasting = clamp((customerEngagement + areaScores.learning_adaptation + predictive) / 3);
  areaScores.behavioral_risk = clamp(100 - ((100 - areaScores.cognitive_bias) * .35 + (100 - areaScores.change_resistance) * .35 + (100 - areaScores.conflict_behavior) * .3));
  areaScores.behavioral_opportunity = clamp((opportunity + areaScores.motivation + areaScores.adoption_forecasting) / 3);

  return {
    ...base,
    organizationHealthScore: clamp(lightScore(health, 72)),
    executionScore: clamp(request.oiosResult?.baseline.executionScore ?? base.executionScore),
    areaScores,
    decisionConfidence: clamp(areaScores.decision_behavior),
    cognitiveBiasRisk: clamp(100 - areaScores.cognitive_bias),
    motivationAlignment: clamp(areaScores.motivation),
    adoptionProbability: clamp(areaScores.adoption_forecasting),
    collaborationImpact: clamp(areaScores.collaboration),
    changeResistance: clamp(100 - areaScores.change_resistance),
    leadershipReadiness: clamp(areaScores.leadership_behavior),
    teamCohesion: clamp(areaScores.team_dynamics),
    forecastMaturity: clamp(predictive),
    scenarioMaturity: clamp((predictive + areaScores.behavioral_risk) / 2),
    evidenceCoverage: clamp((stakeholder + reputation + humanCapital + customer + knowledge) / 5),
    ...request.baselineOverrides,
  };
}

export const behavioralModels = {
  clamp, statusFromScore, priorityFromScore, levelFromValue, outlookFromScore,
  buildConfidence, buildLens, defaultCreateId, defaultPeriodLabel, emptyBehavioralScope,
  defaultBehavioralBaseline, deriveBehavioralBaseline,
};
export class BehavioralModels {
  static clamp = clamp; static buildLens = buildLens; static derive = deriveBehavioralBaseline;
  static baseline = defaultBehavioralBaseline; static outlook = outlookFromScore;
}
