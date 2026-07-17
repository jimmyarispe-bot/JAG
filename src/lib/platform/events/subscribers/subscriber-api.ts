/**
 * Sprint 024 — Subscriber API (subscribe / unsubscribe / once / priority / filters).
 */

import {
  clearEventSubscribers,
  getEventSubscriber,
  getRegisteredEventSubscribers,
  subscribeToEvents,
  unsubscribeFromEvents,
} from "@/lib/platform/events/subscriber/subscribe";
import type {
  EventCategory,
  EventScope,
  EventSubscriberDefinition,
  EventSubscriberFilter,
  EventSubscriberHandler,
} from "@/lib/platform/events/types";

export type SubscribeOptions = {
  label?: string;
  eventTypes?: string[];
  dispatchModes?: ("sync" | "async")[];
  scopes?: EventScope[];
  priority?: number;
  once?: boolean;
  categories?: EventCategory[];
  organizationIds?: string[];
  filters?: EventSubscriberFilter[];
};

let subscribeSequence = 0;

export function subscribe(
  handler: EventSubscriberHandler,
  options: SubscribeOptions = {}
): string {
  subscribeSequence += 1;
  const subscriberKey = `sub_${Date.now()}_${subscribeSequence}`;
  subscribeToEvents({
    subscriberKey,
    handler,
    label: options.label,
    eventTypes: options.eventTypes,
    dispatchModes: options.dispatchModes,
    scopes: options.scopes,
    priority: options.priority ?? 0,
    once: options.once ?? false,
    categories: options.categories,
    organizationIds: options.organizationIds,
    filters: options.filters,
  });
  return subscriberKey;
}

export function unsubscribe(subscriberKey: string): boolean {
  return unsubscribeFromEvents(subscriberKey);
}

export function once(
  handler: EventSubscriberHandler,
  options: Omit<SubscribeOptions, "once"> = {}
): string {
  return subscribe(handler, { ...options, once: true });
}

export function priority(
  value: number,
  handler: EventSubscriberHandler,
  options: Omit<SubscribeOptions, "priority"> = {}
): string {
  return subscribe(handler, { ...options, priority: value });
}

export function filters(
  predicates: EventSubscriberFilter[],
  handler: EventSubscriberHandler,
  options: Omit<SubscribeOptions, "filters"> = {}
): string {
  return subscribe(handler, { ...options, filters: predicates });
}

export function listSubscribers(): EventSubscriberDefinition[] {
  return getRegisteredEventSubscribers();
}

export function getSubscriber(subscriberKey: string): EventSubscriberDefinition | undefined {
  return getEventSubscriber(subscriberKey);
}

export function clearSubscribers(): void {
  clearEventSubscribers();
}
