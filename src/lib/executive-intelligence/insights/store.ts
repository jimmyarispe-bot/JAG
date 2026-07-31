import type {
  ExecutiveInsight,
  InsightTimelineEntry,
} from "@/lib/executive-intelligence/insights/types";

type InsightStore = {
  insights: Map<string, ExecutiveInsight>;
  timeline: InsightTimelineEntry[];
};

const g = globalThis as typeof globalThis & {
  __jagExecutiveInsightStore?: InsightStore;
};

function store(): InsightStore {
  if (!g.__jagExecutiveInsightStore) {
    g.__jagExecutiveInsightStore = {
      insights: new Map(),
      timeline: [],
    };
  }
  return g.__jagExecutiveInsightStore;
}

export function resetInsightStoreForTests(): void {
  g.__jagExecutiveInsightStore = {
    insights: new Map(),
    timeline: [],
  };
}

export function upsertInsight(insight: ExecutiveInsight): ExecutiveInsight {
  store().insights.set(insight.id, insight);
  return insight;
}

export function getInsight(
  organizationId: string,
  insightId: string
): ExecutiveInsight | null {
  const row = store().insights.get(insightId);
  if (!row || row.organizationId !== organizationId) return null;
  return row;
}

export function listInsightsForOrganization(
  organizationId: string
): readonly ExecutiveInsight[] {
  return Object.freeze(
    [...store().insights.values()]
      .filter((i) => i.organizationId === organizationId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  );
}

export function appendInsightTimeline(
  entry: InsightTimelineEntry
): InsightTimelineEntry {
  store().timeline.push(entry);
  if (store().timeline.length > 5000) {
    store().timeline = store().timeline.slice(-4000);
  }
  return entry;
}

export function listInsightTimelineForOrganization(
  organizationId: string
): readonly InsightTimelineEntry[] {
  return Object.freeze(
    store()
      .timeline.filter((e) => e.organizationId === organizationId)
      .sort((a, b) => b.at.localeCompare(a.at))
  );
}

export function listInsightTimelineForInsight(
  organizationId: string,
  insightId: string
): readonly InsightTimelineEntry[] {
  return Object.freeze(
    store()
      .timeline.filter(
        (e) =>
          e.organizationId === organizationId && e.insightId === insightId
      )
      .sort((a, b) => b.at.localeCompare(a.at))
  );
}
