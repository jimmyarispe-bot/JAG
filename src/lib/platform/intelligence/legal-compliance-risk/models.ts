/**
 * Legal, Compliance & Risk Intelligence — model helpers (Sprint 042).
 */

import type { OrganizationDNA } from "@/lib/platform/intelligence/organization-dna/types";
import type { OiosResult } from "@/lib/platform/oios/types";
import type { GraphAnalysisResult, GraphBuildInput, GraphScope } from "@/lib/platform/intelligence/executive-graph/types";
import type { PredictionResult } from "@/lib/platform/intelligence/predictive-intelligence/types";
import type {
  BoardGovernanceResultLight,
  CustomerResultLight,
  DecisionResultLight,
  DocumentResultLight,
  FundingResultLight,
  HumanCapitalResultLight,
  ImprovementResultLight,
  KnowledgeResultLight,
  LcrConfidenceLevel,
  LcrHealthStatus,
  LcrPriorityBand,
  LegalComplianceRiskBaseline,
  LegalComplianceRiskConfidenceScore,
  LegalComplianceRiskLens,
  OperationsResultLight,
} from "@/lib/platform/intelligence/legal-compliance-risk/types";
import {
  buildConfidenceAverageEmptyHalf,
  clamp as sharedClamp,
  defaultCreateId as sharedDefaultCreateId,
  emptyGraphScope,
  levelFromValue as sharedLevelFromValue,
  periodLabelQuarter,
  priorityFromRisk as sharedPriorityFromRisk,
  priorityFromScoreLowUrgent,
  scoreNarrative as sharedScoreNarrative,
  statusFromScore as sharedStatusFromScore,
} from "@/lib/platform/intelligence/common";


export const clamp = sharedClamp;

export function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

export function statusFromScore(score: number): LcrHealthStatus { return sharedStatusFromScore(score); }

export function priorityFromScore(score: number): LcrPriorityBand { return priorityFromScoreLowUrgent(score); }

export function priorityFromRisk(risk: number): LcrPriorityBand { return sharedPriorityFromRisk(risk); }

export function levelFromValue(value: number): LcrConfidenceLevel { return sharedLevelFromValue(value); }

export function scoreNarrative(
  label: string,
  value: number,
  status: LcrHealthStatus
): string {
  return sharedScoreNarrative(label, value, status);
}

export function buildConfidence(
  factors: Array<{ key: string; label: string; contribution: number }>
): LegalComplianceRiskConfidenceScore {
  return buildConfidenceAverageEmptyHalf(factors) as LegalComplianceRiskConfidenceScore;
}

export function buildLens(lens: LegalComplianceRiskLens): LegalComplianceRiskLens {
  return {
    regulationOrPolicyApplies: lens.regulationOrPolicyApplies,
    evidenceSupports: lens.evidenceSupports,
    confidence: lens.confidence,
    organizationalRisk: lens.organizationalRisk,
    ifNoActionTaken: lens.ifNoActionTaken,
    correctiveActionRecommended: lens.correctiveActionRecommended,
    whoOwnsAction: lens.whoOwnsAction,
    whenShouldComplete: lens.whenShouldComplete,
  };
}

export const defaultCreateId = sharedDefaultCreateId;

export const defaultPeriodLabel = periodLabelQuarter;

export const emptyLegalComplianceRiskScope = (): GraphScope => emptyGraphScope();

export function defaultLegalComplianceRiskBaseline(): LegalComplianceRiskBaseline {
  return {
    organizationHealthScore: 74,
    executionScore: 68,
    complianceCoverage: 66,
    riskPressure: 0.34,
    contractCoverage: 62,
    contractDensity: 58,
    regulatoryCoverage: 64,
    policyCoverage: 65,
    auditReadiness: 63,
    licensePermitCoverage: 67,
    insuranceAdequacy: 61,
    litigationExposure: 0.22,
    vendorRiskPressure: 0.3,
    cyberPosture: 60,
    knowledgeContributionScore: 60,
    documentComplianceCoverage: 65,
    boardGovernanceScore: 66,
    fundingComplianceReadiness: 62,
    humanCapitalPolicyCoverage: 63,
    operationsProcessCoverage: 64,
    customerCommunicationCoverage: 60,
    improvementMomentum: 62,
    decisionTraceability: 0.5,
    contractCount: 46,
    obligationCount: 72,
    expiredLicenseRatio: 0.12,
    expirationRisk: 0.26,
  };
}

