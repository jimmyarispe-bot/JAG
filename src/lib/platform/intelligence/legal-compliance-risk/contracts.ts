/**
 * Legal, Compliance & Risk Intelligence — contracts only (Sprint 042).
 *
 * Leaf module: imports types only, never implementations.
 */

import type * as T from "@/lib/platform/intelligence/legal-compliance-risk/types";

export interface LegalComplianceRiskIntelligenceEngine {
  build(request: T.LegalComplianceRiskRequest): T.LegalComplianceRiskResult;
}

export type LegalComplianceRiskEngine = LegalComplianceRiskIntelligenceEngine;

export interface ContractIntelligence {
  assess(input: {
    baseline: T.LegalComplianceRiskBaseline;
    now: Date;
    createId: (prefix: string) => string;
  }): T.ContractSuite;
}

export interface RegulatoryIntelligence {
  assess(input: {
    baseline: T.LegalComplianceRiskBaseline;
    now: Date;
    createId: (prefix: string) => string;
  }): T.RegulatorySuite;
}

export interface ComplianceIntelligence {
  assess(input: {
    baseline: T.LegalComplianceRiskBaseline;
    regulatory: T.RegulatorySuite;
    contracts: T.ContractSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): T.ComplianceSuite;
}

export interface EnterpriseRiskIntelligence {
  assess(input: {
    baseline: T.LegalComplianceRiskBaseline;
    compliance: T.ComplianceSuite;
    contracts: T.ContractSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): T.EnterpriseRiskSuite;
}

export interface PolicyIntelligence {
  assess(input: {
    baseline: T.LegalComplianceRiskBaseline;
    now: Date;
    createId: (prefix: string) => string;
  }): T.PolicySuite;
}

export interface AuditIntelligence {
  assess(input: {
    baseline: T.LegalComplianceRiskBaseline;
    compliance: T.ComplianceSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): T.AuditSuite;
}

export interface LicensePermitIntelligence {
  monitor(input: {
    baseline: T.LegalComplianceRiskBaseline;
    now: Date;
    createId: (prefix: string) => string;
  }): T.LicensePermitSuite;
}

export interface InsuranceIntelligence {
  assess(input: {
    baseline: T.LegalComplianceRiskBaseline;
    enterpriseRisk: T.EnterpriseRiskSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): T.InsuranceSuite;
}

export interface LitigationIntelligence {
  track(input: {
    baseline: T.LegalComplianceRiskBaseline;
    now: Date;
    createId: (prefix: string) => string;
  }): T.LitigationSuite;
}

export interface VendorThirdPartyRiskIntelligence {
  assess(input: {
    baseline: T.LegalComplianceRiskBaseline;
    contracts: T.ContractSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): T.VendorRiskSuite;
}

export interface CyberGovernanceIntelligence {
  assess(input: {
    baseline: T.LegalComplianceRiskBaseline;
    now: Date;
    createId: (prefix: string) => string;
  }): T.CyberGovernanceSuite;
}

export interface LegalComplianceRiskReasoner {
  reason(input: {
    baseline: T.LegalComplianceRiskBaseline;
    compliance: T.ComplianceSuite;
    enterpriseRisk: T.EnterpriseRiskSuite;
    contracts: T.ContractSuite;
    question?: string;
    now: Date;
  }): T.LegalComplianceRiskReasoningResult;
}

export interface LegalComplianceRiskKnowledgeContributionEngine {
  contribute(input: {
    baseline: T.LegalComplianceRiskBaseline;
    compliance: T.ComplianceSuite;
    enterpriseRisk: T.EnterpriseRiskSuite;
    contracts: T.ContractSuite;
    now: Date;
    createId: (prefix: string) => string;
  }): T.LegalComplianceRiskKnowledgeContribution;
}

export interface LegalComplianceRiskIntelligence {
  composeScores(input: {
    baseline: T.LegalComplianceRiskBaseline;
    contracts: T.ContractSuite;
    regulatory: T.RegulatorySuite;
    compliance: T.ComplianceSuite;
    enterpriseRisk: T.EnterpriseRiskSuite;
    policy: T.PolicySuite;
    audit: T.AuditSuite;
    licensePermit: T.LicensePermitSuite;
    insurance: T.InsuranceSuite;
    litigation: T.LitigationSuite;
    vendorRisk: T.VendorRiskSuite;
    cyberGovernance: T.CyberGovernanceSuite;
    knowledgeContribution: T.LegalComplianceRiskKnowledgeContribution;
    reasoning: T.LegalComplianceRiskReasoningResult;
    risks: T.EnterpriseRiskRecordSummary[];
    opportunities: T.LegalComplianceRiskOpportunityRecord[];
  }): {
    healthScore: T.LegalComplianceRiskScore;
    complianceHealthScore: T.LegalComplianceRiskScore;
    riskScore: T.LegalComplianceRiskScore;
    contractScore: T.LegalComplianceRiskScore;
    regulatoryScore: T.LegalComplianceRiskScore;
    policyScore: T.LegalComplianceRiskScore;
    auditScore: T.LegalComplianceRiskScore;
    licensePermitScore: T.LegalComplianceRiskScore;
    insuranceScore: T.LegalComplianceRiskScore;
    litigationScore: T.LegalComplianceRiskScore;
    vendorRiskScore: T.LegalComplianceRiskScore;
    cyberGovernanceScore: T.LegalComplianceRiskScore;
    knowledgeScore: T.LegalComplianceRiskScore;
  };
}

export interface LegalComplianceRiskHealth {
  assess(input: {
    baseline: T.LegalComplianceRiskBaseline;
    scores: ReturnType<LegalComplianceRiskIntelligence["composeScores"]>;
    compliance: T.ComplianceSuite;
    enterpriseRisk: T.EnterpriseRiskSuite;
    licensePermit: T.LicensePermitSuite;
  }): T.LegalComplianceRiskHealthResult;
}

export interface LegalComplianceRiskDashboard {
  compose(input: {
    scores: ReturnType<LegalComplianceRiskIntelligence["composeScores"]>;
    risks: T.EnterpriseRiskRecordSummary[];
    opportunities: T.LegalComplianceRiskOpportunityRecord[];
    now: Date;
  }): T.LegalComplianceRiskDashboardResult;
}

export interface LegalComplianceRiskSpecializedDashboards {
  enterpriseRisk(input: {
    enterpriseRisk: T.EnterpriseRiskSuite;
    now: Date;
  }): T.EnterpriseRiskDashboardResult;
  compliance(input: {
    compliance: T.ComplianceSuite;
    now: Date;
  }): T.ComplianceDashboardResult;
  contracts(input: {
    contracts: T.ContractSuite;
    now: Date;
  }): T.ContractDashboardResult;
  audit(input: {
    audit: T.AuditSuite;
    now: Date;
  }): T.AuditDashboardResult;
}

export interface LegalComplianceRiskRiskAnalyzer {
  analyze(input: {
    baseline: T.LegalComplianceRiskBaseline;
    enterpriseRisk: T.EnterpriseRiskSuite;
    compliance: T.ComplianceSuite;
    litigation: T.LitigationSuite;
    now: Date;
  }): T.EnterpriseRiskRecordSummary[];
}

export interface LegalComplianceRiskOpportunityAnalyzer {
  analyze(input: {
    baseline: T.LegalComplianceRiskBaseline;
    compliance: T.ComplianceSuite;
    contracts: T.ContractSuite;
    knowledgeContribution: T.LegalComplianceRiskKnowledgeContribution;
    now: Date;
  }): T.LegalComplianceRiskOpportunityRecord[];
}

export interface LegalComplianceRiskRecommendationComposer {
  compose(input: {
    baseline: T.LegalComplianceRiskBaseline;
    risks: T.EnterpriseRiskRecordSummary[];
    opportunities: T.LegalComplianceRiskOpportunityRecord[];
    compliance: T.ComplianceSuite;
    contracts: T.ContractSuite;
    now: Date;
  }): T.LegalComplianceRiskRecommendationRecord[];
}

export interface CorrectiveActionPlanner {
  plan(input: {
    recommendations: T.LegalComplianceRiskRecommendationRecord[];
    now: Date;
  }): T.CorrectiveActionPlanResult;
}

export interface ExecutiveRiskBriefGenerator {
  generate(input: {
    request: T.LegalComplianceRiskRequest;
    scores: ReturnType<LegalComplianceRiskIntelligence["composeScores"]>;
    risks: T.EnterpriseRiskRecordSummary[];
    opportunities: T.LegalComplianceRiskOpportunityRecord[];
    enterpriseRisk: T.EnterpriseRiskSuite;
    recommendations: T.LegalComplianceRiskRecommendationRecord[];
    confidence: T.LegalComplianceRiskConfidenceScore;
    now: Date;
  }): T.ExecutiveRiskBrief;
}

export interface BoardComplianceBriefGenerator {
  generate(input: {
    request: T.LegalComplianceRiskRequest;
    scores: ReturnType<LegalComplianceRiskIntelligence["composeScores"]>;
    compliance: T.ComplianceSuite;
    recommendations: T.LegalComplianceRiskRecommendationRecord[];
    now: Date;
  }): T.BoardComplianceBrief;
}

export interface LegalComplianceRiskProjection {
  project(input: {
    request: T.LegalComplianceRiskRequest;
    scores: ReturnType<LegalComplianceRiskIntelligence["composeScores"]>;
    dashboard: T.LegalComplianceRiskDashboardResult;
    enterpriseRiskDashboard: T.EnterpriseRiskDashboardResult;
    complianceDashboard: T.ComplianceDashboardResult;
    brief: T.ExecutiveRiskBrief;
    confidence: T.LegalComplianceRiskConfidenceScore;
    baseline: T.LegalComplianceRiskBaseline;
  }): T.LegalComplianceRiskProjectionResult;
}

export interface LegalComplianceRiskQueries {
  ask(result: T.LegalComplianceRiskResult, request: T.LegalComplianceRiskQueryRequest): T.LegalComplianceRiskQueryResult;
}

export interface LegalComplianceRiskRegistry {
  register(domain: string, capability: string): void;
  list(): T.LegalComplianceRiskPublisher[];
  isRegistered(domain: string): boolean;
  clear(): void;
}

export interface LegalComplianceRiskRepository {
  save(result: T.LegalComplianceRiskResult): T.LegalComplianceRiskResult;
  get(requestId: string): T.LegalComplianceRiskResult | null;
  list(scope?: Partial<T.GraphScope>): T.LegalComplianceRiskResult[];
  remove(requestId: string): boolean;
  saveHistory(record: T.LegalComplianceRiskHistoryRecord): T.LegalComplianceRiskHistoryRecord;
  listHistory(scope?: Partial<T.GraphScope>): T.LegalComplianceRiskHistoryRecord[];
  clear(): void;
}

export interface LegalComplianceRiskIntelligenceService {
  build(request: T.LegalComplianceRiskRequest): T.LegalComplianceRiskResult;
  query(result: T.LegalComplianceRiskResult, request: T.LegalComplianceRiskQueryRequest): T.LegalComplianceRiskQueryResult;
  repository(): LegalComplianceRiskRepository;
}

export type LegalComplianceRiskService = LegalComplianceRiskIntelligenceService;

export interface LegalComplianceRiskDependencies {
  engine?: LegalComplianceRiskIntelligenceEngine;
  contractIntelligence?: ContractIntelligence;
  regulatoryIntelligence?: RegulatoryIntelligence;
  complianceIntelligence?: ComplianceIntelligence;
  enterpriseRiskIntelligence?: EnterpriseRiskIntelligence;
  policyIntelligence?: PolicyIntelligence;
  auditIntelligence?: AuditIntelligence;
  licensePermitIntelligence?: LicensePermitIntelligence;
  insuranceIntelligence?: InsuranceIntelligence;
  litigationIntelligence?: LitigationIntelligence;
  vendorThirdPartyRiskIntelligence?: VendorThirdPartyRiskIntelligence;
  cyberGovernanceIntelligence?: CyberGovernanceIntelligence;
  reasoner?: LegalComplianceRiskReasoner;
  knowledgeContributionEngine?: LegalComplianceRiskKnowledgeContributionEngine;
  intelligence?: LegalComplianceRiskIntelligence;
  health?: LegalComplianceRiskHealth;
  dashboard?: LegalComplianceRiskDashboard;
  specializedDashboards?: LegalComplianceRiskSpecializedDashboards;
  riskAnalyzer?: LegalComplianceRiskRiskAnalyzer;
  opportunityAnalyzer?: LegalComplianceRiskOpportunityAnalyzer;
  recommendationComposer?: LegalComplianceRiskRecommendationComposer;
  correctiveActionPlanner?: CorrectiveActionPlanner;
  briefGenerator?: ExecutiveRiskBriefGenerator;
  boardBriefGenerator?: BoardComplianceBriefGenerator;
  projection?: LegalComplianceRiskProjection;
  queries?: LegalComplianceRiskQueries;
  registry?: LegalComplianceRiskRegistry;
  repository?: LegalComplianceRiskRepository;
  now?: () => Date;
  createId?: (prefix: string) => string;
}
