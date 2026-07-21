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
export { createMarketModule } from "@/lib/platform/intelligence/infrastructure/modules/market";
export { createInnovationModule } from "@/lib/platform/intelligence/infrastructure/modules/innovation";
export { createImpactModule } from "@/lib/platform/intelligence/infrastructure/modules/impact";
export { createEconomicModule } from "@/lib/platform/intelligence/infrastructure/modules/economic";
export { createCompetitiveModule } from "@/lib/platform/intelligence/infrastructure/modules/competitive";
export { createPoliticalModule } from "@/lib/platform/intelligence/infrastructure/modules/political";
export { createEnvironmentalModule } from "@/lib/platform/intelligence/infrastructure/modules/environmental";
export { createStakeholderModule } from "@/lib/platform/intelligence/infrastructure/modules/stakeholder";
export { createReputationModule } from "@/lib/platform/intelligence/infrastructure/modules/reputation";
export { createBehavioralModule } from "@/lib/platform/intelligence/infrastructure/modules/behavioral";
export { createCulturalModule } from "@/lib/platform/intelligence/infrastructure/modules/cultural";
export { createEthicalModule } from "@/lib/platform/intelligence/infrastructure/modules/ethical";
export { createSystemsModule } from "@/lib/platform/intelligence/infrastructure/modules/systems";
export { createResilienceModule } from "@/lib/platform/intelligence/infrastructure/modules/resilience";
export { createEcosystemModule } from "@/lib/platform/intelligence/infrastructure/modules/ecosystem";
export { createInstitutionalMemoryModule } from "@/lib/platform/intelligence/infrastructure/modules/institutional-memory";
export { createCollectiveModule } from "@/lib/platform/intelligence/infrastructure/modules/collective";
export { createWisdomModule } from "@/lib/platform/intelligence/infrastructure/modules/wisdom";
export { createSynthesisModule } from "@/lib/platform/intelligence/infrastructure/modules/synthesis";
export { createBriefingModule } from "@/lib/platform/intelligence/infrastructure/modules/briefing";
export { createExecutiveMemoryModule } from "@/lib/platform/intelligence/infrastructure/modules/executive-memory";
export { createDecisionIntelligenceModule } from "@/lib/platform/intelligence/infrastructure/modules/decision-intelligence";
export { createExecutivePredictiveModule } from "@/lib/platform/intelligence/infrastructure/modules/executive-predictive";
export { createExecutiveAutonomousModule } from "@/lib/platform/intelligence/infrastructure/modules/executive-autonomous";
export { createExecutiveCopilotModule } from "@/lib/platform/intelligence/infrastructure/modules/executive-copilot";
export { createExecutiveCommandCenterModule } from "@/lib/platform/intelligence/infrastructure/modules/executive-command-center";
export { createInitiativeIntelligenceModule } from "@/lib/platform/intelligence/infrastructure/modules/initiative-intelligence";
export { createPortfolioIntelligenceModule } from "@/lib/platform/intelligence/infrastructure/modules/portfolio-intelligence";
export { createDigitalTwinModule } from "@/lib/platform/intelligence/infrastructure/modules/digital-twin";
export { createEcosystemIntelligenceModule } from "@/lib/platform/intelligence/infrastructure/modules/ecosystem-intelligence";

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
import { createMarketModule } from "@/lib/platform/intelligence/infrastructure/modules/market";
import { createInnovationModule } from "@/lib/platform/intelligence/infrastructure/modules/innovation";
import { createImpactModule } from "@/lib/platform/intelligence/infrastructure/modules/impact";
import { createEconomicModule } from "@/lib/platform/intelligence/infrastructure/modules/economic";
import { createCompetitiveModule } from "@/lib/platform/intelligence/infrastructure/modules/competitive";
import { createPoliticalModule } from "@/lib/platform/intelligence/infrastructure/modules/political";
import { createEnvironmentalModule } from "@/lib/platform/intelligence/infrastructure/modules/environmental";
import { createStakeholderModule } from "@/lib/platform/intelligence/infrastructure/modules/stakeholder";
import { createReputationModule } from "@/lib/platform/intelligence/infrastructure/modules/reputation";
import { createBehavioralModule } from "@/lib/platform/intelligence/infrastructure/modules/behavioral";
import { createCulturalModule } from "@/lib/platform/intelligence/infrastructure/modules/cultural";
import { createEthicalModule } from "@/lib/platform/intelligence/infrastructure/modules/ethical";
import { createSystemsModule } from "@/lib/platform/intelligence/infrastructure/modules/systems";
import { createResilienceModule } from "@/lib/platform/intelligence/infrastructure/modules/resilience";
import { createEcosystemModule } from "@/lib/platform/intelligence/infrastructure/modules/ecosystem";
import { createInstitutionalMemoryModule } from "@/lib/platform/intelligence/infrastructure/modules/institutional-memory";
import { createCollectiveModule } from "@/lib/platform/intelligence/infrastructure/modules/collective";
import { createWisdomModule } from "@/lib/platform/intelligence/infrastructure/modules/wisdom";
import { createSynthesisModule } from "@/lib/platform/intelligence/infrastructure/modules/synthesis";
import { createBriefingModule } from "@/lib/platform/intelligence/infrastructure/modules/briefing";
import { createExecutiveMemoryModule } from "@/lib/platform/intelligence/infrastructure/modules/executive-memory";
import { createDecisionIntelligenceModule } from "@/lib/platform/intelligence/infrastructure/modules/decision-intelligence";
import { createExecutivePredictiveModule } from "@/lib/platform/intelligence/infrastructure/modules/executive-predictive";
import { createExecutiveAutonomousModule } from "@/lib/platform/intelligence/infrastructure/modules/executive-autonomous";
import { createExecutiveCopilotModule } from "@/lib/platform/intelligence/infrastructure/modules/executive-copilot";
import { createExecutiveCommandCenterModule } from "@/lib/platform/intelligence/infrastructure/modules/executive-command-center";
import { createInitiativeIntelligenceModule } from "@/lib/platform/intelligence/infrastructure/modules/initiative-intelligence";
import { createPortfolioIntelligenceModule } from "@/lib/platform/intelligence/infrastructure/modules/portfolio-intelligence";
import { createDigitalTwinModule } from "@/lib/platform/intelligence/infrastructure/modules/digital-twin";
import { createEcosystemIntelligenceModule } from "@/lib/platform/intelligence/infrastructure/modules/ecosystem-intelligence";
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
import type {
  CreateMarketOptions,
  MarketStack,
} from "@/lib/platform/intelligence/market";
import type {
  CreateInnovationOptions,
  InnovationStack,
} from "@/lib/platform/intelligence/innovation";
import type {
  CreateImpactOptions,
  ImpactStack,
} from "@/lib/platform/intelligence/impact";
import type {
  CreateEconomicOptions,
  EconomicStack,
} from "@/lib/platform/intelligence/economic";
import type {
  CreateCompetitiveOptions,
  CompetitiveStack,
} from "@/lib/platform/intelligence/competitive";
import type {
  CreatePoliticalOptions,
  PoliticalStack,
} from "@/lib/platform/intelligence/political";
import type {
  CreateEnvironmentalOptions,
  EnvironmentalStack,
} from "@/lib/platform/intelligence/environmental";
import type {
  CreateStakeholderOptions,
  StakeholderStack,
} from "@/lib/platform/intelligence/stakeholder";
import type {
  CreateReputationOptions,
  ReputationStack,
} from "@/lib/platform/intelligence/reputation";
import type {
  CreateBehavioralOptions,
  BehavioralStack,
} from "@/lib/platform/intelligence/behavioral";
import type {
  CreateCulturalOptions,
  CulturalStack,
} from "@/lib/platform/intelligence/cultural";
import type {
  CreateEthicalOptions,
  EthicalStack,
} from "@/lib/platform/intelligence/ethical";
import type {
  CreateSystemsOptions,
  SystemsStack,
} from "@/lib/platform/intelligence/systems";
import type {
  CreateResilienceOptions,
  ResilienceStack,
} from "@/lib/platform/intelligence/resilience";
import type {
  CreateEcosystemOptions,
  EcosystemStack,
} from "@/lib/platform/intelligence/ecosystem";
import type {
  CreateInstitutionalMemoryOptions,
  InstitutionalMemoryStack,
} from "@/lib/platform/intelligence/institutional-memory";
import type {
  CreateCollectiveOptions,
  CollectiveStack,
} from "@/lib/platform/intelligence/collective";
import type {
  CreateWisdomOptions,
  WisdomStack,
} from "@/lib/platform/intelligence/wisdom";
import type {
  CreateSynthesisOptions,
  SynthesisStack,
} from "@/lib/platform/intelligence/synthesis";
import type {
  CreateBriefingOptions,
  BriefingStack,
} from "@/lib/platform/intelligence/briefing";
import type {
  CreateExecutiveMemoryOptions,
  ExecutiveMemoryStack,
} from "@/lib/platform/intelligence/executive-memory";
import type {
  CreateDecisionIntelligenceOptions,
  DecisionIntelligenceStack,
} from "@/lib/platform/intelligence/decision-intelligence";
import type {
  CreateExecutivePredictiveOptions,
  ExecutivePredictiveStack,
} from "@/lib/platform/intelligence/executive-predictive";
import type {
  CreateExecutiveAutonomousOptions,
  ExecutiveAutonomousStack,
} from "@/lib/platform/intelligence/executive-autonomous";
import type {
  CreateExecutiveCopilotOptions,
  ExecutiveCopilotStack,
} from "@/lib/platform/intelligence/executive-copilot";
import type {
  CreateExecutiveCommandCenterOptions,
  ExecutiveCommandCenterStack,
} from "@/lib/platform/intelligence/executive-command-center";
import type {
  CreateInitiativeIntelligenceOptions,
  InitiativeIntelligenceStack,
} from "@/lib/platform/intelligence/initiative-intelligence";
import type {
  CreatePortfolioIntelligenceOptions,
  PortfolioIntelligenceStack,
} from "@/lib/platform/intelligence/portfolio-intelligence";
import type {
  CreateDigitalTwinOptions,
  DigitalTwinStack,
} from "@/lib/platform/intelligence/digital-twin";
import type {
  CreateEcosystemFederationOptions,
  EcosystemFederationStack,
} from "@/lib/platform/intelligence/ecosystem-intelligence";

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
  marketOptions?: CreateMarketOptions;
  market?: MarketStack;
  innovationOptions?: CreateInnovationOptions;
  innovation?: InnovationStack;
  impactOptions?: CreateImpactOptions;
  impact?: ImpactStack;
  economicOptions?: CreateEconomicOptions;
  economic?: EconomicStack;
  competitiveOptions?: CreateCompetitiveOptions;
  competitive?: CompetitiveStack;
  politicalOptions?: CreatePoliticalOptions;
  political?: PoliticalStack;
  environmentalOptions?: CreateEnvironmentalOptions;
  environmental?: EnvironmentalStack;
  stakeholderOptions?: CreateStakeholderOptions;
  stakeholder?: StakeholderStack;
  reputationOptions?: CreateReputationOptions;
  reputation?: ReputationStack;
  behavioralOptions?: CreateBehavioralOptions;
  behavioral?: BehavioralStack;
  culturalOptions?: CreateCulturalOptions;
  cultural?: CulturalStack;
  ethicalOptions?: CreateEthicalOptions;
  ethical?: EthicalStack;
  systemsOptions?: CreateSystemsOptions;
  systems?: SystemsStack;
  resilienceOptions?: CreateResilienceOptions;
  resilience?: ResilienceStack;
  ecosystemOptions?: CreateEcosystemOptions;
  ecosystem?: EcosystemStack;
  institutionalMemoryOptions?: CreateInstitutionalMemoryOptions;
  institutionalMemory?: InstitutionalMemoryStack;
  collectiveOptions?: CreateCollectiveOptions;
  collective?: CollectiveStack;
  wisdomOptions?: CreateWisdomOptions;
  wisdom?: WisdomStack;
  synthesisOptions?: CreateSynthesisOptions;
  synthesis?: SynthesisStack;
  briefingOptions?: CreateBriefingOptions;
  briefing?: BriefingStack;
  executiveMemoryOptions?: CreateExecutiveMemoryOptions;
  executiveMemory?: ExecutiveMemoryStack;
  decisionIntelligenceOptions?: CreateDecisionIntelligenceOptions;
  decisionIntelligence?: DecisionIntelligenceStack;
  executivePredictiveOptions?: CreateExecutivePredictiveOptions;
  executivePredictive?: ExecutivePredictiveStack;
  executiveAutonomousOptions?: CreateExecutiveAutonomousOptions;
  executiveAutonomous?: ExecutiveAutonomousStack;
  executiveCopilotOptions?: CreateExecutiveCopilotOptions;
  executiveCopilot?: ExecutiveCopilotStack;
  executiveCommandCenterOptions?: CreateExecutiveCommandCenterOptions;
  executiveCommandCenter?: ExecutiveCommandCenterStack;
  initiativeIntelligenceOptions?: CreateInitiativeIntelligenceOptions;
  initiativeIntelligence?: InitiativeIntelligenceStack;
  portfolioIntelligenceOptions?: CreatePortfolioIntelligenceOptions;
  portfolioIntelligence?: PortfolioIntelligenceStack;
  digitalTwinOptions?: CreateDigitalTwinOptions;
  digitalTwin?: DigitalTwinStack;
  ecosystemIntelligenceOptions?: CreateEcosystemFederationOptions;
  ecosystemIntelligence?: EcosystemFederationStack;
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
    createMarketModule(options.marketOptions, options.market),
    createInnovationModule(options.innovationOptions, options.innovation),
    createImpactModule(options.impactOptions, options.impact),
    createEconomicModule(options.economicOptions, options.economic),
    createCompetitiveModule(options.competitiveOptions, options.competitive),
    createPoliticalModule(options.politicalOptions, options.political),
    createEnvironmentalModule(options.environmentalOptions, options.environmental),
    createStakeholderModule(options.stakeholderOptions, options.stakeholder),
    createReputationModule(options.reputationOptions, options.reputation),
    createBehavioralModule(options.behavioralOptions, options.behavioral),
    createCulturalModule(options.culturalOptions, options.cultural),
    createEthicalModule(options.ethicalOptions, options.ethical),
    createSystemsModule(options.systemsOptions, options.systems),
    createResilienceModule(options.resilienceOptions, options.resilience),
    createEcosystemModule(options.ecosystemOptions, options.ecosystem),
    createInstitutionalMemoryModule(options.institutionalMemoryOptions, options.institutionalMemory),
    createCollectiveModule(options.collectiveOptions, options.collective),
    createWisdomModule(options.wisdomOptions, options.wisdom),
    createSynthesisModule(options.synthesisOptions, options.synthesis),
    createBriefingModule(options.briefingOptions, options.briefing),
    createExecutiveMemoryModule(options.executiveMemoryOptions, options.executiveMemory),
    createDecisionIntelligenceModule(
      options.decisionIntelligenceOptions,
      options.decisionIntelligence
    ),
    createExecutivePredictiveModule(
      options.executivePredictiveOptions,
      options.executivePredictive
    ),
    createExecutiveAutonomousModule(
      options.executiveAutonomousOptions,
      options.executiveAutonomous
    ),
    createExecutiveCopilotModule(
      options.executiveCopilotOptions,
      options.executiveCopilot
    ),
    createExecutiveCommandCenterModule(
      options.executiveCommandCenterOptions,
      options.executiveCommandCenter
    ),
    createInitiativeIntelligenceModule(
      options.initiativeIntelligenceOptions,
      options.initiativeIntelligence
    ),
    createPortfolioIntelligenceModule(
      options.portfolioIntelligenceOptions,
      options.portfolioIntelligence
    ),
    createDigitalTwinModule(
      options.digitalTwinOptions,
      options.digitalTwin
    ),
    createEcosystemIntelligenceModule(
      options.ecosystemIntelligenceOptions,
      options.ecosystemIntelligence
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
