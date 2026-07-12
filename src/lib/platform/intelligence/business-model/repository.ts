/**
 * Business Model Intelligence — repository (Sprint 037).
 */

import type { BusinessModelRepository as BusinessModelRepositoryContract } from "@/lib/platform/intelligence/business-model/contracts";
import type {
  BusinessModelHistoryRecord,
  BusinessModelResult,
  GraphScope,
} from "@/lib/platform/intelligence/business-model/types";

/**
 * In-memory business model result + history store.
 */
export class BusinessModelRepositoryStore
  implements BusinessModelRepositoryContract
{
  private readonly results = new Map<string, BusinessModelResult>();
  private readonly history: BusinessModelHistoryRecord[] = [];

  save(result: BusinessModelResult): BusinessModelResult {
    this.results.set(result.requestId, result);
    return result;
  }

  get(requestId: string): BusinessModelResult | null {
    return this.results.get(requestId) ?? null;
  }

  list(scope?: Partial<GraphScope>): BusinessModelResult[] {
    const all = [...this.results.values()];
    if (!scope) return all;
    return all.filter((r) => matchesScope(r.scope, scope));
  }

  remove(requestId: string): boolean {
    return this.results.delete(requestId);
  }

  saveHistory(record: BusinessModelHistoryRecord): BusinessModelHistoryRecord {
    this.history.push(record);
    return record;
  }

  listHistory(scope?: Partial<GraphScope>): BusinessModelHistoryRecord[] {
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
export { BusinessModelRepositoryStore as BusinessModelRepository };
