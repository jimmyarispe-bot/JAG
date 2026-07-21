/**
 * Google Workspace SoR client.
 * Demo store ships production-shaped productivity metadata for sync/tests/ECC.
 * Never includes email bodies or document contents by default.
 */

import type {
  GoogleWorkspaceAuthSession,
  GoogleWorkspaceDomain,
} from "@/lib/platform/integrations/connectors/google-workspace/auth";
import type {
  GoogleWorkspaceObjectType,
  GoogleWorkspaceRawEntity,
} from "@/lib/platform/integrations/connectors/google-workspace/entities";
import { GOOGLE_WORKSPACE_OBJECT_TYPES } from "@/lib/platform/integrations/connectors/google-workspace/entities";

export type GoogleWorkspaceListPage = {
  records: GoogleWorkspaceRawEntity[];
  nextCursor: string | null;
};

export interface GoogleWorkspaceClient {
  authenticate(input: {
    accessToken: string;
    domain?: string;
    consentType?: "admin" | "user";
  }): Promise<{ ok: boolean; error?: string; session?: GoogleWorkspaceAuthSession }>;
  refreshToken(refreshToken: string): Promise<{
    ok: boolean;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: string;
    error?: string;
  }>;
  listDomains(accessToken: string): Promise<GoogleWorkspaceDomain[]>;
  health(): Promise<{
    ok: boolean;
    latencyMs: number;
    rateLimitRemaining: number;
  }>;
  list(
    organizationId: string,
    objectType: GoogleWorkspaceObjectType,
    since?: string | null,
    cursor?: string | null
  ): Promise<GoogleWorkspaceListPage>;
}

function entity(
  objectType: GoogleWorkspaceObjectType,
  id: string,
  organizationId: string,
  workspaceDomain: string,
  userId: string | null,
  version: number,
  payload: Record<string, unknown>,
  updatedAt: string
): GoogleWorkspaceRawEntity {
  return {
    id,
    objectType,
    organizationId,
    workspaceDomain,
    userId,
    updatedAt,
    version,
    payload: { ...payload, name: payload.name ?? payload.title ?? payload.subject ?? id },
  };
}

