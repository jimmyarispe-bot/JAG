import {
  buildEventAuditEntry,
  recordEventAuditEntry,
} from "@/lib/platform/events/audit/audit";
import { getEventBusAnalytics } from "@/lib/platform/events/analytics";
import { invokeWithRetry } from "@/lib/platform/events/dispatch/delivery";
import {
  resolveEventSubscribers,
  unsubscribeFromEvents,
} from "@/lib/platform/events/subscriber/subscribe";
import type {
  EventDispatchResult,
  EventHandlerResult,
  EventScope,
  PlatformEventEnvelope,
} from "@/lib/platform/events/types";

type AsyncQueueItem = {
  envelope: PlatformEventEnvelope;
  scope: EventScope;
  domain: string;
  subscriberKeys?: string[];
};

const ASYNC_QUEUE: AsyncQueueItem[] = [];
let asyncProcessing = false;
let maxRetryAttempts = 1;

export function setEventDispatchMaxRetries(attempts: number): void {
  maxRetryAttempts = Math.max(1, attempts);
}

export function getEventDispatchMaxRetries(): number {
  return maxRetryAttempts;
}

export interface EventDispatcher {
  dispatchSync(
    envelope: PlatformEventEnvelope,
    scope: EventScope,
    domain: string,
    subscriberKeys?: string[]
  ): Promise<EventHandlerResult[]>;
  dispatchAsync(
    envelope: PlatformEventEnvelope,
    scope: EventScope,
    domain: string,
    subscriberKeys?: string[]
  ): Promise<void>;
  flushAsyncQueue(): Promise<EventHandlerResult[]>;
}

async function invokeSubscriber(
  envelope: PlatformEventEnvelope,
  subscriberKey: string,
  handler: (envelope: PlatformEventEnvelope) => void | Promise<void>,
  dispatchMode: "sync" | "async",
  once?: boolean
): Promise<EventHandlerResult> {
  const result = await invokeWithRetry(
    envelope,
    subscriberKey,
    handler,
    dispatchMode,
    { maxAttempts: maxRetryAttempts }
  );
  if (result.success && once) {
    unsubscribeFromEvents(subscriberKey);
  }
  return result;
}

/** Default in-memory event dispatcher — no external message broker. */
export const defaultEventDispatcher: EventDispatcher = {
  async dispatchSync(envelope, scope, _domain, subscriberKeys) {
    const subscribers = resolveEventSubscribers(envelope, "sync", scope, subscriberKeys);
    const results: EventHandlerResult[] = [];

    for (const subscriber of subscribers) {
      const result = await invokeSubscriber(
        envelope,
        subscriber.subscriberKey,
        subscriber.handler,
        "sync",
        subscriber.once
      );
      results.push(result);
    }

    getEventBusAnalytics().setQueueDepth(ASYNC_QUEUE.length);
    return results;
  },

  async dispatchAsync(envelope, scope, domain, subscriberKeys) {
    ASYNC_QUEUE.push({ envelope, scope, domain, subscriberKeys });
    getEventBusAnalytics().setQueueDepth(ASYNC_QUEUE.length);
  },

  async flushAsyncQueue() {
    const allResults: EventHandlerResult[] = [];

    while (ASYNC_QUEUE.length > 0) {
      const item = ASYNC_QUEUE.shift()!;
      getEventBusAnalytics().setQueueDepth(ASYNC_QUEUE.length);
      const subscribers = resolveEventSubscribers(
        item.envelope,
        "async",
        item.scope,
        item.subscriberKeys
      );

      for (const subscriber of subscribers) {
        const result = await invokeSubscriber(
          item.envelope,
          subscriber.subscriberKey,
          subscriber.handler,
          "async",
          subscriber.once
        );
        allResults.push(result);
      }
    }

    return allResults;
  },
};

const DISPATCHERS = new Map<string, EventDispatcher>();
DISPATCHERS.set("default", defaultEventDispatcher);

export function registerEventDispatcher(key: string, dispatcher: EventDispatcher): void {
  DISPATCHERS.set(key, dispatcher);
}

export function getEventDispatcher(key = "default"): EventDispatcher {
  const dispatcher = DISPATCHERS.get(key);
  if (!dispatcher) {
    throw new Error(`Unknown event dispatcher "${key}"`);
  }
  return dispatcher;
}

export interface DispatchEventInput {
  envelope: PlatformEventEnvelope;
  domain: string;
  dispatchMode: "sync" | "async";
  scope: EventScope;
  subscriberKeys?: string[];
  dispatcherKey?: string;
  recordAudit?: boolean;
}

/** Dispatch an envelope to registered subscribers. */
export async function dispatchEvent(input: DispatchEventInput): Promise<EventDispatchResult> {
  const dispatcher = getEventDispatcher(input.dispatcherKey);
  const errors: string[] = [];
  let syncResults: EventHandlerResult[] = [];
  let asyncQueued = false;

  if (input.dispatchMode === "sync") {
    syncResults = await dispatcher.dispatchSync(
      input.envelope,
      input.scope,
      input.domain,
      input.subscriberKeys
    );
    for (const result of syncResults) {
      if (!result.success && result.error) errors.push(result.error);
    }
  } else {
    await dispatcher.dispatchAsync(
      input.envelope,
      input.scope,
      input.domain,
      input.subscriberKeys
    );
    asyncQueued = true;
  }

  if (input.recordAudit !== false && input.dispatchMode === "sync") {
    recordEventAuditEntry(
      buildEventAuditEntry(input.envelope, {
        domain: input.domain,
        dispatchMode: input.dispatchMode,
        scope: input.scope,
        subscriberResults: syncResults,
        summary: `Sync dispatch for ${input.envelope.eventType}`,
        metadata: input.envelope.metadata,
      })
    );
  }

  return {
    eventId: input.envelope.eventId,
    dispatched: syncResults.length > 0 || asyncQueued,
    dispatchMode: input.dispatchMode,
    scope: input.scope,
    syncResults,
    asyncQueued,
    errors,
  };
}

export async function flushAsyncEventQueue(dispatcherKey = "default"): Promise<EventHandlerResult[]> {
  return getEventDispatcher(dispatcherKey).flushAsyncQueue();
}

export function getAsyncEventQueueLength(): number {
  return ASYNC_QUEUE.length;
}

export function clearAsyncEventQueue(): void {
  ASYNC_QUEUE.length = 0;
  asyncProcessing = false;
  getEventBusAnalytics().setQueueDepth(0);
}

export function isAsyncEventProcessing(): boolean {
  return asyncProcessing;
}

export function setAsyncEventProcessing(value: boolean): void {
  asyncProcessing = value;
}
