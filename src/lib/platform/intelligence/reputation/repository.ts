import type { ReputationRepository as Contract } from "@/lib/platform/intelligence/reputation/contracts";
import type { ReputationHistoryRecord, ReputationResult, GraphScope } from "@/lib/platform/intelligence/reputation/types";

const matches = (scope: GraphScope, filter: Partial<GraphScope>) =>
  (filter.organizationId == null || scope.organizationId === filter.organizationId) &&
  (filter.schoolId == null || scope.schoolId === filter.schoolId);

export class ReputationRepositoryStore implements Contract {
  private results = new Map<string, ReputationResult>();
  private history: ReputationHistoryRecord[] = [];
  save(result: ReputationResult) { this.results.set(result.requestId, result); return result; }
  get(requestId: string) { return this.results.get(requestId) ?? null; }
  list(scope?: Partial<GraphScope>) {
    const values = [...this.results.values()];
    return scope ? values.filter(v => matches(v.scope, scope)) : values;
  }
  remove(requestId: string) { return this.results.delete(requestId); }
  saveHistory(record: ReputationHistoryRecord) { this.history.push(record); return record; }
  listHistory(scope?: Partial<GraphScope>) {
    return scope ? this.history.filter(v => matches(v.scope, scope)) : [...this.history];
  }
  clear() { this.results.clear(); this.history.length = 0; }
}

export { ReputationRepositoryStore as ReputationRepository };
