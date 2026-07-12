/**
 * Market Intelligence — repository.
 */

import type { MarketRepository as MarketRepositoryContract } from "@/lib/platform/intelligence/market/contracts";
import type {
  GraphScope,
  MarketHistoryRecord,
  MarketResult,
} from "@/lib/platform/intelligence/market/types";

export class MarketRepositoryStore implements MarketRepositoryContract {
  private readonly results = new Map<string, MarketResult>();
  private readonly history: MarketHistoryRecord[] = [];

  save(result: MarketResult): MarketResult {
    this.results.set(result.requestId, result);
    return result;
  }

  get(requestId: string): MarketResult | null {
    return this.results.get(requestId) ?? null;
  }

  list(scope?: Partial<GraphScope>): MarketResult[] {
    const all = [...this.results.values()];
    if (!scope) return all;
    return all.filter((result) => matchesScope(result.scope, scope));
  }

  remove(requestId: string): boolean {
    return this.results.delete(requestId);
  }

  saveHistory(record: MarketHistoryRecord): MarketHistoryRecord {
    this.history.push(record);
    return record;
  }

  listHistory(scope?: Partial<GraphScope>): MarketHistoryRecord[] {
    if (!scope) return [...this.history];
    return this.history.filter((record) => matchesScope(record.scope, scope));
  }

  clear(): void {
    this.results.clear();
    this.history.length = 0;
  }
}

function matchesScope(scope: GraphScope, filter: Partial<GraphScope>): boolean {
  if (filter.organizationId != null && scope.organizationId !== filter.organizationId) return false;
  if (filter.schoolId != null && scope.schoolId !== filter.schoolId) return false;
  return true;
}

export { MarketRepositoryStore as MarketRepository };
