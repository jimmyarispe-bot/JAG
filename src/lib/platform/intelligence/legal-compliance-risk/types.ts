/**
 * Legal, Compliance & Risk Intelligence — shared DTOs and constants (Sprint 042).
 *
 * Organizational governance intelligence: continuously understand legal
 * obligations, contractual commitments, regulatory requirements, policies,
 * enterprise risks, and recommend corrective actions before problems occur.
 *
 * This is NOT document storage — it composes onto Document Intelligence
 * (Sprint 041) and the wider OIOS to reason about obligations and risk.
 */

import type { OrganizationDNA, OrganizationDnaResult } from "@/lib/platform/intelligence/organization-dna/types";
import type { OiosResult } from "@/lib/platform/oios/types";
import type {
  Graph,
  GraphAnalysisResult,
  GraphBuildInput,
  GraphScope,
} from "@/lib/platform/intelligence/executive-graph/types";
import type { ExecutiveDecisionResult } from "@/lib/platform/intelligence/executive-decision/types";
import type { PredictionResult } from "@/lib/platform/intelligence/predictive-intelligence/types";

export const LEGAL_COMPLIANCE_RISK_INTELLIGENCE_VERSION = "0.1.0";

export type LegalComplianceRiskMetadata = Record<string, unknown>;
export type { GraphScope };

/** Enterprise risk categories (snake_case keys). */
export const RISK_CATEGORIES = [
  "financial",
  "operational",
  "strategic",
  "legal",
  "compliance",
  "human_capital",
  "cyber",
  "reputation",
  "mission",
  "funding",
  "vendor",
] as const;
export type RiskCategory = (typeof RISK_CATEGORIES)[number];

/** Compliance scopes (snake_case keys). */
export const COMPLIANCE_SCOPES = [
  "federal",
  "state",
  "local",
  "industry",
  "board_policies",
  "internal_policies",
  "accreditation",
  "grant_requirements",
  "contract_obligations",
] as const;
export type ComplianceScope = (typeof COMPLIANCE_SCOPES)[number];

export const LCR_CONFIDENCE_LEVELS = ["high", "medium", "low", "unknown"] as const;
export type LcrConfidenceLevel = (typeof LCR_CONFIDENCE_LEVELS)[number];

export const LCR_PRIORITY_BANDS = ["critical", "high", "medium", "low", "monitor"] as const;
export type LcrPriorityBand = (typeof LCR_PRIORITY_BANDS)[number];

export const LCR_HEALTH_STATUSES = ["excellent", "healthy", "warning", "critical"] as const;
export type LcrHealthStatus = (typeof LCR_HEALTH_STATUSES)[number];

export const LCR_ARTIFACT_STATUSES = [
  "draft",
  "assessed",
  "monitored",
  "at_risk",
  "remediating",
  "compliant",
  "escalated",
] as const;
export type LcrArtifactStatus = (typeof LCR_ARTIFACT_STATUSES)[number];

export const LEGAL_COMPLIANCE_RISK_CAPABILITIES = [
  "contract_intelligence",
  "regulatory_intelligence",
  "compliance_intelligence",
  "enterprise_risk_intelligence",
  "policy_intelligence",
  "audit_intelligence",
  "license_permit_intelligence",
  "insurance_intelligence",
  "litigation_tracking",
  "vendor_third_party_risk",
  "cyber_governance",
  "corrective_action_planning",
  "recommendation_generation",
  "knowledge_contribution",
] as const;
export type LegalComplianceRiskCapability = (typeof LEGAL_COMPLIANCE_RISK_CAPABILITIES)[number];

export const COMPLIANCE_STATUSES = ["compliant", "at_risk", "non_compliant", "unknown"] as const;
export type ComplianceStatus = (typeof COMPLIANCE_STATUSES)[number];

/**
 * The corrective-action recommendation lens (8 required fields).
 * Every recommendation and governance record surfaces this lens.
 */
export interface LegalComplianceRiskLens {
  regulationOrPolicyApplies: string;
  evidenceSupports: string;
  confidence: string;
  organizationalRisk: string;
  ifNoActionTaken: string;
  correctiveActionRecommended: string;
  whoOwnsAction: string;
  whenShouldComplete: string;
}

export interface LegalComplianceRiskConfidenceScore {
  value: number;
  level: LcrConfidenceLevel;
  factors: Array<{ key: string; label: string; contribution: number }>;
}

