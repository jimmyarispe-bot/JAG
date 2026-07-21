/**
 * Intelligence service DI — shared option surface (public API).
 *
 * Split from create-service.ts for maintainability. Behavior unchanged.
 */

import type {
  CreateExecutiveDecisionOptions,
  ExecutiveDecisionStack,
} from "@/lib/platform/intelligence/executive-decision";
import type {
  CreateExecutiveGraphAnalyzerOptions,
  ExecutiveGraphAnalyzerStack,
} from "@/lib/platform/intelligence/executive-graph";
import type {
  CreateIntelligencePlatformOptions,
  IntelligencePlatformStack,
} from "@/lib/platform/intelligence/infrastructure";
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
import type {
  CreateOiosOptions,
  OiosStack,
} from "@/lib/platform/oios";
import type { DecisionResolver } from "@/lib/platform/intelligence/decision";
import type { ExecutiveResolver } from "@/lib/platform/intelligence/domains/executive";
import type { StrategicResolver } from "@/lib/platform/intelligence/domains/strategic";
import type { SupportResolver } from "@/lib/platform/intelligence/domains/support";
import type { SharedIntelligenceContextBuilder } from "@/lib/platform/intelligence/context/builder";
import type { IntelligenceOrchestrator, IntelligenceOrchestratorDependencies } from "@/lib/platform/intelligence/orchestrator";
import type { IntelligenceDomainRegistry } from "@/lib/platform/intelligence/registry";
import type { IntelligenceRouter } from "@/lib/platform/intelligence/router";

