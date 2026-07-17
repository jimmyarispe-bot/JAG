/**
 * Revenue Intelligence — repository (Sprint 033).
 */

import type { RevenueRepository as RevenueRepositoryContract } from "@/lib/platform/intelligence/revenue/contracts";
import type {
  GraphScope,
  RevenueHistoryRecord,
  RevenueResult,
} from "@/lib/platform/intelligence/revenue/types";
import { InMemoryResultHistoryRepository } from "@/lib/platform/intelligence/common";

/**
 * In-memory revenue result + history store.
 */
export class RevenueRepositoryStore
  extends InMemoryResultHistoryRepository<RevenueResult, RevenueHistoryRecord, GraphScope>
  implements RevenueRepositoryContract {}

/** Alias matching Sprint naming. */
export { RevenueRepositoryStore as RevenueRepository };
