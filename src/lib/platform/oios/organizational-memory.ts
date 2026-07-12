import type { OrganizationalMemory as Contract } from "@/lib/platform/oios/contracts";
import type { MemoryRecord, OiosScope } from "@/lib/platform/oios/types";
export class OrganizationalMemory implements Contract {
  private readonly records: MemoryRecord[] = [];
  remember(record: MemoryRecord): MemoryRecord { const copy = { ...record, scope: { ...record.scope }, metadata: { ...record.metadata } }; this.records.push(copy); return copy; }
  recall(scope: OiosScope): MemoryRecord[] { return this.records.filter((record) => record.scope.organizationId === scope.organizationId && record.scope.schoolId === scope.schoolId).map((record) => ({ ...record, scope: { ...record.scope }, metadata: { ...record.metadata } })); }
}
