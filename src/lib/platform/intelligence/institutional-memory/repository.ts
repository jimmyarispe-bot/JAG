import type { InstitutionalMemoryRepository } from "@/lib/platform/intelligence/institutional-memory/contracts";
import type { InstitutionalMemoryHistoryRecord, InstitutionalMemoryResult, GraphScope } from "@/lib/platform/intelligence/institutional-memory/types";

export class InstitutionalMemoryRepositoryStore implements InstitutionalMemoryRepository {
  private results = new Map<string, InstitutionalMemoryResult>();
  private history: InstitutionalMemoryHistoryRecord[] = [];

  save(result: InstitutionalMemoryResult): InstitutionalMemoryResult {
    this.results.set(result.requestId, result);
    return result;
  }
  get(requestId: string): InstitutionalMemoryResult | null {
    return this.results.get(requestId) ?? null;
  }
  list(scope?: Partial<GraphScope>): InstitutionalMemoryResult[] {
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
  saveHistory(record: InstitutionalMemoryHistoryRecord): InstitutionalMemoryHistoryRecord {
    this.history.push(record);
    return record;
  }
  listHistory(scope?: Partial<GraphScope>): InstitutionalMemoryHistoryRecord[] {
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