export interface LegalComplianceRiskScore {
  key: string;
  label: string;
  value: number;
  status: LcrHealthStatus;
  band: LcrPriorityBand;
  narrative: string;
}

/* ------------------------------------------------------------------ *
 * Soft integration light types (baseline derivation only).
 * ------------------------------------------------------------------ */

export interface KnowledgeResultLight {
  requestId?: string;
  healthScore?: { value?: number };
  coverageScore?: { value?: number };
  contributionScore?: { value?: number };
  baseline?: { coverageScore?: number; validatedRatio?: number; gapPressure?: number };
  recommendations?: string[];
}

export interface DocumentResultLight {
  requestId?: string;
  healthScore?: { value?: number };
  complianceScore?: { value?: number };
  riskScore?: { value?: number };
  baseline?: {
    complianceCoverage?: number;
    riskPressure?: number;
    contractDensity?: number;
    grantDensity?: number;
    policyDensity?: number;
    expirationRisk?: number;
    documentCount?: number;
  };
  recommendations?: string[];
}

export interface BoardGovernanceResultLight {
  requestId?: string;
  healthScore?: { value?: number };
  baseline?: { policyGovernance?: number; minutesCoverage?: number; decisionTraceability?: number };
  recommendations?: string[];
}

export interface DecisionResultLight {
  requestId?: string;
  healthScore?: { value?: number };
  decisionScore?: { value?: number };
  baseline?: { traceabilityScore?: number; dependencyDensity?: number; orphanDecisionRatio?: number };
  recommendations?: string[];
}

export interface HumanCapitalResultLight {
  requestId?: string;
  healthScore?: { value?: number };
  baseline?: { policyCoverage?: number; trainingCoverage?: number; successionReadiness?: number };
  recommendations?: string[];
}

export interface FundingResultLight {
  requestId?: string;
  healthScore?: { value?: number };
  baseline?: { grantReadiness?: number; awardCompliance?: number; pipelineCoverage?: number };
  recommendations?: string[];
}

export interface OperationsResultLight {
  requestId?: string;
  healthScore?: { value?: number };
  workflowScore?: { value?: number };
  baseline?: { operationsScore?: number; processCoverage?: number; backlogPressure?: number };
  recommendations?: string[];
}

export interface CustomerResultLight {
  requestId?: string;
  healthScore?: { value?: number };
  baseline?: { familyExperienceScore?: number; complaintBurden?: number; communicationCoverage?: number };
  recommendations?: string[];
}

export interface ImprovementResultLight {
  requestId?: string;
  healthScore?: { value?: number };
  baseline?: { improvementMomentum?: number; executionScore?: number; capacityScore?: number };
  recommendations?: string[];
}

/* ------------------------------------------------------------------ *
 * Baseline
 * ------------------------------------------------------------------ */

export interface LegalComplianceRiskBaseline {
  organizationHealthScore: number;
  executionScore: number;
  complianceCoverage: number;
  riskPressure: number;
  contractCoverage: number;
  contractDensity: number;
  regulatoryCoverage: number;
  policyCoverage: number;
  auditReadiness: number;
  licensePermitCoverage: number;
  insuranceAdequacy: number;
  litigationExposure: number;
  vendorRiskPressure: number;
  cyberPosture: number;
  knowledgeContributionScore: number;
  documentComplianceCoverage: number;
  boardGovernanceScore: number;
  fundingComplianceReadiness: number;
  humanCapitalPolicyCoverage: number;
  operationsProcessCoverage: number;
  customerCommunicationCoverage: number;
  improvementMomentum: number;
  decisionTraceability: number;
  contractCount: number;
  obligationCount: number;
  expiredLicenseRatio: number;
  expirationRisk: number;
}

/* ------------------------------------------------------------------ *
 * Contract Intelligence
 * ------------------------------------------------------------------ */

export const CONTRACT_STATUSES = ["active", "expiring", "expired", "renewing", "terminated"] as const;
export type ContractStatus = (typeof CONTRACT_STATUSES)[number];

export interface ContractRecord {
  id: string;
  title: string;
  counterparty: string;
  status: ContractStatus;
  annualValue: number;
  startsAt: string;
  expiresAt: string | null;
  autoRenew: boolean;
  obligations: string[];
  missingClauses: string[];
  riskScore: number;
  owner: string;
  narrative: string;
  lenses: LegalComplianceRiskLens;
}

