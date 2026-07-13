import type { EcosystemRepository } from "@/lib/platform/intelligence/ecosystem/contracts";
import type { EcosystemHistoryRecord, EcosystemResult, GraphScope } from "@/lib/platform/intelligence/ecosystem/types";

export class EcosystemRepositoryStore implements EcosystemRepository {
  private results = new Map<string, EcosystemResult>();
  private history: EcosystemHistoryRecord[] = [];

  save(result: EcosystemResult): EcosystemResult {
    this.results.set(result.requestId, result);
    return result;
  }
  get(requestId: string): EcosystemResult | null {
    return this.results.get(requestId) ?? null;
  }
  list(scope?: Partial<GraphScope>): EcosystemResult[] {
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
  saveHistory(record: EcosystemHistoryRecord): EcosystemHistoryRecord {
    this.history.push(record);
    return record;
  }
  listHistory(scope?: Partial<GraphScope>): EcosystemHistoryRecord[] {
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
