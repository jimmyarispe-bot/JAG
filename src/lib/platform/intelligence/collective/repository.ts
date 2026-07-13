import type { CollectiveRepository } from "@/lib/platform/intelligence/collective/contracts";
import type { CollectiveHistoryRecord, CollectiveResult, GraphScope } from "@/lib/platform/intelligence/collective/types";

export class CollectiveRepositoryStore implements CollectiveRepository {
  private results = new Map<string, CollectiveResult>();
  private history: CollectiveHistoryRecord[] = [];

  save(result: CollectiveResult): CollectiveResult {
    this.results.set(result.requestId, result);
    return result;
  }
  get(requestId: string): CollectiveResult | null {
    return this.results.get(requestId) ?? null;
  }
  list(scope?: Partial<GraphScope>): CollectiveResult[] {
    const all = [...this.results.values()];
    if (!scope) return all;
    return all.filter(r =>
      (scope.organizationId == null || r.scope.organizationId === scope.organizationId) &&
      (scope.schoolId == null || r.scope.schoolId === scope.schoolId)
    );
  }
  remove(requestId: string): boolean {
    return this.results.delete(requestId);
  }
  saveHistory(record: CollectiveHistoryRecord): CollectiveHistoryRecord {
    this.history.push(record);
    return record;
  }
  listHistory(scope?: Partial<GraphScope>): CollectiveHistoryRecord[] {
    if (!scope) return [...this.history];
    return this.history.filter(r =>
      (scope.organizationId == null || r.scope.organizationId === scope.organizationId) &&
      (scope.schoolId == null || r.scope.schoolId === scope.schoolId)
    );
  }
  clear(): void {
    this.results.clear();
    this.history = [];
  }
}
