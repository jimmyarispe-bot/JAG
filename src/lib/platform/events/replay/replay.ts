import {
  getAuditedEventEnvelopes,
  getEventAuditEntries,
} from "@/lib/platform/events/audit/audit";
import { dispatchEvent, flushAsyncEventQueue } from "@/lib/platform/events/dispatch/dispatcher";
import { getEventDefinition } from "@/lib/platform/events/registry/registry";
import { resolveEventSubscribers } from "@/lib/platform/events/subscriber/subscribe";
import type {
  EventHandlerResult,
  EventReplayBatchResult,
  EventReplayOptions,
  EventReplayResult,
  PlatformEventEnvelope,
} from "@/lib/platform/events/types";

export interface EventReplayer {
  replay(
    envelopes: PlatformEventEnvelope[],
    options?: EventReplayOptions
  ): Promise<EventReplayBatchResult>;
}

/** Default in-memory event replayer — replays audited envelopes to subscribers. */
export const defaultEventReplayer: EventReplayer = {
  async replay(envelopes, options = {}) {
    const results: EventReplayResult[] = [];
    let replayedCount = 0;

    const filtered = envelopes.filter((envelope) => {
      if (options.fromTimestamp && envelope.timestamp < options.fromTimestamp) return false;
      if (options.toTimestamp && envelope.timestamp > options.toTimestamp) return false;
      return true;
    });

    for (const envelope of filtered) {
      const definition = getEventDefinition(envelope.eventType);
      const domain = definition?.domain ?? "unknown";
      const scope = envelope.metadata.scope ?? "internal";
      const dispatchMode = options.dispatchMode ?? envelope.metadata.deliveryMode ?? "sync";

      const dispatchResult = await dispatchEvent({
        envelope,
        domain,
        dispatchMode,
        scope,
        subscriberKeys: options.subscriberKeys,
        recordAudit: false,
      });

      if (dispatchMode === "async") {
        const asyncResults = await flushAsyncEventQueue();
        dispatchResult.syncResults.push(...asyncResults);
      }

      const replayed = dispatchResult.dispatched;
      if (replayed) replayedCount += 1;

      results.push({
        eventId: envelope.eventId,
        replayed,
        subscriberResults: dispatchResult.syncResults,
        errors: dispatchResult.errors,
      });
    }

    return { replayedCount, results };
  },
};

const REPLAYERS = new Map<string, EventReplayer>();
REPLAYERS.set("default", defaultEventReplayer);

export function registerEventReplayer(key: string, replayer: EventReplayer): void {
  REPLAYERS.set(key, replayer);
}

export function getEventReplayer(key = "default"): EventReplayer {
  const replayer = REPLAYERS.get(key);
  if (!replayer) {
    throw new Error(`Unknown event replayer "${key}"`);
  }
  return replayer;
}

/** Replay events from the in-memory audit buffer. */
export async function replayAuditedEvents(
  options?: EventReplayOptions,
  replayerKey = "default"
): Promise<EventReplayBatchResult> {
  const envelopes = getAuditedEventEnvelopes();
  return getEventReplayer(replayerKey).replay(envelopes, options);
}

/** Replay explicit event envelopes (e.g. imported from persistence). */
export async function replayEvents(
  envelopes: PlatformEventEnvelope[],
  options?: EventReplayOptions,
  replayerKey = "default"
): Promise<EventReplayBatchResult> {
  return getEventReplayer(replayerKey).replay(envelopes, options);
}

/** Replay a single event by id from the audit buffer. */
export async function replayEventById(
  eventId: string,
  options?: EventReplayOptions,
  replayerKey = "default"
): Promise<EventReplayResult | null> {
  const entries = getEventAuditEntries({ eventId });
  const envelope = entries[0]?.envelope;
  if (!envelope) return null;

  const batch = await getEventReplayer(replayerKey).replay([envelope], options);
  return batch.results[0] ?? null;
}

/** Preview which subscribers would receive an envelope without dispatching. */
export function previewEventSubscribers(
  envelope: PlatformEventEnvelope,
  dispatchMode: "sync" | "async" = "sync",
  scope: "internal" | "external_webhook" = "internal",
  subscriberKeys?: string[]
): string[] {
  return resolveEventSubscribers(envelope, dispatchMode, scope, subscriberKeys).map(
    (subscriber) => subscriber.subscriberKey
  );
}

export type { EventHandlerResult };
