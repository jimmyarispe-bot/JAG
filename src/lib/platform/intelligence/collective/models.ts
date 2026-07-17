import type { GraphScope } from "@/lib/platform/intelligence/executive-graph/types";
import type {
  CollectiveBaseline, CollectiveConfidenceLevel, CollectiveConfidenceScore,
  CollectiveHealthStatus, CollectiveLens, CollectiveOutlook, CollectivePriorityBand,
  CollectiveRequest,
} from "@/lib/platform/intelligence/collective/types";
import { COLLECTIVE_AREAS } from "@/lib/platform/intelligence/collective/types";
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
export function statusFromScore(score: number): CollectiveHealthStatus { return sharedStatusFromScore(score); }
export function priorityFromScore(score: number): CollectivePriorityBand { return priorityFromScoreLowUrgent(score); }
export function levelFromValue(value: number): CollectiveConfidenceLevel { return sharedLevelFromValue(value); }
export function outlookFromScore(score: number, volatility = 0): CollectiveOutlook {
  return outlookFromScoreConfigured(score, volatility, {
    volatileLabel: "volatile",
    high: { min: OUTLOOK_THRESHOLDS_ELEVATED.high, label: "aligned" },
    mid: { min: OUTLOOK_THRESHOLDS_ELEVATED.mid, label: "stable" },
    low: { min: OUTLOOK_THRESHOLDS_ELEVATED.low, label: "contested" },
    fallback: "uncertain",
  });
}
export function buildConfidence(
  factors: Array<{ key: string; label: string; contribution: number }>
): CollectiveConfidenceScore {
  return buildConfidenceAverage(factors) as CollectiveConfidenceScore;
}
export function buildLens(partial: Partial<CollectiveLens> = {}): CollectiveLens {
  return {
    consensusStrength: partial.consensusStrength ?? "Consensus strength requires confirmation.",
    expertiseCoverage: partial.expertiseCoverage ?? "Expertise coverage requires confirmation.",
    perspectiveDiversity: partial.perspectiveDiversity ?? "Perspective diversity requires confirmation.",
    crossDomainAgreement: partial.crossDomainAgreement ?? "Cross-domain agreement requires confirmation.",
    organizationalAlignment: partial.organizationalAlignment ?? "Organizational alignment requires confirmation.",
    collaborationQuality: partial.collaborationQuality ?? "Collaboration quality requires confirmation.",
    collectiveConfidence: partial.collectiveConfidence ?? "Collective confidence requires confirmation.",
    longTermCollectiveValue: partial.longTermCollectiveValue ?? "Long-term collective value requires confirmation.",
  };
}
export const defaultCreateId = sharedDefaultCreateId;
export const defaultPeriodLabel = periodLabelIsoMonth;
export const emptyCollectiveScope = (): GraphScope => emptyGraphScope();

export function defaultCollectiveBaseline(): CollectiveBaseline {
  const areaScores = Object.fromEntries(COLLECTIVE_AREAS.map(a => [a, 68])) as CollectiveBaseline["areaScores"];
  return {
    organizationHealthScore: 72,
    executionScore: 70,
    areaScores,
    consensusStrength: 68,
    expertiseCoverage: 68,
    perspectiveDiversity: 68,
    crossDomainAgreement: 68,
    organizationalAlignment: 68,
    collaborationQuality: 68,
    collectiveConfidence: 68,
    longTermCollectiveValue: 68,
    forecastMaturity: 65,
    scenarioMaturity: 64,
    evidenceCoverage: 66,
  };
}

const lightScore = sharedLightScore;