export interface ContractSuite {
  contracts: ContractRecord[];
  coverageScore: number;
  expiringSoon: ContractRecord[];
  missingClauses: string[];
  autoRenewRisk: number;
  narrative: string;
}

/* ------------------------------------------------------------------ *
 * Regulatory Intelligence
 * ------------------------------------------------------------------ */

export interface RegulatoryRequirementRecord {
  id: string;
  regulation: string;
  scope: ComplianceScope;
  obligation: string;
  applies: boolean;
  status: ComplianceStatus;
  owner: string;
  dueDate: string;
  narrative: string;
}

export interface RegulatorySuite {
  requirements: RegulatoryRequirementRecord[];
  coverageScore: number;
  byScope: Record<ComplianceScope, number>;
  weakestScope: ComplianceScope;
  narrative: string;
}

/* ------------------------------------------------------------------ *
 * Compliance Intelligence
 * ------------------------------------------------------------------ */

export interface ComplianceObligationRecord {
  id: string;
  scope: ComplianceScope;
  requirement: string;
  status: ComplianceStatus;
  evidenceRefs: string[];
  owner: string;
  dueDate: string;
  gapScore: number;
  narrative: string;
}

export interface ComplianceSuite {
  scopes: ComplianceScope[];
  obligations: ComplianceObligationRecord[];
  byScope: Record<ComplianceScope, number>;
  coverageScore: number;
  gapPressure: number;
  weakestScope: ComplianceScope;
  narrative: string;
}

/* ------------------------------------------------------------------ *
 * Enterprise Risk Intelligence
 * ------------------------------------------------------------------ */

export interface EnterpriseRiskRecord {
  id: string;
  category: RiskCategory;
  title: string;
  likelihood: number;
  impact: number;
  inherentScore: number;
  residualScore: number;
  velocity: number;
  owner: string;
  mitigation: string;
  narrative: string;
  lenses: LegalComplianceRiskLens;
}

export interface EnterpriseRiskSuite {
  risks: Record<RiskCategory, EnterpriseRiskRecord[]>;
  byCategory: Record<RiskCategory, number>;
  overallRiskPressure: number;
  hottestCategory: RiskCategory;
  narrative: string;
}

/* ------------------------------------------------------------------ *
 * Policy Intelligence
 * ------------------------------------------------------------------ */

export const POLICY_STATUSES = ["active", "draft", "stale", "retired"] as const;
export type PolicyStatus = (typeof POLICY_STATUSES)[number];

export interface PolicyRecord {
  id: string;
  name: string;
  scope: ComplianceScope;
  status: PolicyStatus;
  owner: string;
  lastReviewedAt: string;
  nextReviewAt: string;
  coverageScore: number;
  narrative: string;
}

export interface PolicySuite {
  policies: PolicyRecord[];
  coverageScore: number;
  staleCount: number;
  ownerGaps: number;
  narrative: string;
}

/* ------------------------------------------------------------------ *
 * Audit Intelligence
 * ------------------------------------------------------------------ */

export const AUDIT_FINDING_STATUSES = ["open", "remediating", "closed"] as const;
export type AuditFindingStatus = (typeof AUDIT_FINDING_STATUSES)[number];

export interface AuditFindingRecord {
  id: string;
  title: string;
  area: string;
  severity: LcrPriorityBand;
  status: AuditFindingStatus;
  owner: string;
  dueDate: string;
  overdue: boolean;
  narrative: string;
}

export interface AuditSuite {
  findings: AuditFindingRecord[];
  readinessScore: number;
  openFindings: number;
  overdueFindings: number;
  narrative: string;
}

/* ------------------------------------------------------------------ *
 * License + Permit Intelligence
 * ------------------------------------------------------------------ */

export const LICENSE_PERMIT_KINDS = ["license", "permit"] as const;
export type LicensePermitKind = (typeof LICENSE_PERMIT_KINDS)[number];

export const LICENSE_PERMIT_STATUSES = ["active", "expiring", "expired", "pending"] as const;
export type LicensePermitStatus = (typeof LICENSE_PERMIT_STATUSES)[number];

export interface LicensePermitRecord {
  id: string;
  name: string;
  kind: LicensePermitKind;
  authority: string;
  status: LicensePermitStatus;
  issuedAt: string;
  expiresAt: string | null;
  owner: string;
  narrative: string;
}

