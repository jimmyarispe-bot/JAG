import type { GraphScope } from "@/lib/platform/intelligence/executive-graph/types";
import type {
  ReputationBaseline, ReputationConfidenceLevel, ReputationConfidenceScore,
  ReputationHealthStatus, ReputationLens, ReputationOutlook, ReputationPriorityBand,
  ReputationRequest,
} from "@/lib/platform/intelligence/reputation/types";

export const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
export function statusFromScore(score: number): ReputationHealthStatus {
  if (score >= 85) return "excellent"; if (score >= 70) return "healthy"; if (score >= 50) return "warning"; return "critical";
}
export function priorityFromScore(score: number): ReputationPriorityBand {
  if (score < 35) return "critical"; if (score < 50) return "high"; if (score < 65) return "medium"; if (score < 80) return "low"; return "monitor";
}
export function levelFromValue(value: number): ReputationConfidenceLevel {
  if (value >= .8) return "high"; if (value >= .55) return "medium"; if (value >= .3) return "low"; return "unknown";
}
export function outlookFromScore(score: number, volatility = 0): ReputationOutlook {
  if (volatility >= 25) return "volatile";
  if (score >= 78) return "ascending"; if (score >= 62) return "stable"; if (score >= 45) return "fragile"; return "uncertain";
}
export function buildConfidence(factors: Array<{ key: string; label: string; contribution: number }>): ReputationConfidenceScore {
  const value = Math.min(1, Math.max(0, factors.reduce((s, f) => s + f.contribution, 0) / Math.max(1, factors.length)));
  return { value, level: levelFromValue(value), factors };
}
export function buildLens(lens: ReputationLens): ReputationLens {
  return {
    trustLevel: lens.trustLevel,
    publicPerception: lens.publicPerception,
    brandStrength: lens.brandStrength,
    mediaExposure: lens.mediaExposure,
    crisisRisk: lens.crisisRisk,
    narrativeMomentum: lens.narrativeMomentum,
    credibility: lens.credibility,
    longTermReputationOutlook: lens.longTermReputationOutlook,
  };
}
export const defaultCreateId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
export const defaultPeriodLabel = (now = new Date()) => `${now.getUTCFullYear()}-Q${Math.floor(now.getUTCMonth() / 3) + 1}`;
export const emptyReputationScope = (): GraphScope => ({ organizationId: null, schoolId: null });
const lightScore = (value: unknown, fallback: number) => typeof value === "number" ? (value <= 1 ? value * 100 : value) : fallback;

export function defaultReputationBaseline(): ReputationBaseline {
  return {
    organizationHealthScore: 72, executionScore: 68,
    areaScores: {
      brand_reputation: 64,
      organizational_trust: 60,
      public_perception: 62,
      customer_reputation: 66,
      employee_reputation: 63,
      executive_reputation: 61,
      media_intelligence: 59,
      press_coverage: 58,
      social_narrative: 61,
      community_reputation: 60,
      partner_reputation: 62,
      investor_donor_confidence: 59,
      regulatory_reputation: 58,
      crisis_reputation: 57,
      misinformation_detection: 56,
      reputation_recovery: 58,
      credibility: 63,
    },
    trustLevel: 60, publicPerception: 62, brandStrength: 64,
    mediaExposure: 48, crisisRisk: 42, narrativeMomentum: 61,
    credibilityIndex: 63, recoveryCapacity: 58,
    forecastMaturity: 60, scenarioMaturity: 58, evidenceCoverage: 62,
  };
}

