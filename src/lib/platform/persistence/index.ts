export { OperationalPersistence } from "@/lib/platform/persistence/repository";
export type { OperationalPersistenceApi } from "@/lib/platform/persistence/repository";

export { DecisionRepository } from "@/lib/platform/persistence/decision-repository";
export { NotificationRepository } from "@/lib/platform/persistence/notification-repository";
export { AutomationRepository } from "@/lib/platform/persistence/automation-repository";
export { HistoryRepository } from "@/lib/platform/persistence/history-repository";

export { withTransaction } from "@/lib/platform/persistence/transaction";
export type { TransactionContext } from "@/lib/platform/persistence/transaction";

export {
  clearDirty,
  dirtySets,
  markDirty,
  memoryStore,
  resetMemoryStoreForTests,
  restoreMemoryStore,
  snapshotMemoryStore,
} from "@/lib/platform/persistence/memory-store";

export type {
  AutomationEvent,
  DirtySets,
  PersistenceClient,
  PersistenceSnapshot,
} from "@/lib/platform/persistence/types";
