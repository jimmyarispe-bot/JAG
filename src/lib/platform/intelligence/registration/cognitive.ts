/**
 * Cognitive domain adapters (success / executive / strategic / decision).
 *
 * Moved from create-service.ts — behavior unchanged.
 */

import type { IntelligenceDomainModule } from "@/lib/platform/intelligence/contracts";
import type { SharedIntelligenceContextBuilder } from "@/lib/platform/intelligence/context/builder";
import {
  DECISION_INTELLIGENCE_VERSION,
  type DecisionKpiSignal,
  type DecisionRequest,
  type DecisionResolver,
} from "@/lib/platform/intelligence/decision";
import {
  EXECUTIVE_INTELLIGENCE_VERSION,
  type ExecutiveRequest,
  type ExecutiveResolver,
} from "@/lib/platform/intelligence/domains/executive";
import {
  STRATEGIC_INTELLIGENCE_VERSION,
  type StrategicFindingInput,
  type StrategicRequest,
  type StrategicResolver,
} from "@/lib/platform/intelligence/domains/strategic";
import {
  SUPPORT_INTELLIGENCE_VERSION,
  type SupportRequest,
  type SupportResolver,
} from "@/lib/platform/intelligence/domains/support";
import {
  type IntelligenceOrchestrator,
  type IntelligenceResult,
} from "@/lib/platform/intelligence/orchestrator";
import type { IntelligenceDomainRegistry } from "@/lib/platform/intelligence/registry";
import type { IntelligenceRunRequest } from "@/lib/platform/intelligence/types";

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

export interface RegisterCognitiveDomainsInput {
  registry: IntelligenceDomainRegistry;
  orchestrator: IntelligenceOrchestrator;
  supportResolver: SupportResolver;
  executiveResolver: ExecutiveResolver;
  strategicResolver: StrategicResolver;
  decisionResolver: DecisionResolver;
  sharedContextBuilder: SharedIntelligenceContextBuilder;
}

/**
 * Register cognitive domain modules onto the registry (idempotent per key).
 */
export function registerCognitiveDomains(input: RegisterCognitiveDomainsInput): void {
  const {
    registry,
    orchestrator,
    supportResolver,
    executiveResolver,
    strategicResolver,
    decisionResolver,
    sharedContextBuilder,
  } = input;

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
}
