import type { DatabaseProvider, DatabaseTransaction } from "@/applications/academyos/infrastructure/database";

/**
 * Transaction coordinator — application requests a boundary;
 * infrastructure owns begin/commit/rollback semantics.
 */
export type TransactionCoordinator = {
  readonly id: "memory" | "supabase";
  run<T>(work: (tx: DatabaseTransaction) => Promise<T>): Promise<T>;
};

export function createTransactionCoordinator(
  database: DatabaseProvider
): TransactionCoordinator {
  return {
    id: database.id,
    run: (work) => database.withTransaction(work),
  };
}
