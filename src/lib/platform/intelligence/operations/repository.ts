/**
 * Operations Intelligence — repository (Sprint 038).
 */

import type { OperationsRepository as OperationsRepositoryContract } from "@/lib/platform/intelligence/operations/contracts";
import type {
  GraphScope,
  OperationsHistoryRecord,
  OperationsResult,
} from "@/lib/platform/intelligence/operations/types";
import { InMemoryResultHistoryRepository } from "@/lib/platform/intelligence/common";

/**
 * In-memory operations result + history store.
 */
export class OperationsRepositoryStore
  extends InMemoryResultHistoryRepository<OperationsResult, OperationsHistoryRecord, GraphScope>
  implements OperationsRepositoryContract {}

/** Alias matching Sprint naming. */
export { OperationsRepositoryStore as OperationsRepository };
