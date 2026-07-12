/** In-memory Funding Intelligence repository. */
import type { FundingRepository as Contract } from "@/lib/platform/intelligence/funding/contracts";
import type { FundingHistoryRecord, FundingResult, GraphScope } from "@/lib/platform/intelligence/funding/types";
export class FundingRepositoryStore implements Contract {
  private readonly results = new Map<string, FundingResult>(); private readonly history: FundingHistoryRecord[] = [];
  save(result: FundingResult): FundingResult { this.results.set(result.requestId, result); return result; }
  get(requestId: string): FundingResult | null { return this.results.get(requestId) ?? null; }
  list(scope?: Partial<GraphScope>): FundingResult[] { const all = [...this.results.values()]; return scope ? all.filter((r) => matches(r.scope, scope)) : all; }
  remove(requestId: string): boolean { return this.results.delete(requestId); }
  saveHistory(record: FundingHistoryRecord): FundingHistoryRecord { this.history.push(record); return record; }
  listHistory(scope?: Partial<GraphScope>): FundingHistoryRecord[] { return scope ? this.history.filter((r) => matches(r.scope, scope)) : [...this.history]; }
  clear(): void { this.results.clear(); this.history.length = 0; }
}
function matches(scope: GraphScope, filter: Partial<GraphScope>): boolean { return (filter.organizationId == null || scope.organizationId === filter.organizationId) && (filter.schoolId == null || scope.schoolId === filter.schoolId); }
export { FundingRepositoryStore as FundingRepository };
