import {
  acknowledgeNotification,
  archiveNotification,
  markNotificationRead,
} from "@/lib/platform/notifications/acknowledgement";
import {
  buildAssigneeDecisionBuckets,
  buildFounderAccountabilityBuckets,
  notifyDecisionAssignment,
} from "@/lib/platform/notifications/assignment";
import {
  NOTIFICATION_CHANNELS,
  listImplementedChannels,
} from "@/lib/platform/notifications/channels";
import {
  dispatchAssignmentNotification,
  getStoredNotification,
  listAllNotifications,
  listNotificationsForDecision,
  listNotificationsForRecipient,
  upsertStoredNotification,
} from "@/lib/platform/notifications/dispatcher";
import {
  getNotificationPreferences,
  setNotificationPreferences,
} from "@/lib/platform/notifications/preferences";
import type {
  CreateAssignmentNotificationInput,
  PlatformNotification,
} from "@/lib/platform/notifications/types";
import type { PlatformDecision } from "@/lib/platform/decisions/types";

export const NotificationService = {
  channels: NOTIFICATION_CHANNELS,
  implementedChannels: listImplementedChannels,

  dispatchAssignment(input: CreateAssignmentNotificationInput): PlatformNotification {
    return dispatchAssignmentNotification(input);
  },

  notifyAssignment(input: {
    decision: PlatformDecision;
    reassigned?: boolean;
    actorUserId?: string | null;
    now?: string;
  }): PlatformNotification | null {
    return notifyDecisionAssignment(input);
  },

  listForRecipient(recipientId: string): PlatformNotification[] {
    return listNotificationsForRecipient(recipientId);
  },

  listForDecision(decisionId: string): PlatformNotification[] {
    return listNotificationsForDecision(decisionId);
  },

  listAll(): PlatformNotification[] {
    return listAllNotifications();
  },

  getById(id: string): PlatformNotification | null {
    return getStoredNotification(id);
  },

  markRead(id: string, actorUserId?: string | null, now?: string): PlatformNotification {
    const existing = getStoredNotification(id);
    if (!existing) throw new Error(`Notification not found: ${id}`);
    const updated = markNotificationRead(existing, { actorUserId, now });
    upsertStoredNotification(updated);
    return updated;
  },

  acknowledge(
    id: string,
    input?: { actorUserId?: string | null; now?: string; reason?: string | null }
  ): PlatformNotification {
    const existing = getStoredNotification(id);
    if (!existing) throw new Error(`Notification not found: ${id}`);
    const updated = acknowledgeNotification(existing, input ?? {});
    upsertStoredNotification(updated);
    return updated;
  },

  archive(
    id: string,
    input?: { actorUserId?: string | null; now?: string; reason?: string | null }
  ): PlatformNotification {
    const existing = getStoredNotification(id);
    if (!existing) throw new Error(`Notification not found: ${id}`);
    const updated = archiveNotification(existing, input ?? {});
    upsertStoredNotification(updated);
    return updated;
  },

  getPreferences: getNotificationPreferences,
  setPreferences: setNotificationPreferences,

  founderBuckets: buildFounderAccountabilityBuckets,
  assigneeBuckets: buildAssigneeDecisionBuckets,
} as const;

export type NotificationServiceApi = typeof NotificationService;
