/**
 * Intelligence Platform Infrastructure — Legal, Compliance & Risk module
 * adapter (Sprint 042).
 *
 * Wraps existing createLegalComplianceRiskIntelligence — does not regenerate
 * Sprint 021–041. Terminal module: runs after `document`.
 */

import {
  createLegalComplianceRiskIntelligence,
  LEGAL_COMPLIANCE_RISK_INTELLIGENCE_VERSION,
  type CreateLegalComplianceRiskOptions,
  type LegalComplianceRiskStack,
} from "@/lib/platform/intelligence/legal-compliance-risk";
import type { OrganizationDnaResult } from "@/lib/platform/intelligence/organization-dna/types";
import type { OiosResult } from "@/lib/platform/oios/types";
import type {
  Graph,
  GraphAnalysisResult,
  GraphBuildInput,
} from "@/lib/platform/intelligence/executive-graph/types";
import type { ExecutiveDecisionResult } from "@/lib/platform/intelligence/executive-decision/types";
import type { PredictionResult } from "@/lib/platform/intelligence/predictive-intelligence/types";
import type { KnowledgeResult } from "@/lib/platform/intelligence/knowledge/types";
import type { DocumentResult } from "@/lib/platform/intelligence/document/types";
import type { GovernanceResult } from "@/lib/platform/intelligence/board-governance/types";
import type { HumanCapitalResult } from "@/lib/platform/intelligence/human-capital/types";
import type { FundingResult } from "@/lib/platform/intelligence/funding/types";
import type { OperationsResult } from "@/lib/platform/intelligence/operations/types";
import type { CustomerResult } from "@/lib/platform/intelligence/customer/types";
import type { ImprovementResult } from "@/lib/platform/intelligence/organizational-improvement/types";
import type {
  IntelligenceExecutionContext,
  IntelligenceModule,
} from "@/lib/platform/intelligence/infrastructure/contracts";
import { createModuleResult } from "@/lib/platform/intelligence/infrastructure/module-result";

