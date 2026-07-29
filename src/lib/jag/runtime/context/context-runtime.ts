import type {
  RuntimeContext,
  RuntimeIdentity,
  RuntimePipelineStage,
} from "../contracts";
import { RuntimeCancellationError, RuntimeContextError } from "../errors";
import type { RuntimeEventBus } from "../events";
import { RUNTIME_PIPELINE_STAGE_ORDER } from "../types/stages";
import {
  CONTEXT_EVENT_TYPES,
  type ContextChangedPayload,
  type ContextEnteredPayload,
  type ContextExitedPayload,
  type ContextResolutionFailedPayload,
  type ContextResolvedPayload,
  type ContextRestoredPayload,
  type ContextSnapshotCreatedPayload,
} from "./context-events";
import type { ContextProvider } from "./context-provider";
import {
  createContextRegistry,
  type ContextRegistry,
} from "./context-registry";
import {
  applyProviderEnrichment,
  createContextResolver,
  type ContextResolver,
} from "./context-resolver";
import { createContextStore, type ContextStore } from "./context-store";
import {
  toOrganizationalContext,
  type AvailableContext,
  type ContextResolutionOutcome,
  type ContextResolutionRequest,
  type ContextSelection,
  type ContextSnapshot,
  type ContextSnapshotRecord,
} from "./context-types";

export interface ContextRuntimeOptions {
  events?: RuntimeEventBus;
  providers?: ContextRegistry;
  listProviders?: () => readonly ContextProvider[];
  store?: ContextStore;
  resolver?: ContextResolver;
}

/**
 * Situational Context Runtime (Ω-3).
 * Produces {@link ContextSnapshot} — not the kernel execution {@link RuntimeContext}.
 */
export interface ContextRuntime {
  readonly providers: ContextRegistry;
  readonly store: ContextStore;
  discover(identity: RuntimeIdentity): Promise<AvailableContext[]>;
  resolve(
    request: ContextResolutionRequest
  ): Promise<ContextResolutionOutcome>;
  resolveOrThrow(
    request: ContextResolutionRequest
  ): Promise<ContextSnapshot>;
  switch(
    identity: RuntimeIdentity,
    contextId: string,
    selection?: Omit<ContextSelection, "contextId">
  ): Promise<ContextSnapshot>;
  setTemporary(
    identity: RuntimeIdentity,
    overlay: ContextSelection
  ): Promise<ContextSnapshot>;
  clearTemporary(identity: RuntimeIdentity): Promise<ContextSnapshot>;
  setFocus(
    identity: RuntimeIdentity,
    focusObject: ContextSelection["focusObject"]
  ): Promise<ContextSnapshot>;
  enter(
    identity: RuntimeIdentity,
    selection: ContextSelection
  ): Promise<ContextSnapshot>;
  exit(identity: RuntimeIdentity): Promise<ContextSnapshot | null>;
  createSnapshot(identity: RuntimeIdentity): Promise<ContextSnapshotRecord>;
  restoreSnapshot(
    identity: RuntimeIdentity,
    snapshotId: string
  ): Promise<ContextSnapshot>;
  getActive(identity: RuntimeIdentity): ContextSnapshot | null;
  createPipelineStage(): RuntimePipelineStage;
}

export function createContextRuntime(
  options: ContextRuntimeOptions = {}
): ContextRuntime {
  return new ContextRuntimeImpl(options);
}

class ContextRuntimeImpl implements ContextRuntime {
  readonly providers: ContextRegistry;
  readonly store: ContextStore;
  private readonly events?: RuntimeEventBus;
  private readonly listProviders?: () => readonly ContextProvider[];
  private readonly resolver: ContextResolver;
  /** Stack of entered nested context ids per principal. */
  private readonly enterStack = new Map<string, string[]>();

  constructor(options: ContextRuntimeOptions) {
    this.providers = options.providers ?? createContextRegistry();
    this.store = options.store ?? createContextStore();
    this.events = options.events;
    this.listProviders = options.listProviders;
    this.resolver = options.resolver ?? createContextResolver();
  }

