import type { OiosRepository as Contract } from "@/lib/platform/oios/contracts";
import type { OiosHistoryRecord, OiosResult, OiosScope } from "@/lib/platform/oios/types";
export class OiosRepository implements Contract {
  private readonly results = new Map<string, OiosResult>(); private readonly records: OiosHistoryRecord[] = [];
  save(result: OiosResult): OiosResult { this.results.set(result.requestId, result); return result; }
  get(requestId: string): OiosResult | null { return this.results.get(requestId) ?? null; }
  list(scope?: Partial<OiosScope>): OiosResult[] { return [...this.results.values()].filter((item) => (!scope?.organizationId || item.scope.organizationId === scope.organizationId) && (!scope?.schoolId || item.scope.schoolId === scope.schoolId)); }
  saveHistory(record: OiosHistoryRecord): OiosHistoryRecord { this.records.push(record); return record; }
  listHistory(scope?: Partial<OiosScope>): OiosHistoryRecord[] { return this.records.filter((item) => (!scope?.organizationId || item.scope.organizationId === scope.organizationId) && (!scope?.schoolId || item.scope.schoolId === scope.schoolId)); }
  clear(): void { this.results.clear(); this.records.length = 0; }
}
