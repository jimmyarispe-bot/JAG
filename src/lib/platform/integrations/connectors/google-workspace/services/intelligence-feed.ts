/**
 * Map Google Workspace normalized cache → soft signals for existing intelligence domains.
 * Feeds executive, wisdom, operations, stakeholder, predictive — no new domains.
 * Metadata only — no email bodies or document contents.
 */

import {
  googleWorkspaceStore,
  type GoogleWorkspaceStoreSnapshot,
} from "@/lib/platform/integrations/connectors/google-workspace/services/store";
import {
  buildExecutiveNarratives,
  narrativeHeadlines,
  type ExecutiveNarrative,
} from "@/lib/platform/integrations/google-workspace/intelligence";

export type GoogleWorkspaceIntelligenceFeed = {
  sourceSystem: "google-workspace";
  live: true;
  syncedAt: string;
  organizationId: string;
  workspaceDomain: string | null;
  privacy: { metadataOnly: true };
  counts: {
    messages: number;
    unread: number;
    calendarEvents: number;
    driveFiles: number;
    meets: number;
    tasksOpen: number;
    users: number;
  };
  collaboration: {
    meetingLoadMinutes7d: number;
    upcomingMeetings: number;
    communicationActivity: number;
    openTasks: number;
    schedulingConflicts: number;
  };
  executiveCalendar: Array<{
    id: string;
    title: string;
    startAt: string;
    durationMinutes: number;
    attendeeCount: number;
    correlationKey?: string;
  }>;
  upcomingDecisions: Array<{ id: string; title: string; dueAt: string; source: string }>;
  productivityScore: number;
  collaborationScore: number;
  executiveScore: number;
  /** RC-2.06 — organizational narratives from Gmail / Calendar / Drive. */
  narratives: ExecutiveNarrative[];
  briefBullets: string[];
  timeline: Array<{ id: string; title: string; subtitle: string; at: string }>;
  softLights: {
    operations: { healthScore: { value: number }; operationsScore: { value: number } };
    stakeholder: { healthScore: { value: number }; engagementScore: { value: number } };
    predictive: { healthScore: { value: number }; predictiveScore: { value: number } };
  };
  monitoring: GoogleWorkspaceStoreSnapshot["monitoring"];
};

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n * 10) / 10));
}

function num(v: unknown): number {
  return Number(v ?? 0);
}

