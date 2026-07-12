/**
 * Revenue Intelligence — repository (Sprint 033).
 */

import type { RevenueRepository as RevenueRepositoryContract } from "@/lib/platform/intelligence/revenue/contracts";
import type {
  GraphScope,
  RevenueHistoryRecord,
  RevenueResult,
} from "@/lib/platform/intelligence/revenue/types";

/**
 * In-memory revenue result + history store.
 */
export class RevenueRepositoryStore implements RevenueRepositoryContract {
  private readonly results = new Map<string, RevenueResult>();
  private readonly history: RevenueHistoryRecord[] = [];

  save(result: RevenueResult): RevenueResult {
    this.results.set(result.requestId, result);
    return result;
  }

  get(requestId: string): RevenueResult | null {
    return this.results.get(requestId) ?? null;
  }

  list(scope?: Partial<GraphScope>): RevenueResult[] {
    const all = [...this.results.values()];
    if (!scope) return all;
    return all.filter((r) => matchesScope(r.scope, scope));
  }

  remove(requestId: string): boolean {
    return this.results.delete(requestId);
  }

  saveHistory(record: RevenueHistoryRecord): RevenueHistoryRecord {
    this.history.push(record);
    return record;
  }

  listHistory(scope?: Partial<GraphScope>): RevenueHistoryRecord[] {
    if (!scope) return [...this.history];
    return this.history.filter((r) => matchesScope(r.scope, scope));
  }

  clear(): void {
    this.results.clear();
    this.history.length = 0;
  }
}

function matchesScope(
  scope: GraphScope,
  filter: Partial<GraphScope>
): boolean {
  if (
    filter.organizationId != null &&
    scope.organizationId !== filter.organizationId
  ) {
    return false;
  }
  if (filter.schoolId != null && scope.schoolId !== filter.schoolId) {
    return false;
  }
  return true;
}

/** Alias matching Sprint naming. */
export { RevenueRepositoryStore as RevenueRepository };