/** Optional overrides for {@link createIntelligenceService} (test / advanced DI). */
export interface CreateIntelligenceServiceOptions {
  /**
   * P005: when true, materialise every domain stack (+ platform) immediately.
   * Default false — stacks are created on first property access.
   */
  eagerStacks?: boolean;
  registry?: IntelligenceDomainRegistry;
  router?: IntelligenceRouter;
  orchestrator?: IntelligenceOrchestrator;
  supportResolver?: SupportResolver;
  executiveResolver?: ExecutiveResolver;
  strategicResolver?: StrategicResolver;
  decisionResolver?: DecisionResolver;
  sharedContextBuilder?: SharedIntelligenceContextBuilder;
  orchestratorDependencies?: IntelligenceOrchestratorDependencies;
  executiveGraphAnalyzer?: ExecutiveGraphAnalyzerStack;
  executiveGraphAnalyzerOptions?: CreateExecutiveGraphAnalyzerOptions;
  executiveDecision?: ExecutiveDecisionStack;
  executiveDecisionOptions?: CreateExecutiveDecisionOptions;
  predictiveIntelligence?: PredictiveIntelligenceStack;
  predictiveIntelligenceOptions?: CreatePredictiveIntelligenceOptions;
  boardGovernance?: BoardGovernanceStack;
  boardGovernanceOptions?: CreateBoardGovernanceOptions;
  organizationDna?: OrganizationDnaStack;
  organizationDnaOptions?: CreateOrganizationDnaOptions;
  oios?: OiosStack;
  oiosOptions?: CreateOiosOptions;
  humanCapital?: HumanCapitalStack;
  humanCapitalOptions?: CreateHumanCapitalOptions;
  revenue?: RevenueStack;
  revenueOptions?: CreateRevenueOptions;
  funding?: FundingStack;
  fundingOptions?: CreateFundingOptions;
  opportunity?: OpportunityStack;
  opportunityOptions?: CreateOpportunityOptions;
  organizationalImprovement?: ImprovementStack;
  organizationalImprovementOptions?: CreateImprovementOptions;
  businessModel?: BusinessModelStack;
  businessModelOptions?: CreateBusinessModelOptions;
  operations?: OperationsStack;
  operationsOptions?: CreateOperationsOptions;
  customer?: CustomerStack;
  customerOptions?: CreateCustomerOptions;
  knowledge?: KnowledgeStack;
  knowledgeOptions?: CreateKnowledgeOptions;
  document?: DocumentStack;
  documentOptions?: CreateDocumentOptions;
  legalComplianceRisk?: LegalComplianceRiskStack;
  legalComplianceRiskOptions?: CreateLegalComplianceRiskOptions;
  market?: MarketStack;
  marketOptions?: CreateMarketOptions;
  innovation?: InnovationStack;
  innovationOptions?: CreateInnovationOptions;
  impact?: ImpactStack;
  impactOptions?: CreateImpactOptions;
  economic?: EconomicStack;
  economicOptions?: CreateEconomicOptions;
  competitive?: CompetitiveStack;
  competitiveOptions?: CreateCompetitiveOptions;
  political?: PoliticalStack;
  politicalOptions?: CreatePoliticalOptions;
  environmental?: EnvironmentalStack;
  environmentalOptions?: CreateEnvironmentalOptions;
  stakeholder?: StakeholderStack;
  stakeholderOptions?: CreateStakeholderOptions;
  reputation?: ReputationStack;
  reputationOptions?: CreateReputationOptions;
  behavioral?: BehavioralStack;
  behavioralOptions?: CreateBehavioralOptions;
  cultural?: CulturalStack;
  culturalOptions?: CreateCulturalOptions;
  ethical?: EthicalStack;
  ethicalOptions?: CreateEthicalOptions;
  systems?: SystemsStack;
  systemsOptions?: CreateSystemsOptions;
  resilience?: ResilienceStack;
  resilienceOptions?: CreateResilienceOptions;
  ecosystem?: EcosystemStack;
  ecosystemOptions?: CreateEcosystemOptions;
  institutionalMemory?: InstitutionalMemoryStack;
  institutionalMemoryOptions?: CreateInstitutionalMemoryOptions;
  collective?: CollectiveStack;
  collectiveOptions?: CreateCollectiveOptions;
  wisdom?: WisdomStack;
  wisdomOptions?: CreateWisdomOptions;
  synthesis?: SynthesisStack;
  synthesisOptions?: CreateSynthesisOptions;
  briefing?: BriefingStack;
  briefingOptions?: CreateBriefingOptions;
  executiveMemory?: ExecutiveMemoryStack;
  executiveMemoryOptions?: CreateExecutiveMemoryOptions;
  decisionIntelligence?: DecisionIntelligenceStack;
  decisionIntelligenceOptions?: CreateDecisionIntelligenceOptions;
  executivePredictive?: ExecutivePredictiveStack;
  executivePredictiveOptions?: CreateExecutivePredictiveOptions;
  executiveAutonomous?: ExecutiveAutonomousStack;
  executiveAutonomousOptions?: CreateExecutiveAutonomousOptions;
  executiveCopilot?: ExecutiveCopilotStack;
  executiveCopilotOptions?: CreateExecutiveCopilotOptions;
  executiveCommandCenter?: ExecutiveCommandCenterStack;
  executiveCommandCenterOptions?: CreateExecutiveCommandCenterOptions;
  initiativeIntelligence?: InitiativeIntelligenceStack;
  initiativeIntelligenceOptions?: CreateInitiativeIntelligenceOptions;
  portfolioIntelligence?: PortfolioIntelligenceStack;
  portfolioIntelligenceOptions?: CreatePortfolioIntelligenceOptions;
  digitalTwin?: DigitalTwinStack;
  digitalTwinOptions?: CreateDigitalTwinOptions;
  ecosystemIntelligence?: EcosystemFederationStack;
  ecosystemIntelligenceOptions?: CreateEcosystemFederationOptions;
  intelligencePlatform?: IntelligencePlatformStack;
  intelligencePlatformOptions?: CreateIntelligencePlatformOptions;
}

/** Shared DNA/OIOS wiring inputs for product+ domain factories. */
export interface DnaOiosWiring {
  organizationDna: OrganizationDnaStack;
  oios: OiosStack;
}
