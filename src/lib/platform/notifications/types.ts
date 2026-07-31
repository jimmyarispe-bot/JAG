/**
 * Assignment & Notification Engine (Sprint 067).
 * In-app delivery for RC1; channel architecture is pluggable.
 */

import type { DecisionOwnerRole, DecisionPriority } from "@/lib/platform/decisions/types";

export type NotificationStatus =
  | "pending"
  | "delivered"
  | "read"
  | "acknowledged"
  | "archived";

export type NotificationChannelId =
  | "in_app"
  | "email"
  | "sms"
  | "push"
  | "microsoft_teams"
  | "slack";

export type NotificationType =
  | "decision_assigned"
  | "decision_reassigned"
  | "decision_due_soon"
  | "decision_overdue"
  | "automation_alert";

export type NotificationHistoryAction =
  | "created"
  | "delivered"
  | "read"
  | "acknowledged"
  | "archived";

export type NotificationHistoryEntry = {
  id: string;
  action: NotificationHistoryAction;
  timestamp: string;
  actorUserId: string | null;
  reason: string | null;
  toStatus: NotificationStatus | null;
};

export type PlatformNotification = {
  id: string;
  recipientId: string;
  organizationId: string | null;
  applicationId: string | null;
  decisionId: string;
  type: NotificationType;
  priority: DecisionPriority;
  status: NotificationStatus;
  channel: NotificationChannelId;
  title: string;
  body: string;
  createdAt: string;
  deliveredAt: string | null;
  readAt: string | null;
  acknowledgedAt: string | null;
  archivedAt: string | null;
  history: NotificationHistoryEntry[];
};

export type NotificationChannel = {
  id: NotificationChannelId;
  label: string;
  /** RC1: only in_app is implemented. */
  implemented: boolean;
};

export type NotificationPreferences = {
  userId: string;
  channels: Partial<Record<NotificationChannelId, boolean>>;
  quietHours: { startHourUtc: number; endHourUtc: number } | null;
};

export type CreateAssignmentNotificationInput = {
  decisionId: string;
  recipientId: string;
  organizationId: string | null;
  applicationId: string | null;
  priority: DecisionPriority;
  title: string;
  body: string;
  type?: NotificationType;
  actorUserId?: string | null;
  now?: string;
  channel?: NotificationChannelId;
};

export type AssignmentTarget = {
  role: DecisionOwnerRole;
  userId?: string | null;
  displayName?: string | null;
};

export type DecisionAccountabilityBuckets = {
  unassigned: string[];
  overdue: string[];
  unacknowledged: string[];
  assigned: string[];
  waitingAcknowledgement: string[];
  inProgress: string[];
  completed: string[];
};

export type AssigneeDecisionBuckets = {
  myDecisions: string[];
  dueToday: string[];
  overdue: string[];
  recentlyAssigned: string[];
};
