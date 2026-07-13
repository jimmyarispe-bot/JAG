import type { SystemsRepository } from "@/lib/platform/intelligence/systems/contracts";
import type { SystemsHistoryRecord, SystemsResult, GraphScope } from "@/lib/platform/intelligence/systems/types";

export class SystemsRepositoryStore implements SystemsRepository {
  private results = new Map<string, SystemsResult>();
  private history: SystemsHistoryRecord[] = [];

  save(result: SystemsResult): SystemsResult {
    this.results.set(result.requestId, result);
    return result;
  }
  get(requestId: string): SystemsResult | null {
    return this.results.get(requestId) ?? null;
  }
  list(scope?: Partial<GraphScope>): SystemsResult[] {
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
  saveHistory(record: SystemsHistoryRecord): SystemsHistoryRecord {
    this.history.push(record);
    return record;
  }
  listHistory(scope?: Partial<GraphScope>): SystemsHistoryRecord[] {
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