  async discover(identity: RuntimeIdentity): Promise<AvailableContext[]> {
    const contributions: AvailableContext[] = [];
    for (const provider of this.allProviders()) {
      const items = await provider.discover(identity);
      contributions.push(...items);
    }
    return this.resolver.mergeAvailable(identity, contributions);
  }

  async resolve(
    request: ContextResolutionRequest
  ): Promise<ContextResolutionOutcome> {
    try {
      const value = await this.resolveInternal(request);
      return { status: "resolved", value };
    } catch (error) {
      if (error instanceof RuntimeCancellationError) throw error;
      const reason =
        error instanceof Error ? error.message : "Context resolution failed";
      const code =
        error instanceof RuntimeContextError
          ? error.code
          : "CONTEXT_RESOLUTION_FAILED";
      await this.publishFailed({
        reason,
        code,
        organizationId: request.identity.activeOrganizationId,
      });
      if (
        error instanceof RuntimeContextError &&
        error.code === "CONTEXT_EMPTY"
      ) {
        return { status: "empty", reason };
      }
      throw error;
    }
  }

  async resolveOrThrow(
    request: ContextResolutionRequest
  ): Promise<ContextSnapshot> {
    const outcome = await this.resolve(request);
    if (outcome.status !== "resolved") {
      throw new RuntimeContextError(outcome.reason, {
        code: "CONTEXT_EMPTY",
      });
    }
    return outcome.value;
  }

  async switch(
    identity: RuntimeIdentity,
    contextId: string,
    selection: Omit<ContextSelection, "contextId"> = {}
  ): Promise<ContextSnapshot> {
    const previous = this.getActive(identity);
    const snapshot = await this.resolveOrThrow({
      identity,
      selection: { ...selection, contextId },
      includeTemporary: false,
    });
    this.store.setPersistent(identity.principalId, snapshot);
    this.store.clearTemporary(
      identity.principalId,
      identity.activeOrganizationId
    );

    const payload: ContextChangedPayload = {
      fromContextId: previous?.contextId ?? null,
      toContextId: snapshot.contextId,
      organizationId: snapshot.organizationId,
    };
    await this.events?.publish(CONTEXT_EVENT_TYPES.CONTEXT_CHANGED, payload);
    return snapshot;
  }

  async setTemporary(
    identity: RuntimeIdentity,
    overlay: ContextSelection
  ): Promise<ContextSnapshot> {
    const snapshot = await this.resolveOrThrow({
      identity,
      selection: overlay,
      includeTemporary: false,
    });
    const temporary: ContextSnapshot = { ...snapshot, mode: "temporary" };
    this.store.setTemporary(identity.principalId, temporary);
    await this.publishEntered(temporary);
    return temporary;
  }

  async clearTemporary(identity: RuntimeIdentity): Promise<ContextSnapshot> {
    const temp = this.store.getTemporary(
      identity.principalId,
      identity.activeOrganizationId
    );
    if (temp) {
      await this.publishExited(temp);
    }
    this.store.clearTemporary(
      identity.principalId,
      identity.activeOrganizationId
    );
    return this.resolveOrThrow({
      identity,
      includeTemporary: false,
    });
  }

  async setFocus(
    identity: RuntimeIdentity,
    focusObject: ContextSelection["focusObject"]
  ): Promise<ContextSnapshot> {
    const active = this.getActive(identity);
    return this.resolveOrThrow({
      identity,
      selection: {
        contextId: active?.contextId,
        workspaceId: active?.workspaceId,
        focusObject,
        workflowRef: active?.workflowRef,
        activeTaskRef: active?.activeTaskRef,
        temporal: active?.temporal,
        collaborative: active?.collaborative,
        attributes: active?.attributes,
      },
      includeTemporary: true,
    }).then(async (snapshot) => {
      if (snapshot.mode === "temporary") {
        this.store.setTemporary(identity.principalId, snapshot);
      } else {
        this.store.setPersistent(identity.principalId, snapshot);
      }
      return snapshot;
    });
  }

