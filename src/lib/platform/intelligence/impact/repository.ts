import type { ImpactRepository as Contract } from "@/lib/platform/intelligence/impact/contracts";
import type { GraphScope, ImpactHistoryRecord, ImpactResult } from "@/lib/platform/intelligence/impact/types";
const matches = (scope: GraphScope, filter: Partial<GraphScope>) => (filter.organizationId == null || scope.organizationId === filter.organizationId) && (filter.schoolId == null || scope.schoolId === filter.schoolId);
export class ImpactRepositoryStore implements Contract {
  private results = new Map<string, ImpactResult>(); private history: ImpactHistoryRecord[] = [];
  save(result: ImpactResult) { this.results.set(result.requestId, result); return result; }
  get(requestId: string) { return this.results.get(requestId) ?? null; }
  list(scope?: Partial<GraphScope>) { const values = [...this.results.values()]; return scope ? values.filter(v => matches(v.scope, scope)) : values; }
  remove(requestId: string) { return this.results.delete(requestId); }
  saveHistory(record: ImpactHistoryRecord) { this.history.push(record); return record; }
  listHistory(scope?: Partial<GraphScope>) { return scope ? this.history.filter(v => matches(v.scope, scope)) : [...this.history]; }
  clear() { this.results.clear(); this.history.length = 0; }
}
export { ImpactRepositoryStore as ImpactRepository };
