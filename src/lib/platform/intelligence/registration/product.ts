/**
 * Product stack registration: human capital → … → legal/compliance/risk.
 */

import {
  createHumanCapitalIntelligence,
  type HumanCapitalStack,
} from "@/lib/platform/intelligence/human-capital";
import {
  createRevenueIntelligence,
  type RevenueStack,
} from "@/lib/platform/intelligence/revenue";
import {
  createFundingIntelligence,
  type FundingStack,
} from "@/lib/platform/intelligence/funding";
import {
  createOpportunityIntelligence,
  type OpportunityStack,
} from "@/lib/platform/intelligence/opportunity";
import {
  createOrganizationalImprovementIntelligence,
  type ImprovementStack,
} from "@/lib/platform/intelligence/organizational-improvement";
import {
  createBusinessModelIntelligence,
  type BusinessModelStack,
} from "@/lib/platform/intelligence/business-model";
import {
  createOperationsIntelligence,
  type OperationsStack,
} from "@/lib/platform/intelligence/operations";
import {
  createCustomerIntelligence,
  type CustomerStack,
} from "@/lib/platform/intelligence/customer";
import {
  createKnowledgeIntelligence,
  type KnowledgeStack,
} from "@/lib/platform/intelligence/knowledge";
import {
  createDocumentIntelligence,
  type DocumentStack,
} from "@/lib/platform/intelligence/document";
import {
  createLegalComplianceRiskIntelligence,
  type LegalComplianceRiskStack,
} from "@/lib/platform/intelligence/legal-compliance-risk";
import type {
  CreateIntelligenceServiceOptions,
  DnaOiosWiring,
} from "@/lib/platform/intelligence/registration/options";

export interface ProductStacks {
  humanCapital: HumanCapitalStack;
  revenue: RevenueStack;
  funding: FundingStack;
  opportunity: OpportunityStack;
  organizationalImprovement: ImprovementStack;
  businessModel: BusinessModelStack;
  operations: OperationsStack;
  customer: CustomerStack;
  knowledge: KnowledgeStack;
  document: DocumentStack;
  legalComplianceRisk: LegalComplianceRiskStack;
}

export function registerProductStacks(
  options: CreateIntelligenceServiceOptions,
  wiring: DnaOiosWiring
): ProductStacks {
  const { organizationDna, oios } = wiring;

  const humanCapital =
    options.humanCapital ??
    createHumanCapitalIntelligence({
      ...(options.humanCapitalOptions ?? {}),
      organizationDna:
        options.humanCapitalOptions?.organizationDna ?? organizationDna,
      oios: options.humanCapitalOptions?.oios ?? oios,
      wireOrganizationDna: false,
      wireOios: false,
    });
  const revenue =
    options.revenue ??
    createRevenueIntelligence({
      ...(options.revenueOptions ?? {}),
      organizationDna:
        options.revenueOptions?.organizationDna ?? organizationDna,
      oios: options.revenueOptions?.oios ?? oios,
      wireOrganizationDna: false,
      wireOios: false,
    });
  const funding =
    options.funding ??
    createFundingIntelligence({
      ...(options.fundingOptions ?? {}),
      organizationDna:
        options.fundingOptions?.organizationDna ?? organizationDna,
      oios: options.fundingOptions?.oios ?? oios,
      wireOrganizationDna: false,
      wireOios: false,
    });
  const opportunity =
    options.opportunity ??
    createOpportunityIntelligence({
      ...(options.opportunityOptions ?? {}),
      organizationDna:
        options.opportunityOptions?.organizationDna ?? organizationDna,
      oios: options.opportunityOptions?.oios ?? oios,
      wireOrganizationDna: false,
      wireOios: false,
    });
  const organizationalImprovement =
    options.organizationalImprovement ??
    createOrganizationalImprovementIntelligence({
      ...(options.organizationalImprovementOptions ?? {}),
      organizationDna:
        options.organizationalImprovementOptions?.organizationDna ??
        organizationDna,
      oios: options.organizationalImprovementOptions?.oios ?? oios,
      opportunity:
        options.organizationalImprovementOptions?.opportunity ?? opportunity,
      wireOrganizationDna: false,
      wireOios: false,
      wireOpportunity: false,
    });
  const businessModel =
    options.businessModel ??
    createBusinessModelIntelligence({
      ...(options.businessModelOptions ?? {}),
      organizationDna:
        options.businessModelOptions?.organizationDna ?? organizationDna,
      oios: options.businessModelOptions?.oios ?? oios,
      wireOrganizationDna: false,
      wireOios: false,
    });
  const operations =
    options.operations ??
    createOperationsIntelligence({
      ...(options.operationsOptions ?? {}),
      organizationDna:
        options.operationsOptions?.organizationDna ?? organizationDna,
      oios: options.operationsOptions?.oios ?? oios,
      wireOrganizationDna: false,
      wireOios: false,
    });
  const customer =
    options.customer ??
    createCustomerIntelligence({
      ...(options.customerOptions ?? {}),
      organizationDna:
        options.customerOptions?.organizationDna ?? organizationDna,
      oios: options.customerOptions?.oios ?? oios,
      wireOrganizationDna: false,
      wireOios: false,
    });
  const knowledge =
    options.knowledge ??
    createKnowledgeIntelligence({
      ...(options.knowledgeOptions ?? {}),
      organizationDna:
        options.knowledgeOptions?.organizationDna ?? organizationDna,
      oios: options.knowledgeOptions?.oios ?? oios,
      wireOrganizationDna: false,
      wireOios: false,
    });
  const document =
    options.document ??
    createDocumentIntelligence({
      ...(options.documentOptions ?? {}),
      organizationDna:
        options.documentOptions?.organizationDna ?? organizationDna,
      oios: options.documentOptions?.oios ?? oios,
      wireOrganizationDna: false,
      wireOios: false,
    });
  const legalComplianceRisk =
    options.legalComplianceRisk ??
    createLegalComplianceRiskIntelligence({
      ...(options.legalComplianceRiskOptions ?? {}),
      organizationDna:
        options.legalComplianceRiskOptions?.organizationDna ?? organizationDna,
      oios: options.legalComplianceRiskOptions?.oios ?? oios,
      wireOrganizationDna: false,
      wireOios: false,
    });

  return {
    humanCapital,
    revenue,
    funding,
    opportunity,
    organizationalImprovement,
    businessModel,
    operations,
    customer,
    knowledge,
    document,
    legalComplianceRisk,
  };
}
