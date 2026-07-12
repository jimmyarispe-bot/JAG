/**
 * Legal, Compliance & Risk Intelligence — public API (Sprint 042 / 0.1.0).
 */

export {
  LEGAL_COMPLIANCE_RISK_INTELLIGENCE_VERSION,
  LEGAL_COMPLIANCE_RISK_CAPABILITIES,
  RISK_CATEGORIES,
  COMPLIANCE_SCOPES,
  COMPLIANCE_STATUSES,
  CONTRACT_STATUSES,
  POLICY_STATUSES,
  AUDIT_FINDING_STATUSES,
  LICENSE_PERMIT_KINDS,
  LICENSE_PERMIT_STATUSES,
  INSURANCE_STATUSES,
  LITIGATION_STATUSES,
  VENDOR_TIERS,
  CYBER_CONTROL_STATUSES,
  LCR_CONFIDENCE_LEVELS,
  LCR_PRIORITY_BANDS,
  LCR_HEALTH_STATUSES,
  LCR_ARTIFACT_STATUSES,
  type AuditDashboardResult,
  type AuditFindingRecord,
  type AuditFindingStatus,
  type AuditSuite,
  type BoardComplianceBrief,
  type BoardGovernanceResultLight,
  type ComplianceDashboardResult,
  type ComplianceObligationRecord,
  type ComplianceScope,
  type ComplianceStatus,
  type ComplianceSuite,
  type ContractDashboardResult,
  type ContractRecord,
  type ContractStatus,
  type ContractSuite,
  type CorrectiveActionPlanResult,
  type CustomerResultLight,
  type CyberControlRecord,
  type CyberControlStatus,
  type CyberGovernanceSuite,
  type DecisionResultLight,
  type DocumentResultLight,
  type EnterpriseRiskDashboardResult,
  type EnterpriseRiskRecord,
  type EnterpriseRiskRecordSummary,
  type EnterpriseRiskSuite,
  type ExecutiveRiskBrief,
  type FundingResultLight,
  type GraphScope,
  type HumanCapitalResultLight,
  type ImprovementResultLight,
  type InsurancePolicyRecord,
  type InsuranceStatus,
  type InsuranceSuite,
  type KnowledgeResultLight,
  type LcrArtifactStatus,
  type LcrConfidenceLevel,
  type LcrHealthStatus,
  type LcrPriorityBand,
  type LegalComplianceRiskBaseline,
  type LegalComplianceRiskCapability,
  type LegalComplianceRiskConfidenceScore,
  type LegalComplianceRiskDashboardResult,
  type LegalComplianceRiskHealthResult,
  type LegalComplianceRiskHistoryRecord,
  type LegalComplianceRiskKnowledgeContribution,
  type LegalComplianceRiskKnowledgeDraft,
  type LegalComplianceRiskLens,
  type LegalComplianceRiskMetadata,
  type LegalComplianceRiskOpportunityRecord,
  type LegalComplianceRiskProjectionResult,
  type LegalComplianceRiskPublisher,
  type LegalComplianceRiskQueryRequest,
  type LegalComplianceRiskQueryResult,
  type LegalComplianceRiskReasoningResult,
  type LegalComplianceRiskRecommendationRecord,
  type LegalComplianceRiskRequest,
  type LegalComplianceRiskResult,
  type LegalComplianceRiskScore,
  type LicensePermitKind,
  type LicensePermitRecord,
  type LicensePermitStatus,
  type LicensePermitSuite,
  type LitigationMatterRecord,
  type LitigationStatus,
  type LitigationSuite,
  type OperationsResultLight,
  type PolicyRecord,
  type PolicyStatus,
  type PolicySuite,
  type RegulatoryRequirementRecord,
  type RegulatorySuite,
  type RiskCategory,
  type VendorRiskRecord,
  type VendorRiskSuite,
  type VendorTier,
} from "@/lib/platform/intelligence/legal-compliance-risk/types";

