import { appendNotificationHistory } from "@/lib/platform/notifications/acknowledgement";
import {
  DEFAULT_NOTIFICATION_CHANNEL,
} from "@/lib/platform/notifications/channels";
import { deliverViaChannel } from "@/lib/platform/notifications/delivery";
import { resolvePreferredChannel } from "@/lib/platform/notifications/preferences";
import type {
  CreateAssignmentNotificationInput,
  PlatformNotification,
} from "@/lib/platform/notifications/types";
import {
  dirtySets,
  memoryStore,
  NotificationRepository,
} from "@/lib/platform/persistence";

export function resetNotificationStoreForTests(): void {
  memoryStore.notifications.clear();
  memoryStore.notificationHistory.clear();
  dirtySets.notifications.clear();
  dirtySets.notificationHistory.clear();
}

export function getStoredNotification(id: string): PlatformNotification | null {
  return NotificationRepository.getById(id);
}

export function upsertStoredNotification(
  notification: PlatformNotification
): void {
  NotificationRepository.upsert(notification);
}

export function listNotificationsForRecipient(
  recipientId: string
): PlatformNotification[] {
  return NotificationRepository.listForRecipient(recipientId);
}

export function listNotificationsForDecision(
  decisionId: string
): PlatformNotification[] {
  return NotificationRepository.listForDecision(decisionId);
}

export function listAllNotifications(): PlatformNotification[] {
  return NotificationRepository.listAll();
}

function buildNotificationId(
  decisionId: string,
  recipientId: string,
  createdAt: string
): string {
  return `notif:${decisionId}:${recipientId}:${createdAt}`;
}

/** Create a pending notification and immediately deliver via preferred channel. */
export function dispatchAssignmentNotification(
  input: CreateAssignmentNotificationInput
): PlatformNotification {
  const now = input.now ?? new Date().toISOString();
  const channel =
    input.channel ??
    resolvePreferredChannel(input.recipientId) ??
    DEFAULT_NOTIFICATION_CHANNEL;

  const pending: PlatformNotification = {
    id: buildNotificationId(input.decisionId, input.recipientId, now),
    recipientId: input.recipientId,
    organizationId: input.organizationId,
    applicationId: input.applicationId,
    decisionId: input.decisionId,
    type: input.type ?? "decision_assigned",
    priority: input.priority,
    status: "pending",
    channel,
    title: input.title,
    body: input.body,
    createdAt: now,
    deliveredAt: null,
    readAt: null,
    acknowledgedAt: null,
    archivedAt: null,
    history: appendNotificationHistory([], {
      action: "created",
      timestamp: now,
      actorUserId: input.actorUserId,
      toStatus: "pending",
    }),
  };

  const { notification: delivered } = deliverViaChannel(pending, channel, now);
  return NotificationRepository.upsert(delivered);
}
