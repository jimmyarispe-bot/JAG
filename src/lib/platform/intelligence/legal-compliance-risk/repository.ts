/**
 * Legal, Compliance & Risk Intelligence — repository.
 */

import type { LegalComplianceRiskRepository as LegalComplianceRiskRepositoryContract } from "@/lib/platform/intelligence/legal-compliance-risk/contracts";
import type {
  GraphScope,
  LegalComplianceRiskHistoryRecord,
  LegalComplianceRiskResult,
} from "@/lib/platform/intelligence/legal-compliance-risk/types";

export class LegalComplianceRiskRepositoryStore implements LegalComplianceRiskRepositoryContract {
  private readonly results = new Map<string, LegalComplianceRiskResult>();
  private readonly history: LegalComplianceRiskHistoryRecord[] = [];

  save(result: LegalComplianceRiskResult): LegalComplianceRiskResult {
    this.results.set(result.requestId, result);
    return result;
  }

  get(requestId: string): LegalComplianceRiskResult | null {
    return this.results.get(requestId) ?? null;
  }

  list(scope?: Partial<GraphScope>): LegalComplianceRiskResult[] {
    const all = [...this.results.values()];
    if (!scope) return all;
    return all.filter((result) => matchesScope(result.scope, scope));
  }

  remove(requestId: string): boolean {
    return this.results.delete(requestId);
  }

  saveHistory(record: LegalComplianceRiskHistoryRecord): LegalComplianceRiskHistoryRecord {
    this.history.push(record);
    return record;
  }

  listHistory(scope?: Partial<GraphScope>): LegalComplianceRiskHistoryRecord[] {
    if (!scope) return [...this.history];
    return this.history.filter((record) => matchesScope(record.scope, scope));
  }

  clear(): void {
    this.results.clear();
    this.history.length = 0;
  }
}

function matchesScope(scope: GraphScope, filter: Partial<GraphScope>): boolean {
  if (filter.organizationId != null && scope.organizationId !== filter.organizationId) return false;
  if (filter.schoolId != null && scope.schoolId !== filter.schoolId) return false;
  return true;
}

export { LegalComplianceRiskRepositoryStore as LegalComplianceRiskRepository };
