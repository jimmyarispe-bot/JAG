/** Platform Event Engine — B-06 Phase 1 foundation types */

export const EVENT_DEFINITION_STATUSES = ["draft", "active", "archived"] as const;
export type EventDefinitionStatus = (typeof EVENT_DEFINITION_STATUSES)[number];

export const EVENT_DISPATCH_MODES = ["sync", "async", "both"] as const;
export type EventDispatchMode = (typeof EVENT_DISPATCH_MODES)[number];

/** Event visibility scope — external_webhook is interface-only in Phase 1. */
export const EVENT_SCOPES = ["internal", "external_webhook"] as const;
export type EventScope = (typeof EVENT_SCOPES)[number];

export interface EventDefinition {
  eventType: string;
  name: string;
  description?: string;
  /** Consuming module domain key — bus is domain-agnostic. */
  domain: string;
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
  deliveryMode?: "sync" | "async";
  scope?: EventScope;
  /** Reserved for future external webhook routing — no delivery in Phase 1. */
  externalWebhookTarget?: string | null;
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
  /** Override definition default dispatch mode for this publish. */
  dispatchMode?: "sync" | "async";
  /** Override definition default scope for this publish. */
  scope?: EventScope;
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

export interface EventSubscriberDefinition {
  subscriberKey: string;
  label?: string;
  /** Empty or omitted = receive all registered event types. */
  eventTypes?: string[];
  /** Which dispatch modes this subscriber handles. */
  dispatchModes?: ("sync" | "async")[];
  /** Which scopes this subscriber handles. */
  scopes?: EventScope[];
  handler: EventSubscriberHandler;
}

export type EventSubscriberHandler = (
  envelope: PlatformEventEnvelope
) => void | Promise<void>;

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
