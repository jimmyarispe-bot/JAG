/**
 * Generic in-memory result + history repository (Stabilization A3).
 *
 * Parameterized by result / history / scope types only.
 * Domains keep thin typed subclasses or aliases for public APIs.
 */

import {
  matchesGraphScope,
  type GraphScopeLike,
} from "@/lib/platform/intelligence/common/scope";

/** Result rows keyed by `requestId` with a graph-like scope. */
export interface ResultWithRequestId<TScope extends GraphScopeLike> {
  requestId: string;
  scope: TScope;
}

/** History rows that carry a graph-like scope. */
export interface HistoryWithScope<TScope extends GraphScopeLike> {
  scope: TScope;
}

export type ClearHistoryMode = "truncate" | "replace";

export interface InMemoryResultHistoryRepositoryOptions {
  /**
   * How `clear()` resets the history array.
   * - `truncate` — `history.length = 0` (majority)
   * - `replace` — `history = []` (some late domains)
   */
  clearHistoryMode?: ClearHistoryMode;
}

/**
 * Canonical Sprint result store: Map by requestId + history array + scope filter.
 */
export class InMemoryResultHistoryRepository<
  TResult extends ResultWithRequestId<TScope>,
  THistory extends HistoryWithScope<TScope>,
  TScope extends GraphScopeLike = GraphScopeLike,
> {
  private readonly results = new Map<string, TResult>();
  private history: THistory[] = [];
  private readonly clearHistoryMode: ClearHistoryMode;

  constructor(options: InMemoryResultHistoryRepositoryOptions = {}) {
    this.clearHistoryMode = options.clearHistoryMode ?? "truncate";
  }

  save(result: TResult): TResult {
    this.results.set(result.requestId, result);
    return result;
  }

  get(requestId: string): TResult | null {
    return this.results.get(requestId) ?? null;
  }

  list(scope?: Partial<TScope>): TResult[] {
    const values = [...this.results.values()];
    if (!scope) return values;
    return values.filter((v) => matchesGraphScope(v.scope, scope));
  }

  remove(requestId: string): boolean {
    return this.results.delete(requestId);
  }

  saveHistory(record: THistory): THistory {
    this.history.push(record);
    return record;
  }

  listHistory(scope?: Partial<TScope>): THistory[] {
    if (!scope) return [...this.history];
    return this.history.filter((v) => matchesGraphScope(v.scope, scope));
  }

  clear(): void {
    this.results.clear();
    if (this.clearHistoryMode === "replace") {
      this.history = [];
    } else {
      this.history.length = 0;
    }
  }
}
