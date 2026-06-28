import { dispatchEvent, flushAsyncEventQueue } from "@/lib/platform/events/dispatch/dispatcher";
import { buildEventAuditEntry, recordEventAuditEntry } from "@/lib/platform/events/audit/audit";
import { buildEventEnvelope } from "@/lib/platform/events/envelope";
import { getEventDefinition } from "@/lib/platform/events/registry/registry";
import type {
  EventDispatchResult,
  EventScope,
  PublishEventInput,
} from "@/lib/platform/events/types";

export interface PublishEventOptions {
  dispatcherKey?: string;
  recordAudit?: boolean;
  subscriberKeys?: string[];
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
    if (options.recordAudit !== false) {
      recordEventAuditEntry(
        buildEventAuditEntry(envelope, {
          domain: definition.domain,
          dispatchMode: "async",
          scope,
          subscriberResults: asyncResults,
          summary: `Async dispatch for ${envelope.eventType}`,
          metadata: envelope.metadata,
        })
      );
    }
    return {
      ...dispatchResult,
      syncResults: asyncResults,
    };
  }

  return dispatchResult;
}
