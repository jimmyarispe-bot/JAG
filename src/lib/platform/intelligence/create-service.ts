/**
 * JAG Intelligence — service factory.
 *
 * Wires registry, router, orchestrator, shared context, and Intelligence domains
 * with dependency injection. Uses only existing platform APIs.
 */

import { IntelligenceConfidenceService } from "@/lib/platform/intelligence/confidence";
import type { IntelligenceDomainModule } from "@/lib/platform/intelligence/contracts";
import { IntelligenceContextService } from "@/lib/platform/intelligence/context";
import {
  createSharedIntelligenceContextBuilder,
  type SharedIntelligenceContextBuilder,
} from "@/lib/platform/intelligence/context/builder";
import {
  createDecisionIntelligenceDomain,
  DECISION_INTELLIGENCE_VERSION,
  type DecisionKpiSignal,
  type DecisionRequest,
  type DecisionResolver,
} from "@/lib/platform/intelligence/decision";
import {
  createExecutiveDecisionIntelligence,
  type CreateExecutiveDecisionOptions,
  type ExecutiveDecisionStack,
} from "@/lib/platform/intelligence/executive-decision";
import {
  createExecutiveGraphAnalyzer,
  type CreateExecutiveGraphAnalyzerOptions,
  type ExecutiveGraphAnalyzerStack,
} from "@/lib/platform/intelligence/executive-graph";
import {
  createIntelligencePlatform,
  type CreateIntelligencePlatformOptions,
  type IntelligencePlatformStack,
} from "@/lib/platform/intelligence/infrastructure";
import {
  createPredictiveIntelligence,
  type CreatePredictiveIntelligenceOptions,
  type PredictiveIntelligenceStack,
} from "@/lib/platform/intelligence/predictive-intelligence";
import {
  createBoardGovernanceIntelligence,
  type CreateBoardGovernanceOptions,
  type BoardGovernanceStack,
} from "@/lib/platform/intelligence/board-governance";
import {
  createOrganizationDnaIntelligence,
  type CreateOrganizationDnaOptions,
  type OrganizationDnaStack,
} from "@/lib/platform/intelligence/organization-dna";
import {
  createHumanCapitalIntelligence,
  type CreateHumanCapitalOptions,
  type HumanCapitalStack,
} from "@/lib/platform/intelligence/human-capital";
import {
  createRevenueIntelligence,
  type CreateRevenueOptions,
  type RevenueStack,
} from "@/lib/platform/intelligence/revenue";
import {
  createFundingIntelligence,
  type CreateFundingOptions,
  type FundingStack,
} from "@/lib/platform/intelligence/funding";
import {
  createOpportunityIntelligence,
  type CreateOpportunityOptions,
  type OpportunityStack,
} from "@/lib/platform/intelligence/opportunity";
import {
  createOrganizationalImprovementIntelligence,
  type CreateImprovementOptions,
  type ImprovementStack,
} from "@/lib/platform/intelligence/organizational-improvement";
import {
  createBusinessModelIntelligence,
  type CreateBusinessModelOptions,
  type BusinessModelStack,
} from "@/lib/platform/intelligence/business-model";
import {
  createOperationsIntelligence,
  type CreateOperationsOptions,
  type OperationsStack,
} from "@/lib/platform/intelligence/operations";
import {
  createCustomerIntelligence,
  type CreateCustomerOptions,
  type CustomerStack,
} from "@/lib/platform/intelligence/customer";
import {
  createKnowledgeIntelligence,
  type CreateKnowledgeOptions,
  type KnowledgeStack,
} from "@/lib/platform/intelligence/knowledge";
import {
  createDocumentIntelligence,
  type CreateDocumentOptions,
  type DocumentStack,
} from "@/lib/platform/intelligence/document";
import {
  createLegalComplianceRiskIntelligence,
  type CreateLegalComplianceRiskOptions,
  type LegalComplianceRiskStack,
} from "@/lib/platform/intelligence/legal-compliance-risk";
import {
  createMarketIntelligence,
  type CreateMarketOptions,
  type MarketStack,
} from "@/lib/platform/intelligence/market";
import {
  createInnovationIntelligence,
  type CreateInnovationOptions,
  type InnovationStack,
} from "@/lib/platform/intelligence/innovation";
import {
  createImpactIntelligence,
  type CreateImpactOptions,
  type ImpactStack,
} from "@/lib/platform/intelligence/impact";
import {
  createEconomicIntelligence,
  type CreateEconomicOptions,
  type EconomicStack,
} from "@/lib/platform/intelligence/economic";
import {
  createCompetitiveIntelligence,
  type CreateCompetitiveOptions,
  type CompetitiveStack,
} from "@/lib/platform/intelligence/competitive";
import {
  createPoliticalIntelligence,
  type CreatePoliticalOptions,
  type PoliticalStack,
} from "@/lib/platform/intelligence/political";
import {
  createEnvironmentalIntelligence,
  type CreateEnvironmentalOptions,
  type EnvironmentalStack,
} from "@/lib/platform/intelligence/environmental";
import {
  createStakeholderIntelligence,
  type CreateStakeholderOptions,
  type StakeholderStack,
} from "@/lib/platform/intelligence/stakeholder";
import {
  createReputationIntelligence,
  type CreateReputationOptions,
  type ReputationStack,
} from "@/lib/platform/intelligence/reputation";
import {
  createBehavioralIntelligence,
  type CreateBehavioralOptions,
  type BehavioralStack,
} from "@/lib/platform/intelligence/behavioral";
import {
  createCulturalIntelligence,
  type CreateCulturalOptions,
  type CulturalStack,
} from "@/lib/platform/intelligence/cultural";
import {
  createEthicalIntelligence,
  type CreateEthicalOptions,
  type EthicalStack,
} from "@/lib/platform/intelligence/ethical";
import {
  createSystemsIntelligence,
  type CreateSystemsOptions,
  type SystemsStack,
} from "@/lib/platform/intelligence/systems";
import {
  createResilienceIntelligence,
  type CreateResilienceOptions,
  type ResilienceStack,
} from "@/lib/platform/intelligence/resilience";
import {
  createEcosystemIntelligence,
  type CreateEcosystemOptions,
  type EcosystemStack,
} from "@/lib/platform/intelligence/ecosystem";
import {
  createInstitutionalMemoryIntelligence,
  type CreateInstitutionalMemoryOptions,
  type InstitutionalMemoryStack,
} from "@/lib/platform/intelligence/institutional-memory";
import {
  createCollectiveIntelligence,
  type CreateCollectiveOptions,
  type CollectiveStack,
} from "@/lib/platform/intelligence/collective";
import {
  createWisdomIntelligence,
  type CreateWisdomOptions,
  type WisdomStack,
} from "@/lib/platform/intelligence/wisdom";
import {
  createOiosOperatingSystem,
  type CreateOiosOptions,
  type OiosStack,
} from "@/lib/platform/oios";
import {
  createExecutiveIntelligenceDomain,
  EXECUTIVE_INTELLIGENCE_VERSION,
  type ExecutiveRequest,
  type ExecutiveResolver,
} from "@/lib/platform/intelligence/domains/executive";
import {
  createStrategicIntelligenceDomain,
  STRATEGIC_INTELLIGENCE_VERSION,
  type StrategicFindingInput,
  type StrategicRequest,
  type StrategicResolver,
} from "@/lib/platform/intelligence/domains/strategic";
import {
  createSupportIntelligenceDomain,
  SUPPORT_INTELLIGENCE_VERSION,
  type SupportRequest,
  type SupportResolver,
} from "@/lib/platform/intelligence/domains/support";
import { IntelligenceEventService } from "@/lib/platform/intelligence/events";
import { IntelligenceExplainService } from "@/lib/platform/intelligence/explain";
import { IntelligenceKnowledgeService } from "@/lib/platform/intelligence/knowledge/foundation";
import { IntelligenceLearningService } from "@/lib/platform/intelligence/learning";
import { IntelligenceMemoryService } from "@/lib/platform/intelligence/memory";
import {
  IntelligenceOrchestrator,
  type IntelligenceOrchestratorDependencies,
  type IntelligenceResult,
} from "@/lib/platform/intelligence/orchestrator";
import { IntelligencePlannerService } from "@/lib/platform/intelligence/planner";
import { IntelligenceReasoningService } from "@/lib/platform/intelligence/reasoning";
import {
  createIntelligenceDomainRegistry,
  type IntelligenceDomainRegistry,
} from "@/lib/platform/intelligence/registry";
import {
  createIntelligenceRouter,
  type IntelligenceRouter,
} from "@/lib/platform/intelligence/router";
import {
  IntelligenceService,
  type IntelligenceServiceDependencies,
} from "@/lib/platform/intelligence/service";
import type { IntelligenceRunRequest } from "@/lib/platform/intelligence/types";

