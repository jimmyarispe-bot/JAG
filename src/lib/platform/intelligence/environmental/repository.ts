import type { EnvironmentalRepository as Contract } from "@/lib/platform/intelligence/environmental/contracts";
import type { EnvironmentalHistoryRecord, EnvironmentalResult, GraphScope } from "@/lib/platform/intelligence/environmental/types";

const matches = (scope: GraphScope, filter: Partial<GraphScope>) =>
  (filter.organizationId == null || scope.organizationId === filter.organizationId) &&
  (filter.schoolId == null || scope.schoolId === filter.schoolId);

export class EnvironmentalRepositoryStore implements Contract {
  private results = new Map<string, EnvironmentalResult>();
  private history: EnvironmentalHistoryRecord[] = [];
  save(result: EnvironmentalResult) { this.results.set(result.requestId, result); return result; }
  get(requestId: string) { return this.results.get(requestId) ?? null; }
  list(scope?: Partial<GraphScope>) {
    const values = [...this.results.values()];
    return scope ? values.filter(v => matches(v.scope, scope)) : values;
  }
  remove(requestId: string) { return this.results.delete(requestId); }
  saveHistory(record: EnvironmentalHistoryRecord) { this.history.push(record); return record; }
  listHistory(scope?: Partial<GraphScope>) {
    return scope ? this.history.filter(v => matches(v.scope, scope)) : [...this.history];
  }
  clear() { this.results.clear(); this.history.length = 0; }
}

export { EnvironmentalRepositoryStore as EnvironmentalRepository };
