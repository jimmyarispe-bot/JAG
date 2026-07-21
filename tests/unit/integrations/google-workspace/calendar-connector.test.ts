import { beforeEach, describe, expect, it } from "vitest";
import { createMockSupabase, TEST_UUIDS } from "../../../helpers/mock-supabase";
import {
  CALENDAR_CANONICAL_KINDS,
  CALENDAR_OBJECT_TYPES,
  CALENDAR_OAUTH_SCOPES,
  calendarEventForRecord,
  createCalendarClient,
  deriveCalendarCanonicalEntities,
  normalizeCalendarAttributes,
  syncCalendarSlice,
} from "@/lib/platform/integrations/google-workspace/calendar";
import {
  normalizeGoogleWorkspaceRecords,
  toSyncRecords,
} from "@/lib/platform/integrations/connectors/google-workspace/normalization";
import { buildGoogleWorkspaceGraph } from "@/lib/platform/integrations/connectors/google-workspace/mapping";
import { publishGoogleWorkspaceEvents } from "@/lib/platform/integrations/connectors/google-workspace/services/events";
import { createEventBus } from "@/lib/platform/integrations/events/bus";
import { createEventPublisher } from "@/lib/platform/integrations/events/publisher";
import { memoryGoogleSyncRegistry } from "@/lib/platform/integrations/google-workspace/sync";
import type { createAuthClient } from "@/lib/supabase/server-auth";
import type { ConnectorConfiguration } from "@/lib/platform/integrations/common/types";
import type { GoogleWorkspaceCanonicalEntity } from "@/lib/platform/integrations/connectors/google-workspace/entities";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

const CONNECTION_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const ORG_ID = TEST_UUIDS.organization;

function config(): ConnectorConfiguration {
  const now = new Date().toISOString();
  return {
    connectorId: "google",
    instanceId: `google-${ORG_ID}`,
    scope: { organizationId: ORG_ID, schoolId: null },
    enabled: true,
    authMethod: "oauth2",
    settings: { storeEmailBodies: false, storeDocumentContents: false },
    createdAt: now,
    updatedAt: now,
  };
}

function buildSupabase(): AuthClient {
  const cursors = new Map<string, string>();
  return createMockSupabase(({ table, operation, filters, payload }) => {
    if (table === "integration_sync_cursors") {
      const key = `${filters.connection_id}::${filters.object_type}`;
      if (operation === "maybeSingle") {
        const cursor = cursors.get(key);
        return cursor
          ? {
              data: {
                connection_id: filters.connection_id,
                object_type: filters.object_type,
                cursor,
              },
              error: null,
            }
          : { data: null, error: null };
      }
      if (operation === "upsert" && payload && !Array.isArray(payload)) {
        cursors.set(key, String(payload.cursor));
        return { data: payload as Record<string, unknown>, error: null };
      }
    }
    return { data: null, error: null };
  }) as unknown as AuthClient;
}

