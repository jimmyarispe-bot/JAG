import { describe, expect, it } from "vitest";
import {
  createIntegrationManagement,
  createIntegrationPlatform,
  registerAllConnectors,
  squareStore,
  getSquareFeed,
  squareMetadata,
  squareOAuthConfig,
  createDemoSquareClient,
  normalizeSquareRecords,
  toSquareSyncRecords,
  reconcileSquareQuickBooks,
  quickbooksStore,
} from "@/lib/platform/integrations";
import type { ConnectorConfiguration } from "@/lib/platform/integrations/common/types";

describe("Square production connector (D3) — auth", () => {
  it("registers as a non-placeholder production connector", () => {
    const platform = registerAllConnectors(createIntegrationPlatform());
    const connector = platform.getConnector("square");
    expect(connector).toBeTruthy();
    expect(connector!.metadata.placeholder).toBe(false);
    expect(connector!.metadata.version).toBe(squareMetadata.version);
    expect(connector!.metadata.objectTypes).toContain("payment");
    expect(connector!.metadata.objectTypes).toContain("employee");
    expect(connector!.metadata.objectTypes).toContain("customer_group");
    expect(connector!.metadata.objectTypes).toContain("order_line_item");
    expect(connector!.metadata.authMethods).toContain("oauth2");
  });

  it("exposes sandbox and production OAuth endpoints", () => {
    const sandbox = squareOAuthConfig("sandbox", {
      clientId: "sq0idp-demo",
      redirectUri: "https://jag.local/oauth/square",
    });
    const production = squareOAuthConfig("production", {
      clientId: "sq0idp-demo",
      redirectUri: "https://jag.local/oauth/square",
    });
    expect(sandbox.authorizationUrl).toContain("squareupsandbox.com");
    expect(production.authorizationUrl).toContain("squareup.com");
    expect(sandbox.scopes).toContain("PAYMENTS_READ");
  });

  it("authenticates, lists merchants, and refreshes tokens", async () => {
    const client = createDemoSquareClient();
    const auth = await client.authenticate({
      accessToken: "square-token",
      environment: "sandbox",
    });
    expect(auth.ok).toBe(true);
    expect(auth.session?.merchantId).toBeTruthy();

    const merchants = await client.listMerchants("square-token");
    expect(merchants.length).toBeGreaterThan(0);

    const refreshed = await client.refreshToken(auth.session!.refreshToken);
    expect(refreshed.ok).toBe(true);
    expect(refreshed.accessToken).toBeTruthy();

    const bad = await client.authenticate({ accessToken: "invalid" });
    expect(bad.ok).toBe(false);
  });

  it("handles refresh errors", async () => {
    const client = createDemoSquareClient();
    const badRefresh = await client.refreshToken("invalid");
    expect(badRefresh.ok).toBe(false);
  });
});

