/**
 * Knowledge Intelligence — KnowledgeModels helpers (Sprint 040).
 */

import type { OrganizationDNA } from "@/lib/platform/intelligence/organization-dna/types";
import type { OiosResult } from "@/lib/platform/oios/types";
import type {
  GraphAnalysisResult,
  GraphBuildInput,
  GraphScope,
} from "@/lib/platform/intelligence/executive-graph/types";
import type { PredictionResult } from "@/lib/platform/intelligence/predictive-intelligence/types";
import type {
  CustomerResultLight,
  HumanCapitalResultLight,
  KnowledgeBaseline,
  KnowledgeConfidenceLevel,
  KnowledgeConfidenceScore,
  KnowledgeHealthStatus,
  KnowledgeLensImpact,
  KnowledgePriorityBand,
  OperationsResultLight,
} from "@/lib/platform/intelligence/knowledge/types";
import {
  buildConfidenceAverageEmptyHalf,
  clamp01 as sharedClamp01,
  clampUnchecked,
  defaultCreateId as sharedDefaultCreateId,
  emptyGraphScope,
  levelFromValue as sharedLevelFromValue,
  periodLabelQuarter,
  priorityFromRisk as sharedPriorityFromRisk,
  priorityFromScoreLowUrgent,
  scoreNarrative as sharedScoreNarrative,
  statusFromScore as sharedStatusFromScore,
} from "@/lib/platform/intelligence/common";


export const clamp = clampUnchecked;

export const clamp01 = sharedClamp01;

export function statusFromScore(score: number): KnowledgeHealthStatus { return sharedStatusFromScore(score); }

export function priorityFromScore(score: number): KnowledgePriorityBand { return priorityFromScoreLowUrgent(score); }

export function priorityFromRisk(risk: number): KnowledgePriorityBand { return sharedPriorityFromRisk(risk); }

export function levelFromValue(value: number): KnowledgeConfidenceLevel { return sharedLevelFromValue(value); }

export function scoreNarrative(
  label: string,
  value: number,
  status: KnowledgeHealthStatus
): string {
  return sharedScoreNarrative(label, value, status);
}

export function buildConfidence(
  factors: Array<{ key: string; label: string; contribution: number }>
): KnowledgeConfidenceScore {
  return buildConfidenceAverageEmptyHalf(factors) as KnowledgeConfidenceScore;
}

export function buildLenses(
  partial: Partial<KnowledgeLensImpact> &
    Pick<
      KnowledgeLensImpact,
      | "coverageCompleteness"
      | "provenanceTrust"
      | "ownershipClarity"
      | "validationCurrency"
      | "dependencyReach"
      | "decisionInfluence"
    >
): KnowledgeLensImpact {
  return {
    coverageCompleteness: partial.coverageCompleteness,
    provenanceTrust: partial.provenanceTrust,
    ownershipClarity: partial.ownershipClarity,
    validationCurrency: partial.validationCurrency,
    dependencyReach: partial.dependencyReach,
    decisionInfluence: partial.decisionInfluence,
  };
}

export const defaultCreateId = sharedDefaultCreateId;

export const defaultPeriodLabel = periodLabelQuarter;

export const emptyKnowledgeScope = (): GraphScope => emptyGraphScope();

export function defaultKnowledgeBaseline(): KnowledgeBaseline {
  return {
    coverageScore: 68,
    provenanceScore: 70,
    ownershipScore: 66,
    validationScore: 64,
    connectivityScore: 62,
    reuseScore: 65,
    organizationHealthScore: 75,
    executionScore: 68,
    decisionDensity: 0.42,
    policyCoverage: 70,
    procedureCoverage: 66,
    trainingCoverage: 58,
    expertCoverage: 62,
    duplicatePressure: 0.28,
    conflictPressure: 0.22,
    staleRatio: 0.3,
    gapPressure: 0.34,
    customerInsightDensity: 60,
    operationsProcessDensity: 64,
    humanCapitalTransferScore: 58,
    artifactCount: 48,
    validatedRatio: 0.62,
  };
}