describe("RC-2.04 — Calendar Connector", () => {
  beforeEach(() => {
    memoryGoogleSyncRegistry.clear();
  });

  it("declares readonly Calendar scopes and object types", () => {
    expect(CALENDAR_OAUTH_SCOPES).toContain(
      "https://www.googleapis.com/auth/calendar.readonly"
    );
    expect(CALENDAR_OBJECT_TYPES).toEqual(
      expect.arrayContaining(["calendar_event", "meet"])
    );
    expect(CALENDAR_CANONICAL_KINDS).toEqual(
      expect.arrayContaining([
        "Meeting",
        "CalendarEvent",
        "Attendee",
        "Room",
        "Resource",
      ])
    );
  });

  it("normalizes calendar events into CalendarEvent attributes", () => {
    const attrs = normalizeCalendarAttributes("calendar_event", {
      title: "Budget variance review",
      startAt: "2026-07-12T14:00:00.000Z",
      endAt: "2026-07-12T15:00:00.000Z",
      attendees: ["jimmy@jag-demo.edu", "cfo@jag-demo.edu"],
      rooms: ["Finance Conf Room"],
      meetingLink: "https://meet.google.com/budget-variance",
      workspaceDomain: "jag-demo.edu",
      status: "completed",
    });
    expect(attrs.kind).toBe("CalendarEvent");
    expect(attrs.title).toBe("Budget variance review");
    expect(attrs.attendeeCount).toBe(2);
    expect(attrs.rooms).toEqual(["Finance Conf Room"]);
    expect(attrs.meetingLink).toContain("meet.google.com");
  });

  it("maps MEETING_CREATED / UPDATED / COMPLETED from event status", () => {
    expect(
      calendarEventForRecord({
        status: "confirmed",
        endAt: "2099-01-01T00:00:00.000Z",
        version: 1,
      })
    ).toBe("MEETING_CREATED");
    expect(calendarEventForRecord({ status: "confirmed", version: 2 })).toBe(
      "MEETING_UPDATED"
    );
    expect(calendarEventForRecord({ status: "completed", version: 1 })).toBe(
      "MEETING_COMPLETED"
    );
  });

  it("derives Meeting, Attendee, Room, and Resource from CalendarEvents", async () => {
    const client = createCalendarClient();
    await client.authenticate("demo-token");
    const page = await client.listPage({
      organizationId: ORG_ID,
      objectType: "calendar_event",
    });
    const syncRecords = toSyncRecords(
      page.records.map((r) => ({ ...r, organizationId: ORG_ID }))
    );
    const normalized = normalizeGoogleWorkspaceRecords(syncRecords, config());
    const primary = normalized.map(
      (n) => n.data as unknown as GoogleWorkspaceCanonicalEntity
    );
    const expanded = deriveCalendarCanonicalEntities(primary);

    expect(expanded.some((e) => e.attributes.kind === "CalendarEvent")).toBe(true);
    expect(expanded.some((e) => e.attributes.kind === "Meeting")).toBe(true);
    expect(expanded.some((e) => e.attributes.kind === "Attendee")).toBe(true);
    expect(expanded.some((e) => e.attributes.kind === "Room")).toBe(true);
    expect(expanded.some((e) => e.attributes.kind === "Resource")).toBe(true);
  });

  it("syncs Calendar with pagination, checkpoints, graph, and MEETING_* events", async () => {
    const supabase = buildSupabase();
    const result = await syncCalendarSlice(supabase, {
      organizationId: ORG_ID,
      connectionId: CONNECTION_ID,
      accessToken: "demo-token",
      forceFull: true,
    });

    expect(result.rawCount).toBeGreaterThan(0);
    expect(result.canonical.length).toBeGreaterThan(result.rawCount);
    expect(result.slices.map((s) => s.objectType)).toEqual(
      expect.arrayContaining(["calendar_event", "meet"])
    );

    const graph = buildGoogleWorkspaceGraph(result.canonical);
    expect(graph.nodes.some((n) => n.entityType === "CalendarEvent")).toBe(true);
    expect(graph.nodes.some((n) => n.entityType === "Meeting")).toBe(true);
    expect(graph.nodes.some((n) => n.entityType === "Attendee")).toBe(true);
    expect(graph.nodes.some((n) => n.entityType === "Room")).toBe(true);

    const bus = createEventBus();
    const publisher = createEventPublisher(bus);
    await publishGoogleWorkspaceEvents(publisher, result.canonical, {
      connectorId: "google",
      instanceId: `google-${ORG_ID}`,
    });
    const types = bus.list(200).map((e) => e.type);
    expect(
      types.some(
        (t) =>
          t === "MEETING_CREATED" ||
          t === "MEETING_UPDATED" ||
          t === "MEETING_COMPLETED"
      )
    ).toBe(true);
  });

  it("supports incremental checkpoint resume", async () => {
    const supabase = buildSupabase();
    await syncCalendarSlice(supabase, {
      organizationId: ORG_ID,
      connectionId: CONNECTION_ID,
      accessToken: "demo-token",
      forceFull: true,
    });
    const incremental = await syncCalendarSlice(supabase, {
      organizationId: ORG_ID,
      connectionId: CONNECTION_ID,
      accessToken: "demo-token",
      forceFull: false,
    });
    expect(incremental.slices.every((s) => s.cursor)).toBe(true);
  });
});
