import {
  restoreMemoryStore,
  snapshotMemoryStore,
} from "@/lib/platform/persistence/memory-store";
import type { PersistenceClient } from "@/lib/platform/persistence/types";
import { OperationalPersistence } from "@/lib/platform/persistence/repository";

export type TransactionContext = {
  /** True when operating against durable backend. */
  durable: boolean;
};

/**
 * Memory snapshot transaction — on throw, restores pre-transaction working set.
 * When a persistence client is bound, successful completion flushes dirty rows.
 *
 * Supabase JS has no multi-table client transaction; durability is sequential
 * upsert after the unit of work succeeds. Failure before flush leaves DB unchanged.
 */
export async function withTransaction<T>(
  fn: (tx: TransactionContext) => Promise<T> | T,
  options?: { client?: PersistenceClient | null }
): Promise<T> {
  const snapshot = snapshotMemoryStore();
  const client = options?.client ?? OperationalPersistence.getClient();
  try {
    const result = await fn({ durable: Boolean(client) });
    if (client) {
      await OperationalPersistence.flush(client);
    }
    return result;
  } catch (error) {
    restoreMemoryStore(snapshot);
    throw error;
  }
}
