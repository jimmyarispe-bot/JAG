/**
 * Legal, Compliance & Risk Intelligence Engine — Sprint 042 orchestrator.
 */

import type {
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
  LegalComplianceRiskKnowledgeContributionEngine as LegalComplianceRiskKnowledgeContributionEngineContract,
  LegalComplianceRiskOpportunityAnalyzer as LegalComplianceRiskOpportunityAnalyzerContract,
  LegalComplianceRiskProjection as LegalComplianceRiskProjectionContract,
  LegalComplianceRiskQueries as LegalComplianceRiskQueriesContract,
  LegalComplianceRiskReasoner as LegalComplianceRiskReasonerContract,
  LegalComplianceRiskRecommendationComposer as LegalComplianceRiskRecommendationComposerContract,
  LegalComplianceRiskRegistry as LegalComplianceRiskRegistryContract,
  LegalComplianceRiskRepository as LegalComplianceRiskRepositoryContract,
  LegalComplianceRiskRiskAnalyzer as LegalComplianceRiskRiskAnalyzerContract,
  LegalComplianceRiskSpecializedDashboards as LegalComplianceRiskSpecializedDashboardsContract,
  LicensePermitIntelligence as LicensePermitIntelligenceContract,
  LitigationIntelligence as LitigationIntelligenceContract,
  PolicyIntelligence as PolicyIntelligenceContract,
  RegulatoryIntelligence as RegulatoryIntelligenceContract,
  VendorThirdPartyRiskIntelligence as VendorThirdPartyRiskIntelligenceContract,
} from "@/lib/platform/intelligence/legal-compliance-risk/contracts";
import { AuditIntelligence } from "@/lib/platform/intelligence/legal-compliance-risk/audit-intelligence";
import { ComplianceIntelligence } from "@/lib/platform/intelligence/legal-compliance-risk/compliance-intelligence";
import { ContractIntelligence } from "@/lib/platform/intelligence/legal-compliance-risk/contract-intelligence";
import { CyberGovernanceIntelligence } from "@/lib/platform/intelligence/legal-compliance-risk/cyber-governance-intelligence";
import { EnterpriseRiskIntelligence } from "@/lib/platform/intelligence/legal-compliance-risk/enterprise-risk-intelligence";
import { InsuranceIntelligence } from "@/lib/platform/intelligence/legal-compliance-risk/insurance-intelligence";
import { LegalComplianceRiskKnowledgeContributionEngine } from "@/lib/platform/intelligence/legal-compliance-risk/knowledge-contribution";
import { LegalComplianceRiskReasoner } from "@/lib/platform/intelligence/legal-compliance-risk/legal-compliance-risk-reasoner";
import { LegalComplianceRiskRegistryStore } from "@/lib/platform/intelligence/legal-compliance-risk/legal-compliance-risk-registry";
import { LicensePermitIntelligence } from "@/lib/platform/intelligence/legal-compliance-risk/license-permit-intelligence";
import { LitigationIntelligence } from "@/lib/platform/intelligence/legal-compliance-risk/litigation-intelligence";
import { PolicyIntelligence } from "@/lib/platform/intelligence/legal-compliance-risk/policy-intelligence";
import { RegulatoryIntelligence } from "@/lib/platform/intelligence/legal-compliance-risk/regulatory-intelligence";
import { VendorThirdPartyRiskIntelligence } from "@/lib/platform/intelligence/legal-compliance-risk/vendor-third-party-risk-intelligence";
import {
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
import {
  LegalComplianceRiskProjection,
  LegalComplianceRiskQueries,
} from "@/lib/platform/intelligence/legal-compliance-risk/projection";
import { LegalComplianceRiskRepositoryStore } from "@/lib/platform/intelligence/legal-compliance-risk/repository";
import {
  defaultCreateId,
  defaultPeriodLabel,
  deriveLegalComplianceRiskBaseline,
  emptyLegalComplianceRiskScope,
} from "@/lib/platform/intelligence/legal-compliance-risk/models";
import {
  LEGAL_COMPLIANCE_RISK_INTELLIGENCE_VERSION,
  type DecisionResultLight,
  type LegalComplianceRiskRequest,
  type LegalComplianceRiskResult,
} from "@/lib/platform/intelligence/legal-compliance-risk/types";

export interface LegalComplianceRiskEngineDependencies extends LegalComplianceRiskDependencies {}

export class LegalComplianceRiskIntelligenceEngineImpl implements LegalComplianceRiskEngineContract {
  private readonly contractIntelligence: ContractIntelligenceContract;
  private readonly regulatoryIntelligence: RegulatoryIntelligenceContract;
  private readonly complianceIntelligence: ComplianceIntelligenceContract;
  private readonly enterpriseRiskIntelligence: EnterpriseRiskIntelligenceContract;
  private readonly policyIntelligence: PolicyIntelligenceContract;
  private readonly auditIntelligence: AuditIntelligenceContract;
  private readonly licensePermitIntelligence: LicensePermitIntelligenceContract;
  private readonly insuranceIntelligence: InsuranceIntelligenceContract;
  private readonly litigationIntelligence: LitigationIntelligenceContract;
  private readonly vendorThirdPartyRiskIntelligence: VendorThirdPartyRiskIntelligenceContract;
  private readonly cyberGovernanceIntelligence: CyberGovernanceIntelligenceContract;
  private readonly reasoner: LegalComplianceRiskReasonerContract;
  private readonly knowledgeContributionEngine: LegalComplianceRiskKnowledgeContributionEngineContract;
  private readonly intelligence: LegalComplianceRiskIntelligenceContract;
  private readonly health: LegalComplianceRiskHealthContract;
  private readonly dashboard: LegalComplianceRiskDashboardContract;
  private readonly specializedDashboards: LegalComplianceRiskSpecializedDashboardsContract;
  private readonly riskAnalyzer: LegalComplianceRiskRiskAnalyzerContract;
  private readonly opportunityAnalyzer: LegalComplianceRiskOpportunityAnalyzerContract;
  private readonly recommendationComposer: LegalComplianceRiskRecommendationComposerContract;
  private readonly correctiveActionPlanner: CorrectiveActionPlannerContract;
  private readonly briefGenerator: ExecutiveRiskBriefGeneratorContract;
  private readonly boardBriefGenerator: BoardComplianceBriefGeneratorContract;
  private readonly projectionEngine: LegalComplianceRiskProjectionContract;
  readonly queries: LegalComplianceRiskQueriesContract;
  readonly registry: LegalComplianceRiskRegistryContract;
  readonly repository: LegalComplianceRiskRepositoryContract;
  private readonly now: () => Date;
  private readonly createId: (prefix: string) => string;

  constructor(d: LegalComplianceRiskEngineDependencies = {}) {
    this.createId = d.createId ?? defaultCreateId;
    this.now = d.now ?? (() => new Date());
    this.contractIntelligence = d.contractIntelligence ?? new ContractIntelligence();
    this.regulatoryIntelligence = d.regulatoryIntelligence ?? new RegulatoryIntelligence();
    this.complianceIntelligence = d.complianceIntelligence ?? new ComplianceIntelligence();
    this.enterpriseRiskIntelligence = d.enterpriseRiskIntelligence ?? new EnterpriseRiskIntelligence();
    this.policyIntelligence = d.policyIntelligence ?? new PolicyIntelligence();
    this.auditIntelligence = d.auditIntelligence ?? new AuditIntelligence();
    this.licensePermitIntelligence = d.licensePermitIntelligence ?? new LicensePermitIntelligence();
    this.insuranceIntelligence = d.insuranceIntelligence ?? new InsuranceIntelligence();
    this.litigationIntelligence = d.litigationIntelligence ?? new LitigationIntelligence();
    this.vendorThirdPartyRiskIntelligence =
      d.vendorThirdPartyRiskIntelligence ?? new VendorThirdPartyRiskIntelligence();
    this.cyberGovernanceIntelligence = d.cyberGovernanceIntelligence ?? new CyberGovernanceIntelligence();
    this.reasoner = d.reasoner ?? new LegalComplianceRiskReasoner();
    this.knowledgeContributionEngine =
      d.knowledgeContributionEngine ?? new LegalComplianceRiskKnowledgeContributionEngine();
    this.intelligence = d.intelligence ?? new LegalComplianceRiskIntelligence();
    this.health = d.health ?? new LegalComplianceRiskHealth();
    this.dashboard = d.dashboard ?? new LegalComplianceRiskDashboard();
    this.specializedDashboards = d.specializedDashboards ?? new LegalComplianceRiskSpecializedDashboards();
    this.riskAnalyzer = d.riskAnalyzer ?? new LegalComplianceRiskRiskAnalyzer(this.createId);
    this.opportunityAnalyzer = d.opportunityAnalyzer ?? new LegalComplianceRiskOpportunityAnalyzer(this.createId);
    this.recommendationComposer =
      d.recommendationComposer ?? new LegalComplianceRiskRecommendationComposer(this.createId);
    this.correctiveActionPlanner = d.correctiveActionPlanner ?? new CorrectiveActionPlanner();
    this.briefGenerator = d.briefGenerator ?? new ExecutiveRiskBriefGenerator();
    this.boardBriefGenerator = d.boardBriefGenerator ?? new BoardComplianceBriefGenerator();
    this.projectionEngine = d.projection ?? new LegalComplianceRiskProjection();
    this.queries = d.queries ?? new LegalComplianceRiskQueries();
    this.registry = d.registry ?? new LegalComplianceRiskRegistryStore();
    this.repository = d.repository ?? new LegalComplianceRiskRepositoryStore();
  }

  build(request: LegalComplianceRiskRequest): LegalComplianceRiskResult {
    const now = this.now();
    const scope = request.scope ?? emptyLegalComplianceRiskScope();
    const dna = request.dna ?? request.dnaResult?.dna ?? null;
    const createId = this.createId;

    const baseline = deriveLegalComplianceRiskBaseline(
      dna,
      request.oiosResult,
      request.analysis,
      request.graphInput,
      request.predictionResult,
      request.knowledgeResult,
      request.documentResult,
      request.boardGovernanceResult,
      toDecisionLight(request.decisionResult),
      request.humanCapitalResult,
      request.fundingResult,
      request.operationsResult,
      request.customerResult,
      request.improvementResult,
      request.baselineOverrides
    );

    const contracts = this.contractIntelligence.assess({ baseline, now, createId });
    const regulatory = this.regulatoryIntelligence.assess({ baseline, now, createId });
    const compliance = this.complianceIntelligence.assess({ baseline, regulatory, contracts, now, createId });
    const enterpriseRisk = this.enterpriseRiskIntelligence.assess({ baseline, compliance, contracts, now, createId });
    const policy = this.policyIntelligence.assess({ baseline, now, createId });
    const audit = this.auditIntelligence.assess({ baseline, compliance, now, createId });
    const licensePermit = this.licensePermitIntelligence.monitor({ baseline, now, createId });
    const insurance = this.insuranceIntelligence.assess({ baseline, enterpriseRisk, now, createId });
    const litigation = this.litigationIntelligence.track({ baseline, now, createId });
    const vendorRisk = this.vendorThirdPartyRiskIntelligence.assess({ baseline, contracts, now, createId });
    const cyberGovernance = this.cyberGovernanceIntelligence.assess({ baseline, now, createId });
    const knowledgeContribution = this.knowledgeContributionEngine.contribute({
      baseline,
      compliance,
      enterpriseRisk,
      contracts,
      now,
      createId,
    });
    const reasoning = this.reasoner.reason({
      baseline,
      compliance,
      enterpriseRisk,
      contracts,
      question: request.question,
      now,
    });

    const risks = this.riskAnalyzer.analyze({ baseline, enterpriseRisk, compliance, litigation, now });
    const opportunities = this.opportunityAnalyzer.analyze({
      baseline,
      compliance,
      contracts,
      knowledgeContribution,
      now,
    });
    const recommendations = this.recommendationComposer.compose({
      baseline,
      risks,
      opportunities,
      compliance,
      contracts,
      now,
    });
    const correctiveActionPlan = this.correctiveActionPlanner.plan({ recommendations, now });

    const scores = this.intelligence.composeScores({
      baseline,
      contracts,
      regulatory,
      compliance,
      enterpriseRisk,
      policy,
      audit,
      licensePermit,
      insurance,
      litigation,
      vendorRisk,
      cyberGovernance,
      knowledgeContribution,
      reasoning,
      risks,
      opportunities,
    });
    const healthResult = this.health.assess({ baseline, scores, compliance, enterpriseRisk, licensePermit });
    const dashboard = this.dashboard.compose({ scores, risks, opportunities, now });
    const enterpriseRiskDashboard = this.specializedDashboards.enterpriseRisk({ enterpriseRisk, now });
    const complianceDashboard = this.specializedDashboards.compliance({ compliance, now });
    const contractDashboard = this.specializedDashboards.contracts({ contracts, now });
    const auditDashboard = this.specializedDashboards.audit({ audit, now });
    const confidence = defaultLegalComplianceRiskConfidence({ baseline, compliance, contracts, enterpriseRisk });
    const brief = this.briefGenerator.generate({
      request,
      scores,
      risks,
      opportunities,
      enterpriseRisk,
      recommendations,
      confidence,
      now,
    });
    const boardBrief = this.boardBriefGenerator.generate({ request, scores, compliance, recommendations, now });
    const projection = this.projectionEngine.project({
      request,
      scores,
      dashboard,
      enterpriseRiskDashboard,
      complianceDashboard,
      brief,
      confidence,
      baseline,
    });
    const historyRecord = {
      id: this.createId("lcr-history"),
      requestId: request.requestId,
      scope,
      status: "assessed" as const,
      complianceHealthScore: scores.complianceHealthScore.value,
      riskScore: scores.riskScore.value,
      generatedAt: now.toISOString(),
      summary: brief.headline,
      metadata: request.metadata ?? {},
    };

    const result: LegalComplianceRiskResult = {
      requestId: request.requestId,
      version: LEGAL_COMPLIANCE_RISK_INTELLIGENCE_VERSION,
      generatedAt: now.toISOString(),
      periodLabel: request.periodLabel ?? defaultPeriodLabel(now),
      scope,
      baseline,
      healthScore: scores.healthScore,
      complianceHealthScore: scores.complianceHealthScore,
      riskScore: scores.riskScore,
      contractScore: scores.contractScore,
      regulatoryScore: scores.regulatoryScore,
      policyScore: scores.policyScore,
      auditScore: scores.auditScore,
      licensePermitScore: scores.licensePermitScore,
      insuranceScore: scores.insuranceScore,
      litigationScore: scores.litigationScore,
      vendorRiskScore: scores.vendorRiskScore,
      cyberGovernanceScore: scores.cyberGovernanceScore,
      knowledgeScore: scores.knowledgeScore,
      health: healthResult,
      brief,
      boardBrief,
      projection,
      confidence,
      dashboard,
      enterpriseRiskDashboard,
      complianceDashboard,
      contractDashboard,
      auditDashboard,
      correctiveActionPlan,
      correctiveActions: correctiveActionPlan.correctiveActions,
      recommendations,
      risks,
      opportunities,
      historyRecord,
      contracts,
      regulatory,
      compliance,
      enterpriseRisk,
      policy,
      audit,
      licensePermit,
      insurance,
      litigation,
      vendorRisk,
      cyberGovernance,
      knowledgeContribution,
      reasoning,
      requestMetadata: {
        ...(request.metadata ?? {}),
        registryPublishers: this.registry.list().length,
        graphAligned: Boolean(request.graph),
        documentAligned: Boolean(request.documentResult),
        knowledgeAligned: Boolean(request.knowledgeResult),
      },
    };

    this.repository.save(result);
    this.repository.saveHistory(historyRecord);
    return result;
  }
}

export { LegalComplianceRiskIntelligenceEngineImpl as LegalComplianceRiskIntelligenceEngine };
export { LegalComplianceRiskIntelligenceEngineImpl as LegalComplianceRiskEngine };
export { LegalComplianceRiskIntelligenceEngineImpl as LegalComplianceRiskEngineImpl };

function toDecisionLight(value: LegalComplianceRiskRequest["decisionResult"]): DecisionResultLight | null {
  if (!value) return null;
  const candidate = value as DecisionResultLight;
  return {
    requestId: candidate.requestId,
    healthScore: candidate.healthScore,
    decisionScore: candidate.decisionScore,
    baseline: candidate.baseline,
    recommendations: candidate.recommendations,
  };
}
