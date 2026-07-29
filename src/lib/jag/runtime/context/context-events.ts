export const CONTEXT_EVENT_TYPES = {
  CONTEXT_RESOLVED: "jag.runtime.context.resolved",
  CONTEXT_CHANGED: "jag.runtime.context.changed",
  CONTEXT_ENTERED: "jag.runtime.context.entered",
  CONTEXT_EXITED: "jag.runtime.context.exited",
  CONTEXT_SNAPSHOT_CREATED: "jag.runtime.context.snapshot_created",
  CONTEXT_RESTORED: "jag.runtime.context.restored",
  CONTEXT_RESOLUTION_FAILED: "jag.runtime.context.resolution_failed",
} as const;

export type ContextEventType =
  (typeof CONTEXT_EVENT_TYPES)[keyof typeof CONTEXT_EVENT_TYPES];

export interface ContextResolvedPayload {
  contextId: string;
  contextFamily: string;
  organizationId: string;
  mode: "persistent" | "temporary";
  depth: number;
}

export interface ContextChangedPayload {
  fromContextId: string | null;
  toContextId: string;
  organizationId: string;
}

export interface ContextEnteredPayload {
  contextId: string;
  organizationId: string;
  mode: "persistent" | "temporary";
}

export interface ContextExitedPayload {
  contextId: string;
  organizationId: string;
}

export interface ContextSnapshotCreatedPayload {
  snapshotId: string;
  contextId: string;
}

export interface ContextRestoredPayload {
  snapshotId: string;
  contextId: string;
}

export interface ContextResolutionFailedPayload {
  reason: string;
  code: string;
  organizationId?: string;
}
