import { describe, expect, it } from "vitest";
import {
  createIntegrationManagement,
  createIntegrationPlatform,
  registerAllConnectors,
  plaidStore,
  getPlaidFeed,
  plaidMetadata,
  plaidLinkConfig,
  createDemoPlaidClient,
  normalizePlaidRecords,
  toPlaidSyncRecords,
  reconcilePlaidCash,
  squareStore,
  quickbooksStore,
} from "@/lib/platform/integrations";
import type { ConnectorConfiguration } from "@/lib/platform/integrations/common/types";

describe("Plaid production connector (D4) — auth", () => {
  it("registers as a non-placeholder production connector", () => {
    const platform = registerAllConnectors(createIntegrationPlatform());
    const connector = platform.getConnector("plaid");
    expect(connector).toBeTruthy();
    expect(connector!.metadata.placeholder).toBe(false);
    expect(connector!.metadata.version).toBe(plaidMetadata.version);
    expect(connector!.metadata.objectTypes).toContain("account");
    expect(connector!.metadata.objectTypes).toContain("transaction");
    expect(connector!.metadata.objectTypes).toContain("liability");
    expect(connector!.metadata.objectTypes).toContain("holding");
    expect(connector!.metadata.authMethods).toContain("oauth2");
  });

  it("exposes Plaid Link config for sandbox / development / production", () => {
    const sandbox = plaidLinkConfig("sandbox", {
      clientId: "plaid-demo",
      redirectUri: "https://jag.local/oauth/plaid",
    });
    const development = plaidLinkConfig("development", {
      clientId: "plaid-demo",
      redirectUri: "https://jag.local/oauth/plaid",
    });
    const production = plaidLinkConfig("production", {
      clientId: "plaid-demo",
      redirectUri: "https://jag.local/oauth/plaid",
    });
    expect(sandbox.authorizationUrl).toContain("sandbox.plaid.com");
    expect(development.authorizationUrl).toContain("development.plaid.com");
    expect(production.authorizationUrl).toContain("production.plaid.com");
    expect(sandbox.scopes).toContain("transactions");
  });

  it("authenticates via Link token, institution list, and token refresh", async () => {
    const client = createDemoPlaidClient();
    const link = await client.createLinkToken({
      environment: "sandbox",
      clientUserId: "org-1",
    });
    expect(link.ok).toBe(true);
    expect(link.linkToken).toBeTruthy();

    const exchanged = await client.exchangePublicToken("public-sandbox-demo");
    expect(exchanged.ok).toBe(true);
    expect(exchanged.accessToken).toBeTruthy();

    const auth = await client.authenticate({
      accessToken: exchanged.accessToken!,
      environment: "sandbox",
    });
    expect(auth.ok).toBe(true);
    expect(auth.session?.institutionId).toBeTruthy();

    const institutions = await client.listInstitutions(exchanged.accessToken!);
    expect(institutions.length).toBeGreaterThan(0);

    const refreshed = await client.refreshToken(auth.session!.refreshToken);
    expect(refreshed.ok).toBe(true);

    const bad = await client.authenticate({ accessToken: "invalid" });
    expect(bad.ok).toBe(false);
  });

  it("handles refresh and public token errors", async () => {
    const client = createDemoPlaidClient();
    expect((await client.refreshToken("invalid")).ok).toBe(false);
    expect((await client.exchangePublicToken("invalid")).ok).toBe(false);
  });
});

