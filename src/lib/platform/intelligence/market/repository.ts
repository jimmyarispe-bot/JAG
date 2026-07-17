/**
 * Market Intelligence — repository.
 */

import type { MarketRepository as MarketRepositoryContract } from "@/lib/platform/intelligence/market/contracts";
import type {
  GraphScope,
  MarketHistoryRecord,
  MarketResult,
} from "@/lib/platform/intelligence/market/types";
import { InMemoryResultHistoryRepository } from "@/lib/platform/intelligence/common";

export class MarketRepositoryStore
  extends InMemoryResultHistoryRepository<MarketResult, MarketHistoryRecord, GraphScope>
  implements MarketRepositoryContract {}

export { MarketRepositoryStore as MarketRepository };