/** Optional overrides for {@link createIntelligenceService} (test / advanced DI). */
export interface CreateIntelligenceServiceOptions {
  registry?: IntelligenceDomainRegistry;
  router?: IntelligenceRouter;
  orchestrator?: IntelligenceOrchestrator;
  supportResolver?: SupportResolver;
  executiveResolver?: ExecutiveResolver;
  strategicResolver?: StrategicResolver;
  decisionResolver?: DecisionResolver;
  sharedContextBuilder?: SharedIntelligenceContextBuilder;
  orchestratorDependencies?: IntelligenceOrchestratorDependencies;
  /** Optional Executive Graph Analyzer stack (Sprint 025). */
  executiveGraphAnalyzer?: ExecutiveGraphAnalyzerStack;
  executiveGraphAnalyzerOptions?: CreateExecutiveGraphAnalyzerOptions;
  /** Optional Executive Decision Intelligence stack (Sprint 026). */
  executiveDecision?: ExecutiveDecisionStack;
  executiveDecisionOptions?: CreateExecutiveDecisionOptions;
  /** Optional Predictive Intelligence stack (Sprint 028). */
  predictiveIntelligence?: PredictiveIntelligenceStack;
  predictiveIntelligenceOptions?: CreatePredictiveIntelligenceOptions;
  /** Optional Board & Governance Intelligence stack (Sprint 029). */
  boardGovernance?: BoardGovernanceStack;
  boardGovernanceOptions?: CreateBoardGovernanceOptions;
  /** Optional Organizational DNA & Company Builder stack (Sprint 030). */
  organizationDna?: OrganizationDnaStack;
  organizationDnaOptions?: CreateOrganizationDnaOptions;
  /** Optional JAG OIOS Core stack (Sprint 031). */
  oios?: OiosStack;
  oiosOptions?: CreateOiosOptions;
  /** Optional Human Capital Intelligence stack (Sprint 032). */
  humanCapital?: HumanCapitalStack;
  humanCapitalOptions?: CreateHumanCapitalOptions;
  /** Optional Revenue Intelligence stack (Sprint 033). */
  revenue?: RevenueStack;
  revenueOptions?: CreateRevenueOptions;
  /** Optional Funding Intelligence stack (Sprint 034). */
  funding?: FundingStack;
  fundingOptions?: CreateFundingOptions;
  /** Optional Opportunity Intelligence stack (Sprint 035). */
  opportunity?: OpportunityStack;
  opportunityOptions?: CreateOpportunityOptions;
  /** Optional Organizational Improvement Engine stack (Sprint 036). */
  organizationalImprovement?: ImprovementStack;
  organizationalImprovementOptions?: CreateImprovementOptions;
  /** Optional Business Model Intelligence stack (Sprint 037). */
  businessModel?: BusinessModelStack;
  businessModelOptions?: CreateBusinessModelOptions;
  /** Optional Operations Intelligence stack (Sprint 038). */
  operations?: OperationsStack;
  operationsOptions?: CreateOperationsOptions;
  /** Optional Customer Intelligence stack (Sprint 039). */
  customer?: CustomerStack;
  customerOptions?: CreateCustomerOptions;
  /** Optional Knowledge Intelligence stack (Sprint 040). */
  knowledge?: KnowledgeStack;
  knowledgeOptions?: CreateKnowledgeOptions;
  /** Optional Document Intelligence stack (Sprint 041). */
  document?: DocumentStack;
  documentOptions?: CreateDocumentOptions;
  /** Optional Legal, Compliance & Risk Intelligence stack (Sprint 042). */
  legalComplianceRisk?: LegalComplianceRiskStack;
  legalComplianceRiskOptions?: CreateLegalComplianceRiskOptions;
  /** Optional Market Intelligence stack (Sprint 043). */
  market?: MarketStack;
  marketOptions?: CreateMarketOptions;
  /** Optional Innovation Intelligence stack (Sprint 044). */
  innovation?: InnovationStack;
  innovationOptions?: CreateInnovationOptions;
  /** Optional Impact Intelligence stack (Sprint 045). */
  impact?: ImpactStack;
  impactOptions?: CreateImpactOptions;
  /** Optional Economic Intelligence stack (Sprint 046). */
  economic?: EconomicStack;
  economicOptions?: CreateEconomicOptions;
  /** Optional Competitive Intelligence stack (Sprint 047). */
  competitive?: CompetitiveStack;
  competitiveOptions?: CreateCompetitiveOptions;
  /** Optional Political Intelligence stack (Sprint 048). */
  political?: PoliticalStack;
  politicalOptions?: CreatePoliticalOptions;
  /** Optional Environmental Intelligence stack (Sprint 049). */
  environmental?: EnvironmentalStack;
  environmentalOptions?: CreateEnvironmentalOptions;
  /** Optional Stakeholder Intelligence stack (Sprint 050). */
  stakeholder?: StakeholderStack;
  stakeholderOptions?: CreateStakeholderOptions;
  /** Optional Reputation Intelligence stack (Sprint 051). */
  reputation?: ReputationStack;
  reputationOptions?: CreateReputationOptions;
  /** Optional Behavioral Intelligence stack (Sprint 052). */
  behavioral?: BehavioralStack;
  behavioralOptions?: CreateBehavioralOptions;
  /** Optional Cultural Intelligence stack (Sprint 053). */
  cultural?: CulturalStack;
  culturalOptions?: CreateCulturalOptions;
  /** Optional Ethical Intelligence stack (Sprint 054). */
  ethical?: EthicalStack;
  ethicalOptions?: CreateEthicalOptions;
  /** Optional Systems Intelligence stack (Sprint 055). */
  systems?: SystemsStack;
  systemsOptions?: CreateSystemsOptions;
  /** Optional Resilience Intelligence stack (Sprint 056). */
  resilience?: ResilienceStack;
  resilienceOptions?: CreateResilienceOptions;
  /** Optional Ecosystem Intelligence stack (Sprint 057). */
  ecosystem?: EcosystemStack;
  ecosystemOptions?: CreateEcosystemOptions;
  /** Optional Institutional Memory Intelligence stack (Sprint 058). */
  institutionalMemory?: InstitutionalMemoryStack;
  institutionalMemoryOptions?: CreateInstitutionalMemoryOptions;
  /** Optional Collective Intelligence stack (Sprint 059). */
  collective?: CollectiveStack;
  collectiveOptions?: CreateCollectiveOptions;
  /** Optional Wisdom Intelligence stack (Sprint 060). */
  wisdom?: WisdomStack;
  wisdomOptions?: CreateWisdomOptions;
  /** Optional Intelligence Platform Infrastructure stack (Sprint 027). */
  intelligencePlatform?: IntelligencePlatformStack;
  intelligencePlatformOptions?: CreateIntelligencePlatformOptions;
}

