import type { CompetitiveRepository as Contract } from "@/lib/platform/intelligence/competitive/contracts";
import type { CompetitiveHistoryRecord, CompetitiveResult, GraphScope } from "@/lib/platform/intelligence/competitive/types";

const matches = (scope: GraphScope, filter: Partial<GraphScope>) =>
  (filter.organizationId == null || scope.organizationId === filter.organizationId) &&
  (filter.schoolId == null || scope.schoolId === filter.schoolId);

export class CompetitiveRepositoryStore implements Contract {
  private results = new Map<string, CompetitiveResult>();
  private history: CompetitiveHistoryRecord[] = [];
  save(result: CompetitiveResult) { this.results.set(result.requestId, result); return result; }
  get(requestId: string) { return this.results.get(requestId) ?? null; }
  list(scope?: Partial<GraphScope>) {
    const values = [...this.results.values()];
    return scope ? values.filter(v => matches(v.scope, scope)) : values;
  }
  remove(requestId: string) { return this.results.delete(requestId); }
  saveHistory(record: CompetitiveHistoryRecord) { this.history.push(record); return record; }
  listHistory(scope?: Partial<GraphScope>) {
    return scope ? this.history.filter(v => matches(v.scope, scope)) : [...this.history];
  }
  clear() { this.results.clear(); this.history.length = 0; }
}

export { CompetitiveRepositoryStore as CompetitiveRepository };
