import type { BehavioralRepository as Contract } from "@/lib/platform/intelligence/behavioral/contracts";
import type { BehavioralHistoryRecord, BehavioralResult, GraphScope } from "@/lib/platform/intelligence/behavioral/types";

const matches = (scope: GraphScope, filter: Partial<GraphScope>) =>
  (filter.organizationId == null || scope.organizationId === filter.organizationId) &&
  (filter.schoolId == null || scope.schoolId === filter.schoolId);

export class BehavioralRepositoryStore implements Contract {
  private results = new Map<string, BehavioralResult>();
  private history: BehavioralHistoryRecord[] = [];
  save(result: BehavioralResult) { this.results.set(result.requestId, result); return result; }
  get(requestId: string) { return this.results.get(requestId) ?? null; }
  list(scope?: Partial<GraphScope>) {
    const values = [...this.results.values()];
    return scope ? values.filter(v => matches(v.scope, scope)) : values;
  }
  remove(requestId: string) { return this.results.delete(requestId); }
  saveHistory(record: BehavioralHistoryRecord) { this.history.push(record); return record; }
  listHistory(scope?: Partial<GraphScope>) {
    return scope ? this.history.filter(v => matches(v.scope, scope)) : [...this.history];
  }
  clear() { this.results.clear(); this.history.length = 0; }
}

export { BehavioralRepositoryStore as BehavioralRepository };
