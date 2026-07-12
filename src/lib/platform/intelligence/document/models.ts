/**
 * Document Intelligence — model helpers (Sprint 041).
 */

import type { OrganizationDNA } from "@/lib/platform/intelligence/organization-dna/types";
import type { OiosResult } from "@/lib/platform/oios/types";
import type { GraphAnalysisResult, GraphBuildInput, GraphScope } from "@/lib/platform/intelligence/executive-graph/types";
import type { PredictionResult } from "@/lib/platform/intelligence/predictive-intelligence/types";
import type {
  BoardGovernanceResultLight,
  CustomerResultLight,
  DecisionResultLight,
  DocumentBaseline,
  DocumentConfidenceLevel,
  DocumentConfidenceScore,
  DocumentHealthStatus,
  DocumentLensImpact,
  DocumentPriorityBand,
  FundingResultLight,
  HumanCapitalResultLight,
  KnowledgeResultLight,
  OperationsResultLight,
  RevenueResultLight,
} from "@/lib/platform/intelligence/document/types";

export function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

export function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

export function statusFromScore(score: number): DocumentHealthStatus {
  if (score >= 85) return "excellent";
  if (score >= 70) return "healthy";
  if (score >= 50) return "warning";
  return "critical";
}

export function priorityFromScore(score: number): DocumentPriorityBand {
  if (score < 35) return "critical";
  if (score < 50) return "high";
  if (score < 65) return "medium";
  if (score < 80) return "low";
  return "monitor";
}

export function priorityFromRisk(risk: number): DocumentPriorityBand {
  if (risk >= 0.75) return "critical";
  if (risk >= 0.55) return "high";
  if (risk >= 0.35) return "medium";
  if (risk >= 0.2) return "low";
  return "monitor";
}

export function levelFromValue(value: number): DocumentConfidenceLevel {
  if (value >= 0.8) return "high";
  if (value >= 0.55) return "medium";
  if (value >= 0.3) return "low";
  return "unknown";
}

export function scoreNarrative(label: string, value: number, status: DocumentHealthStatus): string {
  return `${label} is ${status} at ${Math.round(value)}.`;
}

export function buildConfidence(
  factors: Array<{ key: string; label: string; contribution: number }>
): DocumentConfidenceScore {
  const value =
    factors.length === 0
      ? 0.5
      : clamp01(factors.reduce((sum, f) => sum + f.contribution, 0) / factors.length);
  return { value, level: levelFromValue(value), factors };
}

export function buildLenses(
  lenses: Partial<DocumentLensImpact> &
    Pick<
      DocumentLensImpact,
      | "whatIsIt"
      | "whyItMatters"
      | "whoOwnsIt"
      | "whenItExpires"
      | "knowledgeCreated"
      | "risksContained"
      | "decisionsDependent"
    >
): DocumentLensImpact {
  return {
    whatIsIt: lenses.whatIsIt,
    whyItMatters: lenses.whyItMatters,
    whoOwnsIt: lenses.whoOwnsIt,
    whenItExpires: lenses.whenItExpires,
    knowledgeCreated: lenses.knowledgeCreated,
    risksContained: lenses.risksContained,
    decisionsDependent: lenses.decisionsDependent,
  };
}

export function defaultCreateId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function defaultPeriodLabel(now = new Date()): string {
  return `${now.getUTCFullYear()}-Q${Math.floor(now.getUTCMonth() / 3) + 1}`;
}

export function emptyDocumentScope(): GraphScope {
  return { organizationId: null, schoolId: null };
}

export function defaultDocumentBaseline(): DocumentBaseline {
  return {
    catalogCoverage: 67,
    classificationAccuracy: 70,
    metadataCompleteness: 64,
    entityCoverage: 62,
    relationshipDensity: 58,
    versionHygiene: 63,
    duplicatePressure: 0.28,
    summaryCoverage: 66,
    clauseCoverage: 61,
    riskPressure: 0.34,
    complianceCoverage: 65,
    expirationRisk: 0.26,
    knowledgeContributionScore: 60,
    organizationHealthScore: 74,
    executionScore: 68,
    policyDensity: 66,
    contractDensity: 58,
    grantDensity: 52,
    complianceDensity: 62,
    operationsProcessDensity: 64,
    humanCapitalDocDensity: 60,
    revenueDocDensity: 55,
    fundingDocDensity: 54,
    boardDocDensity: 59,
    decisionDependencyDensity: 0.42,
    documentCount: 84,
    expiredRatio: 0.12,
    ocrReadiness: 72,
  };
}

