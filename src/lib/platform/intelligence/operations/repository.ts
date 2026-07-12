/**
 * Operations Intelligence — repository (Sprint 038).
 */

import type { OperationsRepository as OperationsRepositoryContract } from "@/lib/platform/intelligence/operations/contracts";
import type {
  GraphScope,
  OperationsHistoryRecord,
  OperationsResult,
} from "@/lib/platform/intelligence/operations/types";

/**
 * In-memory operations result + history store.
 */
export class OperationsRepositoryStore
  implements OperationsRepositoryContract
{
  private readonly results = new Map<string, OperationsResult>();
  private readonly history: OperationsHistoryRecord[] = [];

  save(result: OperationsResult): OperationsResult {
    this.results.set(result.requestId, result);
    return result;
  }

  get(requestId: string): OperationsResult | null {
    return this.results.get(requestId) ?? null;
  }

  list(scope?: Partial<GraphScope>): OperationsResult[] {
    const all = [...this.results.values()];
    if (!scope) return all;
    return all.filter((r) => matchesScope(r.scope, scope));
  }

  remove(requestId: string): boolean {
    return this.results.delete(requestId);
  }

  saveHistory(record: OperationsHistoryRecord): OperationsHistoryRecord {
    this.history.push(record);
    return record;
  }

  listHistory(scope?: Partial<GraphScope>): OperationsHistoryRecord[] {
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
export { OperationsRepositoryStore as OperationsRepository };
