/** Platform Event Engine — B-06 foundation + Sprint 024 Event Bus types */

export const EVENT_DEFINITION_STATUSES = ["draft", "active", "archived", "deprecated"] as const;
export type EventDefinitionStatus = (typeof EVENT_DEFINITION_STATUSES)[number];

export const EVENT_DISPATCH_MODES = ["sync", "async", "both"] as const;
export type EventDispatchMode = (typeof EVENT_DISPATCH_MODES)[number];

/** Event visibility scope — external_webhook is interface-only in Phase 1. */
export const EVENT_SCOPES = ["internal", "external_webhook"] as const;
export type EventScope = (typeof EVENT_SCOPES)[number];

/** Sprint 024 — platform-wide event categories (product-agnostic). */
export const EVENT_CATEGORIES = [
  "identity",
  "organization",
  "security",
  "audit",
  "workflow",
  "billing",
  "knowledge_graph",
  "executive_graph",
  "ai",
  "marketplace",
  "connector",
  "application",
] as const;
export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export const EVENT_DELIVERY_MODES = [
  "immediate",
  "queued",
  "scheduled",
  "retry",
] as const;
export type EventDeliveryMode = (typeof EVENT_DELIVERY_MODES)[number];

export interface EventDefinition {
  eventType: string;
  name: string;
  description?: string;
  /** Consuming module domain key — bus is domain-agnostic. */
  domain: string;
  /** Sprint 024 category for discovery. */
  category?: EventCategory;
  version: number;
  status: EventDefinitionStatus;
  /** Default dispatch behavior for this event type. */
  dispatchMode: EventDispatchMode;
  /** Supported delivery scopes for this event type. */
  scopes: EventScope[];
  /** Entity types this event may reference. */
  entityTypes?: string[];
  sortOrder?: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
  /** Human documentation for registry discovery. */
  documentation?: string;
  deprecated?: boolean;
  deprecatedAt?: string;
  replacedBy?: string;
}

export interface EventRegistrySnapshot {
  definitions: EventDefinition[];
  domains: string[];
  registeredAt: string;
}

/** Extensible metadata carried on every event envelope. */
export interface EventMetadata {
  source?: string;
  moduleKey?: string;
  traceId?: string;
  /** Cross-request correlation (HTTP / workflow). */
  requestId?: string;
  applicationId?: string;
  category?: EventCategory;
  deliveryMode?: "sync" | "async";
  busDelivery?: EventDeliveryMode;
  scope?: EventScope;
  /** Reserved for future external webhook routing — no delivery in Phase 1. */
  externalWebhookTarget?: string | null;
  audit?: Record<string, unknown>;
  [key: string]: unknown;
}

/** Canonical platform event envelope — uniform for all publishers and subscribers. */
export interface PlatformEventEnvelope {
  eventId: string;
  eventType: string;
  entityType: string;
  entityId: string;
  organizationId: string | null;
  schoolId: string | null;
  actorId: string | null;
  timestamp: string;
  payload: Record<string, unknown>;
  metadata: EventMetadata;
  version: number;
  correlationId: string;
  causationId: string | null;
}

/** Sprint 024 aliases — same runtime shape as PlatformEventEnvelope. */
export type EventEnvelope = PlatformEventEnvelope;
export type Event = PlatformEventEnvelope;

export interface EventContext {
  organizationId: string | null;
  schoolId: string | null;
  actorId: string | null;
  applicationId: string | null;
  correlationId: string;
  requestId: string | null;
  category: EventCategory | null;
}

export interface PublishEventInput {
  eventType: string;
  entityType: string;
  entityId: string;
  organizationId?: string | null;
  schoolId?: string | null;
  actorId?: string | null;
  payload?: Record<string, unknown>;
  metadata?: EventMetadata;
  correlationId?: string;
  causationId?: string | null;
  requestId?: string;
  applicationId?: string;
  /** Override definition default dispatch mode for this publish. */
  dispatchMode?: "sync" | "async";
  /** Override definition default scope for this publish. */
  scope?: EventScope;
  /** Sprint 024 delivery mode (maps onto sync/async + schedule). */
  delivery?: EventDeliveryMode;
}

export interface EventHandlerResult {
  subscriberKey: string;
  success: boolean;
  error?: string;
  dispatchMode: "sync" | "async";
}

export interface EventDispatchResult {
  eventId: string;
  dispatched: boolean;
  dispatchMode: "sync" | "async";
  scope: EventScope;
  syncResults: EventHandlerResult[];
  asyncQueued: boolean;
  errors: string[];
}

export type EventSubscriberFilter = (envelope: PlatformEventEnvelope) => boolean;

export interface EventSubscriberDefinition {
  subscriberKey: string;
  label?: string;
  /** Empty or omitted = receive all registered event types. */
  eventTypes?: string[];
  /** Which dispatch modes this subscriber handles. */
  dispatchModes?: ("sync" | "async")[];
  /** Which scopes this subscriber handles. */
  scopes?: EventScope[];
  /** Higher runs first (default 0). */
  priority?: number;
  /** Remove after first successful invocation. */
  once?: boolean;
  /** Category filter (optional). */
  categories?: EventCategory[];
  /** Organization isolation filter (optional). */
  organizationIds?: string[];
  /** Custom predicate filters. */
  filters?: EventSubscriberFilter[];
  handler: EventSubscriberHandler;
}

export type EventSubscriberHandler = (
  envelope: PlatformEventEnvelope
) => void | Promise<void>;

/** Sprint 024 unified result for publish/handler outcomes. */
export type EventResult = EventDispatchResult;

export interface ScheduledEventRecord {
  scheduleId: string;
  input: PublishEventInput;
  runAt: string;
  cancelled: boolean;
  createdAt: string;
}

export interface DeadLetterRecord {
  id: string;
  envelope: PlatformEventEnvelope;
  subscriberKey: string;
  error: string;
  attempts: number;
  enqueuedAt: string;
}

export interface EventAuditEntry {
  auditId: string;
  eventId: string;
  eventType: string;
  domain: string;
  dispatchMode: "sync" | "async";
  scope: EventScope;
  envelope: PlatformEventEnvelope;
  subscriberResults: EventHandlerResult[];
  summary: string;
  recordedAt: string;
  metadata?: Record<string, unknown>;
}

export interface EventReplayOptions {
  subscriberKeys?: string[];
  dispatchMode?: "sync" | "async";
  fromTimestamp?: string;
  toTimestamp?: string;
  /** Replay filters (Sprint 024). */
  organizationId?: string | null;
  applicationId?: string;
  eventTypes?: string[];
  eventType?: string;
}

export interface EventReplayResult {
  eventId: string;
  replayed: boolean;
  subscriberResults: EventHandlerResult[];
  errors: string[];
}

export interface EventReplayBatchResult {
  replayedCount: number;
  results: EventReplayResult[];
}
