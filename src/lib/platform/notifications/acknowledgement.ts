import type {
  NotificationHistoryEntry,
  NotificationStatus,
  PlatformNotification,
} from "@/lib/platform/notifications/types";

let historySeq = 0;

export function resetNotificationHistorySequenceForTests(): void {
  historySeq = 0;
}

export function appendNotificationHistory(
  history: NotificationHistoryEntry[],
  input: {
    action: NotificationHistoryEntry["action"];
    timestamp: string;
    actorUserId?: string | null;
    reason?: string | null;
    toStatus?: NotificationStatus | null;
  }
): NotificationHistoryEntry[] {
  historySeq += 1;
  return [
    ...history,
    {
      id: `nhist:${historySeq}:${input.timestamp}`,
      action: input.action,
      timestamp: input.timestamp,
      actorUserId: input.actorUserId ?? null,
      reason: input.reason ?? null,
      toStatus: input.toStatus ?? null,
    },
  ];
}

const STATUS_RANK: Record<NotificationStatus, number> = {
  pending: 0,
  delivered: 1,
  read: 2,
  acknowledged: 3,
  archived: 4,
};

export function canAdvanceNotificationStatus(
  from: NotificationStatus,
  to: NotificationStatus
): boolean {
  if (from === "archived" && to !== "archived") return false;
  if (to === "archived") return from !== "archived";
  return STATUS_RANK[to] > STATUS_RANK[from];
}

export function markNotificationRead(
  notification: PlatformNotification,
  input: { actorUserId?: string | null; now?: string }
): PlatformNotification {
  if (notification.status === "acknowledged" || notification.status === "archived") {
    return notification;
  }
  if (notification.status === "read") return notification;

  const now = input.now ?? new Date().toISOString();
  return {
    ...notification,
    status: "read",
    readAt: now,
    history: appendNotificationHistory(notification.history, {
      action: "read",
      timestamp: now,
      actorUserId: input.actorUserId,
      toStatus: "read",
    }),
  };
}

export function acknowledgeNotification(
  notification: PlatformNotification,
  input: { actorUserId?: string | null; now?: string; reason?: string | null }
): PlatformNotification {
  if (notification.status === "archived") {
    throw new Error("Cannot acknowledge an archived notification");
  }
  if (notification.status === "acknowledged") return notification;

  const now = input.now ?? new Date().toISOString();
  return {
    ...notification,
    status: "acknowledged",
    readAt: notification.readAt ?? now,
    acknowledgedAt: now,
    history: appendNotificationHistory(notification.history, {
      action: "acknowledged",
      timestamp: now,
      actorUserId: input.actorUserId,
      reason: input.reason,
      toStatus: "acknowledged",
    }),
  };
}

export function archiveNotification(
  notification: PlatformNotification,
  input: { actorUserId?: string | null; now?: string; reason?: string | null }
): PlatformNotification {
  if (notification.status === "archived") return notification;
  const now = input.now ?? new Date().toISOString();
  return {
    ...notification,
    status: "archived",
    archivedAt: now,
    history: appendNotificationHistory(notification.history, {
      action: "archived",
      timestamp: now,
      actorUserId: input.actorUserId,
      reason: input.reason,
      toStatus: "archived",
    }),
  };
}
