/**
 * Human Capital Intelligence — WorkforceRepository (Sprint 032).
 */

import type { WorkforceRepository as WorkforceRepositoryContract } from "@/lib/platform/intelligence/human-capital/contracts";
import type {
  GraphScope,
  HumanCapitalHistoryRecord,
  HumanCapitalResult,
} from "@/lib/platform/intelligence/human-capital/types";

/**
 * In-memory workforce result + history store.
 */
export class WorkforceRepositoryStore implements WorkforceRepositoryContract {
  private readonly results = new Map<string, HumanCapitalResult>();
  private readonly history: HumanCapitalHistoryRecord[] = [];

  save(result: HumanCapitalResult): HumanCapitalResult {
    this.results.set(result.requestId, result);
    return result;
  }

  get(requestId: string): HumanCapitalResult | null {
    return this.results.get(requestId) ?? null;
  }

  list(scope?: Partial<GraphScope>): HumanCapitalResult[] {
    const all = [...this.results.values()];
    if (!scope) return all;
    return all.filter((r) => matchesScope(r.scope, scope));
  }

  remove(requestId: string): boolean {
    return this.results.delete(requestId);
  }

  saveHistory(record: HumanCapitalHistoryRecord): HumanCapitalHistoryRecord {
    this.history.push(record);
    return record;
  }

  listHistory(scope?: Partial<GraphScope>): HumanCapitalHistoryRecord[] {
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
export { WorkforceRepositoryStore as WorkforceRepository };
