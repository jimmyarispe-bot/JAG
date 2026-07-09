import type {
  ExecutiveAlert,
  ExecutiveAlertDraft,
  ExecutiveAlertSourceRef,
  ExecutiveAlertStatus,
} from "@/lib/platform/executive-alerts/types";
import {
  alertIdFromDedupeKey,
  buildDedupeKey,
  hashString,
  normalizeToken,
} from "@/lib/platform/executive-alerts/hash";
import {
  maxConfidence,
  maxSeverity,
  scoreAlert,
} from "@/lib/platform/executive-alerts/score";

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

function mergeSourceRefs(a: ExecutiveAlertSourceRef[], b: ExecutiveAlertSourceRef[]) {
  const key = (s: ExecutiveAlertSourceRef) => `${s.source}:${s.sourceId}`;
  const map = new Map<string, ExecutiveAlertSourceRef>();
  for (const s of [...a, ...b]) {
    if (!map.has(key(s))) map.set(key(s), s);
  }
  return [...map.values()];
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
  a: ExecutiveAlertStatus,
  b: ExecutiveAlertStatus
): ExecutiveAlertStatus {
  // Open wins so a live source reopens a stale dismissal in the composed stream.
  if (a === "open" || b === "open") return "open";
  if (a === "acknowledged" || b === "acknowledged") return "acknowledged";
  return "dismissed";
}

function scopeToken(alert: Pick<ExecutiveAlert, "campus" | "organization">): string {
  return normalizeToken(alert.campus ?? alert.organization ?? "global");
}

/** Secondary merge when multiple producers cite the same related entity. */
export function buildEntityMergeKey(alert: ExecutiveAlert): string | null {
  if (!alert.relatedEntity?.type || !alert.relatedEntity?.id) return null;
  const payload = [
    scopeToken(alert),
    normalizeToken(alert.category),
    normalizeToken(alert.relatedEntity.type),
    normalizeToken(alert.relatedEntity.id),
  ].join("|");
  return `ent_${hashString(payload)}`;
}

function draftToAlert(draft: ExecutiveAlertDraft): ExecutiveAlert {
  const entityType = draft.relatedEntity?.type ?? draft.entityType ?? null;
  const entityId = draft.relatedEntity?.id ?? draft.entityId ?? null;
  const dedupeKey = buildDedupeKey({
    schoolId: draft.campus,
    campusId: draft.campus,
    organizationId: draft.organization,
    category: draft.category,
    entityType,
    entityId,
    signalKey: draft.signalKey,
  });

  const status = draft.status ?? "open";
  const sources = [draft.source];
  const priority = scoreAlert({
    severity: draft.severity,
    category: draft.category,
    confidence: draft.confidence,
    createdAt: draft.createdAt,
    sourceCount: sources.length,
  });

  return {
    id: alertIdFromDedupeKey(dedupeKey),
    title: draft.title,
    description: draft.description,
    category: draft.category,
    severity: draft.severity,
    priority,
    confidence: draft.confidence,
    organization: draft.organization,
    region: draft.region,
    campus: draft.campus,
    program: draft.program,
    relatedEntity: draft.relatedEntity,
    activityReferences: uniqueStrings(draft.activityReferences ?? []),
    workflowReference: draft.workflowReference ?? null,
    jagWorkReference: draft.jagWorkReference ?? null,
    missionControlReference: draft.missionControlReference ?? null,
    recommendedAction: draft.recommendedAction ?? null,
    createdAt: draft.createdAt,
    status,
    acknowledgedAt: draft.acknowledgedAt ?? null,
    dismissedAt: draft.dismissedAt ?? null,
    dedupeKey,
    signalKey: draft.signalKey,
    sources,
  };
}

