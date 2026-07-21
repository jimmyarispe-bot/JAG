import { describe, expect, it } from "vitest";
import {
  createIntegrationPlatformCore,
  createGoogleWorkspacePlatformConnector,
  registerGoogleWorkspacePlatformConnector,
  reconnectGoogleWorkspace,
  createDemoGoogleWorkspaceClient,
  googleWorkspaceOAuthConfig,
  buildGoogleWorkspaceAuthorizeUrl,
  normalizeGoogleWorkspaceRecords,
  toGoogleWorkspaceSyncRecords,
  scrubPayloadForPrivacy,
  buildGoogleWorkspaceGraph,
  buildGoogleWorkspaceEccWidgets,
  GOOGLE_WORKSPACE_OBJECT_TYPES,
  GOOGLE_WORKSPACE_KG_KINDS,
} from "@/lib/platform/integrations";
import type { ConnectorConfiguration } from "@/lib/platform/integrations/common/types";
import { createOiosOperatingSystem } from "@/lib/platform/oios";

describe("Sprint 074 — Google Workspace PlatformConnector", () => {
  describe("OAuth flow", () => {
    it("builds authorize URL via Sprint 073 OAuth helpers", () => {
      const oauth = googleWorkspaceOAuthConfig({
        clientId: "google-demo",
        redirectUri: "https://jag.local/oauth/google",
        adminConsent: true,
      });
      const url = buildGoogleWorkspaceAuthorizeUrl(oauth, {
        adminConsent: true,
        hostedDomain: "jag-demo.edu",
      });
      expect(url).toContain("accounts.google.com");
      expect(url).toContain("client_id=google-demo");
      expect(oauth.scopes.some((s) => s.includes("gmail.metadata"))).toBe(true);
      expect(oauth.scopes.some((s) => s.includes("presentations"))).toBe(true);
      expect(oauth.scopes.some((s) => s.includes("contacts"))).toBe(true);
    });

    it("installs, refreshes, disconnects, and reconnects", async () => {
      const connector = createGoogleWorkspacePlatformConnector({
        client: createDemoGoogleWorkspaceClient(),
      });
      const auth = await connector.authenticate("google-org-1");
      expect(auth.ok).toBe(true);
      expect(auth.accessToken).toBeTruthy();

      const refreshed = await connector.refreshAuthentication("google-org-1");
      expect(refreshed.ok).toBe(true);

      await connector.disconnect("google-org-1");
      const validation = await connector.validate("google-org-1");
      expect(validation.ok).toBe(false);

      const reconnected = await reconnectGoogleWorkspace(connector, "google-org-1");
      expect(reconnected.ok).toBe(true);
    });
  });

  describe("full and incremental sync", () => {
    it("runs full sync across Gmail/Calendar/Drive/Docs/Sheets/Slides/Contacts/Meet/Directory", async () => {
      const platform = createIntegrationPlatformCore();
      registerGoogleWorkspacePlatformConnector(platform);
      platform.lifecycle.seed("google-org-demo", "connected");

      const result = await platform.syncNow("google", "google-org-demo", "full");
      expect(result.status).toBe("succeeded");
      expect(result.recordsFetched).toBeGreaterThan(20);
      expect(GOOGLE_WORKSPACE_OBJECT_TYPES).toContain("slide");
      expect(GOOGLE_WORKSPACE_OBJECT_TYPES).toContain("contact");
      expect(GOOGLE_WORKSPACE_OBJECT_TYPES).toContain("attachment");

      const events = platform.events.list(200);
      expect(events.some((e) => e.type === "EMAIL_RECEIVED" || e.type === "EMAIL_SENT")).toBe(
        true
      );
      expect(
        events.some(
          (e) =>
            e.type === "MEETING_CREATED" ||
            e.type === "MEETING_UPDATED" ||
            e.type === "MEETING_COMPLETED"
        )
      ).toBe(true);
      expect(
        events.some(
          (e) =>
            e.type === "DOCUMENT_CHANGED" ||
            e.type === "DOCUMENT_CREATED" ||
            e.type === "DOCUMENT_SHARED"
        )
      ).toBe(true);
    });

    it("runs incremental sync with cursor", async () => {
      const platform = createIntegrationPlatformCore();
      registerGoogleWorkspacePlatformConnector(platform);
      platform.lifecycle.seed("google-inc-1", "connected");

      const full = await platform.syncNow("google", "google-inc-1", "full");
      expect(full.status).toBe("succeeded");
      expect(full.cursor).toBeTruthy();

      const incremental = await platform.sync.run(platform.registry.require("google"), {
        connectorId: "google",
        instanceId: "google-inc-1",
        mode: "incremental",
        since: "2026-07-13T00:00:00.000Z",
        cursor: full.cursor,
        triggeredBy: "manual",
      });
      expect(incremental.status).toBe("succeeded");
    });
  });

  describe("normalization & knowledge graph", () => {
    it("never retains email bodies and maps to KG kinds", () => {
      const sync = toGoogleWorkspaceSyncRecords([
        {
          id: "msg-x",
          objectType: "message",
          updatedAt: "2026-07-13T00:00:00.000Z",
          version: 1,
          organizationId: "org-1",
          workspaceDomain: "jag-demo.edu",
          userId: "u1",
          payload: { subject: "Hi", body: "SECRET", direction: "received" },
        },
        {
          id: "meet-x",
          objectType: "meet",
          updatedAt: "2026-07-13T00:00:00.000Z",
          version: 1,
          organizationId: "org-1",
          workspaceDomain: "jag-demo.edu",
          userId: "u1",
          payload: {
            name: "Standup",
            participants: ["a@b.c"],
            durationMinutes: 15,
            startedAt: "2026-07-13T12:00:00.000Z",
            endedAt: "2026-07-13T12:15:00.000Z",
          },
        },
      ]);
      const config = {
        connectorId: "google",
        instanceId: "google-org-1",
        scope: { organizationId: "org-1", schoolId: null },
        authMethod: "oauth2",
        enabled: true,
        settings: { storeEmailBodies: false },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as unknown as ConnectorConfiguration;

      const scrubbed = scrubPayloadForPrivacy("message", { body: "SECRET", subject: "Hi" }, {
        storeEmailBodies: false,
        storeDocumentContents: false,
      });
      expect(scrubbed.body).toBeUndefined();

      const normalized = normalizeGoogleWorkspaceRecords(sync, config);
      const entities = normalized.map((n) => n.data as { attributes: Record<string, unknown>; objectType: string });
      expect(entities[0]!.attributes.body).toBeUndefined();

      const graph = buildGoogleWorkspaceGraph(
        normalized.map((n) => n.data as never)
      );
      expect(graph.nodes.length).toBeGreaterThan(0);
      expect(GOOGLE_WORKSPACE_KG_KINDS).toContain("Person");
      expect(GOOGLE_WORKSPACE_KG_KINDS).toContain("Meeting");
      expect(GOOGLE_WORKSPACE_KG_KINDS).toContain("Communication");
      expect(GOOGLE_WORKSPACE_KG_KINDS).toContain("Email");
      expect(GOOGLE_WORKSPACE_KG_KINDS).toContain("Conversation");
      expect(GOOGLE_WORKSPACE_KG_KINDS).toContain("Attachment");
      expect(GOOGLE_WORKSPACE_KG_KINDS).toContain("CalendarEvent");
      expect(GOOGLE_WORKSPACE_KG_KINDS).toContain("Attendee");
      expect(GOOGLE_WORKSPACE_KG_KINDS).toContain("Room");
      expect(GOOGLE_WORKSPACE_KG_KINDS).toContain("Resource");
      expect(GOOGLE_WORKSPACE_KG_KINDS).toContain("Folder");
      expect(GOOGLE_WORKSPACE_KG_KINDS).toContain("Owner");
      expect(GOOGLE_WORKSPACE_KG_KINDS).toContain("Permission");
      expect(GOOGLE_WORKSPACE_KG_KINDS).toContain("Revision");
      expect(graph.nodes.some((n) => n.entityType === "Meeting" || n.entityType === "Communication")).toBe(
        true
      );
    });
  });

  describe("ECC widgets", () => {
    it("builds Recent Meetings, Calendar Summary, Communication Pulse, Shared Documents, Collaboration Activity, Executive Narratives", async () => {
      const platform = createIntegrationPlatformCore();
      registerGoogleWorkspacePlatformConnector(platform);
      platform.lifecycle.seed("google-ecc-1", "connected");
      await platform.syncNow("google", "google-ecc-1", "full");

      const widgets = buildGoogleWorkspaceEccWidgets("org-google-demo");
      expect(widgets).toBeTruthy();
      expect(widgets!.recentMeetings.kind).toBe("recent_meetings");
      expect(widgets!.calendarSummary.kind).toBe("calendar_summary");
      expect(widgets!.communicationPulse.kind).toBe("communication_pulse");
      expect(widgets!.sharedDocuments.kind).toBe("shared_documents");
      expect(widgets!.collaborationActivity.kind).toBe("collaboration_activity");
      expect(widgets!.executiveNarratives.kind).toBe("executive_narratives");
      expect(widgets!.recentMeetings.meetings.length).toBeGreaterThan(0);
      expect(widgets!.executiveNarratives.narratives.length).toBeGreaterThan(0);
    });
  });

  describe("OIOS registration", () => {
    it("registers Google Workspace on Integration Platform Core via OIOS", () => {
      const oios = createOiosOperatingSystem({ wireOrganizationDna: false });
      expect(oios.integrations?.registry.has("google")).toBe(true);
      expect(oios.integrations?.registry.getVersion("google")).toBe("1.1.0");
      expect(oios.integrationsDescriptor.intelligenceDag).toBe(false);
    });
  });
});
