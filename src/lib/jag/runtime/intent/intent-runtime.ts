import type {
  RuntimeContext,
  RuntimeIdentity,
  RuntimeIntent,
  RuntimeOrganizationalContext,
  RuntimePipelineStage,
} from "../contracts";
import {
  RuntimeCancellationError,
  RuntimeIntentError,
} from "../errors";
import type { RuntimeEventBus } from "../events";
import { RUNTIME_PIPELINE_STAGE_ORDER } from "../types/stages";
import {
  INTENT_EVENT_TYPES,
  type IntentChangedPayload,
  type IntentConfidenceChangedPayload,
  type IntentConflictDetectedPayload,
  type IntentExpiredPayload,
  type IntentResolutionFailedPayload,
  type IntentResolvedPayload,
} from "./intent-events";
import { createIntentHistory, type IntentHistory } from "./intent-history";
import type { IntentProvider } from "./intent-provider";
import {
  createIntentRegistry,
  type IntentRegistry,
} from "./intent-registry";
import {
  createIntentResolver,
  explicitCandidate,
  INTENT_PRECEDENCE,
  type IntentResolver,
} from "./intent-resolver";
import {
  UNKNOWN_INTENT_ID,
  type IntentCandidate,
  type IntentResolutionOutcome,
  type IntentResolutionRequest,
  type IntentSignal,
} from "./intent-types";

export interface IntentRuntimeOptions {
  events?: RuntimeEventBus;
  providers?: IntentRegistry;
  listProviders?: () => readonly IntentProvider[];
  history?: IntentHistory;
  resolver?: IntentResolver;
}

export interface IntentRuntime {
  readonly providers: IntentRegistry;
  readonly historyStore: IntentHistory;
  detect(request: IntentResolutionRequest): Promise<IntentCandidate[]>;
  resolve(
    request: IntentResolutionRequest
  ): Promise<IntentResolutionOutcome>;
  resolveOrThrow(request: IntentResolutionRequest): Promise<RuntimeIntent>;
  clarify(
    request: IntentResolutionRequest,
    choiceIntentId: string
  ): Promise<RuntimeIntent>;
  replace(
    request: IntentResolutionRequest,
    intentId: string
  ): Promise<RuntimeIntent>;
  /** Concurrent secondary intents (non-primary). */
  listConcurrent(principalId: string): RuntimeIntent[];
  history(identity: RuntimeIdentity, limit?: number): RuntimeIntent[];
  purgeExpired(identity: RuntimeIdentity, nowIso?: string): string[];
  createPipelineStage(): RuntimePipelineStage;
}

export function createIntentRuntime(
  options: IntentRuntimeOptions = {}
): IntentRuntime {
  return new IntentRuntimeImpl(options);
}

class IntentRuntimeImpl implements IntentRuntime {
  readonly providers: IntentRegistry;
  readonly historyStore: IntentHistory;
  private readonly events?: RuntimeEventBus;
  private readonly listProviders?: () => readonly IntentProvider[];
  private readonly resolver: IntentResolver;
  /** Active primary intent per principal. */
  private readonly active = new Map<string, RuntimeIntent>();
  /** Concurrent (non-primary) intents per principal. */
  private readonly concurrent = new Map<string, RuntimeIntent[]>();

  constructor(options: IntentRuntimeOptions) {
    this.providers = options.providers ?? createIntentRegistry();
    this.historyStore = options.history ?? createIntentHistory();
    this.events = options.events;
    this.listProviders = options.listProviders;
    this.resolver = options.resolver ?? createIntentResolver();
  }

  async detect(request: IntentResolutionRequest): Promise<IntentCandidate[]> {
    const now = request.now ?? new Date().toISOString();
    const signals = this.collectSignals(request, now);
    const candidates: IntentCandidate[] = [];

    if (request.explicitIntentId || request.clarificationChoice || request.replaceIntentId) {
      const id =
        request.replaceIntentId ??
        request.clarificationChoice ??
        request.explicitIntentId!;
      candidates.push(
        explicitCandidate(id, [
          {
            kind: "explicit",
            sourceClass: "explicit",
            intentId: id,
            weight: 1,
          },
          ...signals.filter((s) => s.intentId === id),
        ])
      );
    }

    for (const provider of this.allProviders()) {
      try {
        const detected = await provider.detect(request, signals);
        candidates.push(...detected);
      } catch {
        // Provider errors: fall back to other providers / explicit-only.
      }
    }

    // Situational boost from temporary context task (generic — no domain).
    const ctx = request.organizationalContext;
    if (ctx?.mode === "temporary") {
      const taskId =
        typeof ctx.attributes?.activeTaskRef === "object" &&
        ctx.attributes.activeTaskRef &&
        "id" in (ctx.attributes.activeTaskRef as object)
          ? String((ctx.attributes.activeTaskRef as { id: string }).id)
          : undefined;
      if (taskId || ctx.focusEntity) {
        const intentId =
          signals.find((s) => s.sourceClass === "context" && s.intentId)
            ?.intentId ?? `context.focus`;
        candidates.push({
          intentId,
          confidence: 0.7,
          source: "inferred",
          precedence: INTENT_PRECEDENCE.TEMPORARY_CONTEXT_TASK,
          signals: [
            {
              kind: "context.temporary",
              sourceClass: "context",
              intentId,
              weight: 0.7,
              detail: {
                contextId: ctx.contextId,
                taskId,
                focusEntity: ctx.focusEntity,
              },
            },
          ],
          domainHints: [...ctx.domainHints],
        });
      }
    }

    return this.resolver.filterCandidates(
      request.identity,
      candidates,
      now
    );
  }