describe("Plaid production connector (D4) — normalize & mapping", () => {
  it("normalizes records with required lineage fields", () => {
    const raw = [
      {
        id: "acc-1",
        objectType: "account",
        updatedAt: "2026-07-13T00:00:00.000Z",
        version: 2,
        organizationId: "org-1",
        institutionId: "ins-1",
        accountId: "acc-1",
        payload: { name: "Checking", subtype: "checking" },
      },
    ];
    const sync = toPlaidSyncRecords(raw);
    const config = {
      connectorId: "plaid",
      instanceId: "plaid-org-1",
      scope: { organizationId: "org-1", schoolId: null },
      authMethod: "oauth2",
      enabled: true,
      status: "connected",
      settings: { institutionId: "ins-1" },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as unknown as ConnectorConfiguration;
    const normalized = normalizePlaidRecords(sync, config);
    const data = normalized[0]!.data as {
      id: string;
      externalId: string;
      organizationId: string;
      sourceSystem: string;
      syncedAt: string;
      version: number;
      institutionId: string | null;
      accountId: string | null;
    };
    expect(data.id).toMatch(/^jag_account_/);
    expect(data.externalId).toBe("acc-1");
    expect(data.organizationId).toBe("org-1");
    expect(data.sourceSystem).toBe("plaid");
    expect(data.syncedAt).toBeTruthy();
    expect(data.version).toBe(2);
    expect(data.institutionId).toBe("ins-1");
    expect(data.accountId).toBe("acc-1");
  });
});

describe("Plaid production connector (D4) — sync, balances, pagination", () => {
  it("synchronizes banking entities with pagination into normalized cache", async () => {
    plaidStore.clear();
    const mgmt = createIntegrationManagement(registerAllConnectors(createIntegrationPlatform()));
    const { config, sync } = await mgmt.connections.bootstrap({
      connectorId: "plaid",
      scope: { organizationId: "exec-demo-org", schoolId: null },
      actor: "test",
    });

    expect(sync.status === "succeeded" || sync.status === "partial").toBe(true);
    expect(sync.recordsAccepted).toBeGreaterThan(15);

    const snapshot = plaidStore.get(config.scope.organizationId);
    expect(snapshot).toBeTruthy();
    expect(snapshot!.byType.account?.length).toBeGreaterThan(0);
    expect(snapshot!.byType.transaction?.length).toBeGreaterThan(0);
    expect(snapshot!.byType.balance?.length).toBeGreaterThan(0);
    expect(snapshot!.monitoring.lastSyncAt).toBeTruthy();
    expect(snapshot!.monitoring.apiLatencyMs).toBeGreaterThan(0);
    expect(snapshot!.monitoring.transactionsImported).toBeGreaterThan(0);
  });

  it("paginates list results from the demo client", async () => {
    const client = createDemoPlaidClient();
    await client.authenticate({ accessToken: "tok", institutionId: "ins-chase-demo" });
    const page1 = await client.list("exec-demo-org", "transaction", null, null);
    expect(page1.records.length).toBeGreaterThan(0);
    expect(page1.nextCursor === null || typeof page1.nextCursor === "string").toBe(true);
  });

  it("builds treasury intelligence feed with balances and cash metrics", async () => {
    plaidStore.clear();
    const mgmt = createIntegrationManagement(registerAllConnectors(createIntegrationPlatform()));
    await mgmt.connections.bootstrap({
      connectorId: "plaid",
      scope: { organizationId: "exec-demo-org" },
    });

    const feed = getPlaidFeed("exec-demo-org");
    expect(feed?.live).toBe(true);
    expect(feed?.sourceSystem).toBe("plaid");
    expect(feed?.cash.available).toBeGreaterThan(0);
    expect(feed?.cash.current).toBeGreaterThan(0);
    expect(feed?.bankBalances.length).toBeGreaterThan(0);
    expect(feed?.softLights.financial.financialScore.value).toBeGreaterThan(0);
    expect(feed?.softLights.resilience.resilienceScore.value).toBeGreaterThan(0);
    expect(feed?.briefBullets.length).toBeGreaterThan(0);
  });

  it("supports incremental sync and reconnect after disconnect", async () => {
    plaidStore.clear();
    const mgmt = createIntegrationManagement(registerAllConnectors(createIntegrationPlatform()));
    const { config } = await mgmt.connections.bootstrap({
      connectorId: "plaid",
      scope: { organizationId: "exec-demo-org" },
    });

    const incremental = await mgmt.connections.incrementalSync(config.instanceId);
    expect(incremental.mode).toBe("incremental");

    await mgmt.connections.disconnect(config.instanceId);
    expect(plaidStore.hasLiveData("exec-demo-org")).toBe(false);

    await mgmt.connections.resume(config.instanceId, "test");
    await mgmt.connections.authenticate(config.instanceId, "test");
    const resync = await mgmt.connections.initialSync(config.instanceId);
    expect(resync.recordsAccepted).toBeGreaterThan(0);
  });
});

describe("Plaid production connector (D4) — reconciliation", () => {
  it("surfaces cash discrepancies when Plaid + Square + QuickBooks are synced", async () => {
    plaidStore.clear();
    squareStore.clear();
    quickbooksStore.clear();
    const mgmt = createIntegrationManagement(registerAllConnectors(createIntegrationPlatform()));
    await mgmt.connections.bootstrap({
      connectorId: "plaid",
      scope: { organizationId: "exec-demo-org" },
    });
    await mgmt.connections.bootstrap({
      connectorId: "square",
      scope: { organizationId: "exec-demo-org" },
    });
    await mgmt.connections.bootstrap({
      connectorId: "quickbooks",
      scope: { organizationId: "exec-demo-org" },
    });

    const recon = reconcilePlaidCash("exec-demo-org");
    expect(recon.multiSystem).toBe(true);
    expect(recon.systemsConnected.plaid).toBe(true);
    expect(recon.systemsConnected.square).toBe(true);
    expect(recon.systemsConnected.quickbooks).toBe(true);
    expect(recon.discrepancies.length).toBeGreaterThan(0);
    expect(recon.discrepancies.some((d) => d.kind === "square_deposit_to_bank")).toBe(true);
    expect(recon.discrepancies.some((d) => d.kind === "quickbooks_cash_to_bank")).toBe(true);
    expect(recon.discrepancies.some((d) => d.kind === "duplicate_deposit")).toBe(true);
    expect(recon.riskPressure).toBeGreaterThan(0);
  });

  it("returns empty discrepancies without multi-system data", () => {
    plaidStore.clear();
    squareStore.clear();
    quickbooksStore.clear();
    const recon = reconcilePlaidCash("exec-demo-org");
    expect(recon.multiSystem).toBe(false);
    expect(recon.discrepancies).toEqual([]);
  });
});