export function buildGoogleWorkspaceIntelligenceFeed(
  snapshot: GoogleWorkspaceStoreSnapshot
): GoogleWorkspaceIntelligenceFeed | null {
  if (!snapshot.records.length || !snapshot.syncedAt) return null;

  const messages = snapshot.byType.message ?? [];
  const events = snapshot.byType.calendar_event ?? [];
  const files = snapshot.byType.drive_file ?? [];
  const meets = snapshot.byType.meet ?? [];
  const tasks = snapshot.byType.task ?? [];
  const users = snapshot.byType.directory_user ?? [];
  const labels = snapshot.byType.label ?? [];

  const unread =
    labels.reduce((s, l) => s + num(l.attributes.messagesUnread), 0) ||
    messages.filter((m) => m.attributes.unread).length;

  const meetingLoadMinutes7d = meets.reduce((s, m) => s + num(m.attributes.durationMinutes), 0);
  const upcoming = events
    .filter((e) => String(e.attributes.startAt ?? "") >= "2026-07-13T00:00:00.000Z")
    .sort((a, b) =>
      String(a.attributes.startAt).localeCompare(String(b.attributes.startAt))
    );
  const openTasks = tasks.filter((t) => !t.attributes.completed);
  const conflicts = events.filter((e) => e.attributes.conflictHint).length;

  const productivityScore = clamp(
    55 + files.length * 2 + (tasks.length - openTasks.length) * 4 - unread
  );
  const collaborationScore = clamp(
    50 + meets.length * 8 + upcoming.length * 3 + users.length * 4
  );
  const executiveScore = clamp(
    52 + upcoming.length * 5 + openTasks.length * 3 - conflicts * 8
  );

  const executiveCalendar = upcoming.slice(0, 6).map((e) => ({
    id: e.id,
    title: String(e.attributes.title ?? e.attributes.name ?? "Event"),
    startAt: String(e.attributes.startAt ?? e.syncedAt),
    durationMinutes: num(e.attributes.durationMinutes),
    attendeeCount: num(e.attributes.attendeeCount),
    correlationKey: e.attributes.correlationKey
      ? String(e.attributes.correlationKey)
      : undefined,
  }));

  const upcomingDecisions = openTasks.slice(0, 5).map((t) => ({
    id: t.id,
    title: String(t.attributes.name ?? "Task"),
    dueAt: String(t.attributes.dueAt ?? t.syncedAt),
    source: "google-workspace.task",
  }));

  const narratives = buildExecutiveNarratives(snapshot);
  const narrativeBullets = narrativeHeadlines(narratives, 5);
  const briefBullets =
    narrativeBullets.length > 0
      ? [
          ...narrativeBullets,
          "Privacy: metadata-only (no email bodies or document contents).",
        ].slice(0, 6)
      : [
          `Google Workspace sync — ${unread} unread · ${upcoming.length} upcoming meetings · ${openTasks.length} open tasks.`,
          `Meeting load ${meetingLoadMinutes7d} minutes recent · ${conflicts} scheduling conflict(s).`,
          executiveCalendar[0]
            ? `Next: ${executiveCalendar[0].title} (${new Date(executiveCalendar[0].startAt).toLocaleString()}).`
            : "No upcoming calendar events.",
          `${files.length} Drive files · ${users.length} directory users · domain ${snapshot.records[0]?.workspaceDomain ?? "—"}.`,
          "Privacy: metadata-only (no email bodies or document contents).",
        ];

  const timeline = [
    {
      id: "gw-sync",
      title: "Google Workspace sync",
      subtitle: `${snapshot.records.length} metadata records normalized into JAG`,
      at: snapshot.syncedAt,
    },
    ...meets.slice(0, 2).map((m) => ({
      id: m.id,
      title: String(m.attributes.name ?? "Meet"),
      subtitle: `${num(m.attributes.durationMinutes)} min · ${num(m.attributes.participantCount)} participants`,
      at: String(m.attributes.startedAt ?? m.syncedAt),
    })),
    ...messages.slice(0, 2).map((m) => ({
      id: m.id,
      title: String(m.attributes.subject ?? "Message"),
      subtitle: `priority ${String(m.attributes.priority ?? "normal")} · attachments ${num(m.attributes.attachmentCount)}`,
      at: String(m.attributes.receivedAt ?? m.syncedAt),
    })),
  ];

  return {
    sourceSystem: "google-workspace",
    live: true,
    syncedAt: snapshot.syncedAt,
    organizationId: snapshot.organizationId,
    workspaceDomain: snapshot.records[0]?.workspaceDomain ?? null,
    privacy: { metadataOnly: true },
    counts: {
      messages: messages.length,
      unread,
      calendarEvents: events.length,
      driveFiles: files.length,
      meets: meets.length,
      tasksOpen: openTasks.length,
      users: users.length,
    },
    collaboration: {
      meetingLoadMinutes7d,
      upcomingMeetings: upcoming.length,
      communicationActivity: messages.length + unread,
      openTasks: openTasks.length,
      schedulingConflicts: conflicts,
    },
    executiveCalendar,
    upcomingDecisions,
    productivityScore,
    collaborationScore,
    executiveScore,
    narratives,
    briefBullets,
    timeline,
    softLights: {
      operations: {
        healthScore: { value: productivityScore },
        operationsScore: { value: productivityScore },
      },
      stakeholder: {
        healthScore: { value: collaborationScore },
        engagementScore: { value: collaborationScore },
      },
      predictive: {
        healthScore: { value: executiveScore },
        predictiveScore: { value: executiveScore },
      },
    },
    monitoring: snapshot.monitoring,
  };
}

export function getGoogleWorkspaceFeed(
  organizationId: string
): GoogleWorkspaceIntelligenceFeed | null {
  const snapshot = googleWorkspaceStore.get(organizationId);
  if (!snapshot) return null;
  return buildGoogleWorkspaceIntelligenceFeed(snapshot);
}