  async resolve(
    request: IntentResolutionRequest
  ): Promise<IntentResolutionOutcome> {
    try {
      if (request.signal?.aborted) {
        throw new RuntimeCancellationError();
      }
      const now = request.now ?? new Date().toISOString();
      this.purgeExpired(request.identity, now);

      const previous = this.active.get(request.identity.principalId) ?? null;
      const candidates = await this.detect(request);
      const { winner, conflicts, requiresClarification } =
        this.resolver.pickWinner(candidates);

      if (conflicts.length > 0 && winner) {
        const payload: IntentConflictDetectedPayload = {
          winnerIntentId: winner.intentId,
          conflictIntentIds: conflicts.map((c) => c.intentId),
        };
        await this.events?.publish(
          INTENT_EVENT_TYPES.INTENT_CONFLICT_DETECTED,
          payload
        );
      }

      const historyRef = previous?.intentId;
      const intent = this.resolver.toRuntimeIntent(
        winner,
        conflicts,
        requiresClarification,
        historyRef,
        now,
        this.providers
      );

      // Concurrent: keep rivals that are still reasonably confident.
      const concurrentIntents = conflicts
        .filter((c) => c.confidence >= 0.55)
        .map((c) =>
          this.resolver.toRuntimeIntent(
            c,
            [],
            false,
            historyRef,
            now,
            this.providers
          )
        );
      this.concurrent.set(request.identity.principalId, concurrentIntents);

      if (
        previous &&
        previous.intentId === intent.intentId &&
        previous.confidence !== intent.confidence
      ) {
        const confPayload: IntentConfidenceChangedPayload = {
          intentId: intent.intentId,
          from: previous.confidence,
          to: intent.confidence,
        };
        await this.events?.publish(
          INTENT_EVENT_TYPES.INTENT_CONFIDENCE_CHANGED,
          confPayload
        );
      }

      if (!previous || previous.intentId !== intent.intentId) {
        const changed: IntentChangedPayload = {
          fromIntentId: previous?.intentId ?? null,
          toIntentId: intent.intentId,
          confidence: intent.confidence,
        };
        await this.events?.publish(INTENT_EVENT_TYPES.INTENT_CHANGED, changed);
      }

      this.active.set(request.identity.principalId, intent);
      const expiresAt =
        typeof intent.attributes?.expiresAt === "string"
          ? intent.attributes.expiresAt
          : undefined;
      this.historyStore.append(
        request.identity.principalId,
        intent,
        expiresAt
      );

      const resolvedPayload: IntentResolvedPayload = {
        intentId: intent.intentId,
        confidence: intent.confidence,
        source: intent.source,
        requiresClarification: intent.requiresClarification,
      };
      await this.events?.publish(
        INTENT_EVENT_TYPES.INTENT_RESOLVED,
        resolvedPayload,
        {
          correlationId: request.correlationId,
          sessionId: request.sessionId,
          organizationId: request.identity.activeOrganizationId,
          actorUserId: request.identity.principalId,
          effectiveUserId: request.identity.effectiveUserId,
        }
      );

      if (intent.intentId === UNKNOWN_INTENT_ID) {
        return { status: "unknown", value: intent };
      }
      return {
        status: "resolved",
        value: intent,
        concurrent: concurrentIntents,
      };
    } catch (error) {
      if (error instanceof RuntimeCancellationError) throw error;
      const reason =
        error instanceof Error ? error.message : "Intent resolution failed";
      const code =
        error instanceof RuntimeIntentError
          ? error.code
          : "INTENT_RESOLUTION_FAILED";
      const payload: IntentResolutionFailedPayload = { reason, code };
      await this.events?.publish(
        INTENT_EVENT_TYPES.INTENT_RESOLUTION_FAILED,
        payload
      );
      throw error;
    }
  }

  async resolveOrThrow(
    request: IntentResolutionRequest
  ): Promise<RuntimeIntent> {
    const outcome = await this.resolve(request);
    return outcome.value;
  }

