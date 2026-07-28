/**
 * P-010 reconciliation store.
 */

import { resetMatchingRulesForTests } from "./rules";
import type {
  MatchSuggestion,
  ReconciliationAdjustment,
  ReconciliationApproval,
  ReconciliationException,
  ReconciliationHistoryEntry,
  ReconciliationMatch,
  ReconciliationPeriod,
  ReconciliationSignalEvent,
} from "./types";

type ReconciliationStore = {
  periods: Map<string, ReconciliationPeriod>;
  matches: Map<string, ReconciliationMatch>;
  exceptions: Map<string, ReconciliationException>;
  adjustments: Map<string, ReconciliationAdjustment>;
  approvals: Map<string, ReconciliationApproval>;
  suggestions: Map<string, MatchSuggestion>;
  history: ReconciliationHistoryEntry[];
  signals: ReconciliationSignalEvent[];
  signalSubscribers: ((e: ReconciliationSignalEvent) => void)[];
};

const g = globalThis as typeof globalThis & {
  __jagReconciliationStore?: ReconciliationStore;
};

function empty(): ReconciliationStore {
  return {
    periods: new Map(),
    matches: new Map(),
    exceptions: new Map(),
    adjustments: new Map(),
    approvals: new Map(),
    suggestions: new Map(),
    history: [],
    signals: [],
    signalSubscribers: [],
  };
}

function store(): ReconciliationStore {
  if (!g.__jagReconciliationStore) g.__jagReconciliationStore = empty();
  return g.__jagReconciliationStore;
}

export function resetReconciliationStoreForTests(): void {
  g.__jagReconciliationStore = empty();
  resetMatchingRulesForTests();
}

function byOrg<T extends { organizationId: string }>(
  map: Map<string, T>,
  organizationId: string
): T[] {
  return [...map.values()].filter((x) => x.organizationId === organizationId);
}

export function upsertPeriod(p: ReconciliationPeriod): ReconciliationPeriod {
  store().periods.set(p.id, p);
  return p;
}
export function getPeriod(id: string): ReconciliationPeriod | null {
  return store().periods.get(id) ?? null;
}
export function listPeriods(
  organizationId: string
): readonly ReconciliationPeriod[] {
  return Object.freeze(byOrg(store().periods, organizationId));
}

export function upsertMatch(m: ReconciliationMatch): ReconciliationMatch {
  store().matches.set(m.id, m);
  return m;
}
export function listMatches(
  organizationId: string,
  periodId?: string
): readonly ReconciliationMatch[] {
  return Object.freeze(
    byOrg(store().matches, organizationId).filter((m) =>
      periodId ? m.periodId === periodId : true
    )
  );
}

export function upsertException(
  e: ReconciliationException
): ReconciliationException {
  store().exceptions.set(e.id, e);
  return e;
}
export function listExceptions(
  organizationId: string,
  periodId?: string
): readonly ReconciliationException[] {
  return Object.freeze(
    byOrg(store().exceptions, organizationId).filter((e) =>
      periodId ? e.periodId === periodId : true
    )
  );
}

export function upsertAdjustment(
  a: ReconciliationAdjustment
): ReconciliationAdjustment {
  store().adjustments.set(a.id, a);
  return a;
}
export function listAdjustments(
  organizationId: string,
  periodId?: string
): readonly ReconciliationAdjustment[] {
  return Object.freeze(
    byOrg(store().adjustments, organizationId).filter((a) =>
      periodId ? a.periodId === periodId : true
    )
  );
}

export function upsertApproval(
  a: ReconciliationApproval
): ReconciliationApproval {
  store().approvals.set(a.id, a);
  return a;
}
export function listApprovals(
  organizationId: string,
  periodId?: string
): readonly ReconciliationApproval[] {
  return Object.freeze(
    byOrg(store().approvals, organizationId).filter((a) =>
      periodId ? a.periodId === periodId : true
    )
  );
}

export function upsertSuggestion(s: MatchSuggestion): MatchSuggestion {
  store().suggestions.set(s.id, s);
  return s;
}
export function listSuggestions(
  organizationId: string,
  periodId?: string
): readonly MatchSuggestion[] {
  return Object.freeze(
    byOrg(store().suggestions, organizationId).filter((s) =>
      periodId ? s.periodId === periodId : true
    )
  );
}
export function clearSuggestions(periodId: string): void {
  for (const [id, s] of store().suggestions) {
    if (s.periodId === periodId) store().suggestions.delete(id);
  }
}

export function appendHistory(
  e: ReconciliationHistoryEntry
): ReconciliationHistoryEntry {
  store().history.unshift(e);
  if (store().history.length > 5000) store().history.length = 5000;
  return e;
}
export function listHistory(
  organizationId: string,
  periodId?: string,
  limit = 200
): readonly ReconciliationHistoryEntry[] {
  return Object.freeze(
    store()
      .history.filter(
        (h) =>
          h.organizationId === organizationId &&
          (periodId ? h.periodId === periodId : true)
      )
      .slice(0, limit)
  );
}

export function appendSignal(
  e: ReconciliationSignalEvent
): ReconciliationSignalEvent {
  store().signals.unshift(e);
  if (store().signals.length > 2000) store().signals.length = 2000;
  for (const sub of store().signalSubscribers) {
    try {
      sub(e);
    } catch {
      /* subscriber isolation */
    }
  }
  return e;
}
export function listSignals(
  organizationId: string,
  limit = 100
): readonly ReconciliationSignalEvent[] {
  return Object.freeze(
    store()
      .signals.filter((s) => s.organizationId === organizationId)
      .slice(0, limit)
  );
}
export function subscribeSignals(
  fn: (e: ReconciliationSignalEvent) => void
): () => void {
  store().signalSubscribers.push(fn);
  return () => {
    const arr = store().signalSubscribers;
    const i = arr.indexOf(fn);
    if (i >= 0) arr.splice(i, 1);
  };
}