export function createLegalComplianceRiskModule(
  options: CreateLegalComplianceRiskOptions = {},
  stack?: LegalComplianceRiskStack
): IntelligenceModule {
  const legalComplianceRisk =
    stack ??
    createLegalComplianceRiskIntelligence({
      ...options,
      wireOrganizationDna: options.wireOrganizationDna ?? false,
      wireOios: options.wireOios ?? false,
    });

  return {
    id: "legal-compliance-risk",
    name: "Legal, Compliance & Risk Intelligence",
    version: LEGAL_COMPLIANCE_RISK_INTELLIGENCE_VERSION,
    dependencies: ["document"],
    capabilities: [
      { key: "legal_compliance_risk.contracts", description: "Contract obligations, renewals, and clause gaps" },
      { key: "legal_compliance_risk.regulatory", description: "Regulatory requirements across all compliance scopes" },
      { key: "legal_compliance_risk.compliance", description: "Compliance obligation tracking and gap pressure" },
      { key: "legal_compliance_risk.enterprise_risk", description: "Enterprise risk register across 11 categories" },
      { key: "legal_compliance_risk.policy", description: "Policy coverage, staleness, and ownership" },
      { key: "legal_compliance_risk.audit", description: "Audit readiness and finding remediation" },
      { key: "legal_compliance_risk.license_permit", description: "License and permit expiration monitoring" },
      { key: "legal_compliance_risk.insurance", description: "Insurance adequacy and renewal monitoring" },
      { key: "legal_compliance_risk.litigation", description: "Litigation tracking and exposure" },
      { key: "legal_compliance_risk.vendor", description: "Vendor and third-party risk tiering" },
      { key: "legal_compliance_risk.cyber", description: "Cyber governance control maturity" },
      { key: "legal_compliance_risk.corrective_actions", description: "Corrective action plan with 8-field recommendation lens" },
    ],
    async execute(context: IntelligenceExecutionContext) {
      const startedAt = new Date().toISOString();
      try {
        const dnaResult = context.get<OrganizationDnaResult>("organizationDna");
        const oiosResult = context.get<OiosResult>("oios");
        const graphBundle = context.get<{
          graph?: Graph;
          analysis?: GraphAnalysisResult;
          graphInput?: GraphBuildInput;
        }>("executiveGraph");
        const decisionResult = context.get<ExecutiveDecisionResult>("executiveDecision");
        const predictionResult = context.get<PredictionResult>("predictive");
        const knowledgeResult = context.get<KnowledgeResult>("knowledge");
        const documentResult = context.get<DocumentResult>("document");
        const boardGovernanceResult = context.get<GovernanceResult>("boardGovernance");
        const humanCapitalResult = context.get<HumanCapitalResult>("humanCapital");
        const fundingResult = context.get<FundingResult>("funding");
        const operationsResult = context.get<OperationsResult>("operations");
        const customerResult = context.get<CustomerResult>("customer");
        const improvementResult = context.get<ImprovementResult>("organizational-improvement");

        const input = context.input as
          | {
              question?: string;
              periodLabel?: string;
            }
          | undefined;

        const result = legalComplianceRisk.service.build({
          requestId: context.runId,
          question:
            typeof input?.question === "string"
              ? input.question
              : "Where are our largest legal, compliance, and enterprise-risk exposures, and what corrective actions should we take before problems occur?",
          periodLabel: input?.periodLabel,
          dnaResult: dnaResult ?? undefined,
          dna: dnaResult?.dna,
          oiosResult: oiosResult ?? undefined,
          graph: graphBundle?.graph,
          analysis: graphBundle?.analysis,
          graphInput: graphBundle?.graphInput,
          decisionResult: decisionResult
            ? {
                requestId: decisionResult.requestId,
                healthScore: { value: decisionResult.confidence?.value },
                decisionScore: { value: decisionResult.confidence?.value },
                recommendations: decisionResult.recommendations?.map((r) => r.title),
              }
            : undefined,
          predictionResult: predictionResult ?? undefined,
          knowledgeResult: knowledgeResult
            ? {
                requestId: knowledgeResult.requestId,
                healthScore: { value: knowledgeResult.healthScore?.value },
                coverageScore: { value: knowledgeResult.coverageScore?.value },
                contributionScore: { value: knowledgeResult.qualityScore?.value },
                baseline: {
                  coverageScore: knowledgeResult.baseline?.coverageScore,
                  validatedRatio: knowledgeResult.baseline?.validatedRatio,
                  gapPressure: knowledgeResult.baseline?.gapPressure,
                },
              }
            : undefined,
          documentResult: documentResult
            ? {
                requestId: documentResult.requestId,
                healthScore: { value: documentResult.healthScore?.value },
                complianceScore: { value: documentResult.complianceScore?.value },
                riskScore: { value: documentResult.riskScore?.value },
                baseline: {
                  complianceCoverage: documentResult.baseline?.complianceCoverage,
                  riskPressure: documentResult.baseline?.riskPressure,
                  contractDensity: documentResult.baseline?.contractDensity,
                  grantDensity: documentResult.baseline?.grantDensity,
                  policyDensity: documentResult.baseline?.policyDensity,
                  expirationRisk: documentResult.baseline?.expirationRisk,
                  documentCount: documentResult.baseline?.documentCount,
                },
              }
            : undefined,
          boardGovernanceResult: boardGovernanceResult
            ? {
                requestId: boardGovernanceResult.requestId,
                healthScore: {
                  value: boardGovernanceResult.confidence?.value
                    ? clamp01ToScore(boardGovernanceResult.confidence.value)
                    : undefined,
                },
                baseline: {
                  policyGovernance: boardGovernanceResult.compliance?.length
                    ? Math.min(100, 50 + boardGovernanceResult.compliance.length * 4)
                    : undefined,
                  minutesCoverage: boardGovernanceResult.packets?.length
                    ? Math.min(100, 55 + boardGovernanceResult.packets.length * 5)
                    : undefined,
                  decisionTraceability: boardGovernanceResult.resolutions?.length
                    ? Math.min(100, 50 + boardGovernanceResult.resolutions.length * 5)
                    : undefined,
                },
                recommendations: boardGovernanceResult.recommendations,
              }
            : undefined,
          humanCapitalResult: humanCapitalResult
            ? {
                requestId: humanCapitalResult.requestId,
                healthScore: { value: humanCapitalResult.workforceHealthScore?.value },
                baseline: {
                  policyCoverage: humanCapitalResult.baseline?.skillsCoverage,
                  trainingCoverage: humanCapitalResult.baseline?.skillsCoverage,
                  successionReadiness: humanCapitalResult.baseline?.successionReadiness,
                },
              }
            : undefined,
          fundingResult: fundingResult
            ? {
                requestId: fundingResult.requestId,
                healthScore: { value: fundingResult.healthScore?.value },
                baseline: {
                  grantReadiness: fundingResult.baseline?.proposalCapacity,
                  awardCompliance: fundingResult.baseline?.complianceReadiness,
                },
              }
            : undefined,
          operationsResult: operationsResult
            ? {
                requestId: operationsResult.requestId,
                healthScore: { value: operationsResult.healthScore?.value },
                workflowScore: { value: operationsResult.workflowScore?.value },
                baseline: {
                  operationsScore: operationsResult.baseline?.operationsScore,
                  backlogPressure: operationsResult.baseline?.backlogPressure,
                },
              }
            : undefined,
          customerResult: customerResult
            ? {
                requestId: customerResult.requestId,
                healthScore: { value: customerResult.healthScore?.value },
                baseline: {
                  familyExperienceScore: customerResult.baseline?.familyExperienceScore,
                  complaintBurden: customerResult.baseline?.complaintBurden,
                  communicationCoverage: customerResult.baseline?.communicationQuality,
                },
              }
            : undefined,
          improvementResult: improvementResult
            ? {
                requestId: improvementResult.requestId,
                healthScore: { value: improvementResult.healthScore?.value },
                baseline: {
                  executionScore: improvementResult.baseline?.executionReadiness,
                  capacityScore: improvementResult.baseline?.organizationalCapacity,
                },
              }
            : undefined,
          scope: {
            organizationId: context.scope.organizationId ?? null,
            schoolId: context.scope.schoolId ?? null,
          },
        });

        context.set("legalComplianceRisk", result);

        return createModuleResult({
          moduleId: "legal-compliance-risk",
          context,
          startedAt,
          ok: true,
          data: result,
        });
      } catch (error) {
        return createModuleResult({
          moduleId: "legal-compliance-risk",
          context,
          startedAt,
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
  };
}

function clamp01ToScore(value: number): number {
  if (value <= 1) return Math.min(100, Math.max(0, value * 100));
  return Math.min(100, Math.max(0, value));
}