/**
 * Build default orchestrator stage services (foundation stubs).
 */
function createDefaultOrchestratorDependencies(): IntelligenceOrchestratorDependencies {
  return {
    context: new IntelligenceContextService(),
    knowledge: new IntelligenceKnowledgeService(),
    memory: new IntelligenceMemoryService(),
    reasoning: new IntelligenceReasoningService(),
    confidence: new IntelligenceConfidenceService(),
    planner: new IntelligencePlannerService(),
    explain: new IntelligenceExplainService(),
    learning: new IntelligenceLearningService(),
    events: new IntelligenceEventService(),
  };
}

/**
 * Map an intelligence run request into a Support domain request.
 * Field projection only — no domain rules.
 */
function toSupportRequest(
  request: IntelligenceRunRequest,
  requestId: string
): SupportRequest {
  const input = request.input ?? {};
  return {
    requestId,
    subject: request.intent,
    description: typeof input.description === "string" ? input.description : undefined,
    affectedModule: typeof input.affectedModule === "string" ? input.affectedModule : undefined,
    workspace: typeof input.workspace === "string" ? input.workspace : undefined,
    metadata: request.metadata,
  };
}

/**
 * Map an intelligence run request into an Executive domain request.
 * Field projection only — no domain rules.
 */
function toExecutiveRequest(
  request: IntelligenceRunRequest,
  requestId: string
): ExecutiveRequest {
  const input = request.input ?? {};
  return {
    requestId,
    subject: request.intent,
    description: typeof input.description === "string" ? input.description : undefined,
    workspace: typeof input.workspace === "string" ? input.workspace : undefined,
    metadata: request.metadata,
  };
}

