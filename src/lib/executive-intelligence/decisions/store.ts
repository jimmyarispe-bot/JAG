import type {
  DecisionReassignment,
  DecisionTimelineEntry,
  JagDecision,
} from "@/lib/executive-intelligence/decisions/types";

type DecisionStore = {
  decisions: Map<string, JagDecision>;
  timeline: DecisionTimelineEntry[];
  reassignmentsByDecision: Map<string, DecisionReassignment[]>;
};

const g = globalThis as typeof globalThis & {
  __jagDecisionStore?: DecisionStore;
};

function store(): DecisionStore {
  if (!g.__jagDecisionStore) {
    g.__jagDecisionStore = {
      decisions: new Map(),
      timeline: [],
      reassignmentsByDecision: new Map(),
    };
  }
  return g.__jagDecisionStore;
}

export function resetDecisionStoreForTests(): void {
  g.__jagDecisionStore = {
    decisions: new Map(),
    timeline: [],
    reassignmentsByDecision: new Map(),
  };
}

export function upsertDecision(decision: JagDecision): JagDecision {
  store().decisions.set(decision.id, decision);
  return decision;
}

export function getDecision(
  organizationId: string,
  decisionId: string
): JagDecision | null {
  const row = store().decisions.get(decisionId);
  if (!row || row.organizationId !== organizationId) return null;
  return row;
}

export function listDecisionsForOrganization(
  organizationId: string
): readonly JagDecision[] {
  return Object.freeze(
    [...store().decisions.values()]
      .filter((d) => d.organizationId === organizationId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  );
}

export function findDecisionByExternalKey(
  organizationId: string,
  externalKey: string
): JagDecision | null {
  return (
    [...store().decisions.values()].find(
      (d) =>
        d.organizationId === organizationId && d.externalKey === externalKey
    ) ?? null
  );
}

export function appendDecisionTimeline(
  entry: DecisionTimelineEntry
): DecisionTimelineEntry {
  store().timeline.push(entry);
  if (store().timeline.length > 8000) {
    store().timeline = store().timeline.slice(-6000);
  }
  return entry;
}

export function listDecisionTimeline(
  organizationId: string,
  decisionId?: string
): readonly DecisionTimelineEntry[] {
  return Object.freeze(
    store()
      .timeline.filter(
        (e) =>
          e.organizationId === organizationId &&
          (!decisionId || e.decisionId === decisionId)
      )
      .sort((a, b) => b.at.localeCompare(a.at))
  );
}

export function recordDecisionReassignment(
  decisionId: string,
  entry: DecisionReassignment
): void {
  const map = store().reassignmentsByDecision;
  const list = map.get(decisionId) ?? [];
  list.push(entry);
  map.set(decisionId, list);
}

export function getDecisionReassignments(
  decisionId: string
): readonly DecisionReassignment[] {
  return Object.freeze([
    ...(store().reassignmentsByDecision.get(decisionId) ?? []),
  ]);
}
