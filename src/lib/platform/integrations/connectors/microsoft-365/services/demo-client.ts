/**
 * Microsoft 365 demo SoR — production-shaped metadata (no mail/chat bodies by default).
 */

import type {
  Microsoft365AuthSession,
  Microsoft365Tenant,
} from "@/lib/platform/integrations/connectors/microsoft-365/auth";
import type {
  Microsoft365ObjectType,
  Microsoft365RawEntity,
} from "@/lib/platform/integrations/connectors/microsoft-365/entities";
import { MICROSOFT_365_OBJECT_TYPES } from "@/lib/platform/integrations/connectors/microsoft-365/entities";

export type Microsoft365ListPage = {
  records: Microsoft365RawEntity[];
  nextCursor: string | null;
};

export interface Microsoft365Client {
  authenticate(input: {
    accessToken: string;
    tenantDomain?: string;
    consentType?: "admin" | "user";
  }): Promise<{ ok: boolean; error?: string; session?: Microsoft365AuthSession }>;
  refreshToken(refreshToken: string): Promise<{
    ok: boolean;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: string;
    error?: string;
  }>;
  listTenants(accessToken: string): Promise<Microsoft365Tenant[]>;
  health(): Promise<{ ok: boolean; latencyMs: number; rateLimitRemaining: number }>;
  list(
    organizationId: string,
    objectType: Microsoft365ObjectType,
    since?: string | null,
    cursor?: string | null
  ): Promise<Microsoft365ListPage>;
}

function entity(
  objectType: Microsoft365ObjectType,
  id: string,
  organizationId: string,
  tenantDomain: string,
  userId: string | null,
  version: number,
  payload: Record<string, unknown>,
  updatedAt: string
): Microsoft365RawEntity {
  return {
    id,
    objectType,
    organizationId,
    tenantDomain,
    userId,
    updatedAt,
    version,
    payload: { ...payload, name: payload.name ?? payload.title ?? payload.subject ?? id },
  };
}