export interface LicensePermitSuite {
  records: LicensePermitRecord[];
  monitoringScore: number;
  expiringSoon: LicensePermitRecord[];
  expired: LicensePermitRecord[];
  nextExpiration: string | null;
  narrative: string;
}

/* ------------------------------------------------------------------ *
 * Insurance Intelligence
 * ------------------------------------------------------------------ */

export const INSURANCE_STATUSES = ["active", "expiring", "lapsed"] as const;
export type InsuranceStatus = (typeof INSURANCE_STATUSES)[number];

export interface InsurancePolicyRecord {
  id: string;
  name: string;
  carrier: string;
  coverageType: string;
  coverageLimit: number;
  premium: number;
  status: InsuranceStatus;
  renewsAt: string;
  adequacyScore: number;
  owner: string;
  narrative: string;
}

export interface InsuranceSuite {
  policies: InsurancePolicyRecord[];
  adequacyScore: number;
  coverageGaps: string[];
  expiringSoon: number;
  narrative: string;
}

/* ------------------------------------------------------------------ *
 * Litigation Tracking
 * ------------------------------------------------------------------ */

export const LITIGATION_STATUSES = ["active", "monitoring", "settled", "closed"] as const;
export type LitigationStatus = (typeof LITIGATION_STATUSES)[number];

export interface LitigationMatterRecord {
  id: string;
  title: string;
  matterType: string;
  status: LitigationStatus;
  exposure: number;
  stage: string;
  owner: string;
  nextMilestone: string;
  narrative: string;
}

export interface LitigationSuite {
  matters: LitigationMatterRecord[];
  exposureScore: number;
  activeMatters: number;
  totalExposure: number;
  narrative: string;
}

/* ------------------------------------------------------------------ *
 * Vendor + Third-Party Risk
 * ------------------------------------------------------------------ */

export const VENDOR_TIERS = ["critical", "high", "medium", "low"] as const;
export type VendorTier = (typeof VENDOR_TIERS)[number];

export interface VendorRiskRecord {
  id: string;
  vendor: string;
  tier: VendorTier;
  riskScore: number;
  dataAccess: boolean;
  contractId: string | null;
  status: ComplianceStatus;
  owner: string;
  narrative: string;
}

export interface VendorRiskSuite {
  vendors: VendorRiskRecord[];
  riskPressure: number;
  criticalVendors: number;
  coverageScore: number;
  narrative: string;
}

/* ------------------------------------------------------------------ *
 * Cyber Governance
 * ------------------------------------------------------------------ */

export const CYBER_CONTROL_STATUSES = ["implemented", "partial", "gap"] as const;
export type CyberControlStatus = (typeof CYBER_CONTROL_STATUSES)[number];

export interface CyberControlRecord {
  id: string;
  control: string;
  domain: string;
  maturity: number;
  status: CyberControlStatus;
  owner: string;
  narrative: string;
}

export interface CyberGovernanceSuite {
  controls: CyberControlRecord[];
  postureScore: number;
  gaps: number;
  weakestDomain: string;
  narrative: string;
}

/* ------------------------------------------------------------------ *
 * Reasoning
 * ------------------------------------------------------------------ */

export interface LegalComplianceRiskReasoningResult {
  answer: string;
  connectedObligations: string[];
  risks: EnterpriseRiskRecord[];
  missingTopics: string[];
  confidence: LegalComplianceRiskConfidenceScore;
  narrative: string;
}

/* ------------------------------------------------------------------ *
 * Knowledge contribution
 * ------------------------------------------------------------------ */

export interface LegalComplianceRiskKnowledgeDraft {
  id: string;
  type: string;
  title: string;
  confidence: number;
  sourceRef: string;
  validated: boolean;
  metadata: LegalComplianceRiskMetadata;
}

export interface LegalComplianceRiskKnowledgeContribution {
  artifacts: LegalComplianceRiskKnowledgeDraft[];
  contributionScore: number;
  validatedCount: number;
  narrative: string;
}

/* ------------------------------------------------------------------ *
 * Health, dashboards, briefs
 * ------------------------------------------------------------------ */

export interface LegalComplianceRiskHealthResult {
  overallScore: number;
  status: LcrHealthStatus;
  dimensions: Record<string, number>;
  lenses: LegalComplianceRiskLens;
  narrative: string;
}

