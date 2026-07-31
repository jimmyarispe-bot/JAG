import type {
  DecisionHistoryEntry,
} from "@/lib/platform/decisions/types";
import type { NotificationHistoryEntry } from "@/lib/platform/notifications/types";
import {
  markDirty,
  memoryStore,
} from "@/lib/platform/persistence/memory-store";

/** Append-only history repository (decision + notification). */
export const HistoryRepository = {
  appendDecisionHistory(
    decisionId: string,
    entry: DecisionHistoryEntry
  ): DecisionHistoryEntry {
    const row = { ...entry, decisionId };
    memoryStore.decisionHistory.set(entry.id, row);
    markDirty("decisionHistory", entry.id);
    return entry;
  },

  listDecisionHistory(decisionId: string): DecisionHistoryEntry[] {
    return [...memoryStore.decisionHistory.values()]
      .filter((h) => h.decisionId === decisionId)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(({ decisionId: _d, ...entry }) => entry);
  },

  replaceDecisionHistory(
    decisionId: string,
    entries: DecisionHistoryEntry[]
  ): void {
    for (const [id, row] of memoryStore.decisionHistory) {
      if (row.decisionId === decisionId) {
        memoryStore.decisionHistory.delete(id);
        markDirty("decisionHistory", id);
      }
    }
    for (const entry of entries) {
      HistoryRepository.appendDecisionHistory(decisionId, entry);
    }
  },

  appendNotificationHistory(
    notificationId: string,
    entry: NotificationHistoryEntry
  ): NotificationHistoryEntry {
    const row = { ...entry, notificationId };
    memoryStore.notificationHistory.set(entry.id, row);
    markDirty("notificationHistory", entry.id);
    return entry;
  },

  listNotificationHistory(notificationId: string): NotificationHistoryEntry[] {
    return [...memoryStore.notificationHistory.values()]
      .filter((h) => h.notificationId === notificationId)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map(({ notificationId: _n, ...entry }) => entry);
  },

  replaceNotificationHistory(
    notificationId: string,
    entries: NotificationHistoryEntry[]
  ): void {
    for (const [id, row] of memoryStore.notificationHistory) {
      if (row.notificationId === notificationId) {
        memoryStore.notificationHistory.delete(id);
        markDirty("notificationHistory", id);
      }
    }
    for (const entry of entries) {
      HistoryRepository.appendNotificationHistory(notificationId, entry);
    }
  },
} as const;
