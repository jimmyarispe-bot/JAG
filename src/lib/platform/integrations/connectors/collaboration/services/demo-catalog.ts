/**
 * Deterministic demo SoR catalogs for Slack, Teams, and Zoom.
 */

import type {
  CollaborationObjectType,
  CollaborationProvider,
  CollaborationRawEntity,
} from "@/lib/platform/integrations/connectors/collaboration/entities";

function entity(
  provider: CollaborationProvider,
  objectType: CollaborationObjectType,
  id: string,
  organizationId: string,
  version: number,
  payload: Record<string, unknown>,
  updatedAt: string
): CollaborationRawEntity {
  return {
    id,
    objectType,
    provider,
    organizationId,
    updatedAt,
    version,
    payload: { ...payload, name: payload.name ?? payload.title ?? payload.subject ?? id },
  };
}

export function buildSlackCatalog(organizationId = "org-collab-demo"): CollaborationRawEntity[] {
  const now = "2026-07-13T16:00:00.000Z";
  const earlier = "2026-07-12T14:00:00.000Z";
  const mid = "2026-07-13T10:00:00.000Z";

  return [
    entity("slack", "user", "slack-u-jimmy", organizationId, 1, {
      name: "Jimmy Executive",
      email: "jimmy@jag-demo.edu",
      status: "active",
      department: "Leadership",
      title: "CEO",
    }, now),
    entity("slack", "user", "slack-u-cfo", organizationId, 1, {
      name: "Casey Finance",
      email: "cfo@jag-demo.edu",
      status: "active",
      department: "Finance",
      title: "CFO",
    }, earlier),
    entity("slack", "user", "slack-u-ops", organizationId, 1, {
      name: "Olivia Ops",
      email: "ops@jag-demo.edu",
      status: "active",
      department: "Operations",
      title: "Operations Manager",
    }, earlier),
    entity("slack", "channel", "slack-ch-leadership", organizationId, 1, {
      name: "leadership",
      memberCount: 6,
      isPrivate: false,
    }, earlier),
    entity("slack", "channel", "slack-ch-finance", organizationId, 1, {
      name: "finance",
      memberCount: 4,
      isPrivate: true,
    }, earlier),
    entity("slack", "channel", "slack-ch-ops-silo", organizationId, 1, {
      name: "ops-internal",
      memberCount: 2,
      isPrivate: true,
      siloHint: true,
    }, mid),
    entity("slack", "thread", "slack-thr-1", organizationId, 1, {
      name: "Board packet review",
      channelId: "slack-ch-leadership",
      messageCount: 4,
      rootMessageId: "slack-msg-1",
    }, earlier),
    entity("slack", "message", "slack-msg-1", organizationId, 1, {
      subject: "Board packet ready",
      channelId: "slack-ch-leadership",
      threadId: "slack-thr-1",
      userId: "slack-u-jimmy",
      sentAt: earlier,
      responseLatencyMinutes: 45,
    }, earlier),
    entity("slack", "message", "slack-msg-2", organizationId, 1, {
      subject: "Cash forecast update",
      channelId: "slack-ch-finance",
      userId: "slack-u-cfo",
      sentAt: mid,
      responseLatencyMinutes: 180,
    }, mid),
    entity("slack", "message", "slack-msg-3", organizationId, 1, {
      subject: "Ops-only status",
      channelId: "slack-ch-ops-silo",
      userId: "slack-u-ops",
      sentAt: now,
      responseLatencyMinutes: 12,
    }, now),
    entity("slack", "reaction", "slack-rx-1", organizationId, 1, {
      name: "thumbsup",
      messageId: "slack-msg-1",
      userId: "slack-u-cfo",
      count: 3,
    }, mid),
  ];
}