export interface LegalComplianceRiskDashboardResult {
  generatedAt: string;
  headline: string;
  overall: number;
  complianceHealthScore: number;
  riskScore: number;
  contractScore: number;
  regulatoryScore: number;
  policyScore: number;
  auditScore: number;
  topRisks: string[];
  topOpportunities: string[];
  narrative: string;
}

export interface EnterpriseRiskDashboardResult {
  generatedAt: string;
  headline: string;
  overallRiskPressure: number;
  byCategory: Record<RiskCategory, number>;
  hottestCategory: RiskCategory;
  topRisks: string[];
  narrative: string;
}

export interface ComplianceDashboardResult {
  generatedAt: string;
  complianceCoverage: number;
  byScope: Record<ComplianceScope, number>;
  weakestScope: ComplianceScope;
  openObligations: number;
  narrative: string;
}

export interface ContractDashboardResult {
  generatedAt: string;
  contractCount: number;
  coverageScore: number;
  expiringSoon: number;
  missingClauses: string[];
  autoRenewRisk: number;
  narrative: string;
}

export interface AuditDashboardResult {
  generatedAt: string;
  readinessScore: number;
  openFindings: number;
  overdueFindings: number;
  narrative: string;
}

export interface EnterpriseRiskRecordSummary {
  id: string;
  title: string;
  category: RiskCategory;
  severity: LcrPriorityBand;
  score: number;
  mitigation: string;
  lenses: LegalComplianceRiskLens;
  narrative: string;
}

export interface LegalComplianceRiskOpportunityRecord {
  id: string;
  title: string;
  priority: LcrPriorityBand;
  score: number;
  expectedValue: number;
  lenses: LegalComplianceRiskLens;
  narrative: string;
}

/**
 * A recommendation / corrective action. Carries the 8-field lens plus
 * regulation/policy ref, evidence refs, confidence, risk score, owner,
 * due date, and priority.
 */
export interface LegalComplianceRiskRecommendationRecord {
  id: string;
  title: string;
  priority: LcrPriorityBand;
  regulationOrPolicyRef: string;
  evidenceRefs: string[];
  confidenceScore: number;
  riskScore: number;
  owner: string;
  dueDate: string;
  rationale: string;
  correctiveAction: string;
  lenses: LegalComplianceRiskLens;
  narrative: string;
}

export interface CorrectiveActionPlanResult {
  generatedAt: string;
  correctiveActions: LegalComplianceRiskRecommendationRecord[];
  planScore: number;
  criticalCount: number;
  narrative: string;
}

export interface ExecutiveRiskBrief {
  generatedAt: string;
  headline: string;
  summary: string;
  complianceHealthScore: number;
  riskScore: number;
  contractScore: number;
  auditScore: number;
  topRecommendations: string[];
  topRisks: string[];
  topOpportunities: string[];
  hottestRiskCategory: RiskCategory;
  lenses: LegalComplianceRiskLens;
  narrative: string;
}

export interface BoardComplianceBrief {
  generatedAt: string;
  headline: string;
  summary: string;
  complianceHealthScore: number;
  weakestScope: ComplianceScope;
  openObligations: number;
  topObligations: string[];
  correctiveActions: string[];
  lenses: LegalComplianceRiskLens;
  narrative: string;
}

/* ------------------------------------------------------------------ *
 * Projection / history / query
 * ------------------------------------------------------------------ */

export interface LegalComplianceRiskProjectionResult {
  generatedAt: string;
  headline: string;
  complianceHealthScore: number;
  riskScore: number;
  contractScore: number;
  regulatoryScore: number;
  policyScore: number;
  auditScore: number;
  licensePermitScore: number;
  insuranceScore: number;
  litigationScore: number;
  vendorRiskScore: number;
  cyberGovernanceScore: number;
  dashboard: LegalComplianceRiskDashboardResult;
  enterpriseRiskDashboard: EnterpriseRiskDashboardResult;
  complianceDashboard: ComplianceDashboardResult;
  brief: ExecutiveRiskBrief;
  metrics: {
    contractCount: number;
    obligationCount: number;
    riskPressure: number;
    complianceCoverage: number;
    litigationExposure: number;
    vendorRiskPressure: number;
  };
  overallConfidence: LegalComplianceRiskConfidenceScore;
}

export interface LegalComplianceRiskHistoryRecord {
  id: string;
  requestId: string;
  scope: GraphScope;
  status: LcrArtifactStatus;
  complianceHealthScore: number;
  riskScore: number;
  generatedAt: string;
  summary: string;
  metadata: LegalComplianceRiskMetadata;
}