function mergeAlerts(primary: ExecutiveAlert, incoming: ExecutiveAlert): ExecutiveAlert {
  const severity = maxSeverity(primary.severity, incoming.severity);
  const confidence = maxConfidence(primary.confidence, incoming.confidence);
  const sources = mergeSourceRefs(primary.sources, incoming.sources);
  const createdAt = preferOlder(primary.createdAt, incoming.createdAt);
  const status = mergeStatus(primary.status, incoming.status);

  // Keep the stronger signal key (prefer non-generic mc.* when merging with domain keys).
  const signalKey = preferSignalKey(primary.signalKey, incoming.signalKey);

  const merged: ExecutiveAlert = {
    ...primary,
    title: preferLonger(primary.title, incoming.title) ?? primary.title,
    description:
      preferLonger(primary.description, incoming.description) ?? primary.description,
    severity,
    confidence,
    signalKey,
    organization: primary.organization ?? incoming.organization,
    region: primary.region ?? incoming.region,
    campus: primary.campus ?? incoming.campus,
    program: primary.program ?? incoming.program,
    relatedEntity: primary.relatedEntity ?? incoming.relatedEntity,
    activityReferences: uniqueStrings([
      ...primary.activityReferences,
      ...incoming.activityReferences,
    ]),
    workflowReference: primary.workflowReference ?? incoming.workflowReference,
    jagWorkReference: primary.jagWorkReference ?? incoming.jagWorkReference,
    missionControlReference:
      primary.missionControlReference ?? incoming.missionControlReference,
    recommendedAction:
      preferLonger(primary.recommendedAction, incoming.recommendedAction) ??
      primary.recommendedAction,
    createdAt,
    status,
    acknowledgedAt:
      status === "acknowledged"
        ? preferNewer(
            primary.acknowledgedAt ?? incoming.acknowledgedAt ?? createdAt,
            incoming.acknowledgedAt ?? primary.acknowledgedAt ?? createdAt
          )
        : null,
    dismissedAt:
      status === "dismissed"
        ? preferNewer(
            primary.dismissedAt ?? incoming.dismissedAt ?? createdAt,
            incoming.dismissedAt ?? primary.dismissedAt ?? createdAt
          )
        : null,
    sources,
  };

  // Recompute stable id from primary dedupe key (first writer wins identity).
  merged.priority = scoreAlert({
    severity: merged.severity,
    category: merged.category,
    confidence: merged.confidence,
    createdAt: merged.createdAt,
    sourceCount: merged.sources.length,
  });

  return merged;
}

function preferSignalKey(a: string, b: string): string {
  const score = (k: string) => {
    if (k.startsWith("mc.")) return 1;
    if (k.startsWith("executive.insight.")) return 2;
    return 3;
  };
  return score(a) >= score(b) ? a : b;
}

function sortAlerts(alerts: ExecutiveAlert[]): ExecutiveAlert[] {
  return [...alerts].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

/**
 * Collapse drafts that describe the same underlying issue into one alert.
 *
 * Pass 1 — exact Sprint §2.3 dedupe key (scope + category + entity + signalKey)
 * Pass 2 — same related entity within scope + category (cross-producer corroboration)
 * Pass 3 — same signalKey within scope + category when no entity (metric/insight merge)
 */
export function dedupeAlerts(drafts: ExecutiveAlertDraft[]): {
  alerts: ExecutiveAlert[];
  rawDraftCount: number;
  dedupedAway: number;
} {
  const byKey = new Map<string, ExecutiveAlert>();

  for (const draft of drafts) {
    const alert = draftToAlert(draft);
    const existing = byKey.get(alert.dedupeKey);
    if (!existing) {
      byKey.set(alert.dedupeKey, alert);
      continue;
    }
    byKey.set(alert.dedupeKey, mergeAlerts(existing, alert));
  }

  const afterSignal = [...byKey.values()];
  const byEntity = new Map<string, ExecutiveAlert>();
  const withoutEntity: ExecutiveAlert[] = [];

  for (const alert of afterSignal) {
    const entityKey = buildEntityMergeKey(alert);
    if (!entityKey) {
      withoutEntity.push(alert);
      continue;
    }
    const existing = byEntity.get(entityKey);
    if (!existing) {
      byEntity.set(entityKey, alert);
      continue;
    }
    byEntity.set(entityKey, mergeAlerts(existing, alert));
  }

  const afterEntity = [...byEntity.values(), ...withoutEntity];
  const bySignal = new Map<string, ExecutiveAlert>();

  for (const alert of afterEntity) {
    if (alert.relatedEntity) {
      // Entity-backed alerts already merged; keep distinct.
      bySignal.set(`id:${alert.id}`, alert);
      continue;
    }
    const signalMergeKey = [
      scopeToken(alert),
      normalizeToken(alert.category),
      normalizeToken(alert.signalKey),
    ].join("|");
    const existing = bySignal.get(signalMergeKey);
    if (!existing) {
      bySignal.set(signalMergeKey, alert);
      continue;
    }
    bySignal.set(signalMergeKey, mergeAlerts(existing, alert));
  }

  const alerts = sortAlerts([...bySignal.values()]);

  return {
    alerts,
    rawDraftCount: drafts.length,
    dedupedAway: Math.max(0, drafts.length - alerts.length),
  };
}
