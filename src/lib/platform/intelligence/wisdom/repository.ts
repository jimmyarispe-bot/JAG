import type { WisdomRepository } from "@/lib/platform/intelligence/wisdom/contracts";
import type { WisdomHistoryRecord, WisdomResult, GraphScope } from "@/lib/platform/intelligence/wisdom/types";

export class WisdomRepositoryStore implements WisdomRepository {
  private results = new Map<string, WisdomResult>();
  private history: WisdomHistoryRecord[] = [];

  save(result: WisdomResult): WisdomResult {
    this.results.set(result.requestId, result);
    return result;
  }
  get(requestId: string): WisdomResult | null {
    return this.results.get(requestId) ?? null;
  }
  list(scope?: Partial<GraphScope>): WisdomResult[] {
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
  saveHistory(record: WisdomHistoryRecord): WisdomHistoryRecord {
    this.history.push(record);
    return record;
  }
  listHistory(scope?: Partial<GraphScope>): WisdomHistoryRecord[] {
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
