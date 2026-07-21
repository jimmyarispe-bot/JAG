import { beforeEach, describe, expect, it } from "vitest";
import { createMockSupabase, TEST_UUIDS } from "../../../helpers/mock-supabase";
import {
  DRIVE_CANONICAL_KINDS,
  DRIVE_OBJECT_TYPES,
  DRIVE_OAUTH_SCOPES,
  createDriveClient,
  deriveDriveCanonicalEntities,
  driveEventForRecord,
  normalizeDriveAttributes,
  syncDriveSlice,
} from "@/lib/platform/integrations/google-workspace/drive";
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

const CONNECTION_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
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

describe("RC-2.05 — Drive Connector", () => {
  beforeEach(() => {
    memoryGoogleSyncRegistry.clear();
  });

  it("declares metadata-only Drive scopes and object types", () => {
    expect(DRIVE_OAUTH_SCOPES).toContain(
      "https://www.googleapis.com/auth/drive.metadata.readonly"
    );
    expect(DRIVE_OBJECT_TYPES).toEqual(
      expect.arrayContaining(["drive_file", "drive_folder"])
    );
    expect(DRIVE_CANONICAL_KINDS).toEqual(
      expect.arrayContaining([
        "Document",
        "Folder",
        "Owner",
        "Permission",
        "Revision",
      ])
    );
  });

  it("normalizes files into Document and folders into Folder without contents", () => {
    const file = normalizeDriveAttributes("drive_file", {
      name: "Q2 Board Packet.pdf",
      mimeType: "application/pdf",
      ownerEmail: "jimmy@jag-demo.edu",
      parentId: "fld-board",
      shared: true,
      permissions: [
        { id: "p1", email: "jimmy@jag-demo.edu", role: "owner", type: "user" },
      ],
      content: "SECRET",
      version: 2,
    });
    expect(file.kind).toBe("Document");
    expect(file.content).toBeUndefined();
    expect(file.ownerEmail).toBe("jimmy@jag-demo.edu");
    expect(file.permissionCount).toBe(1);

    const folder = normalizeDriveAttributes("drive_folder", {
      name: "Board Packets",
      path: "/Board Packets",
      parentId: null,
    });
    expect(folder.kind).toBe("Folder");
  });

  it("maps DOCUMENT_CREATED / CHANGED / SHARED from drive attributes", () => {
    expect(driveEventForRecord({ version: 1, shared: false })).toBe(
      "DOCUMENT_CREATED"
    );
    expect(driveEventForRecord({ version: 2, shared: false })).toBe(
      "DOCUMENT_CHANGED"
    );
    expect(driveEventForRecord({ version: 1, shared: true })).toBe(
      "DOCUMENT_SHARED"
    );
  });

  it("derives Owner, Permission, and Revision from Documents", async () => {
    const client = createDriveClient();
    await client.authenticate("demo-token");
    const page = await client.listPage({
      organizationId: ORG_ID,
      objectType: "drive_file",
    });
    const syncRecords = toSyncRecords(
      page.records.map((r) => ({ ...r, organizationId: ORG_ID }))
    );
    const normalized = normalizeGoogleWorkspaceRecords(syncRecords, config());
    const primary = normalized.map(
      (n) => n.data as unknown as GoogleWorkspaceCanonicalEntity
    );
    const expanded = deriveDriveCanonicalEntities(primary);

    expect(expanded.some((e) => e.attributes.kind === "Document")).toBe(true);
    expect(expanded.some((e) => e.attributes.kind === "Owner")).toBe(true);
    expect(expanded.some((e) => e.attributes.kind === "Permission")).toBe(true);
    expect(expanded.some((e) => e.attributes.kind === "Revision")).toBe(true);
  });

  it("syncs Drive with pagination, checkpoints, graph, and DOCUMENT_* events", async () => {
    const supabase = buildSupabase();
    const result = await syncDriveSlice(supabase, {
      organizationId: ORG_ID,
      connectionId: CONNECTION_ID,
      accessToken: "demo-token",
      forceFull: true,
    });

    expect(result.rawCount).toBeGreaterThan(0);
    expect(result.canonical.length).toBeGreaterThan(result.rawCount);
    expect(result.slices.map((s) => s.objectType)).toEqual(
      expect.arrayContaining(["drive_file", "drive_folder"])
    );

    const graph = buildGoogleWorkspaceGraph(result.canonical);
    expect(graph.nodes.some((n) => n.entityType === "Document")).toBe(true);
    expect(graph.nodes.some((n) => n.entityType === "Folder")).toBe(true);
    expect(graph.nodes.some((n) => n.entityType === "Owner")).toBe(true);
    expect(graph.nodes.some((n) => n.entityType === "Permission")).toBe(true);
    expect(graph.nodes.some((n) => n.entityType === "Revision")).toBe(true);

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
          t === "DOCUMENT_CREATED" ||
          t === "DOCUMENT_CHANGED" ||
          t === "DOCUMENT_SHARED"
      )
    ).toBe(true);
  });

  it("supports incremental checkpoint resume", async () => {
    const supabase = buildSupabase();
    await syncDriveSlice(supabase, {
      organizationId: ORG_ID,
      connectionId: CONNECTION_ID,
      accessToken: "demo-token",
      forceFull: true,
    });
    const incremental = await syncDriveSlice(supabase, {
      organizationId: ORG_ID,
      connectionId: CONNECTION_ID,
      accessToken: "demo-token",
      forceFull: false,
    });
    expect(incremental.slices.every((s) => s.cursor)).toBe(true);
  });
});
