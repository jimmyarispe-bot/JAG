/**
 * Business Model Intelligence — repository (Sprint 037).
 */

import type { BusinessModelRepository as BusinessModelRepositoryContract } from "@/lib/platform/intelligence/business-model/contracts";
import type {
  BusinessModelHistoryRecord,
  BusinessModelResult,
  GraphScope,
} from "@/lib/platform/intelligence/business-model/types";
import { InMemoryResultHistoryRepository } from "@/lib/platform/intelligence/common";

/**
 * In-memory business model result + history store.
 */
export class BusinessModelRepositoryStore
  extends InMemoryResultHistoryRepository<BusinessModelResult, BusinessModelHistoryRecord, GraphScope>
  implements BusinessModelRepositoryContract {}

/** Alias matching Sprint naming. */
export { BusinessModelRepositoryStore as BusinessModelRepository };
