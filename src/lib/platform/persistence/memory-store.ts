import type { AutomationRun } from "@/lib/platform/automation/operating/types";
import type {
  DecisionHistoryEntry,
  PlatformDecision,
} from "@/lib/platform/decisions/types";
import type {
  NotificationHistoryEntry,
  PlatformNotification,
} from "@/lib/platform/notifications/types";
import type {
  AutomationEvent,
  DirtySets,
  PersistenceSnapshot,
} from "@/lib/platform/persistence/types";

/** Process working set — hydrated from DB on request, flushed on write-through. */
export const memoryStore = {
  decisions: new Map<string, PlatformDecision>(),
  decisionHistory: new Map<string, DecisionHistoryEntry & { decisionId: string }>(),
  notifications: new Map<string, PlatformNotification>(),
  notificationHistory: new Map<
    string,
    NotificationHistoryEntry & { notificationId: string }
  >(),
  automationRuns: new Map<string, AutomationRun>(),
  automationEvents: new Map<string, AutomationEvent>(),
  /** Newest-first run id order for status lists. */
  automationRunOrder: [] as string[],
};

export const dirtySets: DirtySets = {
  decisions: new Set(),
  decisionHistory: new Set(),
  notifications: new Set(),
  notificationHistory: new Set(),
  automationRuns: new Set(),
  automationEvents: new Set(),
};

export function markDirty(
  kind: keyof DirtySets,
  id: string
): void {
  dirtySets[kind].add(id);
}

export function clearDirty(): void {
  for (const set of Object.values(dirtySets)) set.clear();
}

export function resetMemoryStoreForTests(): void {
  memoryStore.decisions.clear();
  memoryStore.decisionHistory.clear();
  memoryStore.notifications.clear();
  memoryStore.notificationHistory.clear();
  memoryStore.automationRuns.clear();
  memoryStore.automationEvents.clear();
  memoryStore.automationRunOrder = [];
  clearDirty();
}

export function snapshotMemoryStore(): PersistenceSnapshot {
  return {
    decisions: [...memoryStore.decisions.values()].map((d) => ({
      ...d,
      history: [...d.history],
      signalIds: [...d.signalIds],
    })),
    decisionHistory: [...memoryStore.decisionHistory.values()].map((h) => ({
      ...h,
    })),
    notifications: [...memoryStore.notifications.values()].map((n) => ({
      ...n,
      history: [...n.history],
    })),
    notificationHistory: [...memoryStore.notificationHistory.values()].map(
      (h) => ({ ...h })
    ),
    automationRuns: [...memoryStore.automationRuns.values()].map((r) => ({
      ...r,
      decisionsCreated: [...r.decisionsCreated],
      notificationsCreated: [...r.notificationsCreated],
      actionsExecuted: [...r.actionsExecuted],
    })),
    automationEvents: [...memoryStore.automationEvents.values()].map((e) => ({
      ...e,
      payload: e.payload ? { ...e.payload } : undefined,
    })),
  };
}

export function restoreMemoryStore(snapshot: PersistenceSnapshot): void {
  resetMemoryStoreForTests();
  for (const d of snapshot.decisions) {
    memoryStore.decisions.set(d.id, {
      ...d,
      history: [...d.history],
      signalIds: [...d.signalIds],
    });
  }
  for (const h of snapshot.decisionHistory) {
    memoryStore.decisionHistory.set(h.id, { ...h });
  }
  for (const n of snapshot.notifications) {
    memoryStore.notifications.set(n.id, {
      ...n,
      history: [...n.history],
    });
  }
  for (const h of snapshot.notificationHistory) {
    memoryStore.notificationHistory.set(h.id, { ...h });
  }
  for (const r of snapshot.automationRuns) {
    memoryStore.automationRuns.set(r.id, {
      ...r,
      decisionsCreated: [...r.decisionsCreated],
      notificationsCreated: [...r.notificationsCreated],
      actionsExecuted: [...r.actionsExecuted],
    });
    memoryStore.automationRunOrder.push(r.id);
  }
  // Keep newest-first by finishedAt
  memoryStore.automationRunOrder.sort((a, b) => {
    const ra = memoryStore.automationRuns.get(a);
    const rb = memoryStore.automationRuns.get(b);
    return (rb?.finishedAt ?? "").localeCompare(ra?.finishedAt ?? "");
  });
  for (const e of snapshot.automationEvents) {
    memoryStore.automationEvents.set(e.id, {
      ...e,
      payload: e.payload ? { ...e.payload } : undefined,
    });
  }
}
