import { describe, expect, it } from "vitest";
import {
  createIntegrationPlatformCore,
  createMicrosoft365PlatformConnector,
  registerMicrosoft365PlatformConnector,
  registerGoogleWorkspacePlatformConnector,
  reconnectMicrosoft365,
  createDemoMicrosoft365Client,
  microsoft365OAuthConfig,
  buildMicrosoft365AuthorizeUrl,
  normalizeMicrosoft365Records,
  toMicrosoft365SyncRecords,
  scrubMicrosoft365PayloadForPrivacy,
  buildMicrosoft365Graph,
  buildUnifiedCommunicationDashboard,
  MICROSOFT_365_OBJECT_TYPES,
  MICROSOFT_365_KG_KINDS,
  googleWorkspaceCanonicalType,
  microsoft365CanonicalType,
  registerAllConnectors,
  createIntegrationPlatform,
  microsoft365Metadata,
} from "@/lib/platform/integrations";
import type { ConnectorConfiguration } from "@/lib/platform/integrations/common/types";
import { createOiosOperatingSystem } from "@/lib/platform/oios";

describe("Sprint 075 — Microsoft 365 PlatformConnector", () => {
  describe("catalog & OAuth", () => {
    it("registers as a non-placeholder production connector", () => {
      const platform = registerAllConnectors(createIntegrationPlatform());
      const connector = platform.getConnector("microsoft");
      expect(connector).toBeTruthy();
      expect(connector!.metadata.placeholder).toBe(false);
      expect(connector!.metadata.version).toBe(microsoft365Metadata.version);
      expect(connector!.metadata.objectTypes).toContain("message");
      expect(connector!.metadata.objectTypes).toContain("chat");
      expect(connector!.metadata.objectTypes).toContain("team");
    });

    it("builds Entra ID authorize URL via Sprint 073 OAuth helpers", () => {
      const oauth = microsoft365OAuthConfig({
        clientId: "ms-demo",
        redirectUri: "https://jag.local/oauth/microsoft",
        tenant: "common",
      });
      const url = buildMicrosoft365AuthorizeUrl(oauth);
      expect(url).toContain("login.microsoftonline.com");
      expect(url).toContain("client_id=ms-demo");
      expect(oauth.scopes.some((s) => s.includes("Mail.Read"))).toBe(true);
      expect(oauth.scopes.some((s) => s.includes("Calendars.Read"))).toBe(true);
    });

    it("installs, refreshes, disconnects, and reconnects", async () => {
      const connector = createMicrosoft365PlatformConnector({
        client: createDemoMicrosoft365Client(),
      });
      const auth = await connector.authenticate("microsoft-org-1");
      expect(auth.ok).toBe(true);
      const refreshed = await connector.refreshAuthentication("microsoft-org-1");
      expect(refreshed.ok).toBe(true);
      await connector.disconnect("microsoft-org-1");
      expect((await connector.validate("microsoft-org-1")).ok).toBe(false);
      expect((await reconnectMicrosoft365(connector, "microsoft-org-1")).ok).toBe(true);
    });
  });

  describe("canonical parity with Google", () => {
    it("maps mail/calendar/files/meetings into the same canonical types as Google", () => {
      expect(microsoft365CanonicalType("message")).toBe(googleWorkspaceCanonicalType("message"));
      expect(microsoft365CanonicalType("calendar_event")).toBe(
        googleWorkspaceCanonicalType("calendar_event")
      );
      expect(microsoft365CanonicalType("meet")).toBe(googleWorkspaceCanonicalType("meet"));
      expect(microsoft365CanonicalType("onedrive_file")).toBe(
        googleWorkspaceCanonicalType("drive_file")
      );
      expect(microsoft365CanonicalType("chat")).toBe("comms.message");
      expect(MICROSOFT_365_KG_KINDS).toEqual([
        "Person",
        "Meeting",
        "Communication",
        "Document",
        "Task",
        "Organization",
      ]);
    });

    it("builds provider-neutral KG Meeting nodes", () => {
      const sync = toMicrosoft365SyncRecords([
        {
          id: "meet-1",
          objectType: "meet",
          updatedAt: "2026-07-13T00:00:00.000Z",
          version: 1,
          organizationId: "org-1",
          tenantDomain: "jag-demo.onmicrosoft.com",
          userId: "u1",
          payload: {
            name: "Budget review",
            participants: ["a@b.c"],
            durationMinutes: 30,
            startedAt: "2026-07-12T14:00:00.000Z",
            endedAt: "2026-07-12T14:30:00.000Z",
          },
        },
      ]);
      const config = {
        connectorId: "microsoft",
        instanceId: "microsoft-org-1",
        scope: { organizationId: "org-1", schoolId: null },
        authMethod: "oauth2",
        enabled: true,
        settings: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as unknown as ConnectorConfiguration;
      const normalized = normalizeMicrosoft365Records(sync, config);
      const graph = buildMicrosoft365Graph(normalized.map((n) => n.data as never));
      expect(graph.nodes[0]?.entityType).toBe("Meeting");
      expect(graph.nodes[0]?.nodeId.startsWith("prod:Meeting:")).toBe(true);
    });
  });

  describe("sync & events", () => {
    it("runs full sync across Outlook/Calendar/OneDrive/SharePoint/Teams/People/Groups", async () => {
      const platform = createIntegrationPlatformCore();
      registerMicrosoft365PlatformConnector(platform);
      platform.lifecycle.seed("microsoft-org-demo", "connected");

      const result = await platform.syncNow("microsoft", "microsoft-org-demo", "full");
      expect(result.status).toBe("succeeded");
      expect(result.recordsFetched).toBeGreaterThan(10);
      expect(MICROSOFT_365_OBJECT_TYPES).toContain("chat");
      expect(MICROSOFT_365_OBJECT_TYPES).toContain("team");

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
    });

    it("runs incremental sync", async () => {
      const platform = createIntegrationPlatformCore();
      registerMicrosoft365PlatformConnector(platform);
      platform.lifecycle.seed("microsoft-inc-1", "connected");
      const full = await platform.syncNow("microsoft", "microsoft-inc-1", "full");
      const incremental = await platform.sync.run(platform.registry.require("microsoft"), {
        connectorId: "microsoft",
        instanceId: "microsoft-inc-1",
        mode: "incremental",
        since: "2026-07-13T00:00:00.000Z",
        cursor: full.cursor,
        triggeredBy: "manual",
      });
      expect(incremental.status).toBe("succeeded");
    });
  });

  describe("privacy", () => {
    it("never retains mail or chat bodies by default", () => {
      const scrubbed = scrubMicrosoft365PayloadForPrivacy(
        "message",
        { subject: "Hi", body: "SECRET" },
        { storeEmailBodies: false, storeDocumentContents: false, storeChatBodies: false }
      );
      expect(scrubbed.body).toBeUndefined();
      const chat = scrubMicrosoft365PayloadForPrivacy(
        "chat",
        { topic: "Hi", body: "SECRET CHAT" },
        { storeEmailBodies: false, storeDocumentContents: false, storeChatBodies: false }
      );
      expect(chat.body).toBeUndefined();
    });
  });

  describe("Unified Communication Dashboard", () => {
    it("merges Google + Microsoft into provider-neutral meetings/comms", async () => {
      const platform = createIntegrationPlatformCore();
      registerGoogleWorkspacePlatformConnector(platform);
      registerMicrosoft365PlatformConnector(platform);
      platform.lifecycle.seed("google-ecc-1", "connected");
      platform.lifecycle.seed("microsoft-ecc-1", "connected");
      await platform.syncNow("google", "google-ecc-1", "full");
      await platform.syncNow("microsoft", "microsoft-ecc-1", "full");

      const dash = buildUnifiedCommunicationDashboard("exec-demo-org");
      expect(dash).toBeTruthy();
      expect(dash!.kind).toBe("unified_communication_dashboard");
      expect(dash!.providersConnected).toContain("google-workspace");
      expect(dash!.providersConnected).toContain("microsoft-365");
      expect(dash!.recentMeetings.length).toBeGreaterThan(0);
      expect(dash!.recentMeetings.every((m) => m.kind === "Meeting")).toBe(true);
      expect(dash!.recentCommunications.every((c) => c.kind === "Communication")).toBe(true);
      // Copilot-facing cards must not require consumers to branch on provider.
      expect(dash!.calendar.every((c) => c.kind === "Meeting")).toBe(true);
    });
  });

  describe("OIOS registration", () => {
    it("registers Microsoft 365 on Integration Platform Core via OIOS", () => {
      const oios = createOiosOperatingSystem({ wireOrganizationDna: false });
      expect(oios.integrations?.registry.has("microsoft")).toBe(true);
      expect(oios.integrations?.registry.getVersion("microsoft")).toBe("1.0.0");
    });
  });
});
