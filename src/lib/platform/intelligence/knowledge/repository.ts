/**
 * Knowledge Intelligence — repository (Sprint 040).
 */

import type { KnowledgeRepository as KnowledgeRepositoryContract } from "@/lib/platform/intelligence/knowledge/contracts";
import type {
  GraphScope,
  KnowledgeHistoryRecord,
  KnowledgeResult,
} from "@/lib/platform/intelligence/knowledge/types";

/**
 * In-memory knowledge result + history store.
 */
export class KnowledgeRepositoryStore implements KnowledgeRepositoryContract {
  private readonly results = new Map<string, KnowledgeResult>();
  private readonly history: KnowledgeHistoryRecord[] = [];

  save(result: KnowledgeResult): KnowledgeResult {
    this.results.set(result.requestId, result);
    return result;
  }

  get(requestId: string): KnowledgeResult | null {
    return this.results.get(requestId) ?? null;
  }

  list(scope?: Partial<GraphScope>): KnowledgeResult[] {
    const all = [...this.results.values()];
    if (!scope) return all;
    return all.filter((r) => matchesScope(r.scope, scope));
  }

  remove(requestId: string): boolean {
    return this.results.delete(requestId);
  }

  saveHistory(record: KnowledgeHistoryRecord): KnowledgeHistoryRecord {
    this.history.push(record);
    return record;
  }

  listHistory(scope?: Partial<GraphScope>): KnowledgeHistoryRecord[] {
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
export { KnowledgeRepositoryStore as KnowledgeRepository };
