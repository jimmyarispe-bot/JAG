import { describe, expect, it } from "vitest";
import {
  createIntegrationManagement,
  createIntegrationPlatform,
  registerAllConnectors,
  googleWorkspaceStore,
  getGoogleWorkspaceFeed,
  googleWorkspaceMetadata,
  googleWorkspaceOAuthConfig,
  createDemoGoogleWorkspaceClient,
  normalizeGoogleWorkspaceRecords,
  toGoogleWorkspaceSyncRecords,
  scrubPayloadForPrivacy,
  correlateGoogleWorkspace,
  academyOsStore,
  squareStore,
  quickbooksStore,
  plaidStore,
} from "@/lib/platform/integrations";
import type { ConnectorConfiguration } from "@/lib/platform/integrations/common/types";

describe("Google Workspace production connector (D5) — OAuth", () => {
  it("registers as a non-placeholder production connector", () => {
    const platform = registerAllConnectors(createIntegrationPlatform());
    const connector = platform.getConnector("google");
    expect(connector).toBeTruthy();
    expect(connector!.metadata.placeholder).toBe(false);
    expect(connector!.metadata.version).toBe(googleWorkspaceMetadata.version);
    expect(connector!.metadata.objectTypes).toContain("message");
    expect(connector!.metadata.objectTypes).toContain("calendar_event");
    expect(connector!.metadata.objectTypes).toContain("drive_file");
    expect(connector!.metadata.authMethods).toContain("oauth2");
  });

  it("exposes OAuth config with Workspace metadata scopes", () => {
    const oauth = googleWorkspaceOAuthConfig({
      clientId: "google-demo",
      redirectUri: "https://jag.local/oauth/google",
      adminConsent: true,
    });
    expect(oauth.authorizationUrl).toContain("accounts.google.com");
    expect(oauth.tokenUrl).toContain("oauth2.googleapis.com");
    expect(oauth.scopes.some((s) => s.includes("gmail.metadata"))).toBe(true);
    expect(oauth.scopes.some((s) => s.includes("calendar"))).toBe(true);
  });

  it("authenticates, lists domains, and refreshes tokens", async () => {
    const client = createDemoGoogleWorkspaceClient();
    const auth = await client.authenticate({
      accessToken: "google-token",
      consentType: "admin",
      domain: "jag-demo.edu",
    });
    expect(auth.ok).toBe(true);
    expect(auth.session?.domain).toBe("jag-demo.edu");

    const domains = await client.listDomains("google-token");
    expect(domains.length).toBeGreaterThan(0);

    const refreshed = await client.refreshToken(auth.session!.refreshToken);
    expect(refreshed.ok).toBe(true);

    expect((await client.authenticate({ accessToken: "invalid" })).ok).toBe(false);
    expect((await client.refreshToken("invalid")).ok).toBe(false);
  });
});