  async clarify(
    request: IntentResolutionRequest,
    choiceIntentId: string
  ): Promise<RuntimeIntent> {
    return this.resolveOrThrow({
      ...request,
      clarificationChoice: choiceIntentId,
      explicitIntentId: choiceIntentId,
    });
  }

  async replace(
    request: IntentResolutionRequest,
    intentId: string
  ): Promise<RuntimeIntent> {
    return this.resolveOrThrow({
      ...request,
      replaceIntentId: intentId,
      explicitIntentId: intentId,
    });
  }

  listConcurrent(principalId: string): RuntimeIntent[] {
    return [...(this.concurrent.get(principalId) ?? [])];
  }

  history(identity: RuntimeIdentity, limit?: number): RuntimeIntent[] {
    return this.historyStore.list(identity.principalId, limit);
  }

  purgeExpired(identity: RuntimeIdentity, nowIso?: string): string[] {
    const now = nowIso ?? new Date().toISOString();
    const expired = this.historyStore.purgeExpired(identity.principalId, now);
    const active = this.active.get(identity.principalId);
    if (
      active?.attributes?.expiresAt &&
      typeof active.attributes.expiresAt === "string" &&
      Date.parse(active.attributes.expiresAt) <= Date.parse(now)
    ) {
      expired.push(active.intentId);
      this.active.delete(identity.principalId);
      void this.events?.publish(INTENT_EVENT_TYPES.INTENT_EXPIRED, {
        intentId: active.intentId,
        expiredAt: now,
      } satisfies IntentExpiredPayload);
    }
    for (const id of expired) {
      if (id !== active?.intentId) {
        void this.events?.publish(INTENT_EVENT_TYPES.INTENT_EXPIRED, {
          intentId: id,
          expiredAt: now,
        } satisfies IntentExpiredPayload);
      }
    }
    return [...new Set(expired)];
  }

  createPipelineStage(): RuntimePipelineStage {
    return {
      id: "intent",
      order: RUNTIME_PIPELINE_STAGE_ORDER.intent,
      execute: async (ctx: RuntimeContext) => {
        ctx.throwIfCancelled();
        const identity = ctx.state.identity;
        if (!identity) {
          throw new RuntimeIntentError(
            "Identity required before Intent stage",
            { code: "INTENT_REQUIRES_IDENTITY" }
          );
        }
        const request = intentRequestFromExecution(ctx, identity);
        const intent = await this.resolveOrThrow(request);
        ctx.setIntent(intent);
        ctx.state.data.intentConcurrent = this.listConcurrent(
          identity.principalId
        );
      },
    };
  }

  private allProviders(): IntentProvider[] {
    const fromLocal = this.providers.list();
    const fromExternal = this.listProviders?.() ?? [];
    const byId = new Map<string, IntentProvider>();
    for (const p of [...fromExternal, ...fromLocal]) {
      byId.set(p.id, p);
    }
    return [...byId.values()].sort(
      (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
    );
  }

  private collectSignals(
    request: IntentResolutionRequest,
    now: string
  ): IntentSignal[] {
    const signals: IntentSignal[] = [...(request.signals ?? [])];

    signals.push({
      kind: "identity.active",
      sourceClass: "identity",
      weight: 0.1,
      detail: {
        principalId: request.identity.principalId,
        organizationId: request.identity.activeOrganizationId,
      },
    });

    if (request.organizationalContext) {
      signals.push({
        kind: "context.active",
        sourceClass: "context",
        weight: 0.2,
        detail: {
          contextId: request.organizationalContext.contextId,
          contextFamily: request.organizationalContext.contextFamily,
          mode: request.organizationalContext.mode,
        },
      });
    }

    const merged = this.resolver.mergeSignals(signals);
    const nowMs = Date.parse(now);
    return merged.filter(
      (s) => !s.expiresAt || Date.parse(s.expiresAt) > nowMs
    );
  }
}

export function intentRequestFromExecution(
  ctx: RuntimeContext,
  identity: RuntimeIdentity
): IntentResolutionRequest {
  const data = ctx.state.data;
  const signals = Array.isArray(data.intentSignals)
    ? (data.intentSignals as IntentSignal[])
    : undefined;

  return {
    identity,
    organizationalContext: ctx.state.organizationalContext,
    signals,
    explicitIntentId:
      typeof data.explicitIntentId === "string"
        ? data.explicitIntentId
        : typeof data.intentId === "string"
          ? data.intentId
          : undefined,
    clarificationChoice:
      typeof data.intentClarification === "string"
        ? data.intentClarification
        : undefined,
    correlationId: ctx.correlationId,
    sessionId: ctx.sessionId,
    signal: ctx.signal,
  };
}

export type { RuntimeOrganizationalContext };