export function buildTeamsCatalog(organizationId = "org-collab-demo"): CollaborationRawEntity[] {
  const now = "2026-07-13T16:00:00.000Z";
  const earlier = "2026-07-12T14:00:00.000Z";
  const tomorrow = "2026-07-14T15:00:00.000Z";

  return [
    entity("teams", "user", "teams-u-jimmy", organizationId, 1, {
      name: "Jimmy Executive",
      email: "jimmy@jag-demo.onmicrosoft.com",
      department: "Leadership",
      title: "CEO",
    }, now),
    entity("teams", "user", "teams-u-cfo", organizationId, 1, {
      name: "Casey Finance",
      email: "cfo@jag-demo.onmicrosoft.com",
      department: "Finance",
      title: "CFO",
    }, earlier),
    entity("teams", "team", "teams-t-leadership", organizationId, 1, {
      name: "Leadership Team",
      memberCount: 8,
    }, earlier),
    entity("teams", "team", "teams-t-admissions", organizationId, 1, {
      name: "Admissions",
      memberCount: 12,
    }, earlier),
    entity("teams", "channel", "teams-ch-general", organizationId, 1, {
      name: "General",
      teamId: "teams-t-leadership",
      memberCount: 8,
    }, earlier),
    entity("teams", "channel", "teams-ch-finance", organizationId, 1, {
      name: "Finance",
      teamId: "teams-t-leadership",
      memberCount: 3,
    }, earlier),
    entity("teams", "chat", "teams-chat-1", organizationId, 1, {
      subject: "Enrollment sync",
      teamId: "teams-t-leadership",
      channelId: "teams-ch-general",
      userId: "teams-u-cfo",
      sentAt: now,
      responseLatencyMinutes: 25,
    }, now),
    entity("teams", "message", "teams-msg-1", organizationId, 1, {
      subject: "Weekly standup notes",
      channelId: "teams-ch-general",
      teamId: "teams-t-leadership",
      userId: "teams-u-jimmy",
      sentAt: earlier,
      responseLatencyMinutes: 60,
    }, earlier),
    entity("teams", "meet", "teams-meet-1", organizationId, 1, {
      name: "Leadership standup",
      teamId: "teams-t-leadership",
      durationMinutes: 30,
      participantCount: 6,
      startAt: earlier,
      endAt: "2026-07-12T14:30:00.000Z",
    }, earlier),
    entity("teams", "meet", "teams-meet-2", organizationId, 1, {
      name: "Admissions pipeline review",
      teamId: "teams-t-admissions",
      durationMinutes: 55,
      participantCount: 9,
      startAt: tomorrow,
      endAt: "2026-07-14T15:55:00.000Z",
    }, now),
  ];
}

export function buildZoomCatalog(organizationId = "org-collab-demo"): CollaborationRawEntity[] {
  const now = "2026-07-13T16:00:00.000Z";
  const earlier = "2026-07-12T14:00:00.000Z";

  return [
    entity("zoom", "user", "zoom-u-jimmy", organizationId, 1, {
      name: "Jimmy Executive",
      email: "jimmy@jag-demo.edu",
    }, now),
    entity("zoom", "user", "zoom-u-cfo", organizationId, 1, {
      name: "Casey Finance",
      email: "cfo@jag-demo.edu",
    }, earlier),
    entity("zoom", "meet", "zoom-meet-1", organizationId, 1, {
      name: "Board prep sync",
      durationMinutes: 48,
      participantCount: 5,
      startAt: earlier,
      endAt: "2026-07-12T14:48:00.000Z",
      hasRecording: true,
    }, earlier),
    entity("zoom", "meet", "zoom-meet-2", organizationId, 1, {
      name: "Vendor strategy",
      durationMinutes: 62,
      participantCount: 4,
      startAt: "2026-07-13T12:00:00.000Z",
      endAt: "2026-07-13T13:02:00.000Z",
      hasRecording: false,
    }, now),
    entity("zoom", "recording", "zoom-rec-1", organizationId, 1, {
      name: "Board prep sync recording",
      meetingId: "zoom-meet-1",
      durationMinutes: 48,
      mimeType: "video/mp4",
      sizeBytes: 240_000_000,
    }, earlier),
    entity("zoom", "attendance", "zoom-att-1", organizationId, 1, {
      name: "Board prep attendance",
      meetingId: "zoom-meet-1",
      participantCount: 5,
      attendees: ["jimmy@jag-demo.edu", "cfo@jag-demo.edu"],
      durationMinutes: 48,
    }, earlier),
  ];
}