/**
 * Build shared context for a run and attach it to domain request metadata.
 * Domains consume SharedIntelligenceContext instead of collecting their own data.
 */
async function attachSharedContext(
  builder: SharedIntelligenceContextBuilder,
  request: IntelligenceRunRequest,
  requestId: string
): Promise<{ sharedRequestId: string; metadata: IntelligenceRunRequest["metadata"] }> {
  const input = request.input ?? {};
  const shared = await builder.build({
    organizationId: request.scope.organizationId,
    schoolId: request.scope.schoolId,
    userId: request.actor.userId,
    studentId: typeof input.studentId === "string" ? input.studentId : undefined,
    runId: requestId,
    metadata: request.metadata,
  });

  return {
    sharedRequestId: shared.requestId,
    metadata: {
      ...request.metadata,
      sharedContext: shared,
    },
  };
}

/**
 * Adapt Support Intelligence into an {@link IntelligenceDomainModule}
 * that runs the shared orchestrator pipeline, then domain analysis.
 */
function createSupportDomainModule(
  orchestrator: IntelligenceOrchestrator,
  supportResolver: SupportResolver,
  sharedContextBuilder: SharedIntelligenceContextBuilder
): IntelligenceDomainModule {
  return {
    domainKey: "success",
    name: "Support Intelligence",
    version: SUPPORT_INTELLIGENCE_VERSION,
    async handle(request: IntelligenceRunRequest): Promise<IntelligenceResult> {
      const pipeline = await orchestrator.run(request);
      const requestId = request.runId ?? pipeline.runId;
      const { metadata } = await attachSharedContext(
        sharedContextBuilder,
        request,
        requestId
      );
      const support = supportResolver.analyze({
        ...toSupportRequest(request, requestId),
        metadata,
      });

      return {
        ...pipeline,
        metadata: {
          ...metadata,
          support,
        },
      };
    },
  };
}

/**
 * Adapt Executive Intelligence into an {@link IntelligenceDomainModule}
 * that runs the shared orchestrator pipeline, then domain analysis.
 */
function createExecutiveDomainModule(
  orchestrator: IntelligenceOrchestrator,
  executiveResolver: ExecutiveResolver,
  sharedContextBuilder: SharedIntelligenceContextBuilder
): IntelligenceDomainModule {
  return {
    domainKey: "executive",
    name: "Executive Intelligence",
    version: EXECUTIVE_INTELLIGENCE_VERSION,
    async handle(request: IntelligenceRunRequest): Promise<IntelligenceResult> {
      const pipeline = await orchestrator.run(request);
      const requestId = request.runId ?? pipeline.runId;
      const { metadata } = await attachSharedContext(
        sharedContextBuilder,
        request,
        requestId
      );
      const executive = executiveResolver.analyze({
        ...toExecutiveRequest(request, requestId),
        metadata,
      });

      return {
        ...pipeline,
        metadata: {
          ...metadata,
          executive,
        },
      };
    },
  };
}

/**
 * Narrow unknown input findings into {@link StrategicFindingInput} records.
 */
function parseStrategicFindings(value: unknown): StrategicFindingInput[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const findings: StrategicFindingInput[] = [];
  for (const item of value) {
    if (item === null || typeof item !== "object") {
      continue;
    }
    const record = item as Record<string, unknown>;
    if (
      typeof record.findingId !== "string" ||
      typeof record.title !== "string" ||
      typeof record.summary !== "string"
    ) {
      continue;
    }
    findings.push({
      findingId: record.findingId,
      title: record.title,
      summary: record.summary,
      severity:
        record.severity === "critical" ||
        record.severity === "high" ||
        record.severity === "medium" ||
        record.severity === "low"
          ? record.severity
          : undefined,
      kindHints: Array.isArray(record.kindHints)
        ? (record.kindHints.filter((hint) => typeof hint === "string") as StrategicFindingInput["kindHints"])
        : undefined,
      evidenceRefs: Array.isArray(record.evidenceRefs)
        ? record.evidenceRefs.filter(
            (ref): ref is NonNullable<StrategicFindingInput["evidenceRefs"]>[number] =>
              ref !== null &&
              typeof ref === "object" &&
              typeof (ref as { evidenceId?: unknown }).evidenceId === "string"
          )
        : undefined,
      confidence:
        record.confidence !== null &&
        typeof record.confidence === "object" &&
        typeof (record.confidence as { value?: unknown }).value === "number"
          ? (record.confidence as StrategicFindingInput["confidence"])
          : undefined,
      signals: Array.isArray(record.signals)
        ? record.signals.filter((signal): signal is string => typeof signal === "string")
        : undefined,
      metadata:
        record.metadata !== null && typeof record.metadata === "object"
          ? (record.metadata as StrategicFindingInput["metadata"])
          : undefined,
    });
  }

  return findings.length > 0 ? findings : undefined;
}