/** Derive baseline from DNA / OIOS / graph / customer / operations / HC soft signals. */
export function deriveKnowledgeBaseline(
  dna: OrganizationDNA | null | undefined,
  oios: OiosResult | null | undefined,
  analysis: GraphAnalysisResult | null | undefined,
  graphInput: GraphBuildInput | null | undefined,
  prediction: PredictionResult | null | undefined,
  customerResult?: CustomerResultLight | null,
  operationsResult?: OperationsResultLight | null,
  humanCapitalResult?: HumanCapitalResultLight | null,
  overrides?: Partial<KnowledgeBaseline>
): KnowledgeBaseline {
  const base = defaultKnowledgeBaseline();
  const health = graphInput?.organizationHealth;
  const executive = graphInput?.executive;

  const organizationHealthScore = clamp(
    oios?.health.score ?? health?.overallScore ?? base.organizationHealthScore
  );

  const executionScore = clamp(
    oios?.baseline.executionScore ?? base.executionScore
  );

  const decisionDensity = clamp01(
    analysis?.dashboard
      ? 0.25 + analysis.dashboard.overallRisk * 0.35 + 0.15
      : prediction?.projection?.scenarios?.length
        ? 0.4
        : base.decisionDensity
  );

  const customerInsightDensity = clamp(
    customerResult?.healthScore?.value ??
      customerResult?.engagementScore?.value ??
      (customerResult?.baseline?.familyExperienceScore != null
        ? customerResult.baseline.familyExperienceScore
        : undefined) ??
      base.customerInsightDensity
  );

  const operationsProcessDensity = clamp(
    operationsResult?.workflowScore?.value ??
      operationsResult?.healthScore?.value ??
      operationsResult?.baseline?.operationsScore ??
      health?.operationsScore ??
      base.operationsProcessDensity
  );

  const humanCapitalTransferScore = clamp(
    humanCapitalResult?.knowledgeTransfer?.overallScore ??
      humanCapitalResult?.baseline?.skillsCoverage ??
      humanCapitalResult?.healthScore?.value ??
      base.humanCapitalTransferScore
  );

  const policyCoverage = clamp(
    organizationHealthScore * 0.35 +
      executionScore * 0.25 +
      (dna?.profile?.personas?.length && dna.profile.personas.length > 2
        ? 78
        : 62) * 0.4
  );

  const procedureCoverage = clamp(
    operationsProcessDensity * 0.55 +
      executionScore * 0.25 +
      (100 - (operationsResult?.baseline?.backlogPressure ?? 0.32) * 100) * 0.2
  );

  const trainingCoverage = clamp(
    humanCapitalTransferScore * 0.55 +
      customerInsightDensity * 0.2 +
      (executive?.staff != null && executive.staff > 0 ? 70 : 55) * 0.25
  );

  const expertCoverage = clamp(
    humanCapitalTransferScore * 0.4 +
      (humanCapitalResult?.baseline?.successionReadiness ?? 55) * 0.3 +
      trainingCoverage * 0.3
  );

  const duplicatePressure = clamp01(
    0.15 +
      (1 - organizationHealthScore / 100) * 0.2 +
      (operationsResult?.baseline?.backlogPressure ?? 0.3) * 0.35 +
      (customerResult?.baseline?.complaintBurden ?? 0.25) * 0.2
  );

  const conflictPressure = clamp01(
    0.12 +
      decisionDensity * 0.35 +
      (analysis?.dashboard ? analysis.dashboard.overallRisk * 0.3 : 0.15) +
      duplicatePressure * 0.2
  );

  const staleRatio = clamp01(
    0.18 +
      (1 - executionScore / 100) * 0.3 +
      (1 - trainingCoverage / 100) * 0.25 +
      (1 - procedureCoverage / 100) * 0.2
  );

  const gapPressure = clamp01(
    0.2 +
      (1 - policyCoverage / 100) * 0.25 +
      (1 - procedureCoverage / 100) * 0.2 +
      (1 - expertCoverage / 100) * 0.2 +
      staleRatio * 0.2
  );

  const provenanceScore = clamp(
    organizationHealthScore * 0.3 +
      executionScore * 0.3 +
      (100 - conflictPressure * 100) * 0.25 +
      policyCoverage * 0.15
  );

  const ownershipScore = clamp(
    expertCoverage * 0.4 +
      humanCapitalTransferScore * 0.3 +
      (100 - gapPressure * 100) * 0.3
  );

  const validationScore = clamp(
    (1 - staleRatio) * 55 +
      provenanceScore * 0.3 +
      procedureCoverage * 0.2
  );

  const connectivityScore = clamp(
    operationsProcessDensity * 0.3 +
      customerInsightDensity * 0.25 +
      decisionDensity * 40 +
      (100 - duplicatePressure * 100) * 0.2
  );

  const reuseScore = clamp(
    trainingCoverage * 0.35 +
      connectivityScore * 0.35 +
      (100 - duplicatePressure * 100) * 0.3
  );

  const coverageScore = clamp(
    policyCoverage * 0.22 +
      procedureCoverage * 0.22 +
      trainingCoverage * 0.18 +
      customerInsightDensity * 0.14 +
      operationsProcessDensity * 0.14 +
      expertCoverage * 0.1
  );

  const validatedRatio = clamp01(validationScore / 100);
  const artifactCount = Math.round(
    28 +
      coverageScore * 0.35 +
      (dna?.profile?.personas?.length ?? 3) * 2 +
      decisionDensity * 20
  );

  return {
    coverageScore,
    provenanceScore,
    ownershipScore,
    validationScore,
    connectivityScore,
    reuseScore,
    organizationHealthScore,
    executionScore,
    decisionDensity,
    policyCoverage,
    procedureCoverage,
    trainingCoverage,
    expertCoverage,
    duplicatePressure,
    conflictPressure,
    staleRatio,
    gapPressure,
    customerInsightDensity,
    operationsProcessDensity,
    humanCapitalTransferScore,
    artifactCount,
    validatedRatio,
    ...overrides,
  };
}

/** KnowledgeModels façade used by DI consumers. */
export const knowledgeModels = {
  clamp,
  clamp01,
  statusFromScore,
  priorityFromScore,
  priorityFromRisk,
  levelFromValue,
  scoreNarrative,
  buildConfidence,
  buildLenses,
  defaultCreateId,
  defaultPeriodLabel,
  emptyKnowledgeScope,
  defaultKnowledgeBaseline,
  deriveKnowledgeBaseline,
};

export class KnowledgeModels {
  static clamp = clamp;
  static clamp01 = clamp01;
  static statusFromScore = statusFromScore;
  static priorityFromScore = priorityFromScore;
  static priorityFromRisk = priorityFromRisk;
  static levelFromValue = levelFromValue;
  static scoreNarrative = scoreNarrative;
  static buildConfidence = buildConfidence;
  static buildLenses = buildLenses;
  static defaultCreateId = defaultCreateId;
  static defaultPeriodLabel = defaultPeriodLabel;
  static emptyScope = emptyKnowledgeScope;
  static baseline = defaultKnowledgeBaseline;
  static derive = deriveKnowledgeBaseline;
}
