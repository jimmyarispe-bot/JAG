/**
 * Intelligence Platform Infrastructure — built-in module providers (Sprint 027).
 */

export { createOrganizationHealthModule, ORGANIZATION_HEALTH_MODULE_VERSION } from "@/lib/platform/intelligence/infrastructure/modules/organization-health";
export { createFinancialIntelligenceModule, FINANCIAL_INTELLIGENCE_MODULE_VERSION } from "@/lib/platform/intelligence/infrastructure/modules/financial";
export { createFounderIntelligenceModule, FOUNDER_INTELLIGENCE_MODULE_VERSION } from "@/lib/platform/intelligence/infrastructure/modules/founder";
export { createExecutiveIntelligenceModule } from "@/lib/platform/intelligence/infrastructure/modules/executive";
export { createExecutiveGraphModule } from "@/lib/platform/intelligence/infrastructure/modules/executive-graph";
export { createExecutiveDecisionModule } from "@/lib/platform/intelligence/infrastructure/modules/executive-decision";
export { createPredictiveIntelligenceModule } from "@/lib/platform/intelligence/infrastructure/modules/predictive";
export { createBoardGovernanceModule } from "@/lib/platform/intelligence/infrastructure/modules/board-governance";
export { createOrganizationDnaModule } from "@/lib/platform/intelligence/infrastructure/modules/organization-dna";
export { createOiosCoreModule } from "@/lib/platform/intelligence/infrastructure/modules/oios-core";
export { createHumanCapitalModule } from "@/lib/platform/intelligence/infrastructure/modules/human-capital";
export { createRevenueModule } from "@/lib/platform/intelligence/infrastructure/modules/revenue";
export { createFundingModule } from "@/lib/platform/intelligence/infrastructure/modules/funding";
export { createOpportunityModule } from "@/lib/platform/intelligence/infrastructure/modules/opportunity";
export { createOrganizationalImprovementModule } from "@/lib/platform/intelligence/infrastructure/modules/organizational-improvement";
export { createBusinessModelModule } from "@/lib/platform/intelligence/infrastructure/modules/business-model";
export { createOperationsModule } from "@/lib/platform/intelligence/infrastructure/modules/operations";
export { createCustomerModule } from "@/lib/platform/intelligence/infrastructure/modules/customer";
export { createKnowledgeModule } from "@/lib/platform/intelligence/infrastructure/modules/knowledge";
export { createDocumentModule } from "@/lib/platform/intelligence/infrastructure/modules/document";
export { createLegalComplianceRiskModule } from "@/lib/platform/intelligence/infrastructure/modules/legal-compliance-risk";

import type { IntelligenceModule, IntelligenceProvider } from "@/lib/platform/intelligence/infrastructure/contracts";
import { createIntelligenceProvider } from "@/lib/platform/intelligence/infrastructure/provider";
import { createOrganizationDnaModule } from "@/lib/platform/intelligence/infrastructure/modules/organization-dna";
import { createOiosCoreModule } from "@/lib/platform/intelligence/infrastructure/modules/oios-core";
import { createHumanCapitalModule } from "@/lib/platform/intelligence/infrastructure/modules/human-capital";
import { createRevenueModule } from "@/lib/platform/intelligence/infrastructure/modules/revenue";
import { createFundingModule } from "@/lib/platform/intelligence/infrastructure/modules/funding";
import { createOpportunityModule } from "@/lib/platform/intelligence/infrastructure/modules/opportunity";
import { createOrganizationalImprovementModule } from "@/lib/platform/intelligence/infrastructure/modules/organizational-improvement";
import { createBusinessModelModule } from "@/lib/platform/intelligence/infrastructure/modules/business-model";
import { createOperationsModule } from "@/lib/platform/intelligence/infrastructure/modules/operations";
import { createCustomerModule } from "@/lib/platform/intelligence/infrastructure/modules/customer";
import { createKnowledgeModule } from "@/lib/platform/intelligence/infrastructure/modules/knowledge";
import { createDocumentModule } from "@/lib/platform/intelligence/infrastructure/modules/document";
import { createLegalComplianceRiskModule } from "@/lib/platform/intelligence/infrastructure/modules/legal-compliance-risk";
import { createOrganizationHealthModule } from "@/lib/platform/intelligence/infrastructure/modules/organization-health";
import { createFinancialIntelligenceModule } from "@/lib/platform/intelligence/infrastructure/modules/financial";
import { createFounderIntelligenceModule } from "@/lib/platform/intelligence/infrastructure/modules/founder";
import { createExecutiveIntelligenceModule } from "@/lib/platform/intelligence/infrastructure/modules/executive";
import { createExecutiveGraphModule } from "@/lib/platform/intelligence/infrastructure/modules/executive-graph";
import { createExecutiveDecisionModule } from "@/lib/platform/intelligence/infrastructure/modules/executive-decision";
import { createPredictiveIntelligenceModule } from "@/lib/platform/intelligence/infrastructure/modules/predictive";
import { createBoardGovernanceModule } from "@/lib/platform/intelligence/infrastructure/modules/board-governance";
import type {
  CreateExecutiveDecisionOptions,
  ExecutiveDecisionStack,
} from "@/lib/platform/intelligence/executive-decision";
import type {
  CreateExecutiveGraphAnalyzerOptions,
  ExecutiveGraphAnalyzerStack,
} from "@/lib/platform/intelligence/executive-graph";
import type {
  CreatePredictiveIntelligenceOptions,
  PredictiveIntelligenceStack,
} from "@/lib/platform/intelligence/predictive-intelligence";
import type {
  CreateBoardGovernanceOptions,
  BoardGovernanceStack,
} from "@/lib/platform/intelligence/board-governance";
import type {
  CreateOrganizationDnaOptions,
  OrganizationDnaStack,
} from "@/lib/platform/intelligence/organization-dna";
import type {
  CreateOiosOptions,
  OiosStack,
} from "@/lib/platform/oios";
import type {
  CreateHumanCapitalOptions,
  HumanCapitalStack,
} from "@/lib/platform/intelligence/human-capital";
import type {
  CreateRevenueOptions,
  RevenueStack,
} from "@/lib/platform/intelligence/revenue";
import type {
  CreateFundingOptions,
  FundingStack,
} from "@/lib/platform/intelligence/funding";
import type {
  CreateOpportunityOptions,
  OpportunityStack,
} from "@/lib/platform/intelligence/opportunity";
import type {
  CreateImprovementOptions,
  ImprovementStack,
} from "@/lib/platform/intelligence/organizational-improvement";
import type {
  CreateBusinessModelOptions,
  BusinessModelStack,
} from "@/lib/platform/intelligence/business-model";
import type {
  CreateOperationsOptions,
  OperationsStack,
} from "@/lib/platform/intelligence/operations";
import type {
  CreateCustomerOptions,
  CustomerStack,
} from "@/lib/platform/intelligence/customer";
import type {
  CreateKnowledgeOptions,
  KnowledgeStack,
} from "@/lib/platform/intelligence/knowledge";
import type {
  CreateDocumentOptions,
  DocumentStack,
} from "@/lib/platform/intelligence/document";
import type {
  CreateLegalComplianceRiskOptions,
  LegalComplianceRiskStack,
} from "@/lib/platform/intelligence/legal-compliance-risk";

