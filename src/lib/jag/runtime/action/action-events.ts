export const ACTION_EVENT_TYPES = {
  ACTION_REQUESTED: "jag.runtime.action.requested",
  ACTION_AUTHORIZED: "jag.runtime.action.authorized",
  ACTION_DISPATCHED: "jag.runtime.action.dispatched",
  ACTION_COMPLETED: "jag.runtime.action.completed",
  ACTION_FAILED: "jag.runtime.action.failed",
  ACTION_REJECTED: "jag.runtime.action.rejected",
} as const;

export type ActionEventType =
  (typeof ACTION_EVENT_TYPES)[keyof typeof ACTION_EVENT_TYPES];

export interface ActionRequestedPayload {
  actionId: string;
  principalId: string;
  organizationId: string;
  cognitionBriefId: string;
  evidenceCount: number;
}

export interface ActionAuthorizedPayload {
  actionId: string;
  permission: string;
  effectiveUserId: string;
}

export interface ActionDispatchedPayload {
  actionId: string;
  providerId: string;
}

export interface ActionCompletedPayload {
  actionId: string;
  providerId?: string;
  status: string;
  auditEventId: string;
}

export interface ActionFailedPayload {
  actionId: string;
  providerId?: string;
  code: string;
  message: string;
  auditEventId: string;
}

export interface ActionRejectedPayload {
  actionId: string;
  code: string;
  message: string;
  auditEventId: string;
}
