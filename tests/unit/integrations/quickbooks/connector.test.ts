import { describe, expect, it } from "vitest";
import {
  createIntegrationManagement,
  createIntegrationPlatform,
  registerAllConnectors,
  quickbooksStore,
  getQuickBooksFeed,
  quickbooksMetadata,
  quickbooksOAuthConfig,
  createDemoQuickBooksClient,
  normalizeQuickBooksRecords,
  toSyncRecords,
} from "@/lib/platform/integrations";
import type { ConnectorConfiguration } from "@/lib/platform/integrations/common/types";

describe("QuickBooks Online production connector (D2)", () => {
  it("registers as a non-placeholder production connector", () => {
    const platform = registerAllConnectors(createIntegrationPlatform());
    const connector = platform.getConnector("quickbooks");
    expect(connector).toBeTruthy();
    expect(connector!.metadata.placeholder).toBe(false);
    expect(connector!.metadata.version).toBe(quickbooksMetadata.version);
    expect(connector!.metadata.objectTypes).toContain("account");
    expect(connector!.metadata.objectTypes).toContain("invoice");
    expect(connector!.metadata.objectTypes).toContain("journal_entry");
    expect(connector!.metadata.objectTypes).toContain("budget");
    expect(connector!.metadata.authMethods).toContain("oauth2");
  });

  it("exposes sandbox and production OAuth config", () => {
    const sandbox = quickbooksOAuthConfig("sandbox", {
      clientId: "qb-demo",
      redirectUri: "https://jag.local/oauth/quickbooks",
    });
    expect(sandbox.tokenUrl).toContain("oauth.platform.intuit.com");
    expect(sandbox.scopes).toContain("com.intuit.quickbooks.accounting");
  });

  it("authenticates, lists companies, and refreshes tokens", async () => {
    const client = createDemoQuickBooksClient();
    const auth = await client.authenticate({
      accessToken: "qb-token",
      environment: "sandbox",
    });
    expect(auth.ok).toBe(true);
    expect(auth.session?.companyId).toBeTruthy();

    const companies = await client.listCompanies("qb-token");
    expect(companies.length).toBeGreaterThan(0);

    const refreshed = await client.refreshToken(auth.session!.refreshToken);
    expect(refreshed.ok).toBe(true);
    expect(refreshed.accessToken).toBeTruthy();

    const bad = await client.authenticate({ accessToken: "invalid" });
    expect(bad.ok).toBe(false);
  });

  it("normalizes records with required lineage fields", () => {
    const raw = [
      {
        id: "acc-1",
        objectType: "account",
        updatedAt: "2026-07-13T00:00:00.000Z",
        version: 2,
        organizationId: "org-1",
        companyId: "co-1",
        payload: { name: "Cash", balance: 100 },
      },
    ];
    const sync = toSyncRecords(raw);
    const config = {
      connectorId: "quickbooks",
      instanceId: "quickbooks-org-1",
      scope: { organizationId: "org-1", schoolId: null },
      authMethod: "oauth2",
      enabled: true,
      status: "connected",
      settings: { companyId: "co-1" },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as unknown as ConnectorConfiguration;
    const normalized = normalizeQuickBooksRecords(sync, config);

    const data = normalized[0]!.data as {
      id: string;
      externalId: string;
      organizationId: string;
      sourceSystem: string;
      syncedAt: string;
      version: number;
      companyId: string;
    };
    expect(data.id).toMatch(/^jag_account_/);
    expect(data.externalId).toBe("acc-1");
    expect(data.organizationId).toBe("org-1");
    expect(data.sourceSystem).toBe("quickbooks");
    expect(data.syncedAt).toBeTruthy();
    expect(data.version).toBe(2);
    expect(data.companyId).toBe("co-1");
  });

  it("synchronizes entities with pagination into normalized cache", async () => {
    quickbooksStore.clear();
    const mgmt = createIntegrationManagement(registerAllConnectors(createIntegrationPlatform()));
    const { config, sync } = await mgmt.connections.bootstrap({
      connectorId: "quickbooks",
      scope: { organizationId: "exec-demo-org", schoolId: null },
      actor: "test",
    });

    expect(sync.status === "succeeded" || sync.status === "partial").toBe(true);
    expect(sync.recordsAccepted).toBeGreaterThan(15);

    const snapshot = quickbooksStore.get(config.scope.organizationId);
    expect(snapshot).toBeTruthy();
    expect(snapshot!.byType.account?.length).toBeGreaterThan(0);
    expect(snapshot!.byType.invoice?.length).toBeGreaterThan(0);
    expect(snapshot!.monitoring.lastSyncAt).toBeTruthy();
    expect(snapshot!.monitoring.apiLatencyMs).toBeGreaterThan(0);
  });

  it("supports incremental sync and reconnect after disconnect", async () => {
    quickbooksStore.clear();
    const mgmt = createIntegrationManagement(registerAllConnectors(createIntegrationPlatform()));
    const { config } = await mgmt.connections.bootstrap({
      connectorId: "quickbooks",
      scope: { organizationId: "exec-demo-org" },
    });

    const incremental = await mgmt.connections.incrementalSync(config.instanceId);
    expect(incremental.mode).toBe("incremental");

    await mgmt.connections.disconnect(config.instanceId);
    expect(quickbooksStore.hasLiveData("exec-demo-org")).toBe(false);

    // Re-enable via resume (disconnect marks disabled)
    await mgmt.connections.resume(config.instanceId, "test");
    await mgmt.connections.authenticate(config.instanceId, "test");
    const resync = await mgmt.connections.initialSync(config.instanceId);
    expect(resync.recordsAccepted).toBeGreaterThan(0);
  });

  it("builds intelligence feed soft lights without new domains", async () => {
    quickbooksStore.clear();
    const mgmt = createIntegrationManagement(registerAllConnectors(createIntegrationPlatform()));
    await mgmt.connections.bootstrap({
      connectorId: "quickbooks",
      scope: { organizationId: "exec-demo-org" },
    });

    const feed = getQuickBooksFeed("exec-demo-org");
    expect(feed?.live).toBe(true);
    expect(feed?.sourceSystem).toBe("quickbooks");
    expect(feed?.financial.cash).toBeGreaterThan(0);
    expect(feed?.softLights.financial.financialScore.value).toBeGreaterThan(0);
    expect(feed?.softLights.systems.systemsScore.value).toBeGreaterThan(0);
    expect(feed?.softLights.resilience.resilienceScore.value).toBeGreaterThan(0);
    expect(feed?.briefBullets.length).toBeGreaterThan(0);
  });

  it("paginates list results from the demo client", async () => {
    const client = createDemoQuickBooksClient();
    await client.authenticate({ accessToken: "tok", companyId: "qb-company-demo" });
    const page1 = await client.list("exec-demo-org", "account", null, null);
    expect(page1.records.length).toBeGreaterThan(0);
    expect(page1.nextCursor === null || typeof page1.nextCursor === "string").toBe(true);
  });

  it("handles auth and refresh errors", async () => {
    const client = createDemoQuickBooksClient();
    const badRefresh = await client.refreshToken("invalid");
    expect(badRefresh.ok).toBe(false);
  });
});