export function createDemoMicrosoft365Client(_seed = "microsoft-demo"): Microsoft365Client {
  const orgId = "org-microsoft-demo";
  const domain = "jag-demo.onmicrosoft.com";
  const userJimmy = "user-jimmy-ms";
  const userCfo = "user-cfo-ms";
  const now = "2026-07-13T16:00:00.000Z";
  const earlier = "2026-07-12T14:00:00.000Z";
  const tomorrow = "2026-07-14T15:00:00.000Z";

  const tenants: Microsoft365Tenant[] = [
    {
      tenantId: "tenant-jag-demo",
      displayName: "JAG Demo Academy",
      defaultDomain: domain,
    },
  ];

  let selectedDomain = domain;

  const catalog: Microsoft365RawEntity[] = [
    entity("directory_user", userJimmy, orgId, domain, userJimmy, 1, {
      name: "Jimmy Executive",
      email: "jimmy@jag-demo.onmicrosoft.com",
      department: "Leadership",
      status: "active",
    }, now),
    entity("directory_user", userCfo, orgId, domain, userCfo, 1, {
      name: "Casey Finance",
      email: "cfo@jag-demo.onmicrosoft.com",
      department: "Finance",
      status: "active",
    }, earlier),
    entity("directory_group", "grp-leadership-ms", orgId, domain, null, 1, {
      name: "Leadership",
      email: "leadership@jag-demo.onmicrosoft.com",
      memberCount: 6,
    }, earlier),
    entity("contact", "contact-vendor-ms", orgId, domain, null, 1, {
      name: "Blake Partner",
      email: "blake@partner.example",
      organization: "Ed Partners LLC",
      title: "Director",
    }, now),

    entity("message", "msg-ms-1", orgId, domain, userJimmy, 1, {
      subject: "Outlook: Board materials ready",
      threadId: "thr-ms-board",
      from: "board@jag-demo.onmicrosoft.com",
      to: ["jimmy@jag-demo.onmicrosoft.com"],
      unread: true,
      hasAttachments: true,
      attachmentCount: 1,
      receivedAt: earlier,
      direction: "received",
    }, earlier),
    entity("thread", "thr-ms-board", orgId, domain, userJimmy, 1, {
      name: "Board materials",
      messageCount: 3,
      unread: true,
    }, earlier),
    entity("attachment", "att-ms-1", orgId, domain, userJimmy, 1, {
      name: "board-deck.pptx",
      messageId: "msg-ms-1",
      mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    }, earlier),
    entity("message", "msg-ms-sent", orgId, domain, userJimmy, 1, {
      subject: "Re: Outlook: Board materials ready",
      threadId: "thr-ms-board",
      from: "jimmy@jag-demo.onmicrosoft.com",
      to: ["board@jag-demo.onmicrosoft.com"],
      direction: "sent",
      sentAt: now,
    }, now),

    entity("calendar_event", "evt-ms-budget", orgId, domain, userJimmy, 2, {
      title: "Budget variance review",
      startAt: earlier,
      endAt: "2026-07-12T15:00:00.000Z",
      durationMinutes: 60,
      attendees: ["jimmy@jag-demo.onmicrosoft.com", "cfo@jag-demo.onmicrosoft.com"],
      attendeeCount: 2,
      rooms: ["Conf Room West"],
      status: "completed",
      meetingLink: "https://teams.microsoft.com/l/meetup-join/budget",
      updated: true,
    }, earlier),
    entity("calendar_event", "evt-ms-board", orgId, domain, userJimmy, 1, {
      title: "Board meeting — Q2 packet",
      startAt: tomorrow,
      endAt: "2026-07-14T17:00:00.000Z",
      durationMinutes: 120,
      attendees: ["jimmy@jag-demo.onmicrosoft.com", "board@jag-demo.onmicrosoft.com"],
      attendeeCount: 8,
      rooms: ["Board Room"],
      status: "confirmed",
      meetingLink: "https://teams.microsoft.com/l/meetup-join/board",
    }, now),

    entity("onedrive_folder", "fld-ms-board", orgId, domain, userJimmy, 1, {
      name: "Board Packets",
      path: "/Board Packets",
    }, earlier),
    entity("onedrive_file", "file-ms-packet", orgId, domain, userJimmy, 1, {
      name: "Q2 Board Packet.pdf",
      mimeType: "application/pdf",
      ownerEmail: "jimmy@jag-demo.onmicrosoft.com",
      parentId: "fld-ms-board",
      shared: true,
      permissionCount: 5,
      lastModifiedAt: earlier,
    }, earlier),
    entity("sharepoint_site", "site-ms-finance", orgId, domain, null, 1, {
      name: "Finance Hub",
      webUrl: "https://jag-demo.sharepoint.com/sites/finance",
      ownerEmail: "cfo@jag-demo.onmicrosoft.com",
    }, earlier),
    entity("sharepoint_file", "file-ms-sp", orgId, domain, userCfo, 1, {
      name: "Cash forecast.xlsx",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ownerEmail: "cfo@jag-demo.onmicrosoft.com",
      siteId: "site-ms-finance",
      shared: true,
      lastModifiedAt: now,
    }, now),

    entity("team", "team-leadership", orgId, domain, null, 1, {
      name: "Leadership Team",
      memberCount: 8,
    }, earlier),
    entity("channel", "channel-general", orgId, domain, null, 1, {
      name: "General",
      teamId: "team-leadership",
      memberCount: 8,
    }, earlier),
    entity("chat", "chat-ms-1", orgId, domain, userJimmy, 1, {
      topic: "Enrollment sync",
      from: "cfo@jag-demo.onmicrosoft.com",
      to: ["jimmy@jag-demo.onmicrosoft.com"],
      teamId: "team-leadership",
      channelId: "channel-general",
      direction: "received",
      receivedAt: now,
    }, now),
    entity("meet", "meet-ms-budget", orgId, domain, userJimmy, 1, {
      name: "Budget variance review Teams",
      calendarEventId: "evt-ms-budget",
      durationMinutes: 55,
      participantCount: 2,
      participants: ["jimmy@jag-demo.onmicrosoft.com", "cfo@jag-demo.onmicrosoft.com"],
      startedAt: earlier,
      endedAt: "2026-07-12T14:55:00.000Z",
      joinUrl: "https://teams.microsoft.com/l/meetup-join/budget",
    }, earlier),
    entity("task", "task-ms-1", orgId, domain, userJimmy, 1, {
      name: "Finalize Outlook board packet",
      dueAt: tomorrow,
      completed: false,
    }, now),
  ];

  const PAGE_SIZE = 25;

  return {
    async authenticate(input) {
      if (!input.accessToken || input.accessToken === "invalid") {
        return { ok: false, error: "Invalid Microsoft access token" };
      }
      selectedDomain = input.tenantDomain ?? domain;
      return {
        ok: true,
        session: {
          accessToken: input.accessToken,
          refreshToken: `refresh-${input.accessToken}`,
          expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
          tenantId: tenants[0]!.tenantId,
          tenantDomain: selectedDomain,
          consentType: input.consentType ?? "admin",
          tenants,
        },
      };
    },

    async refreshToken(refreshToken) {
      if (!refreshToken || refreshToken === "invalid") {
        return { ok: false, error: "Invalid Microsoft refresh token" };
      }
      return {
        ok: true,
        accessToken: `access-refreshed-ms-${Date.now()}`,
        refreshToken: `refresh-rotated-ms-${Date.now()}`,
        expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
      };
    },

    async listTenants(accessToken) {
      if (!accessToken) return [];
      return tenants;
    },

    async health() {
      return { ok: true, latencyMs: 32, rateLimitRemaining: 920 };
    },

    async list(_organizationId, objectType, since, cursor) {
      const rows = catalog.filter((row) => {
        if (row.objectType !== objectType) return false;
        if (since && row.updatedAt < since) return false;
        if (row.tenantDomain !== selectedDomain && row.tenantDomain !== domain) return false;
        return true;
      });
      const offset = cursor ? Number(cursor) || 0 : 0;
      const page = rows.slice(offset, offset + PAGE_SIZE);
      const next = offset + PAGE_SIZE < rows.length ? String(offset + PAGE_SIZE) : null;
      return { records: page, nextCursor: next };
    },
  };
}

export function allMicrosoft365ObjectTypes(): Microsoft365ObjectType[] {
  return [...MICROSOFT_365_OBJECT_TYPES];
}
