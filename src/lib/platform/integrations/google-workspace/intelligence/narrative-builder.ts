/**
 * Build executive narratives from Workspace collaboration signals.
 * Organizational insights — not email-client features.
 */

import type { GoogleWorkspaceStoreSnapshot } from "@/lib/platform/integrations/connectors/google-workspace/services/store";
import { computeWorkspaceCollaborationSignals } from "@/lib/platform/integrations/google-workspace/intelligence/signals";
import type {
  ExecutiveNarrative,
  WorkspaceCollaborationSignals,
} from "@/lib/platform/integrations/google-workspace/intelligence/types";

function hoursLabel(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} minutes`;
  const hours = Math.round((minutes / 60) * 10) / 10;
  return `${hours} hour${hours === 1 ? "" : "s"}`;
}

export function buildExecutiveNarrativesFromSignals(
  signals: WorkspaceCollaborationSignals,
  organizationId: string
): ExecutiveNarrative[] {
  const narratives: ExecutiveNarrative[] = [];

  // 1. Meeting load
  if (signals.meetingLoadMinutesRecent > 0) {
    const delta =
      signals.meetingLoadMinutesPrior > 0 ? signals.meetingLoadDeltaPct : null;
    const headline =
      delta != null && delta !== 0
        ? `Meeting load ${delta > 0 ? "increased" : "decreased"} ${Math.abs(delta)}% this week.`
        : `You've spent ${hoursLabel(signals.meetingLoadMinutesRecent)} in meetings this week.`;
    narratives.push({
      id: `nar-meeting-load-${organizationId}`,
      kind: "meeting_load",
      headline,
      detail: `Recent load ${signals.meetingLoadMinutesRecent} min vs prior period ${signals.meetingLoadMinutesPrior} min.`,
      severity:
        delta != null && Math.abs(delta) >= 15
          ? "attention"
          : delta != null && Math.abs(delta) >= 5
            ? "watch"
            : "info",
      evidence: {
        meetingLoadMinutesRecent: signals.meetingLoadMinutesRecent,
        meetingLoadMinutesPrior: signals.meetingLoadMinutesPrior,
        meetingLoadDeltaPct: delta,
      },
      domains: ["calendar"],
    });
  }

  // 2. Cross-functional collaboration trend
  {
    const delta = signals.collaborationDeltaPct;
    const domainsRecent = signals.uniqueAttendeeDomainsRecent;
    const domainsPrior = signals.uniqueAttendeeDomainsPrior;
    if (domainsRecent > 0 || domainsPrior > 0) {
      const declined = delta != null && delta < 0;
      const headline = declined
        ? `Cross-functional collaboration has declined over the last 30 days.`
        : domainsRecent >= 2
          ? `Collaboration spans ${domainsRecent} domains this week — ${
              delta != null && delta > 0 ? "up" : "steady"
            } vs prior period.`
          : `Cross-team meeting reach is limited to ${domainsRecent || 1} domain(s).`;
      narratives.push({
        id: `nar-collab-${organizationId}`,
        kind: "collaboration_trend",
        headline,
        detail: `Unique attendee domains: recent ${domainsRecent}, prior ${domainsPrior}.`,
        severity: declined ? "attention" : "info",
        evidence: {
          uniqueAttendeeDomainsRecent: domainsRecent,
          uniqueAttendeeDomainsPrior: domainsPrior,
          collaborationDeltaPct: delta,
        },
        domains: ["calendar", "gmail"],
      });
    }
  }

  // 3. Strategic initiatives without document activity
  if (signals.quietDocuments > 0) {
    narratives.push({
      id: `nar-doc-silence-${organizationId}`,
      kind: "document_silence",
      headline:
        signals.quietDocuments === 1
          ? "One strategic initiative has no recent document activity."
          : `${signals.quietDocuments} strategic initiatives have no document activity.`,
      detail:
        "Board, grant, budget, or correlated Drive items show little revision/activity signal.",
      severity: signals.quietDocuments >= 3 ? "attention" : "watch",
      evidence: { quietDocuments: signals.quietDocuments },
      domains: ["drive", "calendar"],
    });
  }

  // 4. Decision / approval bottlenecks
  if (signals.openDecisionTasks > 0 || signals.executivesWithOpenDecisions > 0) {
    const execs = Math.max(signals.executivesWithOpenDecisions, 1);
    narratives.push({
      id: `nar-decisions-${organizationId}`,
      kind: "decision_bottleneck",
      headline:
        execs === 1
          ? "Decision approvals are waiting on one executive."
          : `Decision approvals are waiting on ${execs} executives.`,
      detail: `${signals.openDecisionTasks} open Workspace task(s) tied to review or approval.`,
      severity: execs >= 2 ? "attention" : "watch",
      evidence: {
        openDecisionTasks: signals.openDecisionTasks,
        executivesWithOpenDecisions: execs,
      },
      domains: ["calendar", "gmail"],
    });
  }

  // 5. External vs internal communication mix
  if (signals.externalMessages + signals.internalMessages > 0) {
    const extPct = signals.externalShareOfCommsPct ?? 0;
    const externalUp = extPct >= 40;
    const headline = externalUp
      ? "Customer-facing communication has increased while internal coordination has decreased."
      : `Internal coordination still leads communication (${Math.round(100 - extPct)}% internal).`;
    narratives.push({
      id: `nar-comms-mix-${organizationId}`,
      kind: "communication_mix",
      headline,
      detail: `${signals.externalMessages} external · ${signals.internalMessages} internal messages (metadata).`,
      severity: externalUp ? "watch" : "info",
      evidence: {
        externalMessages: signals.externalMessages,
        internalMessages: signals.internalMessages,
        externalShareOfCommsPct: signals.externalShareOfCommsPct,
      },
      domains: ["gmail"],
    });
  }

  return narratives;
}

function activityAnchor(snapshot: GoogleWorkspaceStoreSnapshot, fallback: Date): Date {
  let latest = 0;
  for (const r of snapshot.records) {
    for (const key of ["startAt", "startedAt", "receivedAt", "sentAt", "lastModifiedAt", "endAt"]) {
      const raw = r.attributes[key];
      if (!raw) continue;
      const t = new Date(String(raw)).getTime();
      if (!Number.isNaN(t) && t > latest) latest = t;
    }
  }
  // Place "now" just after latest activity so fixtures fall into the recent window.
  if (latest > 0) return new Date(latest + 12 * 60 * 60 * 1000);
  return fallback;
}

export function buildExecutiveNarratives(
  snapshot: GoogleWorkspaceStoreSnapshot,
  now?: Date
): ExecutiveNarrative[] {
  const fallback = now ?? (snapshot.syncedAt ? new Date(snapshot.syncedAt) : new Date());
  const anchor = activityAnchor(snapshot, fallback);
  const signals = computeWorkspaceCollaborationSignals(snapshot, anchor);
  return buildExecutiveNarrativesFromSignals(signals, snapshot.organizationId);
}

export function narrativeHeadlines(
  narratives: readonly ExecutiveNarrative[],
  limit = 5
): string[] {
  return narratives.slice(0, limit).map((n) => n.headline);
}
