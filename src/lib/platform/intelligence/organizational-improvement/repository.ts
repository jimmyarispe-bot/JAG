/** In-memory Organizational Improvement repository (Sprint 036). */
import type { ImprovementRepository as Contract } from "@/lib/platform/intelligence/organizational-improvement/contracts";
import type {
  GraphScope,
  ImprovementHistoryRecord,
  ImprovementResult,
} from "@/lib/platform/intelligence/organizational-improvement/types";

export class ImprovementRepositoryStore implements Contract {
  private readonly results = new Map<string, ImprovementResult>();
  private readonly history: ImprovementHistoryRecord[] = [];

  save(result: ImprovementResult): ImprovementResult {
    this.results.set(result.requestId, result);
    return result;
  }

  get(requestId: string): ImprovementResult | null {
    return this.results.get(requestId) ?? null;
  }

  list(scope?: Partial<GraphScope>): ImprovementResult[] {
    const all = [...this.results.values()];
    return scope ? all.filter((r) => matches(r.scope, scope)) : all;
  }

  remove(requestId: string): boolean {
    return this.results.delete(requestId);
  }

  saveHistory(record: ImprovementHistoryRecord): ImprovementHistoryRecord {
    this.history.push(record);
    return record;
  }

  listHistory(scope?: Partial<GraphScope>): ImprovementHistoryRecord[] {
    return scope ? this.history.filter((r) => matches(r.scope, scope)) : [...this.history];
  }

  clear(): void {
    this.results.clear();
    this.history.length = 0;
  }
}

function matches(scope: GraphScope, filter: Partial<GraphScope>): boolean {
  return (
    (filter.organizationId == null || scope.organizationId === filter.organizationId) &&
    (filter.schoolId == null || scope.schoolId === filter.schoolId)
  );
}

export { ImprovementRepositoryStore as ImprovementRepository };
