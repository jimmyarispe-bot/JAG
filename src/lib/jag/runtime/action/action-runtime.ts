import type {
  RuntimeContext,
  RuntimePipelineStage,
} from "../contracts";
import type { CognitiveResult } from "../cognition/cognition-types";
import {
  RuntimeAuthorizationError,
  RuntimeCancellationError,
  RuntimeError,
} from "../errors";
import type { RuntimeEventBus } from "../events";
import { RUNTIME_PIPELINE_STAGE_ORDER } from "../types/stages";
import {
  createActionAudit,
  type ActionAudit,
  type ActionAuditRecord,
} from "./action-audit";
import {
  createActionAuthorization,
  type ActionAuthorization,
} from "./action-authorization";
import {
  createActionDispatcher,
  type ActionDispatcher,
} from "./action-dispatcher";
import {
  ACTION_EVENT_TYPES,
  type ActionAuthorizedPayload,
  type ActionCompletedPayload,
  type ActionFailedPayload,
  type ActionRejectedPayload,
  type ActionRequestedPayload,
} from "./action-events";
import type { ActionProvider } from "./action-provider";
import {
  createActionRegistry,
  defaultCatalogEntry,
  type ActionRegistry,
} from "./action-registry";
import {
  failedResult,
  rejectedResult,
  toRuntimeAction,
  type RuntimeActionResult,
} from "./action-result";
import type { RuntimeIntent } from "../contracts/intent";
import type {
  ActionCatalogEntry,
  ActionExecutionRequest,
  ActionGateRequirement,
} from "./action-types";

export interface ActionRuntimeOptions {
  events?: RuntimeEventBus;
  registry?: ActionRegistry;
  listProviders?: () => readonly ActionProvider[];
  audit?: ActionAudit;
  authorization?: ActionAuthorization;
  dispatcher?: ActionDispatcher;
}

export interface ActionRuntime {
  readonly registry: ActionRegistry;
  readonly audit: ActionAudit;
  execute(request: ActionExecutionRequest): Promise<RuntimeActionResult>;
  describe(actionId: string): ActionCatalogEntry | undefined;
  registerProvider(provider: ActionProvider): void;
  registerCatalogEntry(entry: ActionCatalogEntry): void;
  listAudit(limit?: number): ActionAuditRecord[];
  createPipelineStage(): RuntimePipelineStage;
}

export function createActionRuntime(
  options: ActionRuntimeOptions = {}
): ActionRuntime {
  return new ActionRuntimeImpl(options);
}

class ActionRuntimeImpl implements ActionRuntime {
  readonly registry: ActionRegistry;
  readonly audit: ActionAudit;
  private readonly events?: RuntimeEventBus;
  private readonly authorization: ActionAuthorization;
  private readonly dispatcher: ActionDispatcher;

  constructor(options: ActionRuntimeOptions) {
    this.events = options.events;
    this.registry = options.registry ?? createActionRegistry();
    this.audit = options.audit ?? createActionAudit();
    this.authorization =
      options.authorization ?? createActionAuthorization();
    this.dispatcher =
      options.dispatcher ??
      createActionDispatcher(
        this.registry,
        options.listProviders,
        options.events
      );
  }

  registerProvider(provider: ActionProvider): void {
    this.registry.register(provider);
  }

  registerCatalogEntry(entry: ActionCatalogEntry): void {
    this.registry.registerCatalogEntry(entry);
  }

  describe(actionId: string): ActionCatalogEntry | undefined {
    return this.registry.describe(actionId);
  }

  listAudit(limit?: number): ActionAuditRecord[] {
    return this.audit.list(limit);
  }