export function deriveReputationBaseline(request: ReputationRequest): ReputationBaseline {
  const base = defaultReputationBaseline();
  const health = request.oiosResult?.health.score ?? request.graphInput?.organizationHealth?.overallScore ?? base.organizationHealthScore;
  const stakeholder = lightScore(request.stakeholderResult?.stakeholderScore?.value ?? request.stakeholderResult?.healthScore?.value, base.trustLevel);
  const stakeholderTrust = lightScore(request.stakeholderResult?.trustLevel, stakeholder);
  const stakeholderEngagement = lightScore(request.stakeholderResult?.engagementQuality, base.publicPerception);
  const customer = lightScore(request.customerResult?.customerScore?.value ?? request.customerResult?.healthScore?.value, base.areaScores.customer_reputation);
  const customerBrand = lightScore(request.customerResult?.brandScore?.value, base.brandStrength);
  const customerEngagement = lightScore(request.customerResult?.engagementScore?.value, stakeholderEngagement);
  const political = lightScore(request.politicalResult?.politicalScore?.value ?? request.politicalResult?.healthScore?.value, base.areaScores.regulatory_reputation);
  const politicalStability = lightScore(request.politicalResult?.politicalStability?.value, base.credibilityIndex);
  const competitive = lightScore(request.competitiveResult?.competitiveScore?.value ?? request.competitiveResult?.healthScore?.value, base.areaScores.partner_reputation);
  const opportunity = lightScore(request.opportunityResult?.opportunityScore?.value ?? request.opportunityResult?.healthScore?.value, base.recoveryCapacity);
  const predictive = lightScore(request.predictiveResult?.predictiveScore?.value ?? request.predictiveResult?.healthScore?.value, base.forecastMaturity);
  const decision = lightScore(request.decisionResult?.confidence?.value, 70);
  const market = lightScore(request.marketResult?.marketScore?.value ?? request.marketResult?.brandPosition?.value ?? request.marketResult?.healthScore?.value, customerBrand);

  const areaScores = { ...base.areaScores };
  areaScores.brand_reputation = clamp((customerBrand + market + competitive) / 3);
  areaScores.organizational_trust = clamp((stakeholderTrust + politicalStability + decision) / 3);
  areaScores.public_perception = clamp((stakeholderEngagement + customerEngagement + market) / 3);
  areaScores.customer_reputation = clamp((customer + customerBrand) / 2);
  areaScores.employee_reputation = clamp((stakeholder + customerEngagement) / 2);
  areaScores.executive_reputation = clamp((decision + stakeholderTrust + politicalStability) / 3);
  areaScores.media_intelligence = clamp((market + competitive + political) / 3);
  areaScores.press_coverage = clamp((areaScores.media_intelligence + politicalStability) / 2);
  areaScores.social_narrative = clamp((areaScores.public_perception + customerEngagement + market) / 3);
  areaScores.community_reputation = clamp((stakeholder + political + opportunity) / 3);
  areaScores.partner_reputation = clamp((competitive + opportunity + stakeholder) / 3);
  areaScores.investor_donor_confidence = clamp((opportunity + decision + stakeholderTrust) / 3);
  areaScores.regulatory_reputation = clamp((political + politicalStability) / 2);
  areaScores.crisis_reputation = clamp(100 - ((100 - areaScores.organizational_trust) * .4 + (100 - areaScores.media_intelligence) * .3 + (100 - areaScores.social_narrative) * .3));
  areaScores.misinformation_detection = clamp((areaScores.media_intelligence + areaScores.social_narrative + predictive) / 3);
  areaScores.reputation_recovery = clamp((opportunity + areaScores.organizational_trust + areaScores.crisis_reputation) / 3);
  areaScores.credibility = clamp((areaScores.organizational_trust + areaScores.executive_reputation + politicalStability) / 3);

  return {
    ...base,
    organizationHealthScore: clamp(lightScore(health, 72)),
    executionScore: clamp(request.oiosResult?.baseline.executionScore ?? base.executionScore),
    areaScores,
    trustLevel: clamp(areaScores.organizational_trust),
    publicPerception: clamp(areaScores.public_perception),
    brandStrength: clamp(areaScores.brand_reputation),
    mediaExposure: clamp(100 - areaScores.media_intelligence),
    crisisRisk: clamp(100 - areaScores.crisis_reputation),
    narrativeMomentum: clamp(areaScores.social_narrative),
    credibilityIndex: clamp(areaScores.credibility),
    recoveryCapacity: clamp(areaScores.reputation_recovery),
    forecastMaturity: clamp(predictive),
    scenarioMaturity: clamp((predictive + areaScores.crisis_reputation) / 2),
    evidenceCoverage: clamp((stakeholder + customer + political + competitive) / 4),
    ...request.baselineOverrides,
  };
}

export const reputationModels = {
  clamp, statusFromScore, priorityFromScore, levelFromValue, outlookFromScore,
  buildConfidence, buildLens, defaultCreateId, defaultPeriodLabel, emptyReputationScope,
  defaultReputationBaseline, deriveReputationBaseline,
};
export class ReputationModels {
  static clamp = clamp; static buildLens = buildLens; static derive = deriveReputationBaseline;
  static baseline = defaultReputationBaseline; static outlook = outlookFromScore;
}