/**
 * Map an intelligence run request into a Strategic domain request.
 * Field projection only — no domain rules.
 */
function toStrategicRequest(
  request: IntelligenceRunRequest,
  requestId: string
): StrategicRequest {
  const input = request.input ?? {};

  return {
    requestId,
    subject: request.intent,
    description: typeof input.description === "string" ? input.description : undefined,
    findings: parseStrategicFindings(input.findings),
    organizationId: request.scope.organizationId,
    schoolId: request.scope.schoolId,
    metadata: request.metadata,
  };
}

/**
 * Adapt Strategic Intelligence into an {@link IntelligenceDomainModule}
 * that runs the shared orchestrator pipeline, then domain analysis.
 */
function createStrategicDomainModule(
  orchestrator: IntelligenceOrchestrator,
  strategicResolver: StrategicResolver,
  sharedContextBuilder: SharedIntelligenceContextBuilder
): IntelligenceDomainModule {
  return {
    domainKey: "strategic",
    name: "Strategic Intelligence",
    version: STRATEGIC_INTELLIGENCE_VERSION,
    async handle(request: IntelligenceRunRequest): Promise<IntelligenceResult> {
      const pipeline = await orchestrator.run(request);
      const requestId = request.runId ?? pipeline.runId;
      const { metadata } = await attachSharedContext(
        sharedContextBuilder,
        request,
        requestId
      );
      const strategic = strategicResolver.analyze({
        ...toStrategicRequest(request, requestId),
        metadata,
      });

      return {
        ...pipeline,
        metadata: {
          ...metadata,
          strategic,
        },
      };
    },
  };
}

/**
 * Narrow unknown KPI signals for Decision Intelligence.
 */