  async execute(
    request: ActionExecutionRequest
  ): Promise<RuntimeActionResult> {
    const now = request.now ?? new Date().toISOString();
    const auditEventId = this.audit.nextId();

    if (request.signal?.aborted) {
      throw new RuntimeCancellationError();
    }

    const requestedPayload: ActionRequestedPayload = {
      actionId: request.actionId,
      principalId: request.identity.principalId,
      organizationId: request.organizationalContext.organizationId,
      cognitionBriefId: request.cognition.briefId,
      evidenceCount: request.evidenceRefs.length,
    };
    await this.events?.publish(
      ACTION_EVENT_TYPES.ACTION_REQUESTED,
      requestedPayload,
      {
        correlationId: request.correlationId,
        sessionId: request.sessionId,
        organizationId: request.organizationalContext.organizationId,
        actorUserId: request.identity.principalId,
        effectiveUserId: request.identity.effectiveUserId,
      }
    );

    const validationError = validateExecutionRequest(request);
    if (validationError) {
      const result = rejectedResult(
        request.actionId,
        auditEventId,
        validationError.code,
        validationError.message,
        now,
        validationError.missing
      );
      this.audit.record(request, result);
      await this.publishRejected(result);
      return result;
    }

    const catalog =
      this.registry.getCatalogEntry(request.actionId) ??
      this.dispatcher.findProvider(request.actionId)?.catalog?.find(
        (c) => c.actionId === request.actionId
      ) ??
      defaultCatalogEntry(request.actionId);

    try {
      this.authorization.assertAuthorized(request, catalog);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Action not authorized";
      const code =
        error instanceof RuntimeAuthorizationError
          ? error.code
          : "ACTION_UNAUTHORIZED";
      const result = rejectedResult(
        request.actionId,
        auditEventId,
        code,
        message,
        now
      );
      this.audit.record(request, result);
      await this.publishRejected(result);
      return result;
    }

    const authPayload: ActionAuthorizedPayload = {
      actionId: request.actionId,
      permission: catalog.permission,
      effectiveUserId: request.identity.effectiveUserId,
    };
    await this.events?.publish(ACTION_EVENT_TYPES.ACTION_AUTHORIZED, authPayload);

    const provider = this.dispatcher.findProvider(request.actionId);
    if (!provider) {
      const result = rejectedResult(
        request.actionId,
        auditEventId,
        "ACTION_PROVIDER_MISS",
        `No action provider registered for: ${request.actionId}`,
        now
      );
      this.audit.record(request, result);
      await this.publishRejected(result);
      return result;
    }

    try {
      const { providerId, result: providerResult } =
        await this.dispatcher.dispatch(request, provider);

      const result: RuntimeActionResult = {
        actionId: request.actionId,
        status: providerResult.status,
        providerId,
        domainPackageId: providerResult.domainPackageId,
        workflowInstanceId: providerResult.workflowInstanceId,
        evidenceRefs: providerResult.evidenceRefs ?? [...request.evidenceRefs],
        memoryRefs: providerResult.memoryRefs ?? [],
        twinRefs: providerResult.twinRefs ?? [],
        auditEventId,
        undoToken: providerResult.undoToken,
        error: providerResult.error,
        attributes: providerResult.attributes,
        completedAt: now,
      };

      this.audit.record(request, result, { providerId });

      if (result.status === "failed" || result.status === "rejected") {
        await this.publishFailed(result);
      } else {
        const completed: ActionCompletedPayload = {
          actionId: result.actionId,
          providerId,
          status: result.status,
          auditEventId,
        };
        await this.events?.publish(
          ACTION_EVENT_TYPES.ACTION_COMPLETED,
          completed
        );
      }

      return result;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Action dispatch failed";
      const result = failedResult(
        request.actionId,
        auditEventId,
        "ACTION_DISPATCH_FAILED",
        message,
        now,
        provider.id
      );
      this.audit.record(request, result, { providerId: provider.id });
      await this.publishFailed(result);
      return result;
    }
  }

  createPipelineStage(): RuntimePipelineStage {
    return {
      id: "action",
      order: RUNTIME_PIPELINE_STAGE_ORDER.action,
      optional: true,
      execute: async (ctx: RuntimeContext) => {
        ctx.throwIfCancelled();
        const actionId = ctx.state.data.actionId;
        if (typeof actionId !== "string") {
          return;
        }
        const request = actionRequestFromExecution(ctx, actionId);
        const result = await this.execute(request);
        ctx.setAction(toRuntimeAction(result));
        ctx.state.data.actionResult = result;
        ctx.state.data.actionAuditEventId = result.auditEventId;
      },
    };
  }

  private async publishRejected(result: RuntimeActionResult): Promise<void> {
    const payload: ActionRejectedPayload = {
      actionId: result.actionId,
      code: result.error?.code ?? "ACTION_REJECTED",
      message: result.error?.message ?? "Action rejected",
      auditEventId: result.auditEventId,
      missing: result.missing,
    };
    await this.events?.publish(ACTION_EVENT_TYPES.ACTION_REJECTED, payload);
  }

  private async publishFailed(result: RuntimeActionResult): Promise<void> {
    const payload: ActionFailedPayload = {
      actionId: result.actionId,
      providerId: result.providerId,
      code: result.error?.code ?? "ACTION_FAILED",
      message: result.error?.message ?? "Action failed",
      auditEventId: result.auditEventId,
    };
    await this.events?.publish(ACTION_EVENT_TYPES.ACTION_FAILED, payload);
  }
}