export function deriveCollectiveBaseline(request: CollectiveRequest): CollectiveBaseline {
  const base = defaultCollectiveBaseline();
  const health = lightScore(
    request.oiosResult?.health.score ?? request.graphInput?.organizationHealth?.overallScore,
    base.organizationHealthScore,
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
  const behavioral = lightScore(request.behavioralResult?.behavioralScore?.value ?? request.behavioralResult?.healthScore?.value, 70);
  const cultural = lightScore(request.culturalResult?.culturalScore?.value ?? request.culturalResult?.healthScore?.value, 70);
  const stakeholder = lightScore(request.stakeholderResult?.healthScore?.value ?? request.stakeholderResult?.engagementScore?.value, 70);
  const systems = lightScore(request.systemsResult?.healthScore?.value, 70);
  const opportunity = lightScore(request.opportunityResult?.opportunityScore?.value ?? request.opportunityResult?.healthScore?.value, 70);
  const ecosystem = lightScore(request.ecosystemResult?.ecosystemScore?.value ?? request.ecosystemResult?.healthScore?.value, 70);
  const resilience = lightScore(request.resilienceResult?.healthScore?.value ?? request.resilienceResult?.adaptiveCapacity, 70);
  const ethical = lightScore(request.ethicalResult?.ethicalScore?.value ?? request.ethicalResult?.healthScore?.value, 70);
  const market = lightScore(request.marketResult?.marketScore?.value ?? request.marketResult?.healthScore?.value, 70);
  const competitive = lightScore(request.competitiveResult?.competitiveScore?.value ?? request.competitiveResult?.healthScore?.value, 70);
  const humanCapital = lightScore(request.humanCapitalResult?.humanCapitalScore?.value ?? request.humanCapitalResult?.healthScore?.value, 70);
  const operations = lightScore(request.operationsResult?.operationsScore?.value ?? request.operationsResult?.healthScore?.value, 70);

  const areaScores = { ...base.areaScores };
  areaScores.collective_reasoning = clamp((institutionalMemory + decision + knowledge) / 3);
  areaScores.consensus_analysis = clamp((cultural + stakeholder + decision) / 3);
  areaScores.distributed_expertise = clamp((humanCapital + knowledge + institutionalMemory) / 3);
  areaScores.collaborative_intelligence = clamp((behavioral + cultural + stakeholder) / 3);
  areaScores.multi_domain_synthesis = clamp((systems + knowledge + opportunity) / 3);
  areaScores.cross_functional_intelligence = clamp((operations + systems + humanCapital) / 3);
  areaScores.organizational_alignment = clamp((cultural + decision + stakeholder) / 3);
  areaScores.team_decision_intelligence = clamp((decision + behavioral + cultural) / 3);
  areaScores.expert_weighting = clamp((humanCapital + knowledge + decision) / 3);
  areaScores.perspective_diversity = clamp((cultural + stakeholder + behavioral) / 3);
  areaScores.conflict_resolution = clamp((cultural + stakeholder + ethical) / 3);
  areaScores.collaborative_learning = clamp((knowledge + institutionalMemory + opportunity) / 3);
  areaScores.organizational_coordination = clamp((operations + systems + cultural) / 3);
  areaScores.shared_decision_quality = clamp((decision + predictive + cultural) / 3);
  areaScores.collective_opportunity_detection = clamp((opportunity + market + competitive) / 3);
  areaScores.collective_risk_assessment = clamp((systems + resilience + ethical) / 3);
  areaScores.collective_intelligence_evolution = clamp((institutionalMemory + predictive + opportunity) / 3);

  const consensusStrength = clamp(areaScores.consensus_analysis);
  const expertiseCoverage = clamp(areaScores.distributed_expertise);
  const perspectiveDiversity = clamp(areaScores.perspective_diversity);
  const crossDomainAgreement = clamp(areaScores.multi_domain_synthesis);
  const organizationalAlignment = clamp(areaScores.organizational_alignment);
  const collaborationQuality = clamp(areaScores.collaborative_intelligence);
  const collectiveConfidence = clamp((consensusStrength + expertiseCoverage + organizationalAlignment) / 3);
  const longTermCollectiveValue = clamp((areaScores.collective_intelligence_evolution + predictive + opportunity) / 3);

  return {
    ...base,
    organizationHealthScore: clamp(health),
    executionScore: clamp(request.oiosResult?.baseline.executionScore ?? base.executionScore),
    areaScores,
    consensusStrength,
    expertiseCoverage,
    perspectiveDiversity,
    crossDomainAgreement,
    organizationalAlignment,
    collaborationQuality,
    collectiveConfidence,
    longTermCollectiveValue,
    forecastMaturity: clamp(predictive),
    scenarioMaturity: clamp((predictive + areaScores.collective_risk_assessment) / 2),
    evidenceCoverage: clamp((institutionalMemory + knowledge + ecosystem + resilience + systems + stakeholder + cultural + ethical) / 8),
    ...request.baselineOverrides,
  };
}

export const collectiveModels = {
  clamp, statusFromScore, priorityFromScore, levelFromValue, outlookFromScore,
  buildConfidence, buildLens, defaultCreateId, defaultPeriodLabel, emptyCollectiveScope,
  defaultCollectiveBaseline, deriveCollectiveBaseline,
};
export class CollectiveModels {
  static clamp = clamp; static buildLens = buildLens; static derive = deriveCollectiveBaseline;
  static baseline = defaultCollectiveBaseline; static outlook = outlookFromScore;
}
