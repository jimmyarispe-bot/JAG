/**
 * Sprint 024 — Platform Event Bus composition root (DI).
 */

import {
  EventBusAnalytics,
  getEventBusAnalytics,
} from "@/lib/platform/events/analytics";
import {
  clearDeadLetters,
  listDeadLetters,
} from "@/lib/platform/events/dispatch/dead-letter";
import {
  clearAsyncEventQueue,
  getAsyncEventQueueLength,
  setEventDispatchMaxRetries,
} from "@/lib/platform/events/dispatch/dispatcher";
import {
  EventPublisher,
  type EventPublisherDependencies,
} from "@/lib/platform/events/publishers";
import {
  discoverEventDefinitions,
  getAllEventDefinitions,
  getEventDefinitionsByCategory,
} from "@/lib/platform/events/registry/registry";
import { replayAuditedEvents, replayEvents } from "@/lib/platform/events/replay/replay";
import {
  clearSubscribers,
  filters,
  once,
  priority,
  subscribe,
  unsubscribe,
} from "@/lib/platform/events/subscribers";
import type {
  EventDispatchResult,
  EventReplayBatchResult,
  EventReplayOptions,
  PlatformEventEnvelope,
  PublishEventInput,
  ScheduledEventRecord,
} from "@/lib/platform/events/types";

export type CreatePlatformEventBusOptions = EventPublisherDependencies & {
  maxRetryAttempts?: number;
  analytics?: EventBusAnalytics;
};

export type PlatformEventBus = {
  publisher: EventPublisher;
  analytics: EventBusAnalytics;
  publish: (
    input: PublishEventInput
  ) => Promise<EventDispatchResult>;
  publishMany: (
    inputs: readonly PublishEventInput[]
  ) => Promise<EventDispatchResult[]>;
  schedule: (input: PublishEventInput, runAt: Date | string) => ScheduledEventRecord;
  cancel: (scheduleId: string) => boolean;
  flushDue: () => Promise<EventDispatchResult[]>;
  subscribe: typeof subscribe;
  unsubscribe: typeof unsubscribe;
  once: typeof once;
  priority: typeof priority;
  filters: typeof filters;
  discover: typeof discoverEventDefinitions;
  listDefinitions: typeof getAllEventDefinitions;
  byCategory: typeof getEventDefinitionsByCategory;
  replay: (
    envelopes: PlatformEventEnvelope[],
    options?: EventReplayOptions
  ) => Promise<EventReplayBatchResult>;
  replayAudited: typeof replayAuditedEvents;
  deadLetters: typeof listDeadLetters;
  clearDeadLetters: typeof clearDeadLetters;
  queueDepth: () => number;
  clearQueue: typeof clearAsyncEventQueue;
  metrics: () => ReturnType<EventBusAnalytics["snapshot"]>;
};

export function createPlatformEventBus(
  options: CreatePlatformEventBusOptions = {}
): PlatformEventBus {
  if (options.maxRetryAttempts != null) {
    setEventDispatchMaxRetries(options.maxRetryAttempts);
  }

  const analytics = options.analytics ?? getEventBusAnalytics();
  const publisher = new EventPublisher({
    now: options.now,
    createId: options.createId,
    security: options.security,
    publishOptions: options.publishOptions,
  });

  return {
    publisher,
    analytics,
    publish: (input) => publisher.publish(input),
    publishMany: (inputs) => publisher.publishMany(inputs),
    schedule: (input, runAt) => publisher.schedule(input, runAt),
    cancel: (scheduleId) => publisher.cancel(scheduleId),
    flushDue: () => publisher.flushDue(),
    subscribe,
    unsubscribe,
    once,
    priority,
    filters,
    discover: discoverEventDefinitions,
    listDefinitions: getAllEventDefinitions,
    byCategory: getEventDefinitionsByCategory,
    replay: replayEvents,
    replayAudited: replayAuditedEvents,
    deadLetters: listDeadLetters,
    clearDeadLetters,
    queueDepth: getAsyncEventQueueLength,
    clearQueue: clearAsyncEventQueue,
    metrics: () => analytics.snapshot(),
  };
}

/** Reset in-memory bus state for tests. */
export function resetPlatformEventBusRuntime(): void {
  clearAsyncEventQueue();
  clearDeadLetters();
  clearSubscribers();
  getEventBusAnalytics().reset();
  setEventDispatchMaxRetries(1);
}