export function deriveLegalComplianceRiskBaseline(
  dna: OrganizationDNA | null | undefined,
  oios: OiosResult | null | undefined,
  analysis: GraphAnalysisResult | null | undefined,
  graphInput: GraphBuildInput | null | undefined,
  prediction: PredictionResult | null | undefined,
  knowledgeResult?: KnowledgeResultLight | null,
  documentResult?: DocumentResultLight | null,
  boardGovernanceResult?: BoardGovernanceResultLight | null,
  decisionResult?: DecisionResultLight | null,
  humanCapitalResult?: HumanCapitalResultLight | null,
  fundingResult?: FundingResultLight | null,
  operationsResult?: OperationsResultLight | null,
  customerResult?: CustomerResultLight | null,
  improvementResult?: ImprovementResultLight | null,
  overrides?: Partial<LegalComplianceRiskBaseline>
): LegalComplianceRiskBaseline {
  const base = defaultLegalComplianceRiskBaseline();
  const health = graphInput?.organizationHealth;
  const organizationHealthScore = clamp(oios?.health.score ?? health?.overallScore ?? base.organizationHealthScore);
  const executionScore = clamp(oios?.baseline.executionScore ?? base.executionScore);

  const oiosCompliance = clamp(oios?.baseline.complianceScore ?? health?.complianceScore ?? base.complianceCoverage);
  const oiosRisk = clamp01((oios?.baseline.riskScore ?? base.riskPressure * 100) / 100);

  const documentComplianceCoverage = clamp(
    documentResult?.complianceScore?.value ??
      documentResult?.baseline?.complianceCoverage ??
      documentResult?.healthScore?.value ??
      base.documentComplianceCoverage
  );
  const documentRiskPressure = clamp01(
    documentResult?.baseline?.riskPressure ??
      (documentResult?.riskScore?.value != null ? documentResult.riskScore.value / 100 : base.riskPressure)
  );
  const documentContractDensity = clamp(documentResult?.baseline?.contractDensity ?? base.contractDensity);
  const documentPolicyDensity = clamp(documentResult?.baseline?.policyDensity ?? base.policyCoverage);
  const documentExpirationRisk = clamp01(documentResult?.baseline?.expirationRisk ?? base.expirationRisk);

  const knowledgeContributionScore = clamp(
    knowledgeResult?.contributionScore?.value ??
      knowledgeResult?.healthScore?.value ??
      knowledgeResult?.baseline?.coverageScore ??
      base.knowledgeContributionScore
  );
  const boardGovernanceScore = clamp(
    boardGovernanceResult?.baseline?.policyGovernance ??
      boardGovernanceResult?.healthScore?.value ??
      base.boardGovernanceScore
  );
  const decisionTraceability = clamp01(
    decisionResult?.baseline?.traceabilityScore != null
      ? decisionResult.baseline.traceabilityScore / 100
      : decisionResult?.baseline?.dependencyDensity ??
          (analysis?.dashboard ? 0.35 + analysis.dashboard.overallRisk * 0.3 : base.decisionTraceability)
  );
  const humanCapitalPolicyCoverage = clamp(
    humanCapitalResult?.baseline?.policyCoverage ??
      humanCapitalResult?.baseline?.trainingCoverage ??
      humanCapitalResult?.healthScore?.value ??
      base.humanCapitalPolicyCoverage
  );
  const fundingComplianceReadiness = clamp(
    fundingResult?.baseline?.awardCompliance ??
      fundingResult?.baseline?.grantReadiness ??
      fundingResult?.healthScore?.value ??
      base.fundingComplianceReadiness
  );
  const operationsProcessCoverage = clamp(
    operationsResult?.baseline?.processCoverage ??
      operationsResult?.workflowScore?.value ??
      operationsResult?.baseline?.operationsScore ??
      base.operationsProcessCoverage
  );
  const customerCommunicationCoverage = clamp(
    customerResult?.baseline?.communicationCoverage ??
      customerResult?.healthScore?.value ??
      base.customerCommunicationCoverage
  );
  const improvementMomentum = clamp(
    improvementResult?.baseline?.improvementMomentum ??
      improvementResult?.healthScore?.value ??
      base.improvementMomentum
  );

  const complianceCoverage = clamp(
    oiosCompliance * 0.3 + documentComplianceCoverage * 0.3 + boardGovernanceScore * 0.2 + fundingComplianceReadiness * 0.2
  );
  const regulatoryCoverage = clamp(
    complianceCoverage * 0.45 + fundingComplianceReadiness * 0.25 + documentComplianceCoverage * 0.3
  );
  const contractDensity = clamp(documentContractDensity * 0.5 + executionScore * 0.25 + operationsProcessCoverage * 0.25);
  const contractCoverage = clamp(contractDensity * 0.55 + complianceCoverage * 0.25 + documentComplianceCoverage * 0.2);
  const policyCoverage = clamp(
    documentPolicyDensity * 0.35 + boardGovernanceScore * 0.25 + humanCapitalPolicyCoverage * 0.25 + executionScore * 0.15
  );
  const auditReadiness = clamp(complianceCoverage * 0.4 + policyCoverage * 0.25 + boardGovernanceScore * 0.2 + executionScore * 0.15);
  const licensePermitCoverage = clamp(complianceCoverage * 0.4 + regulatoryCoverage * 0.3 + (100 - documentExpirationRisk * 100) * 0.3);
  const insuranceAdequacy = clamp(organizationHealthScore * 0.4 + executionScore * 0.25 + complianceCoverage * 0.35);
  const cyberPosture = clamp(operationsProcessCoverage * 0.35 + executionScore * 0.3 + complianceCoverage * 0.35);

  const litigationExposure = clamp01(
    0.1 + oiosRisk * 0.25 + (1 - complianceCoverage / 100) * 0.25 + (1 - contractCoverage / 100) * 0.2
  );
  const vendorRiskPressure = clamp01(
    0.12 + (1 - contractCoverage / 100) * 0.25 + (1 - cyberPosture / 100) * 0.25 + (operationsResult?.baseline?.backlogPressure ?? 0.28) * 0.2
  );
  const expiredLicenseRatio = clamp01(0.06 + documentExpirationRisk * 0.3 + (1 - licensePermitCoverage / 100) * 0.2);
  const expirationRisk = clamp01(expiredLicenseRatio * 0.5 + documentExpirationRisk * 0.3 + (prediction ? 0.08 : 0.12));

  const riskPressure = clamp01(
    0.12 +
      Math.max(oiosRisk, documentRiskPressure) * 0.28 +
      (1 - complianceCoverage / 100) * 0.2 +
      litigationExposure * 0.15 +
      vendorRiskPressure * 0.15
  );

  const contractCount = Math.round(
    28 + contractCoverage * 0.3 + (documentResult?.baseline?.documentCount ?? 40) * 0.15 + (dna?.profile?.personas?.length ?? 3) * 2
  );
  const obligationCount = Math.round(
    40 + complianceCoverage * 0.35 + regulatoryCoverage * 0.2 + (prediction?.projection?.scenarios?.length ?? 0) * 3
  );

  return {
    organizationHealthScore,
    executionScore,
    complianceCoverage,
    riskPressure,
    contractCoverage,
    contractDensity,
    regulatoryCoverage,
    policyCoverage,
    auditReadiness,
    licensePermitCoverage,
    insuranceAdequacy,
    litigationExposure,
    vendorRiskPressure,
    cyberPosture,
    knowledgeContributionScore,
    documentComplianceCoverage,
    boardGovernanceScore,
    fundingComplianceReadiness,
    humanCapitalPolicyCoverage,
    operationsProcessCoverage,
    customerCommunicationCoverage,
    improvementMomentum,
    decisionTraceability,
    contractCount,
    obligationCount,
    expiredLicenseRatio,
    expirationRisk,
    ...overrides,
  };
}

export const legalComplianceRiskModels = {
  clamp,
  clamp01,
  statusFromScore,
  priorityFromScore,
  priorityFromRisk,
  levelFromValue,
  scoreNarrative,
  buildConfidence,
  buildLens,
  defaultCreateId,
  defaultPeriodLabel,
  emptyLegalComplianceRiskScope,
  defaultLegalComplianceRiskBaseline,
  deriveLegalComplianceRiskBaseline,
};

export class LegalComplianceRiskModels {
  static clamp = clamp;
  static clamp01 = clamp01;
  static statusFromScore = statusFromScore;
  static priorityFromScore = priorityFromScore;
  static priorityFromRisk = priorityFromRisk;
  static levelFromValue = levelFromValue;
  static scoreNarrative = scoreNarrative;
  static buildConfidence = buildConfidence;
  static buildLens = buildLens;
  static defaultCreateId = defaultCreateId;
  static defaultPeriodLabel = defaultPeriodLabel;
  static emptyScope = emptyLegalComplianceRiskScope;
  static baseline = defaultLegalComplianceRiskBaseline;
  static derive = deriveLegalComplianceRiskBaseline;
}