  async enter(
    identity: RuntimeIdentity,
    selection: ContextSelection
  ): Promise<ContextSnapshot> {
    const snapshot = await this.setTemporary(identity, selection);
    const stack = this.enterStack.get(identity.principalId) ?? [];
    stack.push(snapshot.contextId);
    this.enterStack.set(identity.principalId, stack);
    return snapshot;
  }

  async exit(identity: RuntimeIdentity): Promise<ContextSnapshot | null> {
    const stack = this.enterStack.get(identity.principalId) ?? [];
    stack.pop();
    this.enterStack.set(identity.principalId, stack);
    if (stack.length === 0) {
      return this.clearTemporary(identity);
    }
    return this.switch(identity, stack[stack.length - 1]!);
  }

  async createSnapshot(
    identity: RuntimeIdentity
  ): Promise<ContextSnapshotRecord> {
    const active = await this.resolveOrThrow({
      identity,
      includeTemporary: true,
    });
    const record = this.store.createSnapshot(identity.principalId, active);
    const payload: ContextSnapshotCreatedPayload = {
      snapshotId: record.snapshotId,
      contextId: active.contextId,
    };
    await this.events?.publish(
      CONTEXT_EVENT_TYPES.CONTEXT_SNAPSHOT_CREATED,
      payload
    );
    return record;
  }

  async restoreSnapshot(
    identity: RuntimeIdentity,
    snapshotId: string
  ): Promise<ContextSnapshot> {
    const record = this.store.restoreSnapshot(
      identity.principalId,
      snapshotId
    );
    if (!record) {
      throw new RuntimeContextError(`Unknown context snapshot: ${snapshotId}`, {
        code: "CONTEXT_SNAPSHOT_MISS",
      });
    }
    const active =
      this.store.getTemporary(
        identity.principalId,
        identity.activeOrganizationId
      ) ??
      this.store.getPersistent(
        identity.principalId,
        identity.activeOrganizationId
      ) ??
      record.snapshot;

    const payload: ContextRestoredPayload = {
      snapshotId,
      contextId: active.contextId,
    };
    await this.events?.publish(CONTEXT_EVENT_TYPES.CONTEXT_RESTORED, payload);
    return active;
  }

  getActive(identity: RuntimeIdentity): ContextSnapshot | null {
    return (
      this.store.getTemporary(
        identity.principalId,
        identity.activeOrganizationId
      ) ??
      this.store.getPersistent(
        identity.principalId,
        identity.activeOrganizationId
      )
    );
  }

  createPipelineStage(): RuntimePipelineStage {
    return {
      id: "context",
      order: RUNTIME_PIPELINE_STAGE_ORDER.context,
      execute: async (ctx: RuntimeContext) => {
        ctx.throwIfCancelled();
        const identity = ctx.state.identity;
        if (!identity) {
          throw new RuntimeContextError(
            "Identity required before Context stage",
            { code: "CONTEXT_REQUIRES_IDENTITY" }
          );
        }
        const request = contextRequestFromExecution(ctx, identity);
        const snapshot = await this.resolveOrThrow(request);
        ctx.setOrganizationalContext(toOrganizationalContext(snapshot));
        ctx.state.data.contextSnapshot = snapshot;
      },
    };
  }

