/**
 * Predictive Intelligence — ForecastHistory (Sprint 028).
 */

import type { ForecastHistory as ForecastHistoryContract } from "@/lib/platform/intelligence/predictive-intelligence/contracts";
import type {
  ForecastHistoryRecord,
  ForecastStatus,
  GraphScope,
  PredictionResult,
} from "@/lib/platform/intelligence/predictive-intelligence/types";

function scopeKey(scope?: Partial<GraphScope> | null): string {
  return [
    scope?.organizationId ?? "org:null",
    scope?.schoolId ?? "school:null",
    scope?.regionId ?? "region:null",
    scope?.campusId ?? "campus:null",
  ].join("|");
}

/**
 * ForecastHistory — in-memory forecast audit trail.
 */
export class ForecastHistoryStore implements ForecastHistoryContract {
  private readonly byId = new Map<string, ForecastHistoryRecord>();
  private readonly byScope = new Map<string, string[]>();

  record(result: PredictionResult): ForecastHistoryRecord {
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

  get(id: string): ForecastHistoryRecord | null {
    return this.byId.get(id) ?? null;
  }

  list(scope?: Partial<GraphScope>): ForecastHistoryRecord[] {
    if (!scope) {
      return Array.from(this.byId.values()).sort((a, b) =>
        a.createdAt < b.createdAt ? 1 : -1
      );
    }
    const ids = this.byScope.get(scopeKey(scope)) ?? [];
    return ids
      .map((id) => this.byId.get(id))
      .filter((r): r is ForecastHistoryRecord => Boolean(r))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  updateStatus(id: string, status: ForecastStatus): ForecastHistoryRecord | null {
    const existing = this.byId.get(id);
    if (!existing) return null;
    const updated: ForecastHistoryRecord = {
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

/** Alias matching Sprint 028 naming. */
export { ForecastHistoryStore as ForecastHistory };
