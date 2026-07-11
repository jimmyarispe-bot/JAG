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
import { IntelligenceKnowledgeService } from "@/lib/platform/intelligence/knowledge";
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
 * and Decision (`decision`) domains.
 */
export function createIntelligenceService(
  options: CreateIntelligenceServiceOptions = {}
): IntelligenceService {
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

  return new IntelligenceService(dependencies);
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