function parseDecisionKpis(value: unknown): DecisionKpiSignal[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const kpis: DecisionKpiSignal[] = [];
  for (const item of value) {
    if (item === null || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    if (
      typeof record.key !== "string" ||
      typeof record.label !== "string" ||
      typeof record.value !== "number"
    ) {
      continue;
    }
    kpis.push({
      key: record.key,
      label: record.label,
      value: record.value,
      unit: typeof record.unit === "string" ? record.unit : undefined,
      target: typeof record.target === "number" ? record.target : undefined,
      trend:
        record.trend === "up" || record.trend === "down" || record.trend === "flat"
          ? record.trend
          : undefined,
    });
  }
  return kpis.length > 0 ? kpis : undefined;
}

/**
 * Map an intelligence run request into a Decision domain request.
 * Field projection only — no domain rules.
 */
function toDecisionRequest(
  request: IntelligenceRunRequest,
  requestId: string
): DecisionRequest {
  const input = request.input ?? {};
  const findings = Array.isArray(input.findings)
    ? input.findings.filter((f): f is string => typeof f === "string")
    : undefined;

  return {
    requestId,
    subject: request.intent,
    description: typeof input.description === "string" ? input.description : undefined,
    decisionQuestion:
      typeof input.decisionQuestion === "string" ? input.decisionQuestion : undefined,
    organizationId: request.scope.organizationId,
    schoolId: request.scope.schoolId,
    kpis: parseDecisionKpis(input.kpis),
    findings,
    opportunities: Array.isArray(input.opportunities)
      ? input.opportunities.filter((o): o is string => typeof o === "string")
      : undefined,
    risks: Array.isArray(input.risks)
      ? input.risks.filter((r): r is string => typeof r === "string")
      : undefined,
    metadata: request.metadata,
  };
}

/**
 * Adapt Decision Intelligence into an {@link IntelligenceDomainModule}
 * that runs the shared orchestrator pipeline, then domain analysis.
 */
function createDecisionDomainModule(
  orchestrator: IntelligenceOrchestrator,
  decisionResolver: DecisionResolver,
  sharedContextBuilder: SharedIntelligenceContextBuilder
): IntelligenceDomainModule {
  return {
    domainKey: "decision",
    name: "Decision Intelligence",
    version: DECISION_INTELLIGENCE_VERSION,
    async handle(request: IntelligenceRunRequest): Promise<IntelligenceResult> {
      const pipeline = await orchestrator.run(request);
      const requestId = request.runId ?? pipeline.runId;
      const { metadata } = await attachSharedContext(
        sharedContextBuilder,
        request,
        requestId
      );
      const sharedContext =
        metadata &&
        typeof metadata === "object" &&
        "sharedContext" in metadata
          ? (metadata.sharedContext as DecisionRequest["sharedContext"])
          : undefined;

      const decision = decisionResolver.analyze({
        ...toDecisionRequest(request, requestId),
        sharedContext,
        metadata,
      });

      return {
        ...pipeline,
        metadata: {
          ...metadata,
          decision,
        },
      };
    },
  };
}

/**
 * Create a fully wired {@link IntelligenceService}.
 *
 * Registers Support (`success`), Executive (`executive`), Strategic (`strategic`),
 * and Decision (`decision`) domains. Optionally wires Sprint 025 Executive Graph Analyzer,
 * Sprint 026 Executive Decision Intelligence, Sprint 027 Platform Infrastructure,
 * Sprint 028 Predictive Intelligence, Sprint 029 Board & Governance Intelligence,
 * Sprint 030 Organizational DNA & Company Builder, Sprint 031 OIOS Core,
 * Sprint 032 Human Capital Intelligence, Sprint 033 Revenue Intelligence,
 * Sprint 034 Funding Intelligence, Sprint 035 Opportunity Intelligence,
 * Sprint 036 Organizational Improvement Engine, Sprint 037 Business Model Intelligence,
 * and Sprint 038 Operations Intelligence / Sprint 039 Customer Intelligence /
 * Sprint 040 Knowledge Intelligence.
 */
export function createIntelligenceService(
  options: CreateIntelligenceServiceOptions = {}
): IntelligenceService & {
  executiveGraphAnalyzer: ExecutiveGraphAnalyzerStack;
  executiveDecision: ExecutiveDecisionStack;
  predictiveIntelligence: PredictiveIntelligenceStack;
  boardGovernance: BoardGovernanceStack;
  organizationDna: OrganizationDnaStack;
  oios: OiosStack;
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
  market: MarketStack;
  innovation: InnovationStack;
  impact: ImpactStack;
  economic: EconomicStack;
  competitive: CompetitiveStack;
  political: PoliticalStack;
  environmental: EnvironmentalStack;
  stakeholder: StakeholderStack;
  reputation: ReputationStack;
  behavioral: BehavioralStack;
  cultural: CulturalStack;
  ethical: EthicalStack;
  systems: SystemsStack;
  resilience: ResilienceStack;
  ecosystem: EcosystemStack;
  institutionalMemory: InstitutionalMemoryStack;
  collective: CollectiveStack;
  wisdom: WisdomStack;
  intelligencePlatform: IntelligencePlatformStack;
} {
  const registry = options.registry ?? createIntelligenceDomainRegistry();
  const orchestrator =
    options.orchestrator ??
    new IntelligenceOrchestrator(
      options.orchestratorDependencies ?? createDefaultOrchestratorDependencies()
    );
  const supportResolver = options.supportResolver ?? createSupportIntelligenceDomain();
  const executiveResolver =
    options.executiveResolver ?? createExecutiveIntelligenceDomain();
  const strategicResolver =
    options.strategicResolver ?? createStrategicIntelligenceDomain();
  const decisionResolver =
    options.decisionResolver ?? createDecisionIntelligenceDomain();
  const sharedContextBuilder =
    options.sharedContextBuilder ?? createSharedIntelligenceContextBuilder();
  const executiveGraphAnalyzer =
    options.executiveGraphAnalyzer ??
    createExecutiveGraphAnalyzer(options.executiveGraphAnalyzerOptions ?? {});
  const executiveDecision =
    options.executiveDecision ??
    createExecutiveDecisionIntelligence({
      ...(options.executiveDecisionOptions ?? {}),
      graphAnalyzer:
        options.executiveDecisionOptions?.graphAnalyzer ?? executiveGraphAnalyzer,
    });
  const predictiveIntelligence =
    options.predictiveIntelligence ??
    createPredictiveIntelligence({
      ...(options.predictiveIntelligenceOptions ?? {}),
      graphAnalyzer:
        options.predictiveIntelligenceOptions?.graphAnalyzer ??
        executiveGraphAnalyzer,
      decision:
        options.predictiveIntelligenceOptions?.decision ?? executiveDecision,
      wireGraphAnalyzer: false,
      wireDecision: false,
    });
  const boardGovernance =
    options.boardGovernance ??
    createBoardGovernanceIntelligence({
      ...(options.boardGovernanceOptions ?? {}),
      graphAnalyzer:
        options.boardGovernanceOptions?.graphAnalyzer ?? executiveGraphAnalyzer,
      decision:
        options.boardGovernanceOptions?.decision ?? executiveDecision,
      predictive:
        options.boardGovernanceOptions?.predictive ?? predictiveIntelligence,
      wireGraphAnalyzer: false,
      wireDecision: false,
      wirePredictive: false,
    });
  const organizationDna =
    options.organizationDna ??
    createOrganizationDnaIntelligence({
      ...(options.organizationDnaOptions ?? {}),
      graphAnalyzer:
        options.organizationDnaOptions?.graphAnalyzer ?? executiveGraphAnalyzer,
      decision:
        options.organizationDnaOptions?.decision ?? executiveDecision,
      predictive:
        options.organizationDnaOptions?.predictive ?? predictiveIntelligence,
      boardGovernance:
        options.organizationDnaOptions?.boardGovernance ?? boardGovernance,
      wireGraphAnalyzer: false,
      wireDecision: false,
      wirePredictive: false,
      wireBoardGovernance: false,
    });
  const oios =
    options.oios ??
    createOiosOperatingSystem({
      ...(options.oiosOptions ?? {}),
      organizationDnaStack:
        options.oiosOptions?.organizationDnaStack ?? organizationDna,
      wireOrganizationDna: false,
    });
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
  const market =
    options.market ??
    createMarketIntelligence({
      ...(options.marketOptions ?? {}),
      organizationDna: options.marketOptions?.organizationDna ?? organizationDna,
      oios: options.marketOptions?.oios ?? oios,
      wireOrganizationDna: false,
      wireOios: false,
    });
  const innovation =
    options.innovation ??
    createInnovationIntelligence({
      ...(options.innovationOptions ?? {}),
      organizationDna: options.innovationOptions?.organizationDna ?? organizationDna,
      oios: options.innovationOptions?.oios ?? oios,
      wireOrganizationDna: false,
      wireOios: false,
    });
  const impact =
    options.impact ??
    createImpactIntelligence({
      ...(options.impactOptions ?? {}),
      organizationDna: options.impactOptions?.organizationDna ?? organizationDna,
      oios: options.impactOptions?.oios ?? oios,
      wireOrganizationDna: false,
      wireOios: false,
    });
  const economic =
    options.economic ??
    createEconomicIntelligence({
      ...(options.economicOptions ?? {}),
      organizationDna: options.economicOptions?.organizationDna ?? organizationDna,
      oios: options.economicOptions?.oios ?? oios,
      wireOrganizationDna: false,
      wireOios: false,
    });
  const competitive =
    options.competitive ??
    createCompetitiveIntelligence({
      ...(options.competitiveOptions ?? {}),
      organizationDna: options.competitiveOptions?.organizationDna ?? organizationDna,
      oios: options.competitiveOptions?.oios ?? oios,
      wireOrganizationDna: false,
      wireOios: false,
    });
  const political =
    options.political ??
    createPoliticalIntelligence({
      ...(options.politicalOptions ?? {}),
      organizationDna: options.politicalOptions?.organizationDna ?? organizationDna,
      oios: options.politicalOptions?.oios ?? oios,
      wireOrganizationDna: false,
      wireOios: false,
    });
  const environmental =
    options.environmental ??
    createEnvironmentalIntelligence({
      ...(options.environmentalOptions ?? {}),
      organizationDna: options.environmentalOptions?.organizationDna ?? organizationDna,
      oios: options.environmentalOptions?.oios ?? oios,
      wireOrganizationDna: false,
      wireOios: false,
    });
  const stakeholder =
    options.stakeholder ??
    createStakeholderIntelligence({
      ...(options.stakeholderOptions ?? {}),
      organizationDna: options.stakeholderOptions?.organizationDna ?? organizationDna,
      oios: options.stakeholderOptions?.oios ?? oios,
      wireOrganizationDna: false,
      wireOios: false,
    });
  const reputation =
    options.reputation ??
    createReputationIntelligence({
      ...(options.reputationOptions ?? {}),
      organizationDna: options.reputationOptions?.organizationDna ?? organizationDna,
      oios: options.reputationOptions?.oios ?? oios,
      wireOrganizationDna: false,
      wireOios: false,
    });
  const behavioral =
    options.behavioral ??
    createBehavioralIntelligence({
      ...(options.behavioralOptions ?? {}),
      organizationDna: options.behavioralOptions?.organizationDna ?? organizationDna,
      oios: options.behavioralOptions?.oios ?? oios,
      wireOrganizationDna: false,
      wireOios: false,
    });
  const cultural =
    options.cultural ??
    createCulturalIntelligence({
      ...(options.culturalOptions ?? {}),
      organizationDna: options.culturalOptions?.organizationDna ?? organizationDna,
      oios: options.culturalOptions?.oios ?? oios,
      wireOrganizationDna: false,
      wireOios: false,
    });
  const ethical =
    options.ethical ??
    createEthicalIntelligence({
      ...(options.ethicalOptions ?? {}),
      organizationDna: options.ethicalOptions?.organizationDna ?? organizationDna,
      oios: options.ethicalOptions?.oios ?? oios,
      wireOrganizationDna: false,
      wireOios: false,
    });
  const systems =
    options.systems ??
    createSystemsIntelligence({
      ...(options.systemsOptions ?? {}),
      organizationDna: options.systemsOptions?.organizationDna ?? organizationDna,
      oios: options.systemsOptions?.oios ?? oios,
      wireOrganizationDna: false,
      wireOios: false,
    });
  const resilience =
    options.resilience ??
    createResilienceIntelligence({
      ...(options.resilienceOptions ?? {}),
      organizationDna: options.resilienceOptions?.organizationDna ?? organizationDna,
      oios: options.resilienceOptions?.oios ?? oios,
      wireOrganizationDna: false,
      wireOios: false,
    });
  const ecosystem =
    options.ecosystem ??
    createEcosystemIntelligence({
      ...(options.ecosystemOptions ?? {}),
      organizationDna: options.ecosystemOptions?.organizationDna ?? organizationDna,
      oios: options.ecosystemOptions?.oios ?? oios,
      wireOrganizationDna: false,
      wireOios: false,
    });
  const institutionalMemory =
    options.institutionalMemory ??
    createInstitutionalMemoryIntelligence({
      ...(options.institutionalMemoryOptions ?? {}),
      organizationDna: options.institutionalMemoryOptions?.organizationDna ?? organizationDna,
      oios: options.institutionalMemoryOptions?.oios ?? oios,
      wireOrganizationDna: false,
      wireOios: false,
    });
  const collective =
    options.collective ??
    createCollectiveIntelligence({
      ...(options.collectiveOptions ?? {}),
      organizationDna: options.collectiveOptions?.organizationDna ?? organizationDna,
      oios: options.collectiveOptions?.oios ?? oios,
      wireOrganizationDna: false,
      wireOios: false,
    });
  const wisdom =
    options.wisdom ??
    createWisdomIntelligence({
      ...(options.wisdomOptions ?? {}),
      organizationDna: options.wisdomOptions?.organizationDna ?? organizationDna,
      oios: options.wisdomOptions?.oios ?? oios,
      wireOrganizationDna: false,
      wireOios: false,
    });
  const intelligencePlatform =
    options.intelligencePlatform ??
    createIntelligencePlatform({
      ...(options.intelligencePlatformOptions ?? {}),
      graphAnalyzer:
        options.intelligencePlatformOptions?.graphAnalyzer ?? executiveGraphAnalyzer,
      decision:
        options.intelligencePlatformOptions?.decision ?? executiveDecision,
      predictive:
        options.intelligencePlatformOptions?.predictive ?? predictiveIntelligence,
      boardGovernance:
        options.intelligencePlatformOptions?.boardGovernance ?? boardGovernance,
      organizationDna:
        options.intelligencePlatformOptions?.organizationDna ?? organizationDna,
      oios: options.intelligencePlatformOptions?.oios ?? oios,
      humanCapital:
        options.intelligencePlatformOptions?.humanCapital ?? humanCapital,
      revenue: options.intelligencePlatformOptions?.revenue ?? revenue,
      funding: options.intelligencePlatformOptions?.funding ?? funding,
      opportunity: options.intelligencePlatformOptions?.opportunity ?? opportunity,
      organizationalImprovement:
        options.intelligencePlatformOptions?.organizationalImprovement ??
        organizationalImprovement,
      businessModel:
        options.intelligencePlatformOptions?.businessModel ?? businessModel,
      operations:
        options.intelligencePlatformOptions?.operations ?? operations,
      customer: options.intelligencePlatformOptions?.customer ?? customer,
      knowledge: options.intelligencePlatformOptions?.knowledge ?? knowledge,
      document: options.intelligencePlatformOptions?.document ?? document,
      legalComplianceRisk:
        options.intelligencePlatformOptions?.legalComplianceRisk ?? legalComplianceRisk,
      market: options.intelligencePlatformOptions?.market ?? market,
      innovation: options.intelligencePlatformOptions?.innovation ?? innovation,
      impact: options.intelligencePlatformOptions?.impact ?? impact,
      economic: options.intelligencePlatformOptions?.economic ?? economic,
      competitive: options.intelligencePlatformOptions?.competitive ?? competitive,
      political: options.intelligencePlatformOptions?.political ?? political,
      environmental: options.intelligencePlatformOptions?.environmental ?? environmental,
      stakeholder: options.intelligencePlatformOptions?.stakeholder ?? stakeholder,
      reputation: options.intelligencePlatformOptions?.reputation ?? reputation,
      behavioral: options.intelligencePlatformOptions?.behavioral ?? behavioral,
      cultural: options.intelligencePlatformOptions?.cultural ?? cultural,
      ethical: options.intelligencePlatformOptions?.ethical ?? ethical,
      systems: options.intelligencePlatformOptions?.systems ?? systems,
      resilience: options.intelligencePlatformOptions?.resilience ?? resilience,
      ecosystem: options.intelligencePlatformOptions?.ecosystem ?? ecosystem,
      institutionalMemory:
        options.intelligencePlatformOptions?.institutionalMemory ?? institutionalMemory,
      collective:
        options.intelligencePlatformOptions?.collective ?? collective,
      wisdom: options.intelligencePlatformOptions?.wisdom ?? wisdom,
      wisdomOptions: options.intelligencePlatformOptions?.wisdomOptions,
    });

  if (!registry.get("success")) {
    registry.register(
      createSupportDomainModule(orchestrator, supportResolver, sharedContextBuilder)
    );
  }

  if (!registry.get("executive")) {
    registry.register(
      createExecutiveDomainModule(orchestrator, executiveResolver, sharedContextBuilder)
    );
  }

  if (!registry.get("strategic")) {
    registry.register(
      createStrategicDomainModule(orchestrator, strategicResolver, sharedContextBuilder)
    );
  }

  if (!registry.get("decision")) {
    registry.register(
      createDecisionDomainModule(orchestrator, decisionResolver, sharedContextBuilder)
    );
  }

  if (!registry.isInitialized()) {
    registry.initialize();
  }

  const router = options.router ?? createIntelligenceRouter(registry);

  const dependencies: IntelligenceServiceDependencies = {
    registry,
    router,
    orchestrator,
  };

  const service = new IntelligenceService(dependencies);
  return Object.assign(service, {
    executiveGraphAnalyzer,
    executiveDecision,
    predictiveIntelligence,
    boardGovernance,
    organizationDna,
    oios,
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
    market,
    innovation,
    impact,
    economic,
    competitive,
    political,
    environmental,
    stakeholder,
    reputation,
    behavioral,
    cultural,
    ethical,
    systems,
    resilience,
    ecosystem,
    institutionalMemory,
    collective,
    wisdom,
    intelligencePlatform,
  });
}

/**
 * Convenience entry point bound to a freshly created service instance.
 * @param request - Intelligence run request.
 */
export async function runIntelligence(
  request: IntelligenceRunRequest
): Promise<IntelligenceResult> {
  return createIntelligenceService().runIntelligence(request);
}
