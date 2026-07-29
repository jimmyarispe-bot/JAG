import type {
  RuntimeContext,
  RuntimePipelineStage,
} from "../contracts";
import {
  RuntimeCancellationError,
  RuntimeError,
} from "../errors";
import type { RuntimeEventBus } from "../events";
import { RUNTIME_PIPELINE_STAGE_ORDER } from "../types/stages";
import type { CognitiveProvider } from "./cognitive-provider";
import {
  createCognitiveRegistry,
  type CognitiveRegistry,
} from "./cognitive-registry";
import {
  cognitiveResultToBag,
  type CognitiveResult,
  type CognitiveThinkOutcome,
  type CognitiveThinkRequest,
  type ReasoningTraceStep,
} from "./cognition-types";
import {
  createReasoningEngine,
  type ReasoningEngine,
} from "./reasoning-engine";

export interface CognitiveRuntimeOptions {
  events?: RuntimeEventBus;
  registry?: CognitiveRegistry;
  listProviders?: () => readonly CognitiveProvider[];
  reasoning?: ReasoningEngine;
}

export interface CognitiveRuntime {
  readonly registry: CognitiveRegistry;
  think(request: CognitiveThinkRequest): Promise<CognitiveThinkOutcome>;
  thinkOrThrow(request: CognitiveThinkRequest): Promise<CognitiveResult>;
  explain(
    result: CognitiveResult,
    recommendationId: string
  ): ReasoningTraceStep[];
  refresh(request: CognitiveThinkRequest): Promise<CognitiveResult>;
  registerProvider(provider: CognitiveProvider): void;
  createPipelineStage(): RuntimePipelineStage;
}

export function createCognitiveRuntime(
  options: CognitiveRuntimeOptions = {}
): CognitiveRuntime {
  return new CognitiveRuntimeImpl(options);
}

class CognitiveRuntimeImpl implements CognitiveRuntime {
  readonly registry: CognitiveRegistry;
  private readonly listProviders?: () => readonly CognitiveProvider[];
  private readonly reasoning: ReasoningEngine;
  private readonly lastByPrincipal = new Map<string, CognitiveResult>();

  constructor(options: CognitiveRuntimeOptions) {
    this.registry = options.registry ?? createCognitiveRegistry();
    this.listProviders = options.listProviders;
    this.reasoning =
      options.reasoning ?? createReasoningEngine({ events: options.events });
  }

  registerProvider(provider: CognitiveProvider): void {
    this.registry.register(provider);
  }

  async think(
    request: CognitiveThinkRequest
  ): Promise<CognitiveThinkOutcome> {
    if (request.signal?.aborted) {
      throw new RuntimeCancellationError();
    }

    const providers = this.allProviders();
    const result = await this.reasoning.think(request, providers);
    this.lastByPrincipal.set(request.identity.principalId, result);

    if (
      result.consultedProviders.length === 0 &&
      result.recommendations.length === 0
    ) {
      return {
        status: "empty",
        value: result,
        reason: "No cognitive providers available",
      };
    }
    if (result.failedProviders.length > 0 || result.unknownGaps.length > 0) {
      return {
        status: "partial",
        value: result,
        reason: "Partial cognition — gaps or provider failures",
      };
    }
    return { status: "ready", value: result };
  }

  async thinkOrThrow(
    request: CognitiveThinkRequest
  ): Promise<CognitiveResult> {
    const outcome = await this.think(request);
    return outcome.value;
  }

  explain(
    result: CognitiveResult,
    recommendationId: string
  ): ReasoningTraceStep[] {
    return this.reasoning.explain(result, recommendationId);
  }

  async refresh(request: CognitiveThinkRequest): Promise<CognitiveResult> {
    return this.thinkOrThrow(request);
  }

  createPipelineStage(): RuntimePipelineStage {
    return {
      id: "cognition",
      order: RUNTIME_PIPELINE_STAGE_ORDER.cognition,
      execute: async (ctx: RuntimeContext) => {
        ctx.throwIfCancelled();
        const identity = ctx.state.identity;
        if (!identity) {
          throw new RuntimeError(
            "Identity required before Cognition stage",
            { code: "COGNITION_REQUIRES_IDENTITY", stageId: "cognition" }
          );
        }
        const request = cognitionRequestFromExecution(ctx);
        const result = await this.thinkOrThrow(request);
        ctx.setCognition(cognitiveResultToBag(result));
        ctx.state.data.cognitiveResult = result;
      },
    };
  }

  private allProviders(): CognitiveProvider[] {
    const fromLocal = this.registry.list();
    const fromExternal = this.listProviders?.() ?? [];
    const byId = new Map<string, CognitiveProvider>();
    for (const p of [...fromExternal, ...fromLocal]) {
      byId.set(p.id, p);
    }
    return [...byId.values()].sort(
      (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
    );
  }
}

export function cognitionRequestFromExecution(
  ctx: RuntimeContext
): CognitiveThinkRequest {
  const identity = ctx.state.identity;
  if (!identity) {
    throw new RuntimeError("Identity required for cognition", {
      code: "COGNITION_REQUIRES_IDENTITY",
      stageId: "cognition",
    });
  }
  return {
    identity,
    organizationalContext: ctx.state.organizationalContext,
    intent: ctx.state.intent,
    correlationId: ctx.correlationId,
    sessionId: ctx.sessionId,
    signal: ctx.signal,
  };
}
