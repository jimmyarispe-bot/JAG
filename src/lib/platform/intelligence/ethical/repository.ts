import type { EthicalRepository } from "@/lib/platform/intelligence/ethical/contracts";
import type { EthicalHistoryRecord, EthicalResult, GraphScope } from "@/lib/platform/intelligence/ethical/types";

export class EthicalRepositoryStore implements EthicalRepository {
  private results = new Map<string, EthicalResult>();
  private history: EthicalHistoryRecord[] = [];

  save(result: EthicalResult): EthicalResult {
    this.results.set(result.requestId, result);
    return result;
  }
  get(requestId: string): EthicalResult | null {
    return this.results.get(requestId) ?? null;
  }
  list(scope?: Partial<GraphScope>): EthicalResult[] {
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
  saveHistory(record: EthicalHistoryRecord): EthicalHistoryRecord {
    this.history.push(record);
    return record;
  }
  listHistory(scope?: Partial<GraphScope>): EthicalHistoryRecord[] {
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
