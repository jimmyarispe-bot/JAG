/**
 * WatcherService — application façade for Autonomous Executive Intelligence — Sprint 206.
 * Proactive findings only. Never executes organizational decisions.
 */

import type { WatcherAlert, WatcherDigest } from "./WatcherAlert";
import { evaluateWatchers } from "./WatcherEngine";
import type {
  WatcherCandidate,
  WatcherEvaluationContext,
} from "./WatcherEvaluation";
import { maxPriority, sortByPriorityDesc } from "./WatcherPriority";
import { WatcherRegistry } from "./WatcherRegistry";
import type { AlertStatus, DigestKind } from "./WatcherRule";
import { digestLabel, digestMinPriority } from "./WatcherSchedule";
import { priorityRank } from "./WatcherPriority";
import {
  recordWatcherObservation,
} from "./WatcherObservability";

const ADVISORY =
  "Autonomous executive intelligence — proactive attention, not autonomous decision making.";

let alertSeq = 0;
let digestSeq = 0;
let obsSeq = 0;
const alerts: WatcherAlert[] = [];
const digests: WatcherDigest[] = [];

function nowIso(): string {
  return new Date().toISOString();
}

function makeAlert(
  ctx: WatcherEvaluationContext,
  candidate: WatcherCandidate
): WatcherAlert {
  const at = nowIso();
  return {
    id: `alert-${++alertSeq}-${Date.now()}`,
    organizationId: ctx.organizationId,
    organizationName: ctx.organizationName,
    watcherId: candidate.watcherId,
    type: candidate.type,
    title: candidate.title,
    summary: candidate.summary,
    severity: candidate.severity,
    confidence: candidate.confidence,
    evidence: candidate.evidence,
    primaryDrivers: candidate.primaryDrivers,
    supportingContributors: candidate.supportingContributors,
    recommendedExecutiveAction: candidate.recommendedExecutiveAction,
    relatedDecisionIds: candidate.relatedDecisionIds,
    relatedGoalIds: candidate.relatedGoalIds,
    relatedMemoryIds: candidate.relatedMemoryIds,
    explanation: {
      evidence: candidate.evidence,
      policies: candidate.policies,
      forecasts: candidate.forecasts,
      scenarios: candidate.scenarios,
      memory: candidate.memory,
      contributors: candidate.supportingContributors,
      timeline: [
        { at: at.slice(0, 10), message: candidate.title },
        ...candidate.primaryDrivers.slice(0, 3).map((d) => ({
          at: at.slice(0, 10),
          message: d,
        })),
      ],
    },
    status: "open",
    fingerprint: candidate.fingerprintKey,
    createdAt: at,
    updatedAt: at,
    advisoryNotice: ADVISORY,
  };
}

function mergeAlerts(existing: WatcherAlert, candidate: WatcherCandidate): WatcherAlert {
  const at = nowIso();
  return {
    ...existing,
    severity: maxPriority(existing.severity, candidate.severity),
    confidence: Math.max(existing.confidence, candidate.confidence),
    summary: candidate.summary,
    primaryDrivers: [
      ...new Set([...candidate.primaryDrivers, ...existing.primaryDrivers]),
    ].slice(0, 6),
    evidence: [...candidate.evidence, ...existing.evidence].slice(0, 6),
    recommendedExecutiveAction: candidate.recommendedExecutiveAction,
    relatedDecisionIds: [
      ...new Set([
        ...existing.relatedDecisionIds,
        ...candidate.relatedDecisionIds,
      ]),
    ],
    relatedGoalIds: [
      ...new Set([...existing.relatedGoalIds, ...candidate.relatedGoalIds]),
    ],
    relatedMemoryIds: [
      ...new Set([
        ...existing.relatedMemoryIds,
        ...candidate.relatedMemoryIds,
      ]),
    ],
    updatedAt: at,
    status: existing.status === "resolved" ? "open" : existing.status,
    resolvedAt: undefined,
  };
}

