import type { GraphScope } from "@/lib/platform/intelligence/executive-graph/types";
import type {
  InstitutionalMemoryBaseline, InstitutionalMemoryConfidenceLevel, InstitutionalMemoryConfidenceScore,
  InstitutionalMemoryHealthStatus, InstitutionalMemoryLens, InstitutionalMemoryOutlook, InstitutionalMemoryPriorityBand,
  InstitutionalMemoryRequest,
} from "@/lib/platform/intelligence/institutional-memory/types";
import { INSTITUTIONAL_MEMORY_AREAS } from "@/lib/platform/intelligence/institutional-memory/types";
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
export function statusFromScore(score: number): InstitutionalMemoryHealthStatus { return sharedStatusFromScore(score); }
export function priorityFromScore(score: number): InstitutionalMemoryPriorityBand { return priorityFromScoreLowUrgent(score); }
export function levelFromValue(value: number): InstitutionalMemoryConfidenceLevel { return sharedLevelFromValue(value); }
export function outlookFromScore(score: number, volatility = 0): InstitutionalMemoryOutlook {
  return outlookFromScoreConfigured(score, volatility, {
    volatileLabel: "volatile",
    high: { min: OUTLOOK_THRESHOLDS_ELEVATED.high, label: "learning" },
    mid: { min: OUTLOOK_THRESHOLDS_ELEVATED.mid, label: "stable" },
    low: { min: OUTLOOK_THRESHOLDS_ELEVATED.low, label: "eroding" },
    fallback: "uncertain",
  });
}
export function buildConfidence(
  factors: Array<{ key: string; label: string; contribution: number }>
): InstitutionalMemoryConfidenceScore {
  return buildConfidenceAverage(factors) as InstitutionalMemoryConfidenceScore;
}
export function buildLens(partial: Partial<InstitutionalMemoryLens> = {}): InstitutionalMemoryLens {
  return {
    knowledgeConfidence: partial.knowledgeConfidence ?? "Knowledge confidence requires confirmation.",
    evidenceStrength: partial.evidenceStrength ?? "Evidence strength requires confirmation.",
    institutionalMemoryCoverage: partial.institutionalMemoryCoverage ?? "Institutional memory coverage requires confirmation.",
    knowledgeFreshness: partial.knowledgeFreshness ?? "Knowledge freshness requires confirmation.",
    expertiseAvailability: partial.expertiseAvailability ?? "Expertise availability requires confirmation.",
    knowledgeGaps: partial.knowledgeGaps ?? "Knowledge gaps require confirmation.",
    knowledgeQuality: partial.knowledgeQuality ?? "Knowledge quality requires confirmation.",
    longTermLearningValue: partial.longTermLearningValue ?? "Long-term learning value requires confirmation.",
  };
}
export const defaultCreateId = sharedDefaultCreateId;
export const defaultPeriodLabel = periodLabelIsoMonth;
export const emptyInstitutionalMemoryScope = (): GraphScope => emptyGraphScope();

export function defaultInstitutionalMemoryBaseline(): InstitutionalMemoryBaseline {
  const areaScores = Object.fromEntries(INSTITUTIONAL_MEMORY_AREAS.map(a => [a, 68])) as InstitutionalMemoryBaseline["areaScores"];
  return {
    organizationHealthScore: 72,
    executionScore: 70,
    areaScores,
    knowledgeConfidence: 68,
    evidenceStrength: 68,
    institutionalMemoryCoverage: 68,
    knowledgeFreshness: 68,
    expertiseAvailability: 68,
    knowledgeGaps: 68,
    knowledgeQuality: 68,
    longTermLearningValue: 68,
    forecastMaturity: 65,
    scenarioMaturity: 64,
    evidenceCoverage: 66,
  };
}

const lightScore = sharedLightScore;

