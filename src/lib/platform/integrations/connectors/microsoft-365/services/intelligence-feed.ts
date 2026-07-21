import {
  microsoft365Store,
  type Microsoft365StoreSnapshot,
} from "@/lib/platform/integrations/connectors/microsoft-365/services/store";

export type Microsoft365IntelligenceFeed = {
  sourceSystem: "microsoft-365";
  live: true;
  syncedAt: string;
  organizationId: string;
  tenantDomain: string | null;
  privacy: { metadataOnly: true };
  counts: {
    messages: number;
    unread: number;
    calendarEvents: number;
    files: number;
    meets: number;
    chats: number;
    teams: number;
    users: number;
  };
  collaboration: {
    meetingLoadMinutes7d: number;
    upcomingMeetings: number;
    communicationActivity: number;
    chatActivity: number;
  };
  executiveCalendar: Array<{
    id: string;
    title: string;
    startAt: string;
    durationMinutes: number;
    attendeeCount: number;
  }>;
  collaborationScore: number;
};

function num(v: unknown): number {
  return Number(v ?? 0);
}

export function buildMicrosoft365IntelligenceFeed(
  snapshot: Microsoft365StoreSnapshot
): Microsoft365IntelligenceFeed | null {
  if (!snapshot.records.length || !snapshot.syncedAt) return null;

  const messages = snapshot.byType.message ?? [];
  const events = snapshot.byType.calendar_event ?? [];
  const files = [
    ...(snapshot.byType.onedrive_file ?? []),
    ...(snapshot.byType.sharepoint_file ?? []),
  ];
  const meets = snapshot.byType.meet ?? [];
  const chats = snapshot.byType.chat ?? [];
  const teams = snapshot.byType.team ?? [];
  const users = snapshot.byType.directory_user ?? [];

  const unread = messages.filter((m) => m.attributes.unread).length;
  const meetingLoadMinutes7d = meets.reduce((s, m) => s + num(m.attributes.durationMinutes), 0);
  const upcoming = events
    .filter((e) => String(e.attributes.startAt ?? "") >= "2026-07-13T00:00:00.000Z")
    .sort((a, b) =>
      String(a.attributes.startAt).localeCompare(String(b.attributes.startAt))
    );

  return {
    sourceSystem: "microsoft-365",
    live: true,
    syncedAt: snapshot.syncedAt,
    organizationId: snapshot.organizationId,
    tenantDomain: snapshot.records[0]?.tenantDomain ?? null,
    privacy: { metadataOnly: true },
    counts: {
      messages: messages.length,
      unread,
      calendarEvents: events.length,
      files: files.length,
      meets: meets.length,
      chats: chats.length,
      teams: teams.length,
      users: users.length,
    },
    collaboration: {
      meetingLoadMinutes7d,
      upcomingMeetings: upcoming.length,
      communicationActivity: messages.length + unread + chats.length,
      chatActivity: chats.length,
    },
    executiveCalendar: upcoming.slice(0, 6).map((e) => ({
      id: e.id,
      title: String(e.attributes.title ?? e.attributes.name ?? "Event"),
      startAt: String(e.attributes.startAt ?? e.syncedAt),
      durationMinutes: num(e.attributes.durationMinutes),
      attendeeCount: num(e.attributes.attendeeCount),
    })),
    collaborationScore: Math.min(
      100,
      50 + meets.length * 8 + upcoming.length * 3 + chats.length * 4 + teams.length * 5
    ),
  };
}

export function getMicrosoft365Feed(
  organizationId: string
): Microsoft365IntelligenceFeed | null {
  const snapshot = microsoft365Store.get(organizationId);
  if (!snapshot) return null;
  return buildMicrosoft365IntelligenceFeed(snapshot);
}
