/**
 * In-process Innovation store.
 */

import type {
  InnovationCandidate,
  InnovationPattern,
  InnovationSignal,
} from "./types";

type InnovationStore = {
  signals: InnovationSignal[];
  patterns: InnovationPattern[];
  opportunities: Map<string, InnovationCandidate>;
  lastScanAt: string | null;
};

const g = globalThis as typeof globalThis & {
  __jagInnovationStore?: InnovationStore;
};

function empty(): InnovationStore {
  return {
    signals: [],
    patterns: [],
    opportunities: new Map(),
    lastScanAt: null,
  };
}

function store(): InnovationStore {
  if (!g.__jagInnovationStore) g.__jagInnovationStore = empty();
  return g.__jagInnovationStore;
}

export function resetInnovationStoreForTests(): void {
  g.__jagInnovationStore = empty();
}

export function replaceSignals(signals: readonly InnovationSignal[]): void {
  store().signals = [...signals];
}

export function listSignals(filter?: {
  organizationId?: string;
  source?: string;
  limit?: number;
}): readonly InnovationSignal[] {
  let rows = store().signals;
  if (filter?.organizationId) {
    rows = rows.filter(
      (s) =>
        s.organizationId === filter.organizationId || s.organizationId === null
    );
  }
  if (filter?.source) {
    rows = rows.filter((s) => s.source === filter.source);
  }
  return Object.freeze(rows.slice(0, filter?.limit ?? 200));
}

export function replacePatterns(patterns: readonly InnovationPattern[]): void {
  store().patterns = [...patterns];
}

export function listPatterns(limit = 50): readonly InnovationPattern[] {
  return Object.freeze(
    [...store().patterns]
      .sort((a, b) => b.strength - a.strength)
      .slice(0, limit)
  );
}

export function upsertOpportunity(
  opp: InnovationCandidate
): InnovationCandidate {
  store().opportunities.set(opp.opportunityId, opp);
  return opp;
}

export function replaceOpportunities(
  opps: readonly InnovationCandidate[]
): void {
  store().opportunities.clear();
  for (const o of opps) store().opportunities.set(o.opportunityId, o);
}

export function getOpportunity(id: string): InnovationCandidate | null {
  return store().opportunities.get(id) ?? null;
}

export function listOpportunities(filter?: {
  category?: string;
  horizon?: string;
  limit?: number;
}): readonly InnovationCandidate[] {
  let rows = [...store().opportunities.values()];
  if (filter?.category) {
    rows = rows.filter((o) => o.portfolioCategory === filter.category);
  }
  if (filter?.horizon) {
    rows = rows.filter((o) => o.roadmapHorizon === filter.horizon);
  }
  rows.sort((a, b) => b.scores.total - a.scores.total);
  return Object.freeze(rows.slice(0, filter?.limit ?? 100));
}

export function setLastScanAt(iso: string): void {
  store().lastScanAt = iso;
}

export function getLastScanAt(): string | null {
  return store().lastScanAt;
}