/** Deterministic demo SoR — metadata only; correlation anchors for ECC. */
export function createDemoGoogleWorkspaceClient(seed = "google-demo"): GoogleWorkspaceClient {
  const orgId = "org-google-demo";
  const domain = "jag-demo.edu";
  const userJimmy = "user-jimmy";
  const userCfo = "user-cfo";
  const now = "2026-07-13T16:00:00.000Z";
  const earlier = "2026-07-12T14:00:00.000Z";
  const tomorrow = "2026-07-14T15:00:00.000Z";
  const inFiveDays = "2026-07-18T17:00:00.000Z";
  void seed;

  const domains: GoogleWorkspaceDomain[] = [
    {
      domain,
      customerId: "C-google-demo",
      displayName: "JAG Demo Academy",
      adminEmail: "admin@jag-demo.edu",
    },
    {
      domain: "alt.jag-demo.edu",
      customerId: "C-google-alt",
      displayName: "JAG Alt Domain",
      adminEmail: "admin@alt.jag-demo.edu",
    },
  ];

  let selectedDomain = domain;

  const catalog: GoogleWorkspaceRawEntity[] = [
    entity("directory_user", userJimmy, orgId, domain, userJimmy, 1, {
      name: "Jimmy Executive",
      email: "jimmy@jag-demo.edu",
      orgUnitPath: "/Leadership",
      status: "active",
    }, now),
    entity("directory_user", userCfo, orgId, domain, userCfo, 1, {
      name: "Casey Finance",
      email: "cfo@jag-demo.edu",
      orgUnitPath: "/Finance",
      status: "active",
    }, earlier),
    entity("directory_group", "grp-leadership", orgId, domain, null, 1, {
      name: "Leadership",
      email: "leadership@jag-demo.edu",
      memberCount: 6,
    }, earlier),
    entity("organizational_unit", "ou-leadership", orgId, domain, null, 1, {
      name: "Leadership",
      orgUnitPath: "/Leadership",
      parentPath: "/",
    }, earlier),

    entity("label", "label-inbox", orgId, domain, userJimmy, 1, {
      name: "INBOX",
      type: "system",
      messagesUnread: 12,
      messagesTotal: 240,
    }, now),
    entity("label", "label-priority", orgId, domain, userJimmy, 1, {
      name: "PRIORITY",
      type: "user",
      messagesUnread: 3,
      messagesTotal: 18,
    }, now),

    entity("thread", "thr-board", orgId, domain, userJimmy, 1, {
      name: "Board packet review",
      messageCount: 4,
      unread: true,
      labelIds: ["label-inbox", "label-priority"],
      lastMessageAt: earlier,
    }, earlier),
    entity("thread", "thr-grant", orgId, domain, userCfo, 1, {
      name: "Grant deadline reminders",
      messageCount: 2,
      unread: true,
      labelIds: ["label-inbox"],
      lastMessageAt: now,
    }, now),

    // Metadata only — no body fields in demo payload
    entity("message", "msg-1", orgId, domain, userJimmy, 1, {
      subject: "Board packet is ready for review",
      threadId: "thr-board",
      labelIds: ["label-inbox", "label-priority"],
      from: "board@jag-demo.edu",
      to: ["jimmy@jag-demo.edu"],
      unread: true,
      priority: "high",
      hasAttachments: true,
      attachmentCount: 2,
      attachmentNames: ["board-packet.pdf", "financials-summary.xlsx"],
      receivedAt: earlier,
      direction: "received",
    }, earlier),
    entity("attachment", "att-packet", orgId, domain, userJimmy, 1, {
      name: "board-packet.pdf",
      messageId: "msg-1",
      mimeType: "application/pdf",
      sizeBytes: 240_000,
    }, earlier),
    entity("attachment", "att-financials", orgId, domain, userJimmy, 1, {
      name: "financials-summary.xlsx",
      messageId: "msg-1",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      sizeBytes: 88_000,
    }, earlier),
    entity("message", "msg-2", orgId, domain, userCfo, 1, {
      subject: "Grant reporting due in five days",
      threadId: "thr-grant",
      labelIds: ["label-inbox"],
      from: "grants@state.edu",
      to: ["cfo@jag-demo.edu", "jimmy@jag-demo.edu"],
      unread: true,
      priority: "high",
      hasAttachments: false,
      attachmentCount: 0,
      receivedAt: now,
    }, now),
    entity("message", "msg-3", orgId, domain, userJimmy, 1, {
      subject: "Weekly enrollment snapshot",
      threadId: "thr-enroll",
      labelIds: ["label-inbox"],
      from: "sis@jag-demo.edu",
      to: ["jimmy@jag-demo.edu"],
      unread: false,
      priority: "normal",
      hasAttachments: false,
      attachmentCount: 0,
      receivedAt: earlier,
      direction: "received",
    }, earlier),
    entity("message", "msg-sent-1", orgId, domain, userJimmy, 1, {
      subject: "Re: Board packet is ready for review",
      threadId: "thr-board",
      labelIds: ["label-inbox"],
      from: "jimmy@jag-demo.edu",
      to: ["board@jag-demo.edu"],
      unread: false,
      priority: "normal",
      hasAttachments: false,
      attachmentCount: 0,
      sentAt: now,
      direction: "sent",
    }, now),

    // Correlation anchors
    entity("calendar_event", "evt-budget", orgId, domain, userJimmy, 2, {
      title: "Budget variance review",
      correlationKey: "qb_budget_variance",
      startAt: earlier,
      endAt: "2026-07-12T15:00:00.000Z",
      durationMinutes: 60,
      attendees: ["jimmy@jag-demo.edu", "cfo@jag-demo.edu"],
      attendeeCount: 2,
      rooms: ["Finance Conf Room"],
      recurring: false,
      status: "completed",
      location: "Meet",
      meetingLink: "https://meet.google.com/budget-variance",
      hangoutLink: "https://meet.google.com/budget-variance",
      updated: true,
      version: 2,
    }, earlier),
    entity("calendar_event", "evt-grant", orgId, domain, userCfo, 1, {
      title: "State grant deadline",
      correlationKey: "plaid_grant_cash",
      startAt: inFiveDays,
      endAt: "2026-07-18T18:00:00.000Z",
      durationMinutes: 60,
      attendees: ["cfo@jag-demo.edu", "jimmy@jag-demo.edu"],
      attendeeCount: 2,
      recurring: false,
      status: "confirmed",
      allDay: false,
    }, now),
    entity("calendar_event", "evt-board", orgId, domain, userJimmy, 1, {
      title: "Board meeting — Q2 packet",
      correlationKey: "exec_board_brief",
      startAt: tomorrow,
      endAt: "2026-07-14T17:00:00.000Z",
      durationMinutes: 120,
      attendees: ["jimmy@jag-demo.edu", "board@jag-demo.edu", "cfo@jag-demo.edu"],
      attendeeCount: 8,
      rooms: ["Board Room A"],
      recurring: false,
      status: "confirmed",
      meetingLink: "https://meet.google.com/board-q2",
    }, now),
    entity("calendar_event", "evt-school", orgId, domain, null, 1, {
      title: "Campus orientation week",
      correlationKey: "academyos_school_calendar",
      startAt: "2026-07-20T13:00:00.000Z",
      endAt: "2026-07-20T16:00:00.000Z",
      durationMinutes: 180,
      attendees: [],
      attendeeCount: 0,
      recurring: true,
      recurrence: "WEEKLY",
      status: "confirmed",
    }, earlier),
    entity("calendar_event", "evt-conflict-a", orgId, domain, userJimmy, 1, {
      title: "Vendor strategy call",
      startAt: tomorrow,
      endAt: "2026-07-14T16:00:00.000Z",
      durationMinutes: 60,
      attendees: ["jimmy@jag-demo.edu"],
      attendeeCount: 3,
      recurring: false,
      status: "confirmed",
      conflictHint: true,
    }, now),

    entity("drive_folder", "fld-board", orgId, domain, userJimmy, 1, {
      name: "Board Packets",
      parentId: null,
      path: "/Board Packets",
    }, earlier),
    entity("drive_file", "file-packet", orgId, domain, userJimmy, 2, {
      name: "Q2 Board Packet.pdf",
      mimeType: "application/pdf",
      ownerEmail: "jimmy@jag-demo.edu",
      parentId: "fld-board",
      shared: true,
      permissionCount: 3,
      permissions: [
        { id: "p1", email: "jimmy@jag-demo.edu", role: "owner", type: "user" },
        { id: "p2", email: "cfo@jag-demo.edu", role: "writer", type: "user" },
        { id: "p3", email: "board@jag-demo.edu", role: "reader", type: "user" },
      ],
      lastModifiedAt: earlier,
      activityCount: 14,
    }, earlier),
    entity("drive_file", "file-budget", orgId, domain, userCfo, 1, {
      name: "FY26 Variance Notes",
      mimeType: "application/vnd.google-apps.document",
      ownerEmail: "cfo@jag-demo.edu",
      parentId: "fld-board",
      shared: true,
      permissionCount: 2,
      permissions: [
        { id: "p1", email: "cfo@jag-demo.edu", role: "owner", type: "user" },
        { id: "p2", email: "jimmy@jag-demo.edu", role: "reader", type: "user" },
      ],
      lastModifiedAt: now,
      activityCount: 6,
    }, now),

    entity("doc", "doc-brief", orgId, domain, userJimmy, 1, {
      name: "Executive Brief draft",
      ownerEmail: "jimmy@jag-demo.edu",
      collaborators: ["cfo@jag-demo.edu"],
      lastModifiedAt: now,
      // no content field — metadata only
    }, now),
    entity("sheet", "sheet-cash", orgId, domain, userCfo, 1, {
      name: "Cash forecast workbook",
      ownerEmail: "cfo@jag-demo.edu",
      tabCount: 4,
      tabs: ["Summary", "Plaid", "QB", "Scenarios"],
      lastModifiedAt: earlier,
      activityCount: 11,
      shared: true,
    }, earlier),
    entity("slide", "slide-board", orgId, domain, userJimmy, 1, {
      name: "Q2 Board Deck",
      ownerEmail: "jimmy@jag-demo.edu",
      slideCount: 18,
      shared: true,
      collaborators: ["cfo@jag-demo.edu", "board@jag-demo.edu"],
      lastModifiedAt: now,
      createdAt: earlier,
    }, now),
    entity("contact", "contact-grant", orgId, domain, null, 1, {
      name: "State Grants Officer",
      email: "grants@state.edu",
      organization: "State Education Agency",
      title: "Program Officer",
      phone: "+1-555-0100",
    }, earlier),
    entity("contact", "contact-vendor", orgId, domain, null, 1, {
      name: "Ava Vendor",
      email: "ava@edtech.example",
      organization: "EdTech Partners",
      title: "Account Executive",
    }, now),

    entity("meet", "meet-budget", orgId, domain, userJimmy, 1, {
      name: "Budget variance review Meet",
      calendarEventId: "evt-budget",
      durationMinutes: 58,
      participantCount: 2,
      participants: ["jimmy@jag-demo.edu", "cfo@jag-demo.edu"],
      startedAt: earlier,
      endedAt: "2026-07-12T14:58:00.000Z",
    }, earlier),
    entity("meet", "meet-standup", orgId, domain, userJimmy, 1, {
      name: "Leadership standup",
      durationMinutes: 25,
      participantCount: 5,
      startedAt: "2026-07-13T12:00:00.000Z",
      endedAt: "2026-07-13T12:25:00.000Z",
    }, now),

    entity("task_list", "tl-exec", orgId, domain, userJimmy, 1, {
      name: "Executive actions",
    }, earlier),
    entity("task", "task-board", orgId, domain, userJimmy, 1, {
      name: "Finalize board packet",
      listId: "tl-exec",
      dueAt: tomorrow,
      completed: false,
      correlationKey: "exec_board_brief",
    }, now),
    entity("task", "task-grant", orgId, domain, userCfo, 1, {
      name: "Submit grant report",
      listId: "tl-exec",
      dueAt: inFiveDays,
      completed: false,
      correlationKey: "plaid_grant_cash",
    }, now),
    entity("task", "task-done", orgId, domain, userJimmy, 1, {
      name: "Review tuition aging",
      listId: "tl-exec",
      dueAt: earlier,
      completed: true,
      completedAt: earlier,
      correlationKey: "qb_budget_variance",
    }, earlier),
  ];

  const PAGE_SIZE = 25;

  return {
    async authenticate(input) {
      if (!input.accessToken || input.accessToken === "invalid") {
        return { ok: false, error: "Invalid Google access token" };
      }
      selectedDomain = input.domain ?? domain;
      const expiresAt = new Date(Date.now() + 3_600_000).toISOString();
      return {
        ok: true,
        session: {
          accessToken: input.accessToken,
          refreshToken: `refresh-${input.accessToken}`,
          expiresAt,
          domain: selectedDomain,
          consentType: input.consentType ?? "admin",
          domains,
        },
      };
    },

    async refreshToken(refreshToken) {
      if (!refreshToken || refreshToken === "invalid") {
        return { ok: false, error: "Invalid Google refresh token" };
      }
      return {
        ok: true,
        accessToken: `access-refreshed-${Date.now()}`,
        refreshToken: `refresh-rotated-${Date.now()}`,
        expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
      };
    },

    async listDomains(accessToken) {
      if (!accessToken) return [];
      return domains;
    },

    async health() {
      return { ok: true, latencyMs: 28, rateLimitRemaining: 880 };
    },

    async list(organizationId, objectType, since, cursor) {
      void organizationId; // Demo SoR serves the fixture catalog for any org scope.
      const rows = catalog.filter((row) => {
        if (row.objectType !== objectType) return false;
        if (since && row.updatedAt < since) return false;
        if (row.workspaceDomain !== selectedDomain && row.workspaceDomain !== domain) {
          return false;
        }
        return true;
      });
      const offset = cursor ? Number(cursor) || 0 : 0;
      const page = rows.slice(offset, offset + PAGE_SIZE);
      const next = offset + PAGE_SIZE < rows.length ? String(offset + PAGE_SIZE) : null;
      return { records: page, nextCursor: next };
    },
  };
}

export function allGoogleWorkspaceObjectTypes(): GoogleWorkspaceObjectType[] {
  return [...GOOGLE_WORKSPACE_OBJECT_TYPES];
}
