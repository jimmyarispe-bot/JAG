import type {
  EventScope,
  EventSubscriberDefinition,
  EventSubscriberHandler,
  PlatformEventEnvelope,
} from "@/lib/platform/events/types";

const SUBSCRIBERS = new Map<string, EventSubscriberDefinition>();

export function subscribeToEvents(definition: EventSubscriberDefinition): void {
  SUBSCRIBERS.set(definition.subscriberKey, definition);
}

export function registerEventSubscriber(
  subscriberKey: string,
  handler: EventSubscriberHandler,
  options?: Omit<EventSubscriberDefinition, "subscriberKey" | "handler">
): void {
  subscribeToEvents({ subscriberKey, handler, ...options });
}

export function unsubscribeFromEvents(subscriberKey: string): boolean {
  return SUBSCRIBERS.delete(subscriberKey);
}

export function getEventSubscriber(subscriberKey: string): EventSubscriberDefinition | undefined {
  return SUBSCRIBERS.get(subscriberKey);
}

export function getRegisteredEventSubscribers(): EventSubscriberDefinition[] {
  return [...SUBSCRIBERS.values()];
}

export function clearEventSubscribers(): void {
  SUBSCRIBERS.clear();
}

function matchesEventType(subscriber: EventSubscriberDefinition, eventType: string): boolean {
  if (!subscriber.eventTypes?.length) return true;
  return subscriber.eventTypes.includes(eventType);
}

function matchesDispatchMode(
  subscriber: EventSubscriberDefinition,
  dispatchMode: "sync" | "async"
): boolean {
  if (!subscriber.dispatchModes?.length) return true;
  return subscriber.dispatchModes.includes(dispatchMode);
}

function matchesScope(subscriber: EventSubscriberDefinition, scope: EventScope): boolean {
  if (!subscriber.scopes?.length) return true;
  return subscriber.scopes.includes(scope);
}

/** Resolve subscribers eligible for a dispatched envelope. */
export function resolveEventSubscribers(
  envelope: PlatformEventEnvelope,
  dispatchMode: "sync" | "async",
  scope: EventScope,
  subscriberKeys?: string[]
): EventSubscriberDefinition[] {
  const keyFilter = subscriberKeys ? new Set(subscriberKeys) : null;

  return getRegisteredEventSubscribers().filter((subscriber) => {
    if (keyFilter && !keyFilter.has(subscriber.subscriberKey)) return false;
    if (!matchesEventType(subscriber, envelope.eventType)) return false;
    if (!matchesDispatchMode(subscriber, dispatchMode)) return false;
    if (!matchesScope(subscriber, scope)) return false;
    return true;
  });
}
