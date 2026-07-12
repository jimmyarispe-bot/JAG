/**
 * Customer Intelligence — repository (Sprint 039).
 */

import type { CustomerRepository as CustomerRepositoryContract } from "@/lib/platform/intelligence/customer/contracts";
import type {
  CustomerHistoryRecord,
  CustomerResult,
  GraphScope,
} from "@/lib/platform/intelligence/customer/types";

/**
 * In-memory customer result + history store.
 */
export class CustomerRepositoryStore implements CustomerRepositoryContract {
  private readonly results = new Map<string, CustomerResult>();
  private readonly history: CustomerHistoryRecord[] = [];

  save(result: CustomerResult): CustomerResult {
    this.results.set(result.requestId, result);
    return result;
  }

  get(requestId: string): CustomerResult | null {
    return this.results.get(requestId) ?? null;
  }

  list(scope?: Partial<GraphScope>): CustomerResult[] {
    const all = [...this.results.values()];
    if (!scope) return all;
    return all.filter((r) => matchesScope(r.scope, scope));
  }

  remove(requestId: string): boolean {
    return this.results.delete(requestId);
  }

  saveHistory(record: CustomerHistoryRecord): CustomerHistoryRecord {
    this.history.push(record);
    return record;
  }

  listHistory(scope?: Partial<GraphScope>): CustomerHistoryRecord[] {
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
export { CustomerRepositoryStore as CustomerRepository };