export function deriveInstitutionalMemoryBaseline(request: InstitutionalMemoryRequest): InstitutionalMemoryBaseline {
  const base = defaultInstitutionalMemoryBaseline();
  const health = lightScore(
    request.oiosResult?.health.score ?? request.graphInput?.organizationHealth?.overallScore,
    base.organizationHealthScore,
  );
  const knowledge = lightScore(
    request.knowledgeResult?.knowledgeScore?.value ?? request.knowledgeResult?.healthScore?.value,
    70,
  );
  const knowledgeConfidence = lightScore(request.knowledgeResult?.baseline?.knowledgeConfidence, knowledge);
  const knowledgeFreshness = lightScore(request.knowledgeResult?.baseline?.knowledgeFreshness, knowledge);
  const knowledgeQuality = lightScore(request.knowledgeResult?.baseline?.knowledgeQuality, knowledge);
  const ecosystem = lightScore(request.ecosystemResult?.ecosystemScore?.value ?? request.ecosystemResult?.healthScore?.value, 70);
  const resilience = lightScore(request.resilienceResult?.healthScore?.value ?? request.resilienceResult?.adaptiveCapacity, 70);
  const systems = lightScore(request.systemsResult?.healthScore?.value, 70);
  const stakeholder = lightScore(request.stakeholderResult?.healthScore?.value ?? request.stakeholderResult?.engagementScore?.value, 70);
  const cultural = lightScore(request.culturalResult?.culturalScore?.value ?? request.culturalResult?.healthScore?.value, 70);
  const ethical = lightScore(request.ethicalResult?.ethicalScore?.value ?? request.ethicalResult?.healthScore?.value, 70);
  const opportunity = lightScore(request.opportunityResult?.opportunityScore?.value ?? request.opportunityResult?.healthScore?.value, 70);
  const decision = lightScore(request.decisionResult?.confidence?.value, 70);
  const predictive = lightScore(request.predictiveResult?.predictiveScore?.value ?? request.predictiveResult?.healthScore?.value, base.forecastMaturity);
  const market = lightScore(request.marketResult?.marketScore?.value ?? request.marketResult?.healthScore?.value, 70);
  const competitive = lightScore(request.competitiveResult?.competitiveScore?.value ?? request.competitiveResult?.healthScore?.value, 70);
  const behavioral = lightScore(request.behavioralResult?.behavioralScore?.value ?? request.behavioralResult?.healthScore?.value, 70);
  const operations = lightScore(request.operationsResult?.operationsScore?.value ?? request.operationsResult?.healthScore?.value, 70);
  const customer = lightScore(request.customerResult?.customerScore?.value ?? request.customerResult?.healthScore?.value, 70);
  const humanCapital = lightScore(request.humanCapitalResult?.humanCapitalScore?.value ?? request.humanCapitalResult?.healthScore?.value, 70);

  const areaScores = { ...base.areaScores };
  areaScores.organizational_memory = clamp((knowledge + cultural + humanCapital) / 3);
  areaScores.knowledge_graph = clamp((knowledge + systems + ecosystem) / 3);
  areaScores.knowledge_mapping = clamp((knowledge + operations + systems) / 3);
  areaScores.expertise_intelligence = clamp((humanCapital + knowledge + behavioral) / 3);
  areaScores.institutional_memory = clamp((knowledge + cultural + decision) / 3);
  areaScores.lessons_learned = clamp((knowledge + opportunity + decision) / 3);
  areaScores.decision_history = clamp((decision + knowledge + ethical) / 3);
  areaScores.policy_knowledge = clamp((ethical + knowledge + stakeholder) / 3);
  areaScores.process_knowledge = clamp((operations + knowledge + systems) / 3);
  areaScores.relationship_knowledge = clamp((stakeholder + cultural + ecosystem) / 3);
  areaScores.semantic_search = clamp((knowledge + systems + predictive) / 3);
  areaScores.knowledge_validation = clamp((knowledge + ethical + decision) / 3);
  areaScores.knowledge_evolution = clamp((knowledge + predictive + opportunity) / 3);
  areaScores.knowledge_gap_detection = clamp((knowledge + competitive + market) / 3);
  areaScores.knowledge_transfer = clamp((humanCapital + knowledge + behavioral) / 3);
  areaScores.knowledge_quality = clamp((knowledgeQuality + ethical + knowledge) / 3);
  areaScores.knowledge_synthesis = clamp((knowledge + opportunity + predictive) / 3);

  return {
    ...base,
    organizationHealthScore: clamp(health),
    executionScore: clamp(request.oiosResult?.baseline.executionScore ?? base.executionScore),
    areaScores,
    knowledgeConfidence: clamp(knowledgeConfidence),
    evidenceStrength: clamp((knowledge + decision + ethical) / 3),
    institutionalMemoryCoverage: clamp(areaScores.institutional_memory),
    knowledgeFreshness: clamp(knowledgeFreshness),
    expertiseAvailability: clamp(areaScores.expertise_intelligence),
    knowledgeGaps: clamp(100 - areaScores.knowledge_gap_detection),
    knowledgeQuality: clamp(areaScores.knowledge_quality),
    longTermLearningValue: clamp((areaScores.knowledge_evolution + predictive + opportunity) / 3),
    forecastMaturity: clamp(predictive),
    scenarioMaturity: clamp((predictive + areaScores.knowledge_gap_detection) / 2),
    evidenceCoverage: clamp((knowledge + ecosystem + resilience + systems + stakeholder + cultural + ethical) / 7),
    ...request.baselineOverrides,
  };
}

export const institutionalMemoryModels = {
  clamp, statusFromScore, priorityFromScore, levelFromValue, outlookFromScore,
  buildConfidence, buildLens, defaultCreateId, defaultPeriodLabel, emptyInstitutionalMemoryScope,
  defaultInstitutionalMemoryBaseline, deriveInstitutionalMemoryBaseline,
};
export class InstitutionalMemoryModels {
  static clamp = clamp; static buildLens = buildLens; static derive = deriveInstitutionalMemoryBaseline;
  static baseline = defaultInstitutionalMemoryBaseline; static outlook = outlookFromScore;
}