export type {
  AuditIntelligence as AuditIntelligenceContract,
  BoardComplianceBriefGenerator as BoardComplianceBriefGeneratorContract,
  ComplianceIntelligence as ComplianceIntelligenceContract,
  ContractIntelligence as ContractIntelligenceContract,
  CorrectiveActionPlanner as CorrectiveActionPlannerContract,
  CyberGovernanceIntelligence as CyberGovernanceIntelligenceContract,
  EnterpriseRiskIntelligence as EnterpriseRiskIntelligenceContract,
  ExecutiveRiskBriefGenerator as ExecutiveRiskBriefGeneratorContract,
  InsuranceIntelligence as InsuranceIntelligenceContract,
  LegalComplianceRiskDashboard as LegalComplianceRiskDashboardContract,
  LegalComplianceRiskDependencies,
  LegalComplianceRiskEngine as LegalComplianceRiskEngineContract,
  LegalComplianceRiskHealth as LegalComplianceRiskHealthContract,
  LegalComplianceRiskIntelligence as LegalComplianceRiskIntelligenceContract,
  LegalComplianceRiskIntelligenceEngine as LegalComplianceRiskIntelligenceEngineContract,
  LegalComplianceRiskIntelligenceService as LegalComplianceRiskIntelligenceServiceContract,
  LegalComplianceRiskKnowledgeContributionEngine as LegalComplianceRiskKnowledgeContributionEngineContract,
  LegalComplianceRiskOpportunityAnalyzer as LegalComplianceRiskOpportunityAnalyzerContract,
  LegalComplianceRiskProjection as LegalComplianceRiskProjectionContract,
  LegalComplianceRiskQueries as LegalComplianceRiskQueriesContract,
  LegalComplianceRiskReasoner as LegalComplianceRiskReasonerContract,
  LegalComplianceRiskRecommendationComposer as LegalComplianceRiskRecommendationComposerContract,
  LegalComplianceRiskRegistry as LegalComplianceRiskRegistryContract,
  LegalComplianceRiskRepository as LegalComplianceRiskRepositoryContract,
  LegalComplianceRiskRiskAnalyzer as LegalComplianceRiskRiskAnalyzerContract,
  LegalComplianceRiskService as LegalComplianceRiskServiceContract,
  LegalComplianceRiskSpecializedDashboards as LegalComplianceRiskSpecializedDashboardsContract,
  LicensePermitIntelligence as LicensePermitIntelligenceContract,
  LitigationIntelligence as LitigationIntelligenceContract,
  PolicyIntelligence as PolicyIntelligenceContract,
  RegulatoryIntelligence as RegulatoryIntelligenceContract,
  VendorThirdPartyRiskIntelligence as VendorThirdPartyRiskIntelligenceContract,
} from "@/lib/platform/intelligence/legal-compliance-risk/contracts";

export {
  buildConfidence,
  buildLens,
  clamp,
  clamp01,
  defaultCreateId,
  defaultLegalComplianceRiskBaseline,
  defaultPeriodLabel,
  deriveLegalComplianceRiskBaseline,
  emptyLegalComplianceRiskScope,
  legalComplianceRiskModels,
  LegalComplianceRiskModels,
  levelFromValue,
  priorityFromRisk,
  priorityFromScore,
  scoreNarrative,
  statusFromScore,
} from "@/lib/platform/intelligence/legal-compliance-risk/models";

