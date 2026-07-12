/**
 * Innovation Intelligence — repository.
 */

import type { InnovationRepository as InnovationRepositoryContract } from "@/lib/platform/intelligence/innovation/contracts";
import type {
  GraphScope,
  InnovationHistoryRecord,
  InnovationResult,
} from "@/lib/platform/intelligence/innovation/types";

export class InnovationRepositoryStore implements InnovationRepositoryContract {
  private readonly results = new Map<string, InnovationResult>();
  private readonly history: InnovationHistoryRecord[] = [];

  save(result: InnovationResult): InnovationResult {
    this.results.set(result.requestId, result);
    return result;
  }

  get(requestId: string): InnovationResult | null {
    return this.results.get(requestId) ?? null;
  }

  list(scope?: Partial<GraphScope>): InnovationResult[] {
    const all = [...this.results.values()];
    if (!scope) return all;
    return all.filter((result) => matchesScope(result.scope, scope));
  }

  remove(requestId: string): boolean {
    return this.results.delete(requestId);
  }

  saveHistory(record: InnovationHistoryRecord): InnovationHistoryRecord {
    this.history.push(record);
    return record;
  }

  listHistory(scope?: Partial<GraphScope>): InnovationHistoryRecord[] {
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

export { InnovationRepositoryStore as InnovationRepository };