function applyCandidates(
  ctx: WatcherEvaluationContext,
  candidates: readonly WatcherCandidate[]
): { created: number; merged: number; suppressed: number } {
  let created = 0;
  let merged = 0;
  let suppressed = 0;

  const openFingerprints = new Map(
    alerts
      .filter(
        (a) =>
          a.organizationId === ctx.organizationId &&
          (a.status === "open" || a.status === "acknowledged")
      )
      .map((a) => [a.fingerprint, a] as const)
  );

  for (const candidate of candidates) {
    const existing = openFingerprints.get(candidate.fingerprintKey);
    if (existing) {
      const idx = alerts.findIndex((a) => a.id === existing.id);
      if (idx >= 0) {
        alerts[idx] = mergeAlerts(existing, candidate);
        merged += 1;
      } else {
        suppressed += 1;
      }
      continue;
    }

    // Suppress if recently dismissed with same fingerprint (24h)
    const recentDismiss = alerts.find(
      (a) =>
        a.organizationId === ctx.organizationId &&
        a.fingerprint === candidate.fingerprintKey &&
        a.status === "dismissed" &&
        a.dismissedAt &&
        Date.now() - Date.parse(a.dismissedAt) < 24 * 60 * 60 * 1000
    );
    if (recentDismiss) {
      suppressed += 1;
      continue;
    }

    const alert = makeAlert(ctx, candidate);
    alerts.unshift(alert);
    openFingerprints.set(candidate.fingerprintKey, alert);
    created += 1;
    recordWatcherObservation({
      id: `wobs-${++obsSeq}-${Date.now()}`,
      kind: "alert_generation",
      organizationId: ctx.organizationId,
      at: nowIso(),
      durationMs: 0,
      detail: `Alert: ${alert.title} (${alert.severity})`,
      alertIds: [alert.id],
      metadata: { type: alert.type, severity: alert.severity },
    });
  }

  // Auto-close resolved: open alerts whose fingerprint no longer fires and score topic cleared
  const activeKeys = new Set(candidates.map((c) => c.fingerprintKey));
  for (let i = 0; i < alerts.length; i++) {
    const a = alerts[i]!;
    if (
      a.organizationId === ctx.organizationId &&
      a.status === "open" &&
      !activeKeys.has(a.fingerprint) &&
      Date.now() - Date.parse(a.createdAt) > 60_000
    ) {
      // Only auto-resolve older open alerts that no longer match — keep fresh ones
      if (Date.now() - Date.parse(a.updatedAt) > 10 * 60 * 1000) {
        alerts[i] = {
          ...a,
          status: "resolved",
          resolvedAt: nowIso(),
          updatedAt: nowIso(),
        };
        recordWatcherObservation({
          id: `wobs-${++obsSeq}-${Date.now()}`,
          kind: "alert_resolved",
          organizationId: a.organizationId,
          at: nowIso(),
          durationMs: 0,
          detail: `Auto-resolved: ${a.title}`,
          alertIds: [a.id],
        });
      }
    }
  }

  return { created, merged, suppressed };
}

