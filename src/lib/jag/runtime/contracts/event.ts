import type { CorrelationId, EventId, SessionId } from "../types/ids";

/**
 * Typed Runtime event envelope.
 * Channel convention: jag.runtime.<subsystem>.<name>
 */
export interface RuntimeEvent<TPayload = unknown> {
  eventId: EventId;
  eventType: string;
  occurredAt: string;
  correlationId?: CorrelationId;
  sessionId?: SessionId;
  organizationId?: string;
  actorUserId?: string;
  effectiveUserId?: string;
  schemaVersion: number;
  payload: TPayload;
}

export type RuntimeEventHandler<TPayload = unknown> = (
  event: RuntimeEvent<TPayload>
) => void | Promise<void>;

export interface RuntimeEventSubscription {
  id: string;
  eventType: string | "*";
  priority: number;
  handler: RuntimeEventHandler;
}

export type RuntimeEventMiddleware = (
  event: RuntimeEvent,
  next: (event: RuntimeEvent) => Promise<void>
) => Promise<void>;

/** Well-known kernel lifecycle event types. */
export const RUNTIME_KERNEL_EVENT_TYPES = {
  PIPELINE_STARTED: "jag.runtime.runtime.pipeline_started",
  PIPELINE_COMPLETED: "jag.runtime.runtime.pipeline_completed",
  PIPELINE_ABORTED: "jag.runtime.runtime.pipeline_aborted",
  STAGE_STARTED: "jag.runtime.runtime.stage_started",
  STAGE_COMPLETED: "jag.runtime.runtime.stage_completed",
  STAGE_FAILED: "jag.runtime.runtime.stage_failed",
  STAGE_SKIPPED: "jag.runtime.runtime.stage_skipped",
  RUNTIME_STARTED: "jag.runtime.runtime.started",
  RUNTIME_STOPPED: "jag.runtime.runtime.stopped",
  EXTENSION_REGISTERED: "jag.runtime.runtime.extension_registered",
  EXTENSION_UNREGISTERED: "jag.runtime.runtime.extension_unregistered",
  BUDGET_EXCEEDED: "jag.runtime.runtime.budget_exceeded",
} as const;
