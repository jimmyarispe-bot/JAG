/**
 * Integration Platform event types — producers and consumers stay decoupled.
 */

export const PLATFORM_EVENT_TYPES = [
  "PAYMENT_RECEIVED",
  "EMAIL_RECEIVED",
  "EMAIL_SENT",
  "EMAIL_UPDATED",
  "THREAD_UPDATED",
  "CALENDAR_UPDATED",
  "MEETING_CREATED",
  "MEETING_UPDATED",
  "MEETING_COMPLETED",
  "DOCUMENT_CHANGED",
  "DOCUMENT_CREATED",
  "DOCUMENT_SHARED",
  "USER_CREATED",
  "CONTACT_UPSERTED",
  "SYNC_COMPLETED",
  "SYNC_FAILED",
  "SYNC_STARTED",
  "CONNECTOR_FAILED",
  "CONNECTOR_CONNECTED",
  "CONNECTOR_DISCONNECTED",
  "CONNECTOR_HEALTH_CHANGED",
  "AUTH_REFRESHED",
  "WEBHOOK_RECEIVED",
  "NORMALIZATION_COMPLETED",
  "LIFECYCLE_CHANGED",
] as const;

export type PlatformEventType = (typeof PLATFORM_EVENT_TYPES)[number];

export type PlatformEvent = {
  readonly id: string;
  readonly type: PlatformEventType;
  readonly connectorId?: string;
  readonly instanceId?: string;
  readonly payload: Record<string, unknown>;
  readonly occurredAt: string;
};

export type PlatformEventHandler = (event: PlatformEvent) => void | Promise<void>;