export function deriveDocumentBaseline(
  dna: OrganizationDNA | null | undefined,
  oios: OiosResult | null | undefined,
  analysis: GraphAnalysisResult | null | undefined,
  graphInput: GraphBuildInput | null | undefined,
  prediction: PredictionResult | null | undefined,
  knowledgeResult?: KnowledgeResultLight | null,
  operationsResult?: OperationsResultLight | null,
  customerResult?: CustomerResultLight | null,
  humanCapitalResult?: HumanCapitalResultLight | null,
  revenueResult?: RevenueResultLight | null,
  fundingResult?: FundingResultLight | null,
  boardGovernanceResult?: BoardGovernanceResultLight | null,
  decisionResult?: DecisionResultLight | null,
  overrides?: Partial<DocumentBaseline>
): DocumentBaseline {
  const base = defaultDocumentBaseline();
  const health = graphInput?.organizationHealth;
  const organizationHealthScore = clamp(oios?.health.score ?? health?.overallScore ?? base.organizationHealthScore);
  const executionScore = clamp(oios?.baseline.executionScore ?? base.executionScore);
  const knowledgeScore = clamp(
    knowledgeResult?.healthScore?.value ??
      knowledgeResult?.coverageScore?.value ??
      knowledgeResult?.baseline?.coverageScore ??
      base.knowledgeContributionScore
  );
  const operationsProcessDensity = clamp(
    operationsResult?.workflowScore?.value ??
      operationsResult?.baseline?.processCoverage ??
      operationsResult?.baseline?.operationsScore ??
      health?.operationsScore ??
      base.operationsProcessDensity
  );
  const humanCapitalDocDensity = clamp(
    humanCapitalResult?.baseline?.policyCoverage ??
      humanCapitalResult?.baseline?.trainingCoverage ??
      humanCapitalResult?.knowledgeTransfer?.overallScore ??
      base.humanCapitalDocDensity
  );
  const revenueDocDensity = clamp(
    revenueResult?.baseline?.contractCoverage ??
      revenueResult?.baseline?.billingAccuracy ??
      revenueResult?.healthScore?.value ??
      base.revenueDocDensity
  );
  const fundingDocDensity = clamp(
    fundingResult?.baseline?.grantReadiness ??
      fundingResult?.baseline?.awardCompliance ??
      fundingResult?.healthScore?.value ??
      base.fundingDocDensity
  );
  const boardDocDensity = clamp(
    boardGovernanceResult?.baseline?.minutesCoverage ??
      boardGovernanceResult?.baseline?.policyGovernance ??
      boardGovernanceResult?.healthScore?.value ??
      base.boardDocDensity
  );
  const decisionDependencyDensity = clamp01(
    decisionResult?.baseline?.dependencyDensity ??
      (analysis?.dashboard ? 0.3 + analysis.dashboard.overallRisk * 0.35 : base.decisionDependencyDensity)
  );
  const policyDensity = clamp(organizationHealthScore * 0.28 + executionScore * 0.22 + boardDocDensity * 0.25 + humanCapitalDocDensity * 0.25);
  const contractDensity = clamp(revenueDocDensity * 0.45 + executionScore * 0.25 + organizationHealthScore * 0.15 + operationsProcessDensity * 0.15);
  const grantDensity = clamp(fundingDocDensity * 0.55 + complianceDensitySeed(fundingResult) * 0.25 + executionScore * 0.2);
  const complianceDensity = clamp(
    boardDocDensity * 0.25 + fundingDocDensity * 0.2 + humanCapitalDocDensity * 0.2 + organizationHealthScore * 0.2 + executionScore * 0.15
  );
  const catalogCoverage = clamp(
    policyDensity * 0.16 +
      contractDensity * 0.14 +
      grantDensity * 0.12 +
      complianceDensity * 0.14 +
      operationsProcessDensity * 0.14 +
      humanCapitalDocDensity * 0.1 +
      revenueDocDensity * 0.08 +
      fundingDocDensity * 0.06 +
      boardDocDensity * 0.06
  );
  const classificationAccuracy = clamp(catalogCoverage * 0.45 + knowledgeScore * 0.25 + organizationHealthScore * 0.15 + executionScore * 0.15);
  const metadataCompleteness = clamp(classificationAccuracy * 0.45 + catalogCoverage * 0.3 + executionScore * 0.25);
  const entityCoverage = clamp(metadataCompleteness * 0.45 + knowledgeScore * 0.25 + operationsProcessDensity * 0.3);
  const relationshipDensity = clamp(entityCoverage * 0.4 + decisionDependencyDensity * 45 + knowledgeScore * 0.15);
  const duplicatePressure = clamp01(0.12 + (1 - catalogCoverage / 100) * 0.25 + (operationsResult?.baseline?.backlogPressure ?? 0.25) * 0.25);
  const expiredRatio = clamp01(0.06 + (1 - executionScore / 100) * 0.18 + (1 - metadataCompleteness / 100) * 0.14);
  const expirationRisk = clamp01(expiredRatio * 0.55 + (1 - metadataCompleteness / 100) * 0.25 + (prediction ? 0.08 : 0.12));
  const versionHygiene = clamp(100 - duplicatePressure * 35 - expiredRatio * 25 + metadataCompleteness * 0.25);
  const clauseCoverage = clamp(contractDensity * 0.35 + complianceDensity * 0.25 + metadataCompleteness * 0.25 + revenueDocDensity * 0.15);
  const summaryCoverage = clamp(catalogCoverage * 0.45 + knowledgeScore * 0.3 + classificationAccuracy * 0.25);
  const riskPressure = clamp01(
    0.14 + expirationRisk * 0.25 + duplicatePressure * 0.2 + (1 - complianceDensity / 100) * 0.2 + (1 - clauseCoverage / 100) * 0.15
  );
  const complianceCoverage = clamp(complianceDensity * 0.45 + clauseCoverage * 0.25 + policyDensity * 0.15 + fundingDocDensity * 0.15);
  const knowledgeContributionScore = clamp(knowledgeScore * 0.35 + summaryCoverage * 0.25 + relationshipDensity * 0.2 + complianceCoverage * 0.2);
  const ocrReadiness = clamp(base.ocrReadiness + catalogCoverage * 0.1 + (customerResult?.baseline?.communicationCoverage ?? 55) * 0.05);
  const documentCount = Math.round(
    42 +
      catalogCoverage * 0.7 +
      (dna?.profile?.personas?.length ?? 3) * 3 +
      decisionDependencyDensity * 25 +
      (prediction?.projection?.scenarios?.length ?? 0) * 2
  );

  return {
    catalogCoverage,
    classificationAccuracy,
    metadataCompleteness,
    entityCoverage,
    relationshipDensity,
    versionHygiene,
    duplicatePressure,
    summaryCoverage,
    clauseCoverage,
    riskPressure,
    complianceCoverage,
    expirationRisk,
    knowledgeContributionScore,
    organizationHealthScore,
    executionScore,
    policyDensity,
    contractDensity,
    grantDensity,
    complianceDensity,
    operationsProcessDensity,
    humanCapitalDocDensity,
    revenueDocDensity,
    fundingDocDensity,
    boardDocDensity,
    decisionDependencyDensity,
    documentCount,
    expiredRatio,
    ocrReadiness,
    ...overrides,
  };
}

function complianceDensitySeed(fundingResult?: FundingResultLight | null): number {
  return clamp(fundingResult?.baseline?.awardCompliance ?? fundingResult?.healthScore?.value ?? 58);
}

export const documentModels = {
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
  emptyDocumentScope,
  defaultDocumentBaseline,
  deriveDocumentBaseline,
};

export class DocumentModels {
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
  static emptyScope = emptyDocumentScope;
  static baseline = defaultDocumentBaseline;
  static derive = deriveDocumentBaseline;
}