describe("Google Workspace production connector (D5) — mapping & privacy", () => {
  it("normalizes records with required lineage fields and source google-workspace", () => {
    const raw = [
      {
        id: "msg-1",
        objectType: "message",
        updatedAt: "2026-07-13T00:00:00.000Z",
        version: 2,
        organizationId: "org-1",
        workspaceDomain: "jag-demo.edu",
        userId: "user-1",
        payload: { subject: "Hello", body: "SECRET BODY" },
      },
    ];
    const sync = toGoogleWorkspaceSyncRecords(raw);
    const config = {
      connectorId: "google",
      instanceId: "google-org-1",
      scope: { organizationId: "org-1", schoolId: null },
      authMethod: "oauth2",
      enabled: true,
      status: "connected",
      settings: { domain: "jag-demo.edu", storeEmailBodies: false },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as unknown as ConnectorConfiguration;
    const normalized = normalizeGoogleWorkspaceRecords(sync, config);
    const data = normalized[0]!.data as {
      id: string;
      externalId: string;
      organizationId: string;
      sourceSystem: string;
      syncedAt: string;
      version: number;
      workspaceDomain: string;
      userId: string | null;
      attributes: Record<string, unknown>;
    };
    expect(data.id).toMatch(/^jag_message_/);
    expect(data.externalId).toBe("msg-1");
    expect(data.sourceSystem).toBe("google-workspace");
    expect(data.workspaceDomain).toBe("jag-demo.edu");
    expect(data.userId).toBe("user-1");
    expect(data.attributes.body).toBeUndefined();
  });

  it("scrubs email bodies and document contents by default", () => {
    const scrubbedMsg = scrubPayloadForPrivacy(
      "message",
      { subject: "Hi", body: "secret", bodyHtml: "<p>x</p>" },
      { storeEmailBodies: false, storeDocumentContents: false }
    );
    expect(scrubbedMsg.body).toBeUndefined();
    expect(scrubbedMsg.subject).toBe("Hi");

    const scrubbedDoc = scrubPayloadForPrivacy(
      "doc",
      { name: "Doc", content: "full text" },
      { storeEmailBodies: false, storeDocumentContents: false }
    );
    expect(scrubbedDoc.content).toBeUndefined();
  });
});

describe("Google Workspace production connector (D5) — sync, calendar, gmail, drive", () => {
  it("synchronizes productivity metadata with pagination", async () => {
    googleWorkspaceStore.clear();
    const mgmt = createIntegrationManagement(registerAllConnectors(createIntegrationPlatform()));
    const { config, sync } = await mgmt.connections.bootstrap({
      connectorId: "google",
      scope: { organizationId: "exec-demo-org", schoolId: null },
      actor: "test",
    });

    expect(sync.status === "succeeded" || sync.status === "partial").toBe(true);
    expect(sync.recordsAccepted).toBeGreaterThan(15);

    const snapshot = googleWorkspaceStore.get(config.scope.organizationId);
    expect(snapshot!.byType.message?.length).toBeGreaterThan(0);
    expect(snapshot!.byType.calendar_event?.length).toBeGreaterThan(0);
    expect(snapshot!.byType.drive_file?.length).toBeGreaterThan(0);
    expect(snapshot!.monitoring.apiLatencyMs).toBeGreaterThan(0);

    // Privacy: no bodies in stored message attributes
    for (const msg of snapshot!.byType.message ?? []) {
      expect(msg.attributes.body).toBeUndefined();
      expect(msg.sourceSystem).toBe("google-workspace");
    }
  });

  it("paginates list results from the demo client", async () => {
    const client = createDemoGoogleWorkspaceClient();
    await client.authenticate({ accessToken: "tok", domain: "jag-demo.edu" });
    const page1 = await client.list("exec-demo-org", "message", null, null);
    expect(page1.records.length).toBeGreaterThan(0);
    expect(page1.nextCursor === null || typeof page1.nextCursor === "string").toBe(true);
  });

  it("builds collaboration feed soft lights without new domains", async () => {
    googleWorkspaceStore.clear();
    const mgmt = createIntegrationManagement(registerAllConnectors(createIntegrationPlatform()));
    await mgmt.connections.bootstrap({
      connectorId: "google",
      scope: { organizationId: "exec-demo-org" },
    });

    const feed = getGoogleWorkspaceFeed("exec-demo-org");
    expect(feed?.live).toBe(true);
    expect(feed?.sourceSystem).toBe("google-workspace");
    expect(feed?.privacy.metadataOnly).toBe(true);
    expect(feed?.executiveCalendar.length).toBeGreaterThan(0);
    expect(feed?.collaboration.meetingLoadMinutes7d).toBeGreaterThan(0);
    expect(feed?.softLights.operations.operationsScore.value).toBeGreaterThan(0);
  });

  it("supports reconnect after disconnect", async () => {
    googleWorkspaceStore.clear();
    const mgmt = createIntegrationManagement(registerAllConnectors(createIntegrationPlatform()));
    const { config } = await mgmt.connections.bootstrap({
      connectorId: "google",
      scope: { organizationId: "exec-demo-org" },
    });

    await mgmt.connections.disconnect(config.instanceId);
    expect(googleWorkspaceStore.hasLiveData("exec-demo-org")).toBe(false);

    await mgmt.connections.resume(config.instanceId, "test");
    await mgmt.connections.authenticate(config.instanceId, "test");
    const resync = await mgmt.connections.initialSync(config.instanceId);
    expect(resync.recordsAccepted).toBeGreaterThan(0);
  });
});

describe("Google Workspace production connector (D5) — correlation", () => {
  it("correlates calendar/tasks with AcademyOS, QB, Square, and Plaid when synced", async () => {
    googleWorkspaceStore.clear();
    academyOsStore.clear();
    squareStore.clear();
    quickbooksStore.clear();
    plaidStore.clear();

    const mgmt = createIntegrationManagement(registerAllConnectors(createIntegrationPlatform()));
    await mgmt.connections.bootstrap({
      connectorId: "google",
      scope: { organizationId: "exec-demo-org" },
    });
    await mgmt.connections.bootstrap({
      connectorId: "academyos",
      scope: { organizationId: "exec-demo-org" },
    });
    await mgmt.connections.bootstrap({
      connectorId: "quickbooks",
      scope: { organizationId: "exec-demo-org" },
    });
    await mgmt.connections.bootstrap({
      connectorId: "square",
      scope: { organizationId: "exec-demo-org" },
    });
    await mgmt.connections.bootstrap({
      connectorId: "plaid",
      scope: { organizationId: "exec-demo-org" },
    });

    const corr = correlateGoogleWorkspace("exec-demo-org");
    expect(corr.googleConnected).toBe(true);
    expect(corr.links.length).toBeGreaterThan(0);
    expect(corr.links.some((l) => l.kind === "budget_meeting_qb_variance")).toBe(true);
    expect(corr.links.some((l) => l.kind === "grant_deadline_plaid_cash")).toBe(true);
    expect(corr.links.some((l) => l.kind === "board_meeting_exec_brief")).toBe(true);
    expect(corr.links.some((l) => l.kind === "school_calendar_academyos")).toBe(true);
  });
});
