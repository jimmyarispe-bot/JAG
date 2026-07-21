import { beforeEach, describe, expect, it } from "vitest";
import { createMockSupabase, TEST_UUIDS } from "../../../helpers/mock-supabase";
import {
  createGmailClient,
  deriveGmailCanonicalEntities,
  GMAIL_CANONICAL_KINDS,
  GMAIL_OAUTH_SCOPES,
  GMAIL_OBJECT_TYPES,
  gmailEventForRecord,
  normalizeGmailAttributes,
  syncGmailSlice,
} from "@/lib/platform/integrations/google-workspace/gmail";
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

const CONNECTION_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
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

describe("RC-2.03 — Gmail Connector", () => {
  beforeEach(() => {
    memoryGoogleSyncRegistry.clear();
  });

  it("declares metadata-only OAuth scopes and Gmail object types", () => {
    expect(GMAIL_OAUTH_SCOPES).toContain(
      "https://www.googleapis.com/auth/gmail.metadata"
    );
    expect(GMAIL_OBJECT_TYPES).toEqual(
      expect.arrayContaining(["message", "thread", "label", "attachment"])
    );
    expect(GMAIL_CANONICAL_KINDS).toEqual(
      expect.arrayContaining([
        "Communication",
        "Email",
        "Person",
        "Organization",
        "Attachment",
        "Conversation",
      ])
    );
  });

  it("normalizes messages into Email attributes without bodies", () => {
    const attrs = normalizeGmailAttributes("message", {
      subject: "Board packet",
      threadId: "thr-board",
      from: "board@jag-demo.edu",
      to: ["jimmy@jag-demo.edu"],
      direction: "received",
      workspaceDomain: "jag-demo.edu",
      body: "SECRET",
      bodyHtml: "<p>SECRET</p>",
    });
    expect(attrs.kind).toBe("Email");
    expect(attrs.subject).toBe("Board packet");
    expect(attrs.threadId).toBe("thr-board");
    expect(attrs.body).toBeUndefined();
    expect(attrs.bodyHtml).toBeUndefined();
    expect(attrs.participantEmails).toEqual(
      expect.arrayContaining(["board@jag-demo.edu", "jimmy@jag-demo.edu"])
    );
  });

  it("normalizes threads into Conversation and attachments into Attachment", () => {
    const thread = normalizeGmailAttributes("thread", {
      name: "Board packet review",
      messageCount: 4,
      unread: true,
    });
    expect(thread.kind).toBe("Conversation");

    const attachment = normalizeGmailAttributes("attachment", {
      name: "board-packet.pdf",
      messageId: "msg-1",
      mimeType: "application/pdf",
      sizeBytes: 1000,
      bytes: "raw",
    });
    expect(attachment.kind).toBe("Attachment");
    expect(attachment.bytes).toBeUndefined();
  });

  it("maps EMAIL_SENT / EMAIL_RECEIVED / EMAIL_UPDATED without treating updatedAt as update", () => {
    expect(
      gmailEventForRecord({ direction: "sent", version: 1, updatedAt: "2026-01-01" })
    ).toBe("EMAIL_SENT");
    expect(
      gmailEventForRecord({ direction: "received", version: 1, updatedAt: "2026-01-01" })
    ).toBe("EMAIL_RECEIVED");
    expect(gmailEventForRecord({ direction: "received", version: 2 })).toBe(
      "EMAIL_UPDATED"
    );
  });

  it("derives Person, Organization, and Communication from Emails", async () => {
    const client = createGmailClient();
    await client.authenticate("demo-token");
    const page = await client.listPage({
      organizationId: ORG_ID,
      objectType: "message",
    });
    const syncRecords = toSyncRecords(
      page.records.map((r) => ({ ...r, organizationId: ORG_ID }))
    );
    const normalized = normalizeGoogleWorkspaceRecords(syncRecords, config());
    const primary = normalized.map(
      (n) => n.data as unknown as GoogleWorkspaceCanonicalEntity
    );
    const expanded = deriveGmailCanonicalEntities(primary);

    const kinds = new Set(
      expanded.map((e) => String(e.attributes.kind ?? e.canonicalType))
    );
    expect(kinds.has("Email") || expanded.some((e) => e.objectType === "message")).toBe(
      true
    );
    expect(expanded.some((e) => e.attributes.kind === "Person")).toBe(true);
    expect(expanded.some((e) => e.attributes.kind === "Communication")).toBe(true);
    // External grant domain should yield an Organization partner signal
    expect(
      expanded.some(
        (e) =>
          e.attributes.kind === "Organization" &&
          String(e.attributes.domain ?? "").includes("state.edu")
      )
    ).toBe(true);
  });

  it("syncs Gmail with pagination, checkpoints, and publishes EMAIL_* + THREAD_UPDATED", async () => {
    const supabase = buildSupabase();
    const result = await syncGmailSlice(supabase, {
      organizationId: ORG_ID,
      connectionId: CONNECTION_ID,
      accessToken: "demo-token",
      forceFull: true,
    });

    expect(result.rawCount).toBeGreaterThan(0);
    expect(result.canonical.length).toBeGreaterThan(result.rawCount);
    expect(result.slices.map((s) => s.objectType)).toEqual(
      expect.arrayContaining(["message", "thread", "label", "attachment"])
    );

    const graph = buildGoogleWorkspaceGraph(result.canonical);
    expect(graph.nodes.some((n) => n.entityType === "Email")).toBe(true);
    expect(graph.nodes.some((n) => n.entityType === "Conversation")).toBe(true);
    expect(graph.nodes.some((n) => n.entityType === "Person")).toBe(true);

    const bus = createEventBus();
    const publisher = createEventPublisher(bus);
    await publishGoogleWorkspaceEvents(publisher, result.canonical, {
      connectorId: "google",
      instanceId: `google-${ORG_ID}`,
    });
    const types = bus.list(200).map((e) => e.type);
    expect(types).toEqual(
      expect.arrayContaining(["EMAIL_RECEIVED", "EMAIL_SENT", "THREAD_UPDATED"])
    );
  });

  it("supports incremental checkpoint resume", async () => {
    const supabase = buildSupabase();
    const full = await syncGmailSlice(supabase, {
      organizationId: ORG_ID,
      connectionId: CONNECTION_ID,
      accessToken: "demo-token",
      forceFull: true,
    });
    expect(full.rawCount).toBeGreaterThan(0);

    const incremental = await syncGmailSlice(supabase, {
      organizationId: ORG_ID,
      connectionId: CONNECTION_ID,
      accessToken: "demo-token",
      forceFull: false,
    });
    // After a full sync at catalog watermark, incremental may return fewer/zero new rows.
    expect(incremental.slices.every((s) => s.cursor)).toBe(true);
  });
});
