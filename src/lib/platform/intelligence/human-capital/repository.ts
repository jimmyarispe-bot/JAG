/**
 * Human Capital Intelligence — WorkforceRepository (Sprint 032).
 */

import type { WorkforceRepository as WorkforceRepositoryContract } from "@/lib/platform/intelligence/human-capital/contracts";
import type {
  GraphScope,
  HumanCapitalHistoryRecord,
  HumanCapitalResult,
} from "@/lib/platform/intelligence/human-capital/types";
import { InMemoryResultHistoryRepository } from "@/lib/platform/intelligence/common";

/**
 * In-memory workforce result + history store.
 */
export class WorkforceRepositoryStore
  extends InMemoryResultHistoryRepository<HumanCapitalResult, HumanCapitalHistoryRecord, GraphScope>
  implements WorkforceRepositoryContract {}

/** Alias matching Sprint naming. */
export { WorkforceRepositoryStore as WorkforceRepository };