  private allProviders(): ContextProvider[] {
    const fromLocal = this.providers.list();
    const fromExternal = this.listProviders?.() ?? [];
    const byId = new Map<string, ContextProvider>();
    for (const p of [...fromExternal, ...fromLocal]) {
      byId.set(p.id, p);
    }
    return [...byId.values()].sort(
      (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
    );
  }

  private async resolveInternal(
    request: ContextResolutionRequest
  ): Promise<ContextSnapshot> {
    if (request.signal?.aborted) {
      throw new RuntimeCancellationError();
    }

    const now = request.now ?? new Date().toISOString();
    const includeTemporary = request.includeTemporary !== false;

    if (includeTemporary && !request.selection?.contextId) {
      const temp = this.store.getTemporary(
        request.identity.principalId,
        request.identity.activeOrganizationId
      );
      if (temp) {
        await this.publishResolved(temp, request);
        return temp;
      }
    }

    if (!request.selection?.contextId && !request.selection?.legacySurfaceId) {
      const persistent = this.store.getPersistent(
        request.identity.principalId,
        request.identity.activeOrganizationId
      );
      if (persistent && !request.selection) {
        await this.publishResolved(persistent, request);
        return persistent;
      }
    }

    const available = await this.discover(request.identity);
    let snapshot = this.resolver.buildSnapshot({
      identity: request.identity,
      available,
      selection: request.selection,
      parent: this.store.getPersistent(
        request.identity.principalId,
        request.identity.activeOrganizationId
      ),
      mode: "persistent",
      now,
    });

    snapshot = await applyProviderEnrichment(
      this.allProviders(),
      request.identity,
      snapshot,
      request.selection
    );

    if (!this.store.getPersistent(request.identity.principalId, snapshot.organizationId)) {
      this.store.setPersistent(request.identity.principalId, snapshot);
    }

    await this.publishResolved(snapshot, request);
    return snapshot;
  }

  private async publishResolved(
    snapshot: ContextSnapshot,
    request: ContextResolutionRequest
  ): Promise<void> {
    const payload: ContextResolvedPayload = {
      contextId: snapshot.contextId,
      contextFamily: snapshot.contextFamily,
      organizationId: snapshot.organizationId,
      mode: snapshot.mode,
      depth: snapshot.depth,
    };
    await this.events?.publish(CONTEXT_EVENT_TYPES.CONTEXT_RESOLVED, payload, {
      correlationId: request.correlationId,
      sessionId: request.sessionId,
      organizationId: snapshot.organizationId,
      actorUserId: request.identity.principalId,
      effectiveUserId: request.identity.effectiveUserId,
    });
  }

  private async publishEntered(snapshot: ContextSnapshot): Promise<void> {
    const payload: ContextEnteredPayload = {
      contextId: snapshot.contextId,
      organizationId: snapshot.organizationId,
      mode: snapshot.mode,
    };
    await this.events?.publish(CONTEXT_EVENT_TYPES.CONTEXT_ENTERED, payload);
  }

  private async publishExited(snapshot: ContextSnapshot): Promise<void> {
    const payload: ContextExitedPayload = {
      contextId: snapshot.contextId,
      organizationId: snapshot.organizationId,
    };
    await this.events?.publish(CONTEXT_EVENT_TYPES.CONTEXT_EXITED, payload);
  }

  private async publishFailed(
    payload: ContextResolutionFailedPayload
  ): Promise<void> {
    await this.events?.publish(
      CONTEXT_EVENT_TYPES.CONTEXT_RESOLUTION_FAILED,
      payload
    );
  }
}

export function contextRequestFromExecution(
  ctx: RuntimeContext,
  identity: RuntimeIdentity
): ContextResolutionRequest {
  const data = ctx.state.data;
  const selection =
    data.contextSelection &&
    typeof data.contextSelection === "object" &&
    data.contextSelection !== null
      ? (data.contextSelection as ContextSelection)
      : undefined;

  return {
    identity,
    selection: selection ?? {
      contextId:
        typeof data.contextId === "string" ? data.contextId : undefined,
      workspaceId:
        typeof data.workspaceId === "string" ? data.workspaceId : undefined,
      legacySurfaceId:
        typeof data.legacySurfaceId === "string"
          ? data.legacySurfaceId
          : undefined,
    },
    includeTemporary: true,
    correlationId: ctx.correlationId,
    sessionId: ctx.sessionId,
    signal: ctx.signal,
  };
}
