import type {
  PlatformOperatingEvent,
  PlatformOperatingEventType,
} from "@/lib/platform/readiness/types";

const MAX_EVENTS = 500;
const events: PlatformOperatingEvent[] = [];
let seq = 0;

export function resetPlatformEventsForTests(): void {
  events.length = 0;
  seq = 0;
}

/**
 * Emit a platform operating event into the in-process ring buffer.
 * No external logging infrastructure — contract only.
 */
export function emitPlatformEvent(input: {
  type: PlatformOperatingEventType;
  source: string;
  summary: string;
  applicationId?: string | null;
  entityType?: string | null;
  refId?: string | null;
  metadata?: Record<string, unknown>;
  occurredAt?: string;
}): PlatformOperatingEvent {
  seq += 1;
  const event: PlatformOperatingEvent = {
    id: `poe_${seq}`,
    type: input.type,
    occurredAt: input.occurredAt ?? new Date().toISOString(),
    source: input.source,
    applicationId: input.applicationId ?? null,
    entityType: input.entityType ?? null,
    refId: input.refId ?? null,
    summary: input.summary,
    metadata: { ...(input.metadata ?? {}) },
  };
  events.push(event);
  if (events.length > MAX_EVENTS) {
    events.splice(0, events.length - MAX_EVENTS);
  }
  return event;
}

export function listPlatformEvents(filter?: {
  type?: PlatformOperatingEventType;
  applicationId?: string | null;
  source?: string;
}): PlatformOperatingEvent[] {
  let rows = [...events];
  if (filter?.type) rows = rows.filter((e) => e.type === filter.type);
  if (filter?.applicationId !== undefined) {
    rows = rows.filter((e) => e.applicationId === filter.applicationId);
  }
  if (filter?.source) rows = rows.filter((e) => e.source === filter.source);
  return rows;
}

export function clearPlatformEvents(): void {
  events.length = 0;
}

/** Convenience emitters for standard operating moments. */
export const PlatformEvents = {
  registration: (
    source: string,
    summary: string,
    meta?: Partial<Parameters<typeof emitPlatformEvent>[0]>
  ) =>
    emitPlatformEvent({
      type: "registration",
      source,
      summary,
      ...meta,
    }),
  validation: (
    source: string,
    summary: string,
    meta?: Partial<Parameters<typeof emitPlatformEvent>[0]>
  ) =>
    emitPlatformEvent({
      type: "validation",
      source,
      summary,
      ...meta,
    }),
  workflowExecution: (
    source: string,
    summary: string,
    meta?: Partial<Parameters<typeof emitPlatformEvent>[0]>
  ) =>
    emitPlatformEvent({
      type: "workflow.execution",
      source,
      summary,
      ...meta,
    }),
  decisionCreated: (
    source: string,
    summary: string,
    meta?: Partial<Parameters<typeof emitPlatformEvent>[0]>
  ) =>
    emitPlatformEvent({
      type: "decision.created",
      source,
      summary,
      ...meta,
    }),
  notificationDispatch: (
    source: string,
    summary: string,
    meta?: Partial<Parameters<typeof emitPlatformEvent>[0]>
  ) =>
    emitPlatformEvent({
      type: "notification.dispatch",
      source,
      summary,
      ...meta,
    }),
  automationExecution: (
    source: string,
    summary: string,
    meta?: Partial<Parameters<typeof emitPlatformEvent>[0]>
  ) =>
    emitPlatformEvent({
      type: "automation.execution",
      source,
      summary,
      ...meta,
    }),
  graphRebuild: (
    source: string,
    summary: string,
    meta?: Partial<Parameters<typeof emitPlatformEvent>[0]>
  ) =>
    emitPlatformEvent({
      type: "graph.rebuild",
      source,
      summary,
      ...meta,
    }),
  list: listPlatformEvents,
  clear: clearPlatformEvents,
  resetForTests: resetPlatformEventsForTests,
} as const;