function validateExecutionRequest(
  request: ActionExecutionRequest
): {
  code: string;
  message: string;
  missing: readonly ActionGateRequirement[];
} | null {
  if (!request.identity?.principalId) {
    return {
      code: "ACTION_REQUIRES_IDENTITY",
      message: "RuntimeIdentity required",
      missing: ["identity"],
    };
  }
  if (!request.organizationalContext?.contextId) {
    return {
      code: "ACTION_REQUIRES_CONTEXT",
      message: "OrganizationalContext required",
      missing: ["context"],
    };
  }
  if (!request.intent?.intentId) {
    return {
      code: "ACTION_REQUIRES_INTENT",
      message: "RuntimeIntent required",
      missing: ["intent"],
    };
  }
  if (!request.cognition?.briefId) {
    return {
      code: "ACTION_REQUIRES_COGNITION",
      message: "CognitiveResult required",
      missing: ["cognition"],
    };
  }
  if (!request.evidenceRefs?.length) {
    return {
      code: "ACTION_REQUIRES_EVIDENCE",
      message: "EvidenceSet required",
      missing: ["evidence"],
    };
  }
  if (!request.actionId) {
    return {
      code: "ACTION_ID_REQUIRED",
      message: "actionId required",
      missing: [],
    };
  }
  return null;
}

export function actionRequestFromExecution(
  ctx: RuntimeContext,
  actionId: string
): ActionExecutionRequest {
  const identity = ctx.state.identity;
  const organizationalContext = ctx.state.organizationalContext;
  if (!identity) {
    throw new RuntimeError("Identity required for action execution", {
      code: "ACTION_REQUIRES_IDENTITY",
      stageId: "action",
    });
  }
  if (!organizationalContext) {
    throw new RuntimeError("Context required for action execution", {
      code: "ACTION_REQUIRES_CONTEXT",
      stageId: "action",
    });
  }

  const cognition =
    (ctx.state.data.cognitiveResult as CognitiveResult | undefined) ??
    syntheticCognitionFromBag(ctx.state.cognition);

  const evidenceRefs =
    Array.isArray(ctx.state.data.actionEvidenceRefs)
      ? (ctx.state.data.actionEvidenceRefs as ActionExecutionRequest["evidenceRefs"])
      : cognition.evidenceRefs ?? [];

  return {
    actionId,
    identity,
    organizationalContext,
    intent: ctx.state.intent ?? emptyIntentPlaceholder(),
    cognition,
    evidenceRefs,
    cognitionRecommendationId:
      typeof ctx.state.data.cognitionRecommendationId === "string"
        ? ctx.state.data.cognitionRecommendationId
        : undefined,
    payload:
      (ctx.state.data.actionPayload as Record<string, unknown> | undefined) ??
      {},
    idempotencyKey:
      typeof ctx.state.data.idempotencyKey === "string"
        ? ctx.state.data.idempotencyKey
        : undefined,
    confirmationToken:
      typeof ctx.state.data.confirmationToken === "string"
        ? ctx.state.data.confirmationToken
        : undefined,
    correlationId: ctx.correlationId,
    sessionId: ctx.sessionId,
    signal: ctx.signal,
  };
}

function syntheticCognitionFromBag(
  cognition: Readonly<Record<string, unknown>> | undefined
): CognitiveResult {
  return {
    briefId:
      typeof cognition?.briefId === "string" ? cognition.briefId : "",
    findings: [],
    recommendations: [],
    priorities: [],
    unknownGaps: Array.isArray(cognition?.unknownGaps)
      ? (cognition.unknownGaps as string[])
      : [],
    conflicts: [],
    reasoningTrace: [],
    consultedProviders: [],
    failedProviders: [],
    evidenceRefs: [],
    generatedAt: new Date().toISOString(),
    summary:
      typeof cognition?.summary === "string" ? cognition.summary : undefined,
  };
}

/** Placeholder so gate validation can emit typed RuntimeActionRejected. */
function emptyIntentPlaceholder(): RuntimeIntent {
  return {
    intentId: "",
    domainHints: [],
    actionCandidates: [],
    confidence: 0,
    source: "unknown",
    signals: [],
    conflicts: [],
    requiresClarification: false,
    resolvedAt: new Date().toISOString(),
  };
}
