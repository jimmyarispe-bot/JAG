import type {
  ExecutiveDecision,
  ExecutiveDecisionDraft,
  ExecutiveDecisionHistoryEntry,
  ExecutiveDecisionSourceKind,
  ExecutiveDecisionSourceRef,
  ExecutiveDecisionStatus,
} from "@/lib/platform/executive-decisions/types";
import { DECISION_SOURCE_PRECEDENCE } from "@/lib/platform/executive-decisions/types";
import {
  buildDecisionMergeKey,
  decisionIdFromMergeKey,
  hashString,
  normalizeToken,
} from "@/lib/platform/executive-decisions/hash";
import {
  maxDecisionConfidence,
  maxDecisionSeverity,
  scoreDecision,
} from "@/lib/platform/executive-decisions/score";

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    if (!v || seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}

function mergeSourceRefs(
  a: ExecutiveDecisionSourceRef[],
  b: ExecutiveDecisionSourceRef[]
): ExecutiveDecisionSourceRef[] {
  const key = (s: ExecutiveDecisionSourceRef) => `${s.source}:${s.sourceId}`;
  const map = new Map<string, ExecutiveDecisionSourceRef>();
  for (const s of [...a, ...b]) {
    if (!map.has(key(s))) map.set(key(s), s);
  }
  return [...map.values()].sort(
    (x, y) =>
      DECISION_SOURCE_PRECEDENCE[y.source] - DECISION_SOURCE_PRECEDENCE[x.source]
  );
}

function mergeHistory(
  a: ExecutiveDecisionHistoryEntry[],
  b: ExecutiveDecisionHistoryEntry[]
): ExecutiveDecisionHistoryEntry[] {
  const key = (h: ExecutiveDecisionHistoryEntry) =>
    `${h.at}|${h.action}|${h.note ?? ""}|${h.toOwner ?? ""}`;
  const map = new Map<string, ExecutiveDecisionHistoryEntry>();
  for (const h of [...a, ...b]) {
    if (!map.has(key(h))) map.set(key(h), h);
  }
  return [...map.values()].sort(
    (x, y) => new Date(x.at).getTime() - new Date(y.at).getTime()
  );
}

function preferBySource<T>(
  a: T | null | undefined,
  aSource: ExecutiveDecisionSourceKind | null,
  b: T | null | undefined,
  bSource: ExecutiveDecisionSourceKind | null
): T | null {
  const aVal = a ?? null;
  const bVal = b ?? null;
  if (aVal == null) return bVal;
  if (bVal == null) return aVal;
  const aRank = aSource ? DECISION_SOURCE_PRECEDENCE[aSource] : 0;
  const bRank = bSource ? DECISION_SOURCE_PRECEDENCE[bSource] : 0;
  return bRank > aRank ? bVal : aVal;
}

function preferLonger(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return b.length > a.length ? b : a;
}

function preferNewer(a: string, b: string): string {
  return new Date(a).getTime() >= new Date(b).getTime() ? a : b;
}

function preferOlder(a: string, b: string): string {
  return new Date(a).getTime() <= new Date(b).getTime() ? a : b;
}

function mergeStatus(
  a: ExecutiveDecisionStatus,
  b: ExecutiveDecisionStatus
): ExecutiveDecisionStatus {
  const terminal = (s: ExecutiveDecisionStatus) =>
    s === "Completed" || s === "Dismissed";
  // A live source reopens a terminal status in the composed view.
  if (terminal(a) && !terminal(b)) return b;
  if (terminal(b) && !terminal(a)) return a;
  if (terminal(a) && terminal(b)) return a;

  const rank: Record<ExecutiveDecisionStatus, number> = {
    Open: 1,
    Acknowledged: 2,
    Delegated: 3,
    Waiting: 4,
    Completed: 5,
    Dismissed: 6,
  };
  return rank[a] >= rank[b] ? a : b;
}

function primarySourceKind(
  sources: ExecutiveDecisionSourceRef[]
): ExecutiveDecisionSourceKind | null {
  if (!sources.length) return null;
  return [...sources].sort(
    (a, b) =>
      DECISION_SOURCE_PRECEDENCE[b.source] - DECISION_SOURCE_PRECEDENCE[a.source]
  )[0].source;
}