export { ContractIntelligence } from "@/lib/platform/intelligence/legal-compliance-risk/contract-intelligence";
export { RegulatoryIntelligence } from "@/lib/platform/intelligence/legal-compliance-risk/regulatory-intelligence";
export { ComplianceIntelligence } from "@/lib/platform/intelligence/legal-compliance-risk/compliance-intelligence";
export { EnterpriseRiskIntelligence } from "@/lib/platform/intelligence/legal-compliance-risk/enterprise-risk-intelligence";
export { PolicyIntelligence } from "@/lib/platform/intelligence/legal-compliance-risk/policy-intelligence";
export { AuditIntelligence } from "@/lib/platform/intelligence/legal-compliance-risk/audit-intelligence";
export { LicensePermitIntelligence } from "@/lib/platform/intelligence/legal-compliance-risk/license-permit-intelligence";
export { InsuranceIntelligence } from "@/lib/platform/intelligence/legal-compliance-risk/insurance-intelligence";
export { LitigationIntelligence } from "@/lib/platform/intelligence/legal-compliance-risk/litigation-intelligence";
export { VendorThirdPartyRiskIntelligence } from "@/lib/platform/intelligence/legal-compliance-risk/vendor-third-party-risk-intelligence";
export { CyberGovernanceIntelligence } from "@/lib/platform/intelligence/legal-compliance-risk/cyber-governance-intelligence";
export { LegalComplianceRiskReasoner } from "@/lib/platform/intelligence/legal-compliance-risk/legal-compliance-risk-reasoner";
export { LegalComplianceRiskKnowledgeContributionEngine } from "@/lib/platform/intelligence/legal-compliance-risk/knowledge-contribution";
export {
  BoardComplianceBriefGenerator,
  CorrectiveActionPlanner,
  defaultLegalComplianceRiskConfidence,
  ExecutiveRiskBriefGenerator,
  LegalComplianceRiskDashboard,
  LegalComplianceRiskHealth,
  LegalComplianceRiskIntelligence,
  LegalComplianceRiskOpportunityAnalyzer,
  LegalComplianceRiskRecommendationComposer,
  LegalComplianceRiskRiskAnalyzer,
  LegalComplianceRiskSpecializedDashboards,
} from "@/lib/platform/intelligence/legal-compliance-risk/legal-compliance-risk-intelligence";
export {
  LegalComplianceRiskProjection,
  LegalComplianceRiskQueries,
} from "@/lib/platform/intelligence/legal-compliance-risk/projection";
export {
  LegalComplianceRiskRegistry,
  LegalComplianceRiskRegistryStore,
} from "@/lib/platform/intelligence/legal-compliance-risk/legal-compliance-risk-registry";
export {
  LegalComplianceRiskRepository,
  LegalComplianceRiskRepositoryStore,
} from "@/lib/platform/intelligence/legal-compliance-risk/repository";
export {
  LegalComplianceRiskEngine,
  LegalComplianceRiskEngineImpl,
  LegalComplianceRiskIntelligenceEngine,
  LegalComplianceRiskIntelligenceEngineImpl,
} from "@/lib/platform/intelligence/legal-compliance-risk/legal-compliance-risk-engine";
export {
  LegalComplianceRiskIntelligenceService,
  LegalComplianceRiskIntelligenceServiceImpl,
  LegalComplianceRiskService,
  LegalComplianceRiskServiceImpl,
} from "@/lib/platform/intelligence/legal-compliance-risk/service";

import { LegalComplianceRiskIntelligenceEngine } from "@/lib/platform/intelligence/legal-compliance-risk/legal-compliance-risk-engine";
import type { LegalComplianceRiskDependencies } from "@/lib/platform/intelligence/legal-compliance-risk/contracts";
import { LegalComplianceRiskIntelligenceService } from "@/lib/platform/intelligence/legal-compliance-risk/service";
import {
  createOiosOperatingSystem,
  type CreateOiosOptions,
  type OiosStack,
} from "@/lib/platform/oios";
import {
  createOrganizationDnaIntelligence,
  type CreateOrganizationDnaOptions,
  type OrganizationDnaStack,
} from "@/lib/platform/intelligence/organization-dna";

export interface LegalComplianceRiskStack {
  service: LegalComplianceRiskIntelligenceService;
  engine: LegalComplianceRiskIntelligenceEngine;
  organizationDna: OrganizationDnaStack | null;
  oios: OiosStack | null;
}

export interface CreateLegalComplianceRiskOptions extends LegalComplianceRiskDependencies {
  organizationDna?: OrganizationDnaStack;
  organizationDnaOptions?: CreateOrganizationDnaOptions;
  wireOrganizationDna?: boolean;
  oios?: OiosStack;
  oiosOptions?: CreateOiosOptions;
  wireOios?: boolean;
}

export function createLegalComplianceRiskIntelligence(
  options: CreateLegalComplianceRiskOptions = {}
): LegalComplianceRiskStack {
  const wireDna = options.wireOrganizationDna !== false;
  const wireOios = options.wireOios !== false;
  const organizationDna =
    options.organizationDna ??
    (wireDna
      ? createOrganizationDnaIntelligence({
          ...(options.organizationDnaOptions ?? {}),
          wireGraphAnalyzer: false,
          wireDecision: false,
          wirePredictive: false,
          wireBoardGovernance: false,
        })
      : null);
  const oios =
    options.oios ??
    (wireOios
      ? createOiosOperatingSystem({
          ...(options.oiosOptions ?? {}),
          organizationDnaStack:
            options.oiosOptions?.organizationDnaStack ?? organizationDna ?? undefined,
          wireOrganizationDna: false,
        })
      : null);
  const engine = new LegalComplianceRiskIntelligenceEngine(options);
  const service = new LegalComplianceRiskIntelligenceService({ ...options, engine });

  return { service, engine, organizationDna, oios };
}