export interface LegalComplianceRiskQueryRequest {
  question: string;
  focus?:
    | "general"
    | "contracts"
    | "regulatory"
    | "compliance"
    | "risk"
    | "policy"
    | "audit"
    | "licenses"
    | "insurance"
    | "litigation"
    | "vendor"
    | "cyber"
    | "corrective"
    | "reasoning";
  maxResults?: number;
}

export interface LegalComplianceRiskQueryResult {
  question: string;
  focus: string;
  answer: string;
  references: string[];
  confidence: LegalComplianceRiskConfidenceScore;
}

export interface LegalComplianceRiskPublisher {
  domain: string;
  capability: string;
}

/* ------------------------------------------------------------------ *
 * Request / Result
 * ------------------------------------------------------------------ */

export interface LegalComplianceRiskRequest {
  requestId: string;
  question?: string;
  periodLabel?: string;
  scope?: GraphScope;
  dna?: OrganizationDNA;
  dnaResult?: OrganizationDnaResult;
  oiosResult?: OiosResult;
  graph?: Graph;
  analysis?: GraphAnalysisResult;
  graphInput?: GraphBuildInput;
  decisionResult?: ExecutiveDecisionResult | DecisionResultLight;
  predictionResult?: PredictionResult;
  knowledgeResult?: KnowledgeResultLight;
  documentResult?: DocumentResultLight;
  boardGovernanceResult?: BoardGovernanceResultLight;
  humanCapitalResult?: HumanCapitalResultLight;
  fundingResult?: FundingResultLight;
  operationsResult?: OperationsResultLight;
  customerResult?: CustomerResultLight;
  improvementResult?: ImprovementResultLight;
  baselineOverrides?: Partial<LegalComplianceRiskBaseline>;
  metadata?: LegalComplianceRiskMetadata;
}

export interface LegalComplianceRiskResult {
  requestId: string;
  version: string;
  generatedAt: string;
  periodLabel: string;
  scope: GraphScope;
  baseline: LegalComplianceRiskBaseline;
  healthScore: LegalComplianceRiskScore;
  complianceHealthScore: LegalComplianceRiskScore;
  riskScore: LegalComplianceRiskScore;
  contractScore: LegalComplianceRiskScore;
  regulatoryScore: LegalComplianceRiskScore;
  policyScore: LegalComplianceRiskScore;
  auditScore: LegalComplianceRiskScore;
  licensePermitScore: LegalComplianceRiskScore;
  insuranceScore: LegalComplianceRiskScore;
  litigationScore: LegalComplianceRiskScore;
  vendorRiskScore: LegalComplianceRiskScore;
  cyberGovernanceScore: LegalComplianceRiskScore;
  knowledgeScore: LegalComplianceRiskScore;
  health: LegalComplianceRiskHealthResult;
  brief: ExecutiveRiskBrief;
  boardBrief: BoardComplianceBrief;
  projection: LegalComplianceRiskProjectionResult;
  confidence: LegalComplianceRiskConfidenceScore;
  dashboard: LegalComplianceRiskDashboardResult;
  enterpriseRiskDashboard: EnterpriseRiskDashboardResult;
  complianceDashboard: ComplianceDashboardResult;
  contractDashboard: ContractDashboardResult;
  auditDashboard: AuditDashboardResult;
  correctiveActionPlan: CorrectiveActionPlanResult;
  correctiveActions: LegalComplianceRiskRecommendationRecord[];
  recommendations: LegalComplianceRiskRecommendationRecord[];
  risks: EnterpriseRiskRecordSummary[];
  opportunities: LegalComplianceRiskOpportunityRecord[];
  historyRecord: LegalComplianceRiskHistoryRecord;
  contracts: ContractSuite;
  regulatory: RegulatorySuite;
  compliance: ComplianceSuite;
  enterpriseRisk: EnterpriseRiskSuite;
  policy: PolicySuite;
  audit: AuditSuite;
  licensePermit: LicensePermitSuite;
  insurance: InsuranceSuite;
  litigation: LitigationSuite;
  vendorRisk: VendorRiskSuite;
  cyberGovernance: CyberGovernanceSuite;
  knowledgeContribution: LegalComplianceRiskKnowledgeContribution;
  reasoning: LegalComplianceRiskReasoningResult;
  requestMetadata: LegalComplianceRiskMetadata;
}
