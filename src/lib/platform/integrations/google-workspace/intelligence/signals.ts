/**
 * Collaboration / communication / document signals from canonical Workspace entities.
 */

import type { GoogleWorkspaceStoreSnapshot } from "@/lib/platform/integrations/connectors/google-workspace/services/store";
import type { WorkspaceCollaborationSignals } from "@/lib/platform/integrations/google-workspace/intelligence/types";
import {
  attendeesFromStore,
  calendarEventsFromStore,
  documentsFromStore,
  emailsFromStore,
  meetingsFromStore,
  parseIso,
  tasksFromStore,
} from "@/lib/platform/integrations/google-workspace/intelligence/from-store";

const DAY_MS = 86_400_000;

function deltaPct(recent: number, prior: number): number | null {
  if (prior <= 0) return recent > 0 ? 100 : null;
  return Math.round(((recent - prior) / prior) * 1000) / 10;
}

function inWindow(ts: number | null, start: number, end: number): boolean {
  if (ts == null) return false;
  return ts >= start && ts < end;
}

function meetingMinutes(
  meetings: ReturnType<typeof meetingsFromStore>,
  events: ReturnType<typeof calendarEventsFromStore>,
  start: number,
  end: number
): number {
  let minutes = 0;
  for (const m of meetings) {
    const at =
      parseIso(m.attributes.startAt) ??
      parseIso(m.attributes.startedAt) ??
      parseIso(m.syncedAt);
    if (!inWindow(at, start, end)) continue;
    minutes += Number(m.attributes.durationMinutes ?? 0);
  }
  // Fallback: calendar events when Meeting derive is sparse
  if (minutes === 0) {
    for (const e of events) {
      const at = parseIso(e.attributes.startAt) ?? parseIso(e.syncedAt);
      if (!inWindow(at, start, end)) continue;
      minutes += Number(e.attributes.durationMinutes ?? 0);
    }
  }
  return minutes;
}

function uniqueDomains(
  attendees: ReturnType<typeof attendeesFromStore>,
  events: ReturnType<typeof calendarEventsFromStore>,
  start: number,
  end: number
): number {
  const domains = new Set<string>();
  for (const a of attendees) {
    const at = parseIso(a.syncedAt);
    // Attendees inherit event timing via linked event — use sync window loosely
    if (at != null && !inWindow(at, start - DAY_MS * 14, end + DAY_MS)) continue;
    const domain = String(a.attributes.domain ?? "");
    if (domain) domains.add(domain.toLowerCase());
  }
  if (domains.size === 0) {
    for (const e of events) {
      const at = parseIso(e.attributes.startAt) ?? parseIso(e.syncedAt);
      if (!inWindow(at, start, end)) continue;
      const emails = Array.isArray(e.attributes.attendeeEmails)
        ? (e.attributes.attendeeEmails as string[])
        : Array.isArray(e.attributes.attendees)
          ? (e.attributes.attendees as string[]).map(String)
          : [];
      for (const email of emails) {
        const atSign = email.indexOf("@");
        if (atSign >= 0) domains.add(email.slice(atSign + 1).toLowerCase());
      }
    }
  }
  return domains.size;
}

export function computeWorkspaceCollaborationSignals(
  snapshot: GoogleWorkspaceStoreSnapshot,
  now = new Date()
): WorkspaceCollaborationSignals {
  const nowMs = now.getTime();
  const recentStart = nowMs - 7 * DAY_MS;
  const priorStart = nowMs - 14 * DAY_MS;

  const meetings = meetingsFromStore(snapshot);
  const events = calendarEventsFromStore(snapshot);
  const attendees = attendeesFromStore(snapshot);
  const documents = documentsFromStore(snapshot);
  const emails = emailsFromStore(snapshot);
  const tasks = tasksFromStore(snapshot);
  const workspaceDomain = (
    snapshot.records[0]?.workspaceDomain ?? ""
  ).toLowerCase();

  const meetingLoadMinutesRecent = meetingMinutes(
    meetings,
    events,
    recentStart,
    nowMs
  );
  const meetingLoadMinutesPrior = meetingMinutes(
    meetings,
    events,
    priorStart,
    recentStart
  );

  const uniqueAttendeeDomainsRecent = uniqueDomains(
    attendees,
    events,
    recentStart,
    nowMs
  );
  const uniqueAttendeeDomainsPrior = uniqueDomains(
    attendees,
    events,
    priorStart,
    recentStart
  );

  // Strategic / correlated docs with little activity
  const quietDocuments = documents.filter((d) => {
    const activity = Number(d.attributes.activityCount ?? 0);
    const correlated = Boolean(d.attributes.correlationKey);
    const strategicName = /board|grant|budget|strategy|initiative/i.test(
      String(d.attributes.name ?? "")
    );
    return (correlated || strategicName) && activity < 3;
  }).length;

  // Also count meetings with correlation keys that have no linked doc activity
  const quietFromMeetings = events.filter((e) => {
    const key = e.attributes.correlationKey;
    if (!key) return false;
    const linked = documents.some(
      (d) =>
        String(d.attributes.correlationKey ?? "") === String(key) &&
        Number(d.attributes.activityCount ?? 0) >= 3
    );
    return !linked;
  }).length;

  const openDecisionTasks = tasks.filter((t) => !t.attributes.completed);
  const executiveEmails = new Set(
    openDecisionTasks
      .map((t) =>
        String(
          t.attributes.assigneeEmail ??
            t.attributes.ownerEmail ??
            t.userId ??
            ""
        )
      )
      .filter(Boolean)
  );
  // Distinct owners of open exec actions (fallback: count of open tasks capped).
  const executivesWithOpenDecisions =
    executiveEmails.size ||
    Math.min(openDecisionTasks.length, 2);

  let externalMessages = 0;
  let internalMessages = 0;
  for (const m of emails) {
    const participants = Array.isArray(m.attributes.participants)
      ? (m.attributes.participants as Array<{ isInternal?: boolean; domain?: string }>)
      : [];
    const hasExternal =
      participants.some((p) => p.isInternal === false) ||
      (participants.length === 0 &&
        String(m.attributes.from ?? "")
          .toLowerCase()
          .includes("@") &&
        workspaceDomain &&
        !String(m.attributes.from ?? "")
          .toLowerCase()
          .endsWith(`@${workspaceDomain}`));
    if (hasExternal) externalMessages += 1;
    else internalMessages += 1;
  }

  const totalComms = externalMessages + internalMessages;

  return {
    meetingLoadMinutesRecent,
    meetingLoadMinutesPrior,
    meetingLoadDeltaPct: deltaPct(
      meetingLoadMinutesRecent,
      meetingLoadMinutesPrior
    ),
    uniqueAttendeeDomainsRecent,
    uniqueAttendeeDomainsPrior,
    collaborationDeltaPct: deltaPct(
      uniqueAttendeeDomainsRecent,
      uniqueAttendeeDomainsPrior
    ),
    quietDocuments: Math.max(quietDocuments, quietFromMeetings),
    openDecisionTasks: openDecisionTasks.length,
    executivesWithOpenDecisions:
      executivesWithOpenDecisions ||
      (openDecisionTasks.length >= 2 ? 2 : openDecisionTasks.length),
    externalMessages,
    internalMessages,
    externalShareOfCommsPct:
      totalComms > 0
        ? Math.round((externalMessages / totalComms) * 1000) / 10
        : null,
    asOf: now.toISOString(),
  };
}
