/**
 * P-004 Coach in-process store.
 */

import type {
  CoachAnalyticsSnapshot,
  CoachGoal,
  CoachObservationEvent,
  CoachRecommendation,
  CoachRisk,
  CoachTimelineEntry,
  CustomEventRegistration,
} from "./types";

type CoachStore = {
  events: CoachObservationEvent[];
  recommendations: Map<string, CoachRecommendation>;
  risks: Map<string, CoachRisk>;
  goals: Map<string, CoachGoal>;
  timeline: CoachTimelineEntry[];
  customEvents: Map<string, CustomEventRegistration>;
  milestonesHit: Set<string>;
};

const g = globalThis as typeof globalThis & {
  __jagMrJagCoachStore?: CoachStore;
};

function empty(): CoachStore {
  return {
    events: [],
    recommendations: new Map(),
    risks: new Map(),
    goals: new Map(),
    timeline: [],
    customEvents: new Map(),
    milestonesHit: new Set(),
  };
}

function store(): CoachStore {
  if (!g.__jagMrJagCoachStore) g.__jagMrJagCoachStore = empty();
  return g.__jagMrJagCoachStore;
}

export function resetCoachEngineStoreForTests(): void {
  g.__jagMrJagCoachStore = empty();
}

export function appendEvent(event: CoachObservationEvent): CoachObservationEvent {
  store().events.unshift(event);
  if (store().events.length > 500) store().events.length = 500;
  return event;
}

export function listEvents(filter?: {
  organizationId?: string;
  userId?: string;
  kind?: string;
  limit?: number;
}): readonly CoachObservationEvent[] {
  let rows = store().events;
  if (filter?.organizationId) {
    rows = rows.filter((e) => e.organizationId === filter.organizationId);
  }
  if (filter?.userId) {
    rows = rows.filter((e) => e.userId === filter.userId);
  }
  if (filter?.kind) {
    rows = rows.filter((e) => e.kind === filter.kind);
  }
  return Object.freeze(rows.slice(0, filter?.limit ?? 100));
}

export function hasEventKind(
  organizationId: string,
  userId: string,
  kind: string
): boolean {
  return store().events.some(
    (e) =>
      e.organizationId === organizationId &&
      e.userId === userId &&
      e.kind === kind
  );
}

export function upsertRecommendation(
  rec: CoachRecommendation
): CoachRecommendation {
  store().recommendations.set(rec.id, rec);
  return rec;
}

export function getRecommendation(id: string): CoachRecommendation | null {
  return store().recommendations.get(id) ?? null;
}

export function listRecommendations(filter?: {
  organizationId?: string;
  userId?: string;
  persona?: string;
}): readonly CoachRecommendation[] {
  let rows = [...store().recommendations.values()];
  // Recommendations are not org-scoped on the object; filter via timeline later if needed.
  if (filter?.persona) {
    rows = rows.filter(
      (r) => r.persona.toLowerCase() === filter.persona!.toLowerCase()
    );
  }
  rows.sort((a, b) => b.priorityScore - a.priorityScore);
  return Object.freeze(rows);
}

export function upsertRisk(risk: CoachRisk): CoachRisk {
  store().risks.set(risk.id, risk);
  return risk;
}

export function listRisks(filter?: {
  organizationId?: string;
  userId?: string;
  openOnly?: boolean;
}): readonly CoachRisk[] {
  let rows = [...store().risks.values()];
  if (filter?.organizationId) {
    rows = rows.filter((r) => r.organizationId === filter.organizationId);
  }
  if (filter?.userId) {
    rows = rows.filter((r) => r.userId === filter.userId);
  }
  if (filter?.openOnly) {
    rows = rows.filter((r) => r.open);
  }
  rows.sort((a, b) => b.detectedAt.localeCompare(a.detectedAt));
  return Object.freeze(rows);
}

export function upsertGoal(goal: CoachGoal): CoachGoal {
  store().goals.set(goal.id, goal);
  return goal;
}

export function getGoal(id: string): CoachGoal | null {
  return store().goals.get(id) ?? null;
}

