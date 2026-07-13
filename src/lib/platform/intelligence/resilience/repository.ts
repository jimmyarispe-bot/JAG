import type { ResilienceRepository } from "@/lib/platform/intelligence/resilience/contracts";
import type { ResilienceHistoryRecord, ResilienceResult, GraphScope } from "@/lib/platform/intelligence/resilience/types";

export class ResilienceRepositoryStore implements ResilienceRepository {
  private results = new Map<string, ResilienceResult>();
  private history: ResilienceHistoryRecord[] = [];

  save(result: ResilienceResult): ResilienceResult {
    this.results.set(result.requestId, result);
    return result;
  }
  get(requestId: string): ResilienceResult | null {
    return this.results.get(requestId) ?? null;
  }
  list(scope?: Partial<GraphScope>): ResilienceResult[] {
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
  saveHistory(record: ResilienceHistoryRecord): ResilienceHistoryRecord {
    this.history.push(record);
    return record;
  }
  listHistory(scope?: Partial<GraphScope>): ResilienceHistoryRecord[] {
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
