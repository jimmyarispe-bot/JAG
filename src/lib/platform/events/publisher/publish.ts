import { dispatchEvent, flushAsyncEventQueue } from "@/lib/platform/events/dispatch/dispatcher";
import {
  buildEventAuditEntry,
  getEventAuditEntries,
  recordEventAuditEntry,
} from "@/lib/platform/events/audit/audit";
import { buildEventEnvelope } from "@/lib/platform/events/envelope";
import { persistEventAuditEntry } from "@/lib/platform/events/persistence/records";
import { syncEventGraphEdges } from "@/lib/platform/intelligence-graph/integration/events";
import { getEventDefinition } from "@/lib/platform/events/registry/registry";
import type { createAuthClient } from "@/lib/supabase/server-auth";
import type {
  EventAuditEntry,
  EventDispatchResult,
  EventScope,
  PublishEventInput,
} from "@/lib/platform/events/types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

export interface PublishEventOptions {
  dispatcherKey?: string;
  recordAudit?: boolean;
  subscriberKeys?: string[];
  /** Wave 1 — persist audit entry to platform_event_records when provided. */
  persist?: {
    supabase: AuthClient;
  };
}

async function recordAndPersistAudit(
  entry: EventAuditEntry,
  options: PublishEventOptions
): Promise<void> {
  if (options.recordAudit === false) return;

  recordEventAuditEntry(entry);

  if (options.persist?.supabase) {
    const { error } = await persistEventAuditEntry(options.persist.supabase, entry);
    if (error) {
      throw new Error(`Failed to persist platform event "${entry.eventId}": ${error}`);
    }
    await syncEventGraphEdges(options.persist.supabase, entry);
  }
}

async function persistBufferedAuditEntry(
  eventId: string,
  options: PublishEventOptions
): Promise<void> {
  if (!options.persist?.supabase || options.recordAudit === false) return;
  const entry = getEventAuditEntries({ eventId })[0];
  if (!entry) return;
  const { error } = await persistEventAuditEntry(options.persist.supabase, entry);
  if (error) {
    throw new Error(`Failed to persist platform event "${eventId}": ${error}`);
  }
  await syncEventGraphEdges(options.persist.supabase, entry);
}

function resolveDispatchMode(
  input: PublishEventInput,
  definitionMode: "sync" | "async" | "both"
): "sync" | "async" {
  if (input.dispatchMode) return input.dispatchMode;
  if (definitionMode === "both") return "sync";
  return definitionMode;
}

function resolveScope(input: PublishEventInput, definitionScopes: EventScope[]): EventScope {
  if (input.scope) {
    if (!definitionScopes.includes(input.scope)) {
      throw new Error(
        `Scope "${input.scope}" is not supported for event type "${input.eventType}"`
      );
    }
    return input.scope;
  }
  return definitionScopes.includes("internal") ? "internal" : definitionScopes[0]!;
}

/**
 * Publish an event to the platform event bus.
 * Validates against the event registry, builds the envelope, and dispatches to subscribers.
 */
export async function publishEvent(
  input: PublishEventInput,
  options: PublishEventOptions = {}
): Promise<EventDispatchResult> {
  const definition = getEventDefinition(input.eventType);
  if (!definition) {
    throw new Error(`Unknown event type "${input.eventType}"`);
  }
  if (definition.status !== "active") {
    throw new Error(`Event type "${input.eventType}" is not active`);
  }

  if (definition.entityTypes?.length && !definition.entityTypes.includes("*")) {
    if (!definition.entityTypes.includes(input.entityType)) {
      throw new Error(
        `Entity type "${input.entityType}" is not valid for event "${input.eventType}"`
      );
    }
  }

  const dispatchMode = resolveDispatchMode(input, definition.dispatchMode);
  const scope = resolveScope(input, definition.scopes);

  const envelope = buildEventEnvelope({
    ...input,
    definitionVersion: definition.version,
    dispatchMode,
    scope,
  });

  const dispatchResult = await dispatchEvent({
    envelope,
    domain: definition.domain,
    dispatchMode,
    scope,
    subscriberKeys: options.subscriberKeys,
    dispatcherKey: options.dispatcherKey,
    recordAudit: options.recordAudit,
  });

  if (dispatchMode === "async") {
    const asyncResults = await flushAsyncEventQueue(options.dispatcherKey);
    await recordAndPersistAudit(
      buildEventAuditEntry(envelope, {
        domain: definition.domain,
        dispatchMode: "async",
        scope,
        subscriberResults: asyncResults,
        summary: `Async dispatch for ${envelope.eventType}`,
        metadata: envelope.metadata,
      }),
      options
    );
    return {
      ...dispatchResult,
      syncResults: asyncResults,
    };
  }

  await persistBufferedAuditEntry(dispatchResult.eventId, options);

  return dispatchResult;
}