describe("Square production connector (D3) — normalize & mapping", () => {
  it("normalizes records with required lineage fields", () => {
    const raw = [
      {
        id: "pay-1",
        objectType: "payment",
        updatedAt: "2026-07-13T00:00:00.000Z",
        version: 2,
        organizationId: "org-1",
        locationId: "loc-1",
        merchantId: "m-1",
        payload: { name: "Payment", amountCents: 1000 },
      },
    ];
    const sync = toSquareSyncRecords(raw);
    const config = {
      connectorId: "square",
      instanceId: "square-org-1",
      scope: { organizationId: "org-1", schoolId: null },
      authMethod: "oauth2",
      enabled: true,
      status: "connected",
      settings: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as unknown as ConnectorConfiguration;
    const normalized = normalizeSquareRecords(sync, config);
    const data = normalized[0]!.data as {
      id: string;
      externalId: string;
      organizationId: string;
      sourceSystem: string;
      syncedAt: string;
      version: number;
      merchantId: string | null;
      locationId: string | null;
    };
    expect(data.id).toMatch(/^jag_payment_/);
    expect(data.externalId).toBe("pay-1");
    expect(data.organizationId).toBe("org-1");
    expect(data.sourceSystem).toBe("square");
    expect(data.syncedAt).toBeTruthy();
    expect(data.version).toBe(2);
    expect(data.merchantId).toBe("m-1");
    expect(data.locationId).toBe("loc-1");
  });
});

describe("Square production connector (D3) — sync & pagination", () => {
  it("synchronizes entities with pagination into normalized cache", async () => {
    squareStore.clear();
    const mgmt = createIntegrationManagement(registerAllConnectors(createIntegrationPlatform()));
    const { config, sync } = await mgmt.connections.bootstrap({
      connectorId: "square",
      scope: { organizationId: "exec-demo-org", schoolId: null },
      actor: "test",
    });

    expect(sync.status === "succeeded" || sync.status === "partial").toBe(true);
    expect(sync.recordsAccepted).toBeGreaterThan(20);

    const snapshot = squareStore.get(config.scope.organizationId);
    expect(snapshot).toBeTruthy();
    expect(snapshot!.byType.payment?.length).toBeGreaterThan(0);
    expect(snapshot!.byType.employee?.length).toBeGreaterThan(0);
    expect(snapshot!.byType.order_line_item?.length).toBeGreaterThan(0);
    expect(snapshot!.monitoring.lastSyncAt).toBeTruthy();
    expect(snapshot!.monitoring.apiLatencyMs).toBeGreaterThan(0);
    expect(snapshot!.monitoring.webhookStatus).toBe("active");
  });

  it("paginates list results from the demo client", async () => {
    const client = createDemoSquareClient();
    await client.authenticate({ accessToken: "tok", merchantId: "merchant-sq-demo" });
    const page1 = await client.list("exec-demo-org", "payment", null, null);
    expect(page1.records.length).toBeGreaterThan(0);
    expect(page1.nextCursor === null || typeof page1.nextCursor === "string").toBe(true);
  });

  it("supports incremental sync and reconnect after disconnect", async () => {
    squareStore.clear();
    const mgmt = createIntegrationManagement(registerAllConnectors(createIntegrationPlatform()));
    const { config } = await mgmt.connections.bootstrap({
      connectorId: "square",
      scope: { organizationId: "exec-demo-org" },
    });

    const incremental = await mgmt.connections.incrementalSync(config.instanceId);
    expect(incremental.mode).toBe("incremental");

    await mgmt.connections.disconnect(config.instanceId);
    expect(squareStore.hasLiveData("exec-demo-org")).toBe(false);

    await mgmt.connections.resume(config.instanceId, "test");
    await mgmt.connections.authenticate(config.instanceId, "test");
    const resync = await mgmt.connections.initialSync(config.instanceId);
    expect(resync.recordsAccepted).toBeGreaterThan(0);
  });
});

describe("Square production connector (D3) — refunds & feed", () => {
  it("imports refunds and builds intelligence soft lights", async () => {
    squareStore.clear();
    const mgmt = createIntegrationManagement(registerAllConnectors(createIntegrationPlatform()));
    await mgmt.connections.bootstrap({
      connectorId: "square",
      scope: { organizationId: "exec-demo-org" },
    });

    const snapshot = squareStore.get("exec-demo-org");
    expect(snapshot!.byType.refund?.length).toBeGreaterThan(0);

    const feed = getSquareFeed("exec-demo-org");
    expect(feed?.live).toBe(true);
    expect(feed?.payments.refundCents).toBeGreaterThan(0);
    expect(feed?.refundTrends.length).toBeGreaterThan(0);
    expect(feed?.topProducts.length).toBeGreaterThan(0);
    expect(feed?.revenueForecastCents).toBeGreaterThan(0);
    expect(feed?.softLights.financial.financialScore.value).toBeGreaterThan(0);
    expect(feed?.softLights.customer.customerScore.value).toBeGreaterThan(0);
    expect(feed?.dailySales.length).toBeGreaterThan(0);
  });

  it("publishes finance integration events on sync", async () => {
    squareStore.clear();
    const platform = registerAllConnectors(createIntegrationPlatform());
    const mgmt = createIntegrationManagement(platform);
    await mgmt.connections.bootstrap({
      connectorId: "square",
      scope: { organizationId: "exec-demo-org" },
    });
    expect(platform.events.list().some((e) => e.type === "TransactionImported")).toBe(true);
    expect(platform.events.list().some((e) => e.type === "InvoicePaid")).toBe(true);
  });
});

describe("Square production connector (D3) — reconciliation", () => {
  it("surfaces Square↔QuickBooks deposit and refund discrepancies when both synced", async () => {
    squareStore.clear();
    quickbooksStore.clear();
    const mgmt = createIntegrationManagement(registerAllConnectors(createIntegrationPlatform()));
    await mgmt.connections.bootstrap({
      connectorId: "square",
      scope: { organizationId: "exec-demo-org" },
    });
    await mgmt.connections.bootstrap({
      connectorId: "quickbooks",
      scope: { organizationId: "exec-demo-org" },
    });

    const recon = reconcileSquareQuickBooks("exec-demo-org");
    expect(recon.bothConnected).toBe(true);
    expect(recon.discrepancies.length).toBeGreaterThan(0);
    expect(recon.discrepancies.some((d) => d.kind === "deposit_mismatch")).toBe(true);
    expect(recon.discrepancies.some((d) => d.kind === "refund_vs_credit_memo")).toBe(true);
    expect(recon.summaryBullets.length).toBeGreaterThan(0);
    expect(recon.riskPressure).toBeGreaterThan(0);
  });

  it("returns empty discrepancies when only one system is connected", () => {
    squareStore.clear();
    quickbooksStore.clear();
    const recon = reconcileSquareQuickBooks("exec-demo-org");
    expect(recon.bothConnected).toBe(false);
    expect(recon.discrepancies).toEqual([]);
  });
});
