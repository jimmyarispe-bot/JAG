/**
 * Executive Decision Intelligence — DecisionHistory (Sprint 026).
 */

import type { DecisionHistory as DecisionHistoryContract } from "@/lib/platform/intelligence/executive-decision/contracts";
import type {
  DecisionHistoryRecord,
  DecisionStatus,
  ExecutiveDecisionResult,
  GraphScope,
} from "@/lib/platform/intelligence/executive-decision/types";

function scopeKey(scope?: Partial<GraphScope> | null): string {
  return [
    scope?.organizationId ?? "org:null",
    scope?.schoolId ?? "school:null",
    scope?.regionId ?? "region:null",
    scope?.campusId ?? "campus:null",
  ].join("|");
}

/**
 * DecisionHistory — in-memory decision audit trail.
 */
export class DecisionHistoryStore implements DecisionHistoryContract {
  private readonly byId = new Map<string, DecisionHistoryRecord>();
  private readonly byScope = new Map<string, string[]>();

  record(result: ExecutiveDecisionResult): DecisionHistoryRecord {
    const record = result.historyRecord;
    this.byId.set(record.id, record);
    const key = scopeKey(record.scope);
    const list = this.byScope.get(key) ?? [];
    if (!list.includes(record.id)) {
      list.push(record.id);
      this.byScope.set(key, list);
    }
    return record;
  }

  get(id: string): DecisionHistoryRecord | null {
    return this.byId.get(id) ?? null;
  }

  list(scope?: Partial<GraphScope>): DecisionHistoryRecord[] {
    if (!scope) {
      return Array.from(this.byId.values()).sort((a, b) =>
        a.createdAt < b.createdAt ? 1 : -1
      );
    }
    const ids = this.byScope.get(scopeKey(scope)) ?? [];
    return ids
      .map((id) => this.byId.get(id))
      .filter((r): r is DecisionHistoryRecord => Boolean(r))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  updateStatus(id: string, status: DecisionStatus): DecisionHistoryRecord | null {
    const existing = this.byId.get(id);
    if (!existing) return null;
    const updated: DecisionHistoryRecord = {
      ...existing,
      status,
      updatedAt: new Date().toISOString(),
    };
    this.byId.set(id, updated);
    return updated;
  }

  clear(): void {
    this.byId.clear();
    this.byScope.clear();
  }
}

/** Alias matching Sprint 026 naming. */
export { DecisionHistoryStore as DecisionHistory };
