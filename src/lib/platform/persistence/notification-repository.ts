import type {
  NotificationHistoryEntry,
  PlatformNotification,
} from "@/lib/platform/notifications/types";
import { HistoryRepository } from "@/lib/platform/persistence/history-repository";
import {
  dirtySets,
  markDirty,
  memoryStore,
} from "@/lib/platform/persistence/memory-store";
import type { PersistenceClient } from "@/lib/platform/persistence/types";

function withHistory(notification: PlatformNotification): PlatformNotification {
  const fromRepo = HistoryRepository.listNotificationHistory(notification.id);
  const history = fromRepo.length > 0 ? fromRepo : notification.history;
  return { ...notification, history: [...history] };
}

export const NotificationRepository = {
  getById(id: string): PlatformNotification | null {
    const row = memoryStore.notifications.get(id);
    return row ? withHistory(row) : null;
  },

  upsert(notification: PlatformNotification): PlatformNotification {
    const stored: PlatformNotification = {
      ...notification,
      history: [...notification.history],
    };
    memoryStore.notifications.set(stored.id, stored);
    markDirty("notifications", stored.id);
    HistoryRepository.replaceNotificationHistory(stored.id, stored.history);
    return withHistory(stored);
  },

  listForRecipient(recipientId: string): PlatformNotification[] {
    return [...memoryStore.notifications.values()]
      .filter((n) => n.recipientId === recipientId)
      .map(withHistory)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  listForDecision(decisionId: string): PlatformNotification[] {
    return [...memoryStore.notifications.values()]
      .filter((n) => n.decisionId === decisionId)
      .map(withHistory)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  listAll(): PlatformNotification[] {
    return [...memoryStore.notifications.values()]
      .map(withHistory)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async hydrate(client: PersistenceClient): Promise<number> {
    const { data: rows, error } = await client
      .from("platform_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5000);
    if (error || !rows) return 0;

    const { data: histRows } = await client
      .from("platform_notification_history")
      .select("*")
      .limit(50000);

    const historyByNotif = new Map<string, NotificationHistoryEntry[]>();
    for (const h of histRows ?? []) {
      const notificationId = String(h.notification_id);
      const entry: NotificationHistoryEntry = {
        id: String(h.id),
        action: h.action as NotificationHistoryEntry["action"],
        timestamp: String(h.timestamp),
        actorUserId: (h.actor_user_id as string | null) ?? null,
        reason: (h.reason as string | null) ?? null,
        toStatus: (h.to_status as NotificationHistoryEntry["toStatus"]) ?? null,
      };
      const list = historyByNotif.get(notificationId) ?? [];
      list.push(entry);
      historyByNotif.set(notificationId, list);
      memoryStore.notificationHistory.set(entry.id, { ...entry, notificationId });
    }

    for (const row of rows) {
      const id = String(row.id);
      const history = (historyByNotif.get(id) ?? []).sort((a, b) =>
        a.timestamp.localeCompare(b.timestamp)
      );
      const notification: PlatformNotification = {
        id,
        recipientId: String(row.recipient_id),
        organizationId: (row.organization_id as string | null) ?? null,
        applicationId: (row.application_id as string | null) ?? null,
        decisionId: String(row.decision_id),
        type: row.type as PlatformNotification["type"],
        priority: row.priority as PlatformNotification["priority"],
        status: row.status as PlatformNotification["status"],
        channel: row.channel as PlatformNotification["channel"],
        title: String(row.title),
        body: String(row.body ?? ""),
        createdAt: String(row.created_at),
        deliveredAt: (row.delivered_at as string | null) ?? null,
        readAt: (row.read_at as string | null) ?? null,
        acknowledgedAt: (row.acknowledged_at as string | null) ?? null,
        archivedAt: (row.archived_at as string | null) ?? null,
        history,
      };
      memoryStore.notifications.set(id, notification);
    }
    return rows.length;
  },

  async flush(client: PersistenceClient): Promise<void> {
    for (const id of dirtySets.notifications) {
      const n = memoryStore.notifications.get(id);
      if (!n) continue;
      const { error } = await client.from("platform_notifications").upsert({
        id: n.id,
        recipient_id: n.recipientId,
        organization_id: n.organizationId,
        application_id: n.applicationId,
        decision_id: n.decisionId,
        type: n.type,
        priority: n.priority,
        status: n.status,
        channel: n.channel,
        title: n.title,
        body: n.body,
        created_at: n.createdAt,
        delivered_at: n.deliveredAt,
        read_at: n.readAt,
        acknowledged_at: n.acknowledgedAt,
        archived_at: n.archivedAt,
        payload: {},
      });
      if (error) throw new Error(`Notification flush failed: ${error.message}`);
    }

    for (const id of dirtySets.notificationHistory) {
      const h = memoryStore.notificationHistory.get(id);
      if (!h) continue;
      const { error } = await client.from("platform_notification_history").upsert({
        id: h.id,
        notification_id: h.notificationId,
        action: h.action,
        timestamp: h.timestamp,
        actor_user_id: h.actorUserId,
        reason: h.reason,
        to_status: h.toStatus,
      });
      if (error) {
        throw new Error(`Notification history flush failed: ${error.message}`);
      }
    }
  },
} as const;
