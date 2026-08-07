/**
 * Slice 4.1 — pure workbench helpers (filter, search, compare).
 * No LLM. Evidence-backed only.
 */

import type { ListeningSignalClass, ListeningSignalRow } from "./types";

export type ListeningWorkbenchFilters = {
  readonly campaignId?: string | null;
  readonly initiativeId?: string | null;
  readonly instrumentId?: string | null;
  readonly segmentId?: string | null;
  readonly signalClass?: ListeningSignalClass | "" | null;
  readonly questionId?: string | null;
  readonly dateFrom?: string | null;
  readonly dateTo?: string | null;
  readonly query?: string | null;
  readonly sort?: "support" | "confidence" | "recent" | "title";
};

export type ListeningAnalysisRunSummary = {
  readonly id: string;
  readonly organizationId: string;
  readonly campaignId: string;
  readonly campaignTitle: string;
  readonly instrumentId: string | null;
  readonly instrumentTitle: string | null;
  readonly initiativeId: string | null;
  readonly status: string;
  readonly runDate: string;
  readonly completionRate: number | null;
  readonly signalCount: number;
  readonly evidenceCount: number;
};

export type ListeningCampaignCompareResult = {
  readonly campaignAId: string;
  readonly campaignBId: string;
  readonly sharedThemes: readonly string[];
  readonly uniqueToA: readonly string[];
  readonly uniqueToB: readonly string[];
  readonly strengthsA: readonly string[];
  readonly strengthsB: readonly string[];
  readonly concernsA: readonly string[];
  readonly concernsB: readonly string[];
  readonly opportunitiesA: readonly string[];
  readonly opportunitiesB: readonly string[];
};

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function filterListeningSignals(
  signals: readonly ListeningSignalRow[],
  filters: ListeningWorkbenchFilters,
  context?: {
    /** campaignId → initiativeId */
    readonly campaignInitiative?: ReadonlyMap<string, string | null>;
  }
): ListeningSignalRow[] {
  let rows = [...signals];

  if (filters.campaignId) {
    rows = rows.filter((s) => s.campaignId === filters.campaignId);
  }
  if (filters.instrumentId) {
    rows = rows.filter((s) => s.instrumentId === filters.instrumentId);
  }
  if (filters.initiativeId && context?.campaignInitiative) {
    rows = rows.filter(
      (s) =>
        context.campaignInitiative?.get(s.campaignId) === filters.initiativeId
    );
  }
  if (filters.signalClass) {
    rows = rows.filter((s) => s.signalClass === filters.signalClass);
  }
  if (filters.questionId) {
    rows = rows.filter(
      (s) => String(s.metadata.question_id ?? "") === filters.questionId
    );
  }
  if (filters.dateFrom) {
    const from = Date.parse(filters.dateFrom);
    if (!Number.isNaN(from)) {
      rows = rows.filter((s) => Date.parse(s.createdAt) >= from);
    }
  }
  if (filters.dateTo) {
    const to = Date.parse(filters.dateTo);
    if (!Number.isNaN(to)) {
      rows = rows.filter((s) => Date.parse(s.createdAt) <= to);
    }
  }
  // Segment filter reserved — evidence/responses do not carry segment yet.
  // When present on signal metadata, honor it.
  if (filters.segmentId) {
    rows = rows.filter(
      (s) => String(s.metadata.segment_id ?? "") === filters.segmentId
    );
  }

  const q = filters.query?.trim().toLowerCase();
  if (q) {
    rows = rows.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.signalClass.toLowerCase().includes(q)
    );
  }

  const sort = filters.sort ?? "support";
  rows.sort((a, b) => {
    switch (sort) {
      case "confidence":
        return (b.confidence ?? 0) - (a.confidence ?? 0);
      case "recent":
        return Date.parse(b.createdAt) - Date.parse(a.createdAt);
      case "title":
        return a.title.localeCompare(b.title);
      case "support":
      default:
        return b.supportCount - a.supportCount;
    }
  });

  return rows;
}

export function compareListeningCampaignSignals(
  signalsA: readonly ListeningSignalRow[],
  signalsB: readonly ListeningSignalRow[],
  campaignAId: string,
  campaignBId: string
): ListeningCampaignCompareResult {
  const titles = (rows: readonly ListeningSignalRow[], cls?: ListeningSignalClass) => {
    const set = new Set<string>();
    for (const s of rows) {
      if (cls && s.signalClass !== cls) continue;
      const key = normalizeTitle(s.title);
      if (key) set.add(key);
    }
    return set;
  };

  const allA = titles(signalsA);
  const allB = titles(signalsB);
  const sharedThemes: string[] = [];
  for (const t of allA) if (allB.has(t)) sharedThemes.push(t);

  const uniqueToA = [...allA].filter((t) => !allB.has(t));
  const uniqueToB = [...allB].filter((t) => !allA.has(t));

  return {
    campaignAId,
    campaignBId,
    sharedThemes: sharedThemes.sort(),
    uniqueToA: uniqueToA.sort(),
    uniqueToB: uniqueToB.sort(),
    strengthsA: [...titles(signalsA, "strength")].sort(),
    strengthsB: [...titles(signalsB, "strength")].sort(),
    concernsA: [...titles(signalsA, "concern")].sort(),
    concernsB: [...titles(signalsB, "concern")].sort(),
    opportunitiesA: [...titles(signalsA, "opportunity")].sort(),
    opportunitiesB: [...titles(signalsB, "opportunity")].sort(),
  };
}

export function formatCompletionPct(rate: number | null | undefined): string {
  if (rate == null || Number.isNaN(rate)) return "—";
  return `${Math.round(rate * 100)}%`;
}

export function formatConfidence(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${Math.round(value * 100)}%`;
}