export const WatcherService = {
  registry: WatcherRegistry,

  evaluate(ctx: WatcherEvaluationContext): {
    readonly alerts: readonly WatcherAlert[];
    readonly created: number;
    readonly merged: number;
    readonly suppressed: number;
    readonly durationMs: number;
    readonly observationId: string;
    readonly advisoryNotice: string;
  } {
    const started = Date.now();
    const run = evaluateWatchers(ctx);
    const stats = applyCandidates(ctx, run.candidates);
    const observationId = `wobs-${++obsSeq}-${Date.now()}`;
    recordWatcherObservation({
      id: observationId,
      kind: "watcher_execution",
      organizationId: ctx.organizationId,
      at: nowIso(),
      durationMs: Date.now() - started,
      detail: `Evaluated watchers — ${run.candidates.length} candidate(s), ${stats.created} new, ${stats.merged} merged, ${stats.suppressed} suppressed.`,
      alertIds: this.listOpen(ctx.organizationId)
        .slice(0, 20)
        .map((a) => a.id),
    });
    return {
      alerts: this.listOpen(ctx.organizationId),
      ...stats,
      durationMs: Date.now() - started,
      observationId,
      advisoryNotice: run.advisoryNotice,
    };
  },

  listOpen(organizationId?: string): readonly WatcherAlert[] {
    const list = alerts.filter(
      (a) =>
        (a.status === "open" || a.status === "acknowledged") &&
        (!organizationId || a.organizationId === organizationId)
    );
    return sortByPriorityDesc(list);
  },

  listAll(organizationId?: string): readonly WatcherAlert[] {
    const list = organizationId
      ? alerts.filter((a) => a.organizationId === organizationId)
      : alerts;
    return sortByPriorityDesc(list);
  },

  get(id: string): WatcherAlert | null {
    return alerts.find((a) => a.id === id) ?? null;
  },

  setStatus(
    id: string,
    status: Extract<AlertStatus, "acknowledged" | "dismissed" | "resolved">
  ): WatcherAlert | null {
    const idx = alerts.findIndex((a) => a.id === id);
    if (idx < 0) return null;
    const at = nowIso();
    const prev = alerts[idx]!;
    const next: WatcherAlert = {
      ...prev,
      status,
      updatedAt: at,
      acknowledgedAt:
        status === "acknowledged" ? at : prev.acknowledgedAt,
      dismissedAt: status === "dismissed" ? at : prev.dismissedAt,
      resolvedAt: status === "resolved" ? at : prev.resolvedAt,
    };
    alerts[idx] = next;
    const kind =
      status === "acknowledged"
        ? "alert_acknowledged"
        : status === "dismissed"
          ? "alert_dismissed"
          : "alert_resolved";
    recordWatcherObservation({
      id: `wobs-${++obsSeq}-${Date.now()}`,
      kind,
      organizationId: next.organizationId,
      at,
      durationMs: 0,
      detail: `${status}: ${next.title}`,
      alertIds: [next.id],
    });
    return next;
  },

  buildDigest(input: {
    readonly organizationId: string;
    readonly organizationName: string;
    readonly kind: DigestKind;
  }): WatcherDigest {
    const min = digestMinPriority(input.kind);
    const selected = this.listOpen(input.organizationId).filter(
      (a) => priorityRank(a.severity) >= min
    );
    const criticalCount = selected.filter((a) => a.severity === "critical").length;
    const highCount = selected.filter((a) => a.severity === "high").length;
    const highlights = selected.slice(0, 8).map(
      (a) => `${a.severity.toUpperCase()}: ${a.title}`
    );
    const digest: WatcherDigest = {
      id: `digest-${++digestSeq}-${Date.now()}`,
      kind: input.kind,
      organizationId: input.organizationId,
      organizationName: input.organizationName,
      title: `${digestLabel(input.kind)} · ${input.organizationName}`,
      generatedAt: nowIso(),
      alertIds: selected.map((a) => a.id),
      highlights,
      criticalCount,
      highCount,
      advisoryNotice: ADVISORY,
    };
    digests.unshift(digest);
    if (digests.length > 50) digests.length = 50;
    recordWatcherObservation({
      id: `wobs-${++obsSeq}-${Date.now()}`,
      kind: "digest_generated",
      organizationId: input.organizationId,
      at: nowIso(),
      durationMs: 0,
      detail: `${digest.title} — ${selected.length} alert(s).`,
      alertIds: digest.alertIds,
      metadata: { kind: input.kind },
    });
    return digest;
  },

  listDigests(organizationId?: string): readonly WatcherDigest[] {
    return organizationId
      ? digests.filter((d) => d.organizationId === organizationId)
      : digests;
  },
} as const;

export function resetWatcherServiceForTests(): void {
  alerts.length = 0;
  digests.length = 0;
  alertSeq = 0;
  digestSeq = 0;
  obsSeq = 0;
  WatcherRegistry.resetForTests();
}

/** Test-only seed — production paths must still authorize via session ACL. */
export function seedWatcherAlertForTests(alert: WatcherAlert): void {
  alerts.unshift(alert);
}
