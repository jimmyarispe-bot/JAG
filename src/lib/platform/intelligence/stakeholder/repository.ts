import type { StakeholderRepository as Contract } from "@/lib/platform/intelligence/stakeholder/contracts";
import type { StakeholderHistoryRecord, StakeholderResult, GraphScope } from "@/lib/platform/intelligence/stakeholder/types";

const matches = (scope: GraphScope, filter: Partial<GraphScope>) =>
  (filter.organizationId == null || scope.organizationId === filter.organizationId) &&
  (filter.schoolId == null || scope.schoolId === filter.schoolId);

export class StakeholderRepositoryStore implements Contract {
  private results = new Map<string, StakeholderResult>();
  private history: StakeholderHistoryRecord[] = [];
  save(result: StakeholderResult) { this.results.set(result.requestId, result); return result; }
  get(requestId: string) { return this.results.get(requestId) ?? null; }
  list(scope?: Partial<GraphScope>) {
    const values = [...this.results.values()];
    return scope ? values.filter(v => matches(v.scope, scope)) : values;
  }
  remove(requestId: string) { return this.results.delete(requestId); }
  saveHistory(record: StakeholderHistoryRecord) { this.history.push(record); return record; }
  listHistory(scope?: Partial<GraphScope>) {
    return scope ? this.history.filter(v => matches(v.scope, scope)) : [...this.history];
  }
  clear() { this.results.clear(); this.history.length = 0; }
}

export { StakeholderRepositoryStore as StakeholderRepository };
