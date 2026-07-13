import type { CulturalRepository } from "@/lib/platform/intelligence/cultural/contracts";
import type { CulturalHistoryRecord, CulturalResult, GraphScope } from "@/lib/platform/intelligence/cultural/types";

export class CulturalRepositoryStore implements CulturalRepository {
  private results = new Map<string, CulturalResult>();
  private history: CulturalHistoryRecord[] = [];

  save(result: CulturalResult): CulturalResult {
    this.results.set(result.requestId, result);
    return result;
  }
  get(requestId: string): CulturalResult | null {
    return this.results.get(requestId) ?? null;
  }
  list(scope?: Partial<GraphScope>): CulturalResult[] {
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
  saveHistory(record: CulturalHistoryRecord): CulturalHistoryRecord {
    this.history.push(record);
    return record;
  }
  listHistory(scope?: Partial<GraphScope>): CulturalHistoryRecord[] {
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
