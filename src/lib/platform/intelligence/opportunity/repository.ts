/** In-memory Opportunity Intelligence repository (Sprint 035). */
import type { OpportunityRepository as Contract } from "@/lib/platform/intelligence/opportunity/contracts";
import type { GraphScope, OpportunityHistoryRecord, OpportunityResult } from "@/lib/platform/intelligence/opportunity/types";

export class OpportunityRepositoryStore implements Contract {
  private readonly results = new Map<string, OpportunityResult>();
  private readonly history: OpportunityHistoryRecord[] = [];

  save(result: OpportunityResult): OpportunityResult {
    this.results.set(result.requestId, result);
    return result;
  }

  get(requestId: string): OpportunityResult | null {
    return this.results.get(requestId) ?? null;
  }

  list(scope?: Partial<GraphScope>): OpportunityResult[] {
    const all = [...this.results.values()];
    return scope ? all.filter((r) => matches(r.scope, scope)) : all;
  }

  remove(requestId: string): boolean {
    return this.results.delete(requestId);
  }

  saveHistory(record: OpportunityHistoryRecord): OpportunityHistoryRecord {
    this.history.push(record);
    return record;
  }

  listHistory(scope?: Partial<GraphScope>): OpportunityHistoryRecord[] {
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

export { OpportunityRepositoryStore as OpportunityRepository };
