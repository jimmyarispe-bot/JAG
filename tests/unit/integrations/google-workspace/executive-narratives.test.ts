import { beforeEach, describe, expect, it } from "vitest";
import {
  buildExecutiveNarratives,
  narrativeHeadlines,
} from "@/lib/platform/integrations/google-workspace/intelligence";
import { createDemoGoogleWorkspaceClient } from "@/lib/platform/integrations/connectors/google-workspace/services/demo-client";
import {
  normalizeGoogleWorkspaceRecords,
  toSyncRecords,
} from "@/lib/platform/integrations/connectors/google-workspace/normalization";
import { deriveGmailCanonicalEntities } from "@/lib/platform/integrations/google-workspace/gmail";
import { deriveCalendarCanonicalEntities } from "@/lib/platform/integrations/google-workspace/calendar";
import { deriveDriveCanonicalEntities } from "@/lib/platform/integrations/google-workspace/drive";
import {
  getGoogleWorkspaceFeed,
  googleWorkspaceStore,
} from "@/lib/platform/integrations/connectors/google-workspace";
import { buildGoogleWorkspaceEccWidgets } from "@/lib/platform/integrations/connectors/google-workspace/services/ecc-widgets";
import { CommandCenterEngine } from "@/lib/platform/intelligence/executive-command-center/engine/command-center-engine";
import type { ConnectorConfiguration } from "@/lib/platform/integrations/common/types";
import type { GoogleWorkspaceCanonicalEntity } from "@/lib/platform/integrations/connectors/google-workspace/entities";
import { GOOGLE_WORKSPACE_OBJECT_TYPES } from "@/lib/platform/integrations/connectors/google-workspace/entities";

const ORG_ID = "org-narratives-demo";

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

async function hydrateStore(): Promise<void> {
  const client = createDemoGoogleWorkspaceClient();
  await client.authenticate({ accessToken: "demo-token", consentType: "admin" });
  const collected = [];
  for (const objectType of GOOGLE_WORKSPACE_OBJECT_TYPES) {
    let cursor: string | null = null;
    do {
      const page = await client.list(ORG_ID, objectType, null, cursor);
      collected.push(
        ...page.records.map((r) => ({ ...r, organizationId: ORG_ID }))
      );
      cursor = page.nextCursor;
    } while (cursor);
  }
  const syncRecords = toSyncRecords(collected);
  const normalized = normalizeGoogleWorkspaceRecords(syncRecords, config());
  const primary = normalized.map(
    (n) => n.data as unknown as GoogleWorkspaceCanonicalEntity
  );
  const canonical = deriveDriveCanonicalEntities(
    deriveCalendarCanonicalEntities(deriveGmailCanonicalEntities(primary))
  );
  googleWorkspaceStore.replace(
    ORG_ID,
    `google-${ORG_ID}`,
    canonical.map((entity) => ({
      canonicalType: entity.canonicalType,
      externalId: entity.externalId,
      sourceSystem: "google-workspace" as const,
      scope: { organizationId: entity.organizationId, schoolId: null },
      data: entity as unknown as Record<string, unknown>,
      lineage: {
        connectorId: "google",
        instanceId: `google-${ORG_ID}`,
        syncedAt: entity.syncedAt,
        rawHash: entity.id,
      },
    }))
  );
}

describe("RC-2.06 — Executive Narratives", () => {
  beforeEach(() => {
    googleWorkspaceStore.clear();
  });

  it("builds organizational narratives from Gmail, Calendar, and Drive entities", async () => {
    await hydrateStore();
    const snap = googleWorkspaceStore.get(ORG_ID);
    expect(snap).toBeTruthy();
    const narratives = buildExecutiveNarratives(snap!);
    const kinds = new Set(narratives.map((n) => n.kind));

    expect(kinds.has("meeting_load")).toBe(true);
    expect(kinds.has("document_silence") || kinds.has("decision_bottleneck")).toBe(
      true
    );
    expect(kinds.has("communication_mix")).toBe(true);

    const headlines = narrativeHeadlines(narratives);
    expect(headlines.some((h) => /meeting/i.test(h))).toBe(true);
    expect(headlines.every((h) => !/gmail\.googleapis|raw/i.test(h))).toBe(true);
  });

  it("surfaces narratives on the intelligence feed and ECC widget bundle", async () => {
    await hydrateStore();
    const feed = getGoogleWorkspaceFeed(ORG_ID);
    expect(feed?.narratives.length).toBeGreaterThan(0);
    expect(feed?.briefBullets[0]).toBe(feed?.narratives[0]?.headline);

    const widgets = buildGoogleWorkspaceEccWidgets(ORG_ID);
    expect(widgets?.executiveNarratives.narratives.length).toBeGreaterThan(0);
  });

  it("projects executive_narratives into the Command Center for CEO layout", async () => {
    await hydrateStore();
    const engine = new CommandCenterEngine();
    const result = engine.build({
      requestId: "ecc-nar-1",
      role: "ceo",
      scope: { organizationId: ORG_ID, schoolId: null },
    });
    const widget = result.widgets.find((w) => w.kind === "executive_narratives");
    expect(widget).toBeTruthy();
    expect(widget!.cards.length).toBeGreaterThan(0);
    expect(widget!.sourceDomain).toBe("google-workspace");
  });
});