function draftToDecision(draft: ExecutiveDecisionDraft): ExecutiveDecision {
  const mergeKey = buildDecisionMergeKey({
    schoolId: draft.campus,
    campusId: draft.campus,
    organizationId: draft.organization,
    decisionType: draft.decisionType,
    entityType: draft.relatedEntityType,
    entityId: draft.relatedEntityId,
    signalKey: draft.signalKey,
    missionControlId: draft.relatedMissionControlItem,
    workflowId: draft.relatedWorkflow,
    jagWorkId: draft.relatedJagWorkItem,
  });

  const sources = [draft.source];
  const status = draft.status ?? "Open";
  const createdAt = draft.createdAt;
  const updatedAt = draft.updatedAt ?? createdAt;
  const history =
    draft.history ??
    ([
      {
        at: createdAt,
        action: "created",
        note: `From ${draft.source.source}`,
      },
    ] satisfies ExecutiveDecisionHistoryEntry[]);

  const decision: ExecutiveDecision = {
    id: decisionIdFromMergeKey(mergeKey),
    title: draft.title,
    summary: draft.summary,
    decisionType: draft.decisionType,
    priority: 1,
    severity: draft.severity,
    confidence: draft.confidence,
    organization: draft.organization,
    region: draft.region,
    campus: draft.campus,
    program: draft.program,
    status,
    recommendedAction: draft.recommendedAction ?? null,
    recommendedOwner: draft.recommendedOwner ?? null,
    dueDate: draft.dueDate ?? null,
    blocking: draft.blocking ?? false,
    relatedAlerts: uniqueStrings(draft.relatedAlerts ?? []),
    relatedActivities: uniqueStrings(draft.relatedActivities ?? []),
    relatedWorkflow: draft.relatedWorkflow ?? null,
    relatedMissionControlItem: draft.relatedMissionControlItem ?? null,
    relatedJagWorkItem: draft.relatedJagWorkItem ?? null,
    createdAt,
    updatedAt,
    mergeKey,
    signalKey: draft.signalKey,
    sources,
    history,
    relatedEntityType: draft.relatedEntityType ?? null,
    relatedEntityId: draft.relatedEntityId ?? null,
    financialImpact: draft.financialImpact ?? false,
    studentImpact: draft.studentImpact ?? false,
    complianceRisk: draft.complianceRisk ?? false,
  };

  decision.priority = scoreDecision({
    severity: decision.severity,
    decisionType: decision.decisionType,
    confidence: decision.confidence,
    blocking: decision.blocking,
    financialImpact: decision.financialImpact,
    studentImpact: decision.studentImpact,
    complianceRisk: decision.complianceRisk,
    sourceCount: sources.length,
    createdAt: decision.createdAt,
    dueDate: decision.dueDate,
  });

  return decision;
}

function mergeTwo(
  primary: ExecutiveDecision,
  incoming: ExecutiveDecision
): ExecutiveDecision {
  const primaryKind = primarySourceKind(primary.sources);
  const incomingKind = primarySourceKind(incoming.sources);

  const sources = mergeSourceRefs(primary.sources, incoming.sources);
  const severity = maxDecisionSeverity(primary.severity, incoming.severity);
  const confidence = maxDecisionConfidence(primary.confidence, incoming.confidence);
  const status = mergeStatus(primary.status, incoming.status);
  const createdAt = preferOlder(primary.createdAt, incoming.createdAt);
  const updatedAt = preferNewer(primary.updatedAt, incoming.updatedAt);

  // Prefer Mission Control / Workflow / JAG Work references when present (task rules).
  const relatedMissionControlItem =
    primary.relatedMissionControlItem ?? incoming.relatedMissionControlItem;
  const relatedWorkflow = primary.relatedWorkflow ?? incoming.relatedWorkflow;
  const relatedJagWorkItem =
    primary.relatedJagWorkItem ?? incoming.relatedJagWorkItem;

  const title = preferBySource(
    primary.title,
    primaryKind,
    incoming.title,
    incomingKind
  ) as string;

  const merged: ExecutiveDecision = {
    ...primary,
    title: title || primary.title,
    summary:
      preferLonger(primary.summary, incoming.summary) ?? primary.summary,
    // Prefer more specific domain types over generic Review when merging.
    decisionType: preferDecisionType(primary.decisionType, incoming.decisionType),
    severity,
    confidence,
    organization: primary.organization ?? incoming.organization,
    region: primary.region ?? incoming.region,
    campus: primary.campus ?? incoming.campus,
    program: primary.program ?? incoming.program,
    status,
    recommendedAction:
      preferLonger(primary.recommendedAction, incoming.recommendedAction) ??
      primary.recommendedAction,
    recommendedOwner:
      preferBySource(
        primary.recommendedOwner,
        primaryKind,
        incoming.recommendedOwner,
        incomingKind
      ) ?? primary.recommendedOwner,
    dueDate: preferSoonerDue(primary.dueDate, incoming.dueDate),
    blocking: primary.blocking || incoming.blocking,
    relatedAlerts: uniqueStrings([
      ...primary.relatedAlerts,
      ...incoming.relatedAlerts,
    ]),
    relatedActivities: uniqueStrings([
      ...primary.relatedActivities,
      ...incoming.relatedActivities,
    ]),
    relatedWorkflow,
    relatedMissionControlItem,
    relatedJagWorkItem,
    createdAt,
    updatedAt,
    sources,
    history: mergeHistory(primary.history, incoming.history),
    relatedEntityType: primary.relatedEntityType ?? incoming.relatedEntityType,
    relatedEntityId: primary.relatedEntityId ?? incoming.relatedEntityId,
    financialImpact: primary.financialImpact || incoming.financialImpact,
    studentImpact: primary.studentImpact || incoming.studentImpact,
    complianceRisk: primary.complianceRisk || incoming.complianceRisk,
    signalKey: preferSignalKey(primary.signalKey, incoming.signalKey),
  };

  // Keep primary mergeKey / id for stable identity once first writer wins.
  merged.priority = scoreDecision({
    severity: merged.severity,
    decisionType: merged.decisionType,
    confidence: merged.confidence,
    blocking: merged.blocking,
    financialImpact: merged.financialImpact,
    studentImpact: merged.studentImpact,
    complianceRisk: merged.complianceRisk,
    sourceCount: merged.sources.length,
    createdAt: merged.createdAt,
    dueDate: merged.dueDate,
  });

  return merged;
}

