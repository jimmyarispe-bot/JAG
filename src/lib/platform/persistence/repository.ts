import {
  AutomationRepository,
  clearAutomationRunScopeForTests,
} from "@/lib/platform/persistence/automation-repository";
import { DecisionRepository } from "@/lib/platform/persistence/decision-repository";
import { NotificationRepository } from "@/lib/platform/persistence/notification-repository";
import {
  clearDirty,
  resetMemoryStoreForTests,
} from "@/lib/platform/persistence/memory-store";
import type { PersistenceClient } from "@/lib/platform/persistence/types";

let boundClient: PersistenceClient | null = null;
let flushContext: {
  organizationId?: string | null;
  applicationId?: string | null;
} = {};

/**
 * Central persistence facade.
 * Services depend on repositories; this coordinates hydrate / flush / client binding.
 */
export const OperationalPersistence = {
  decisions: DecisionRepository,
  notifications: NotificationRepository,
  automation: AutomationRepository,

  bindClient(client: PersistenceClient | null): void {
    boundClient = client;
  },

  getClient(): PersistenceClient | null {
    return boundClient;
  },

  setFlushContext(ctx: {
    organizationId?: string | null;
    applicationId?: string | null;
  }): void {
    flushContext = ctx;
  },

  /**
   * Replace working set from durable storage (recovery after restart).
   * Clears memory first so DB is source of truth for the request.
   */
  async hydrate(client: PersistenceClient): Promise<{
    decisions: number;
    notifications: number;
    automationRuns: number;
  }> {
    resetMemoryStoreForTests();
    boundClient = client;
    const decisions = await DecisionRepository.hydrate(client);
    const notifications = await NotificationRepository.hydrate(client);
    const automationRuns = await AutomationRepository.hydrate(client);
    clearDirty();
    return { decisions, notifications, automationRuns };
  },

  /** Persist dirty working-set rows. */
  async flush(client?: PersistenceClient | null): Promise<void> {
    const c = client ?? boundClient;
    if (!c) return;
    await DecisionRepository.flush(c);
    await NotificationRepository.flush(c);
    await AutomationRepository.flush(c, flushContext);
    clearDirty();
  },

  /**
   * Hydrate → run work → flush. Used by Founder / Decisions request paths.
   */
  async runWithPersistence<T>(
    client: PersistenceClient,
    work: () => Promise<T> | T,
    context?: { organizationId?: string | null; applicationId?: string | null }
  ): Promise<T> {
    await OperationalPersistence.hydrate(client);
    if (context) OperationalPersistence.setFlushContext(context);
    try {
      const result = await work();
      await OperationalPersistence.flush(client);
      return result;
    } finally {
      // Keep hydrated memory for the remainder of the request (React cache).
    }
  },

  resetForTests(): void {
    boundClient = null;
    flushContext = {};
    resetMemoryStoreForTests();
    clearAutomationRunScopeForTests();
  },
} as const;

export type OperationalPersistenceApi = typeof OperationalPersistence;
