/**
 * Unified Communication Dashboard — Google Workspace + Microsoft 365.
 * Meetings/comms are provider-neutral for Copilot / ECC consumers.
 */

import { getGoogleWorkspaceFeed } from "@/lib/platform/integrations/connectors/google-workspace/services/intelligence-feed";
import { googleWorkspaceStore } from "@/lib/platform/integrations/connectors/google-workspace/services/store";
import { getMicrosoft365Feed } from "@/lib/platform/integrations/connectors/microsoft-365/services/intelligence-feed";
import { microsoft365Store } from "@/lib/platform/integrations/connectors/microsoft-365/services/store";

export type UnifiedMeetingCard = {
  id: string;
  title: string;
  startAt: string;
  durationMinutes: number;
  participantCount: number;
  /** Lineage only — UI/Copilot should prefer kind over provider. */
  provider: "google-workspace" | "microsoft-365";
  kind: "Meeting";
};

export type UnifiedCommunicationCard = {
  id: string;
  title: string;
  at: string;
  provider: "google-workspace" | "microsoft-365";
  kind: "Communication";
};

export type UnifiedCommunicationDashboard = {
  kind: "unified_communication_dashboard";
  title: string;
  organizationId: string;
  totals: {
    messages: number;
    unread: number;
    upcomingMeetings: number;
    meetingLoadMinutes: number;
    chats: number;
    files: number;
    collaborationScore: number;
  };
  recentMeetings: UnifiedMeetingCard[];
  recentCommunications: UnifiedCommunicationCard[];
  calendar: Array<{
    id: string;
    title: string;
    startAt: string;
    durationMinutes: number;
    attendeeCount: number;
    kind: "Meeting";
  }>;
  providersConnected: Array<"google-workspace" | "microsoft-365">;
  refreshedAt: string;
};

function resolveGoogleOrg(organizationId: string): string {
  if (googleWorkspaceStore.get(organizationId)) return organizationId;
  if (googleWorkspaceStore.get("org-google-demo")) return "org-google-demo";
  if (googleWorkspaceStore.get("exec-demo-org")) return "exec-demo-org";
  return organizationId;
}

function resolveMicrosoftOrg(organizationId: string): string {
  if (microsoft365Store.get(organizationId)) return organizationId;
  if (microsoft365Store.get("org-microsoft-demo")) return "org-microsoft-demo";
  if (microsoft365Store.get("exec-demo-org")) return "exec-demo-org";
  return organizationId;
}

export function buildUnifiedCommunicationDashboard(
  organizationId: string
): UnifiedCommunicationDashboard | null {
  const googleOrg = resolveGoogleOrg(organizationId);
  const microsoftOrg = resolveMicrosoftOrg(organizationId);
  const google = getGoogleWorkspaceFeed(googleOrg);
  const microsoft = getMicrosoft365Feed(microsoftOrg);

  if (!google && !microsoft) return null;

  const providersConnected: Array<"google-workspace" | "microsoft-365"> = [];
  if (google) providersConnected.push("google-workspace");
  if (microsoft) providersConnected.push("microsoft-365");

  const googleMeetSnap = googleWorkspaceStore.get(googleOrg);
  const msMeetSnap = microsoft365Store.get(microsoftOrg);

  const recentMeetings: UnifiedMeetingCard[] = [
    ...(googleMeetSnap?.byType.meet ?? []).map((m) => ({
      id: m.id,
      title: String(m.attributes.name ?? "Meeting"),
      startAt: String(m.attributes.startedAt ?? m.attributes.startAt ?? m.syncedAt),
      durationMinutes: Number(m.attributes.durationMinutes ?? 0),
      participantCount: Number(m.attributes.participantCount ?? 0),
      provider: "google-workspace" as const,
      kind: "Meeting" as const,
    })),
    ...(msMeetSnap?.byType.meet ?? []).map((m) => ({
      id: m.id,
      title: String(m.attributes.name ?? "Meeting"),
      startAt: String(m.attributes.startAt ?? m.attributes.startedAt ?? m.syncedAt),
      durationMinutes: Number(m.attributes.durationMinutes ?? 0),
      participantCount: Number(m.attributes.participantCount ?? 0),
      provider: "microsoft-365" as const,
      kind: "Meeting" as const,
    })),
  ]
    .sort((a, b) => b.startAt.localeCompare(a.startAt))
    .slice(0, 8);

  const recentCommunications: UnifiedCommunicationCard[] = [
    ...(googleMeetSnap?.byType.message ?? []).map((m) => ({
      id: m.id,
      title: String(m.attributes.subject ?? "Message"),
      at: String(m.attributes.receivedAt ?? m.attributes.sentAt ?? m.syncedAt),
      provider: "google-workspace" as const,
      kind: "Communication" as const,
    })),
    ...(msMeetSnap?.byType.message ?? []).map((m) => ({
      id: m.id,
      title: String(m.attributes.subject ?? "Message"),
      at: String(m.attributes.receivedAt ?? m.attributes.sentAt ?? m.syncedAt),
      provider: "microsoft-365" as const,
      kind: "Communication" as const,
    })),
    ...(msMeetSnap?.byType.chat ?? []).map((m) => ({
      id: m.id,
      title: String(m.attributes.subject ?? m.attributes.topic ?? "Chat"),
      at: String(m.attributes.receivedAt ?? m.syncedAt),
      provider: "microsoft-365" as const,
      kind: "Communication" as const,
    })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 10);

  const calendar = [
    ...(google?.executiveCalendar ?? []).map((e) => ({
      id: e.id,
      title: e.title,
      startAt: e.startAt,
      durationMinutes: e.durationMinutes,
      attendeeCount: e.attendeeCount,
      kind: "Meeting" as const,
    })),
    ...(microsoft?.executiveCalendar ?? []).map((e) => ({
      id: e.id,
      title: e.title,
      startAt: e.startAt,
      durationMinutes: e.durationMinutes,
      attendeeCount: e.attendeeCount,
      kind: "Meeting" as const,
    })),
  ]
    .sort((a, b) => a.startAt.localeCompare(b.startAt))
    .slice(0, 10);

  const messages = (google?.counts.messages ?? 0) + (microsoft?.counts.messages ?? 0);
  const unread = (google?.counts.unread ?? 0) + (microsoft?.counts.unread ?? 0);
  const upcomingMeetings =
    (google?.collaboration.upcomingMeetings ?? 0) +
    (microsoft?.collaboration.upcomingMeetings ?? 0);
  const meetingLoadMinutes =
    (google?.collaboration.meetingLoadMinutes7d ?? 0) +
    (microsoft?.collaboration.meetingLoadMinutes7d ?? 0);
  const chats = microsoft?.counts.chats ?? 0;
  const files = (google?.counts.driveFiles ?? 0) + (microsoft?.counts.files ?? 0);
  const collaborationScore = Math.round(
    ((google?.collaborationScore ?? 0) + (microsoft?.collaborationScore ?? 0)) /
      Math.max(providersConnected.length, 1)
  );

  return {
    kind: "unified_communication_dashboard",
    title: "Unified Communication Dashboard",
    organizationId,
    totals: {
      messages,
      unread,
      upcomingMeetings,
      meetingLoadMinutes,
      chats,
      files,
      collaborationScore,
    },
    recentMeetings,
    recentCommunications,
    calendar,
    providersConnected,
    refreshedAt: new Date().toISOString(),
  };
}