function preferSoonerDue(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return new Date(a).getTime() <= new Date(b).getTime() ? a : b;
}

function preferDecisionType(
  a: ExecutiveDecision["decisionType"],
  b: ExecutiveDecision["decisionType"]
): ExecutiveDecision["decisionType"] {
  const specificity: Record<ExecutiveDecision["decisionType"], number> = {
    Financial: 10,
    Compliance: 10,
    Staffing: 9,
    Admissions: 9,
    Escalation: 8,
    Exception: 8,
    Approval: 7,
    Operations: 6,
    Strategic: 5,
    Review: 2,
  };
  return specificity[a] >= specificity[b] ? a : b;
}

function preferSignalKey(a: string, b: string): string {
  const score = (k: string) => {
    if (k.startsWith("mc.")) return 1;
    if (k.startsWith("activity.")) return 2;
    if (k.startsWith("kpi.")) return 3;
    return 4;
  };
  return score(a) >= score(b) ? a : b;
}

function scopeToken(d: Pick<ExecutiveDecision, "campus" | "organization">): string {
  return normalizeToken(d.campus ?? d.organization ?? "global");
}

function orgToken(d: Pick<ExecutiveDecision, "organization">): string {
  return normalizeToken(d.organization ?? "global");
}

function entityMergeKey(d: ExecutiveDecision): string | null {
  if (!d.relatedEntityType || !d.relatedEntityId) return null;
  // Entity ids are unique — key by org so campus/school aliases still merge.
  return `ent_${hashString(
    [
      orgToken(d),
      normalizeToken(d.relatedEntityType),
      normalizeToken(d.relatedEntityId),
    ].join("|")
  )}`;
}

function linkMergeKeys(d: ExecutiveDecision): string[] {
  const keys: string[] = [d.mergeKey];
  const org = orgToken(d);
  if (d.relatedMissionControlItem) {
    keys.push(
      `mc_${hashString([org, normalizeToken(d.relatedMissionControlItem)].join("|"))}`
    );
  }
  if (d.relatedWorkflow) {
    keys.push(
      `wf_${hashString([org, normalizeToken(d.relatedWorkflow)].join("|"))}`
    );
  }
  if (d.relatedJagWorkItem) {
    keys.push(
      `jag_${hashString([org, normalizeToken(d.relatedJagWorkItem)].join("|"))}`
    );
  }
  const ent = entityMergeKey(d);
  if (ent) keys.push(ent);
  // Signal-level merge when no strong identity links.
  if (!d.relatedMissionControlItem && !d.relatedWorkflow && !d.relatedJagWorkItem) {
    keys.push(
      `sig_${hashString(
        [scopeToken(d), normalizeToken(d.signalKey)].join("|")
      )}`
    );
    // Also org-scoped signal for campus alias drift.
    keys.push(
      `sig_org_${hashString([org, normalizeToken(d.signalKey)].join("|"))}`
    );
  }
  return keys;
}

/**
 * Collapse drafts that describe the same underlying decision into one item.
 * Prefer Mission Control, Workflow, and JAG Work identities when present.
 */
export function mergeDecisionSources(drafts: ExecutiveDecisionDraft[]): {
  decisions: ExecutiveDecision[];
  rawDraftCount: number;
  mergedAway: number;
} {
  const decisions = drafts.map(draftToDecision);
  const clusters = new Map<string, ExecutiveDecision>();
  const keyToCluster = new Map<string, string>();

  for (const decision of decisions) {
    const keys = linkMergeKeys(decision);
    let clusterId: string | null = null;
    for (const k of keys) {
      const existing = keyToCluster.get(k);
      if (existing) {
        clusterId = existing;
        break;
      }
    }

    if (!clusterId) {
      clusterId = decision.id;
      clusters.set(clusterId, decision);
    } else {
      const existing = clusters.get(clusterId)!;
      clusters.set(clusterId, mergeTwo(existing, decision));
    }

    const merged = clusters.get(clusterId)!;
    for (const k of linkMergeKeys(merged)) {
      keyToCluster.set(k, clusterId);
    }
  }

  const sorted = [...clusters.values()].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return {
    decisions: sorted,
    rawDraftCount: drafts.length,
    mergedAway: Math.max(0, drafts.length - sorted.length),
  };
}