export function buildGoogleMeetCatalog(
  organizationId = "org-collab-demo"
): CollaborationRawEntity[] {
  const now = "2026-07-13T16:00:00.000Z";
  const earlier = "2026-07-12T14:00:00.000Z";
  const mid = "2026-07-13T09:00:00.000Z";

  return [
    entity("google_meet", "user", "gmeet-u-jimmy", organizationId, 1, {
      name: "Jimmy Executive",
      email: "jimmy@jag-demo.edu",
      department: "Leadership",
      title: "CEO",
    }, now),
    entity("google_meet", "user", "gmeet-u-cfo", organizationId, 1, {
      name: "Casey Finance",
      email: "cfo@jag-demo.edu",
      department: "Finance",
      title: "CFO",
    }, earlier),
    entity("google_meet", "user", "gmeet-u-ops", organizationId, 1, {
      name: "Olivia Ops",
      email: "ops@jag-demo.edu",
      department: "Operations",
      title: "Operations Manager",
    }, earlier),
    // Metadata-only Meet sessions (no recordings/transcripts).
    entity("google_meet", "meet", "gmeet-budget", organizationId, 1, {
      name: "Budget variance review",
      durationMinutes: 55,
      participantCount: 4,
      participants: ["jimmy@jag-demo.edu", "cfo@jag-demo.edu"],
      startAt: earlier,
      endAt: "2026-07-12T14:55:00.000Z",
      calendarEventId: "evt-budget",
      meetingLink: "https://meet.google.com/abc-defg-hij",
    }, earlier),
    entity("google_meet", "meet", "gmeet-standup", organizationId, 1, {
      name: "Ops standup",
      durationMinutes: 25,
      participantCount: 6,
      participants: ["ops@jag-demo.edu", "jimmy@jag-demo.edu"],
      startAt: mid,
      endAt: "2026-07-13T09:25:00.000Z",
      calendarEventId: "evt-standup",
      meetingLink: "https://meet.google.com/xyz-uvwx-yz",
    }, mid),
    entity("google_meet", "meet", "gmeet-board", organizationId, 1, {
      name: "Board prep",
      durationMinutes: 90,
      participantCount: 8,
      participants: ["jimmy@jag-demo.edu", "cfo@jag-demo.edu", "ops@jag-demo.edu"],
      startAt: now,
      endAt: "2026-07-13T17:30:00.000Z",
      calendarEventId: "evt-board",
      meetingLink: "https://meet.google.com/board-prep",
    }, now),
    entity("google_meet", "attendance", "gmeet-att-1", organizationId, 1, {
      name: "Budget review attendance",
      meetingId: "gmeet-budget",
      participantCount: 4,
      attendees: ["jimmy@jag-demo.edu", "cfo@jag-demo.edu"],
      durationMinutes: 55,
    }, earlier),
  ];
}

export function catalogForProvider(
  provider: CollaborationProvider,
  organizationId?: string
): CollaborationRawEntity[] {
  if (provider === "slack") return buildSlackCatalog(organizationId);
  if (provider === "teams") return buildTeamsCatalog(organizationId);
  if (provider === "google_meet") return buildGoogleMeetCatalog(organizationId);
  return buildZoomCatalog(organizationId);
}

export function objectTypesForProvider(
  provider: CollaborationProvider
): CollaborationObjectType[] {
  if (provider === "slack") {
    return ["channel", "thread", "message", "user", "reaction"];
  }
  if (provider === "teams") {
    return ["team", "channel", "chat", "message", "meet", "user"];
  }
  if (provider === "google_meet") {
    return ["meet", "attendance", "user"];
  }
  return ["meet", "recording", "attendance", "user"];
}