export function listGoals(filter?: {
  organizationId?: string;
  userId?: string;
}): readonly CoachGoal[] {
  let rows = [...store().goals.values()];
  if (filter?.organizationId) {
    rows = rows.filter((g) => g.organizationId === filter.organizationId);
  }
  if (filter?.userId) {
    rows = rows.filter((g) => g.userId === filter.userId);
  }
  rows.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return Object.freeze(rows);
}

export function appendTimeline(
  entry: CoachTimelineEntry
): CoachTimelineEntry {
  store().timeline.unshift(entry);
  if (store().timeline.length > 400) store().timeline.length = 400;
  return entry;
}

export function updateTimeline(
  id: string,
  patch: Partial<Pick<CoachTimelineEntry, "status" | "body" | "updatedAt">>
): CoachTimelineEntry | null {
  const idx = store().timeline.findIndex((t) => t.id === id);
  if (idx < 0) return null;
  const next = {
    ...store().timeline[idx]!,
    ...patch,
    updatedAt: patch.updatedAt ?? new Date().toISOString(),
  };
  store().timeline[idx] = next;
  return next;
}

export function listTimeline(filter?: {
  organizationId?: string;
  userId?: string;
  status?: CoachTimelineEntry["status"];
  limit?: number;
}): readonly CoachTimelineEntry[] {
  let rows = store().timeline;
  if (filter?.organizationId) {
    rows = rows.filter((t) => t.organizationId === filter.organizationId);
  }
  if (filter?.userId) {
    rows = rows.filter((t) => t.userId === filter.userId);
  }
  if (filter?.status) {
    rows = rows.filter((t) => t.status === filter.status);
  }
  return Object.freeze(rows.slice(0, filter?.limit ?? 100));
}

export function registerCustomEvent(
  reg: CustomEventRegistration
): CustomEventRegistration {
  store().customEvents.set(reg.kind, reg);
  return reg;
}

export function getCustomEvent(kind: string): CustomEventRegistration | null {
  return store().customEvents.get(kind) ?? null;
}

export function listCustomEvents(): readonly CustomEventRegistration[] {
  return Object.freeze([...store().customEvents.values()]);
}

export function markMilestone(
  organizationId: string,
  userId: string,
  kind: string
): void {
  store().milestonesHit.add(`${organizationId}::${userId}::${kind}`);
}

export function isMilestoneHit(
  organizationId: string,
  userId: string,
  kind: string
): boolean {
  return store().milestonesHit.has(`${organizationId}::${userId}::${kind}`);
}

export function milestoneCount(
  organizationId: string,
  userId: string
): number {
  const prefix = `${organizationId}::${userId}::`;
  let n = 0;
  for (const key of store().milestonesHit) {
    if (key.startsWith(prefix)) n += 1;
  }
  return n;
}

export function buildCoachAnalytics(
  organizationId: string,
  userId: string
): CoachAnalyticsSnapshot {
  const events = listEvents({ organizationId, userId, limit: 500 });
  const eventsByKind: Record<string, number> = {};
  for (const e of events) {
    eventsByKind[e.kind] = (eventsByKind[e.kind] ?? 0) + 1;
  }
  const timeline = listTimeline({ organizationId, userId, limit: 400 });
  const recs = listRecommendations();
  const byType: Record<string, number> = {};
  for (const r of recs) {
    byType[r.type] = (byType[r.type] ?? 0) + 1;
  }
  const avg =
    recs.length === 0
      ? 0
      : Math.round(
          recs.reduce((a, b) => a + b.priorityScore, 0) / recs.length
        );
  const goals = listGoals({ organizationId, userId });
  const goalsPct =
    goals.length === 0
      ? 0
      : Math.round(
          goals.reduce((a, g) => a + g.completionPercent, 0) / goals.length
        );

  return {
    generatedAt: new Date().toISOString(),
    eventsByKind: Object.freeze(eventsByKind),
    recommendationsByType: Object.freeze(byType),
    openRiskCount: listRisks({ organizationId, userId, openOnly: true })
      .length,
    acceptedCount: timeline.filter((t) => t.status === "accepted").length,
    dismissedCount: timeline.filter((t) => t.status === "dismissed").length,
    averagePriorityScore: avg,
    goalsCompletionPercent: goalsPct,
  };
}
