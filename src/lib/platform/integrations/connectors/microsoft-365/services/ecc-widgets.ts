/**
 * ECC widget data from Microsoft 365 intelligence feed (RC-3.01).
 * Soft-read only — Communication / Meetings / Documents — never raw Graph objects.
 */

import type { Microsoft365IntelligenceFeed } from "@/lib/platform/integrations/connectors/microsoft-365/services/intelligence-feed";
import { getMicrosoft365Feed } from "@/lib/platform/integrations/connectors/microsoft-365/services/intelligence-feed";
import { microsoft365Store } from "@/lib/platform/integrations/connectors/microsoft-365/services/store";

export type MicrosoftMeetingsWidget = {
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

export type MicrosoftCommunicationWidget = {
  kind: "communication_pulse";
  title: string;
  messages: number;
  unread: number;
  chats: number;
  communicationActivity: number;
};

export type MicrosoftDocumentsWidget = {
  kind: "shared_documents";
  title: string;
  documents: Array<{
    id: string;
    name: string;
    ownerEmail: string | null;
    shared: boolean;
  }>;
};

export type Microsoft365EccWidgets = {
  /** Meetings — calendar + Teams meets */
  meetings: MicrosoftMeetingsWidget;
  /** Communication — Outlook + Teams chat pulse */
  communication: MicrosoftCommunicationWidget;
  /** Documents — OneDrive + SharePoint */
  documents: MicrosoftDocumentsWidget;
  /** Aliases matching Google ECC kind names for projector reuse */
  recentMeetings: MicrosoftMeetingsWidget;
  communicationPulse: MicrosoftCommunicationWidget;
  sharedDocuments: MicrosoftDocumentsWidget;
};

export function buildMicrosoft365EccWidgets(
  organizationId: string
): Microsoft365EccWidgets | null {
  const feed = getMicrosoft365Feed(organizationId);
  if (!feed) return null;
  return projectEccWidgets(feed, organizationId);
}

export function projectEccWidgets(
  feed: Microsoft365IntelligenceFeed,
  organizationId: string
): Microsoft365EccWidgets {
  const snapshot = microsoft365Store.get(organizationId);
  const meets = [
    ...(snapshot?.byType.meet ?? []),
    ...(snapshot?.byType.calendar_event ?? []).filter(
      (e) => e.attributes.kind === "Meeting" || e.attributes.meetingLink
    ),
  ];
  const docs = [
    ...(snapshot?.byType.onedrive_file ?? []),
    ...(snapshot?.byType.sharepoint_file ?? []),
  ].filter((d) => d.attributes.shared !== false);

  const meetings: MicrosoftMeetingsWidget = {
    kind: "recent_meetings",
    title: "Meetings",
    meetings: meets.slice(0, 6).map((m) => ({
      id: m.id,
      title: String(m.attributes.name ?? m.attributes.title ?? "Meeting"),
      startAt: String(
        m.attributes.startedAt ?? m.attributes.startAt ?? m.syncedAt
      ),
      durationMinutes: Number(m.attributes.durationMinutes ?? 0),
      participantCount: Number(
        m.attributes.participantCount ?? m.attributes.attendeeCount ?? 0
      ),
    })),
  };

  const communication: MicrosoftCommunicationWidget = {
    kind: "communication_pulse",
    title: "Communication",
    messages: feed.counts.messages,
    unread: feed.counts.unread,
    chats: feed.counts.chats,
    communicationActivity:
      feed.collaboration.communicationActivity + feed.collaboration.chatActivity,
  };

  const documents: MicrosoftDocumentsWidget = {
    kind: "shared_documents",
    title: "Documents",
    documents: docs.slice(0, 8).map((d) => ({
      id: d.id,
      name: String(d.attributes.name ?? "Document"),
      ownerEmail: d.attributes.ownerEmail
        ? String(d.attributes.ownerEmail)
        : null,
      shared: true,
    })),
  };

  return {
    meetings,
    communication,
    documents,
    recentMeetings: meetings,
    communicationPulse: communication,
    sharedDocuments: documents,
  };
}
