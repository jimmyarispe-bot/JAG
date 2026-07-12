/**
 * Document Intelligence — repository.
 */

import type { DocumentRepository as DocumentRepositoryContract } from "@/lib/platform/intelligence/document/contracts";
import type {
  DocumentHistoryRecord,
  DocumentResult,
  GraphScope,
} from "@/lib/platform/intelligence/document/types";

export class DocumentRepositoryStore implements DocumentRepositoryContract {
  private readonly results = new Map<string, DocumentResult>();
  private readonly history: DocumentHistoryRecord[] = [];

  save(result: DocumentResult): DocumentResult {
    this.results.set(result.requestId, result);
    return result;
  }

  get(requestId: string): DocumentResult | null {
    return this.results.get(requestId) ?? null;
  }

  list(scope?: Partial<GraphScope>): DocumentResult[] {
    const all = [...this.results.values()];
    if (!scope) return all;
    return all.filter((result) => matchesScope(result.scope, scope));
  }

  remove(requestId: string): boolean {
    return this.results.delete(requestId);
  }

  saveHistory(record: DocumentHistoryRecord): DocumentHistoryRecord {
    this.history.push(record);
    return record;
  }

  listHistory(scope?: Partial<GraphScope>): DocumentHistoryRecord[] {
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

export { DocumentRepositoryStore as DocumentRepository };