export interface CreateDefaultModulesOptions {
  graphAnalyzerOptions?: CreateExecutiveGraphAnalyzerOptions;
  graphAnalyzer?: ExecutiveGraphAnalyzerStack;
  decisionOptions?: CreateExecutiveDecisionOptions;
  decision?: ExecutiveDecisionStack;
  predictiveOptions?: CreatePredictiveIntelligenceOptions;
  predictive?: PredictiveIntelligenceStack;
  boardGovernanceOptions?: CreateBoardGovernanceOptions;
  boardGovernance?: BoardGovernanceStack;
  organizationDnaOptions?: CreateOrganizationDnaOptions;
  organizationDna?: OrganizationDnaStack;
  oiosOptions?: CreateOiosOptions;
  oios?: OiosStack;
  humanCapitalOptions?: CreateHumanCapitalOptions;
  humanCapital?: HumanCapitalStack;
  revenueOptions?: CreateRevenueOptions;
  revenue?: RevenueStack;
  fundingOptions?: CreateFundingOptions;
  funding?: FundingStack;
  opportunityOptions?: CreateOpportunityOptions;
  opportunity?: OpportunityStack;
  organizationalImprovementOptions?: CreateImprovementOptions;
  organizationalImprovement?: ImprovementStack;
  businessModelOptions?: CreateBusinessModelOptions;
  businessModel?: BusinessModelStack;
  operationsOptions?: CreateOperationsOptions;
  operations?: OperationsStack;
  customerOptions?: CreateCustomerOptions;
  customer?: CustomerStack;
  knowledgeOptions?: CreateKnowledgeOptions;
  knowledge?: KnowledgeStack;
  documentOptions?: CreateDocumentOptions;
  document?: DocumentStack;
  legalComplianceRiskOptions?: CreateLegalComplianceRiskOptions;
  legalComplianceRisk?: LegalComplianceRiskStack;
}

/** Create the default set of integrated intelligence modules. */
export function createDefaultIntelligenceModules(
  options: CreateDefaultModulesOptions = {}
): IntelligenceModule[] {
  return [
    createOrganizationDnaModule(options.organizationDnaOptions, options.organizationDna),
    createOiosCoreModule(options.oiosOptions, options.oios),
    createOrganizationHealthModule(),
    createFinancialIntelligenceModule(),
    createFounderIntelligenceModule(),
    createExecutiveIntelligenceModule(),
    createExecutiveGraphModule(options.graphAnalyzerOptions, options.graphAnalyzer),
    createExecutiveDecisionModule(options.decisionOptions, options.decision),
    createPredictiveIntelligenceModule(options.predictiveOptions, options.predictive),
    createBoardGovernanceModule(options.boardGovernanceOptions, options.boardGovernance),
    createHumanCapitalModule(options.humanCapitalOptions, options.humanCapital),
    createRevenueModule(options.revenueOptions, options.revenue),
    createFundingModule(options.fundingOptions, options.funding),
    createOpportunityModule(options.opportunityOptions, options.opportunity),
    createOrganizationalImprovementModule(
      options.organizationalImprovementOptions,
      options.organizationalImprovement
    ),
    createBusinessModelModule(options.businessModelOptions, options.businessModel),
    createOperationsModule(options.operationsOptions, options.operations),
    createCustomerModule(options.customerOptions, options.customer),
    createKnowledgeModule(options.knowledgeOptions, options.knowledge),
    createDocumentModule(options.documentOptions, options.document),
    createLegalComplianceRiskModule(
      options.legalComplianceRiskOptions,
      options.legalComplianceRisk
    ),
  ];
}

/** Default provider that auto-registers all integrated modules. */
export function createDefaultIntelligenceProvider(
  options: CreateDefaultModulesOptions = {}
): IntelligenceProvider {
  return createIntelligenceProvider(
    "default-intelligence-modules",
    createDefaultIntelligenceModules(options)
  );
}
