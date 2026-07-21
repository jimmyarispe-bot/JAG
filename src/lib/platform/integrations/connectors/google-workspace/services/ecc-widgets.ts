/**
 * ECC widget data from Google Workspace intelligence feed (Sprint 074).
 * Soft-read only — no raw Google objects.
 */

import type { GoogleWorkspaceIntelligenceFeed } from "@/lib/platform/integrations/connectors/google-workspace/services/intelligence-feed";
import { getGoogleWorkspaceFeed } from "@/lib/platform/integrations/connectors/google-workspace/services/intelligence-feed";
import { googleWorkspaceStore } from "@/lib/platform/integrations/connectors/google-workspace/services/store";
import type { ExecutiveNarrative } from "@/lib/platform/integrations/google-workspace/intelligence";

export type RecentMeetingsWidget = {
  kind: "recent_meetings";
  title: string;
  meetings: Array<{
    id: string;
    title: string;
    startAt: string;
    durationMinutes: number;
    participantCount: number;
  }>;
};

export type CalendarSummaryWidget = {
  kind: "calendar_summary";
  title: string;
  upcomingMeetings: number;
  meetingLoadMinutes7d: number;
  schedulingConflicts: number;
  nextMeeting: { title: string; startAt: string } | null;
};

export type CommunicationPulseWidget = {
  kind: "communication_pulse";
  title: string;
  messages: number;
  unread: number;
  communicationActivity: number;
};

export type SharedDocumentsWidget = {
  kind: "shared_documents";
  title: string;
  documents: Array<{ id: string; name: string; ownerEmail: string | null; shared: boolean }>;
};

export type CollaborationActivityWidget = {
  kind: "collaboration_activity";
  title: string;
  collaborationScore: number;
  openTasks: number;
  driveFiles: number;
  users: number;
  timeline: Array<{ id: string; title: string; subtitle: string; at: string }>;
};

/** RC-2.06 — organizational narratives for the Executive Command Center. */
export type ExecutiveNarrativesWidget = {
  kind: "executive_narratives";
  title: string;
  narratives: ExecutiveNarrative[];
};

export type GoogleWorkspaceEccWidgets = {
  recentMeetings: RecentMeetingsWidget;
  calendarSummary: CalendarSummaryWidget;
  communicationPulse: CommunicationPulseWidget;
  sharedDocuments: SharedDocumentsWidget;
  collaborationActivity: CollaborationActivityWidget;
  executiveNarratives: ExecutiveNarrativesWidget;
};

export function buildGoogleWorkspaceEccWidgets(
  organizationId: string
): GoogleWorkspaceEccWidgets | null {
  const feed = getGoogleWorkspaceFeed(organizationId);
  if (!feed) return null;
  return projectEccWidgets(feed, organizationId);
}

export function projectEccWidgets(
  feed: GoogleWorkspaceIntelligenceFeed,
  organizationId: string
): GoogleWorkspaceEccWidgets {
  const snapshot = googleWorkspaceStore.get(organizationId);
  const meets = snapshot?.byType.meet ?? [];
  const docs = [
    ...(snapshot?.byType.drive_file ?? []),
    ...(snapshot?.byType.doc ?? []),
    ...(snapshot?.byType.sheet ?? []),
    ...(snapshot?.byType.slide ?? []),
  ].filter((d) => d.attributes.shared);

  return {
    recentMeetings: {
      kind: "recent_meetings",
      title: "Recent Meetings",
      meetings: meets.slice(0, 6).map((m) => ({
        id: m.id,
        title: String(m.attributes.name ?? "Meeting"),
        startAt: String(m.attributes.startedAt ?? m.attributes.startAt ?? m.syncedAt),
        durationMinutes: Number(m.attributes.durationMinutes ?? 0),
        participantCount: Number(m.attributes.participantCount ?? 0),
      })),
    },
    calendarSummary: {
      kind: "calendar_summary",
      title: "Calendar Summary",
      upcomingMeetings: feed.collaboration.upcomingMeetings,
      meetingLoadMinutes7d: feed.collaboration.meetingLoadMinutes7d,
      schedulingConflicts: feed.collaboration.schedulingConflicts,
      nextMeeting: feed.executiveCalendar[0]
        ? {
            title: feed.executiveCalendar[0].title,
            startAt: feed.executiveCalendar[0].startAt,
          }
        : null,
    },
    communicationPulse: {
      kind: "communication_pulse",
      title: "Communication Pulse",
      messages: feed.counts.messages,
      unread: feed.counts.unread,
      communicationActivity: feed.collaboration.communicationActivity,
    },
    sharedDocuments: {
      kind: "shared_documents",
      title: "Shared Documents",
      documents: docs.slice(0, 8).map((d) => ({
        id: d.id,
        name: String(d.attributes.name ?? "Document"),
        ownerEmail: d.attributes.ownerEmail ? String(d.attributes.ownerEmail) : null,
        shared: true,
      })),
    },
    collaborationActivity: {
      kind: "collaboration_activity",
      title: "Collaboration Activity",
      collaborationScore: feed.collaborationScore,
      openTasks: feed.counts.tasksOpen,
      driveFiles: feed.counts.driveFiles,
      users: feed.counts.users,
      timeline: feed.timeline.slice(0, 6),
    },
    executiveNarratives: {
      kind: "executive_narratives",
      title: "Executive Narratives",
      narratives: feed.narratives.slice(0, 8),
    },
  };
}
