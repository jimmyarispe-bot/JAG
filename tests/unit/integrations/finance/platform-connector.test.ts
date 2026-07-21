import { describe, expect, it, beforeEach } from "vitest";
import {
  createIntegrationPlatformCore,
  registerFinancePlatformConnectors,
  createStripePlatformConnector,
  createDemoFinanceClient,
  reconnectStripe,
  financeCanonicalType,
  FINANCE_OBJECT_TYPES,
  FINANCE_KG_KINDS,
  buildFinancialGraph,
  buildFinanceEccWidgets,
  buildFinanceExecutiveFeed,
  financeStore,
  registerAllConnectors,
  createIntegrationPlatform,
  stripeMetadata,
} from "@/lib/platform/integrations";
import { createOiosOperatingSystem } from "@/lib/platform/oios";

describe("RC-3.03 / Sprint 077 — Financial Intelligence Connectors", () => {
  beforeEach(() => {
    financeStore.clear();
  });

  describe("catalog", () => {
    it("registers Stripe as a non-placeholder production connector", () => {
      const platform = registerAllConnectors(createIntegrationPlatform());
      const connector = platform.getConnector("stripe");
      expect(connector).toBeTruthy();
      expect(connector!.metadata.placeholder).toBe(false);
      expect(connector!.metadata.version).toBe(stripeMetadata.version);
      expect(connector!.metadata.objectTypes).toContain("subscription");
      expect(connector!.metadata.objectTypes).toContain("refund");
    });

    it("keeps QuickBooks, Square, and Plaid as production connectors", () => {
      const platform = registerAllConnectors(createIntegrationPlatform());
      expect(platform.getConnector("quickbooks")!.metadata.placeholder).toBe(false);
      expect(platform.getConnector("square")!.metadata.placeholder).toBe(false);
      expect(platform.getConnector("plaid")!.metadata.placeholder).toBe(false);
    });
  });

  describe("auth lifecycle", () => {
    it("installs, refreshes, disconnects, and reconnects Stripe", async () => {
      const connector = createStripePlatformConnector({
        client: createDemoFinanceClient("stripe"),
      });
      const auth = await connector.authenticate("stripe-org-1");
      expect(auth.ok).toBe(true);
      const refreshed = await connector.refreshAuthentication("stripe-org-1");
      expect(refreshed.ok).toBe(true);
      await connector.disconnect("stripe-org-1");
      expect((await connector.validate("stripe-org-1")).ok).toBe(false);
      expect((await reconnectStripe(connector, "stripe-org-1")).ok).toBe(true);
    });
  });

  describe("canonical mapping", () => {
    it("maps finance objects into shared canonical types and KG kinds", () => {
      expect(financeCanonicalType("payment")).toBe("finance.payment");
      expect(financeCanonicalType("invoice")).toBe("finance.invoice");
      expect(financeCanonicalType("subscription")).toBe("finance.subscription");
      expect(financeCanonicalType("transaction")).toBe("finance.transaction");
      expect(financeCanonicalType("customer")).toBe("crm.contact");
      expect(FINANCE_OBJECT_TYPES).toContain("cash_flow");
      expect(FINANCE_KG_KINDS).toEqual(
        expect.arrayContaining([
          "FinancialTransaction",
          "Customer",
          "Vendor",
          "Account",
          "Payment",
          "Invoice",
          "Subscription",
        ])
      );
    });
  });

  describe("sync", () => {
    it("syncs QuickBooks, Stripe, Square, and Plaid into the finance store", async () => {
      const platform = createIntegrationPlatformCore();
      registerFinancePlatformConnectors(platform);
      platform.lifecycle.seed("quickbooks-org-finance-demo", "connected");
      platform.lifecycle.seed("stripe-org-finance-demo", "connected");
      platform.lifecycle.seed("square-org-finance-demo", "connected");
      platform.lifecycle.seed("plaid-org-finance-demo", "connected");

      const qb = await platform.syncNow("quickbooks", "quickbooks-org-finance-demo", "full");
      const stripe = await platform.syncNow("stripe", "stripe-org-finance-demo", "full");
      const square = await platform.syncNow("square", "square-org-finance-demo", "full");
      const plaid = await platform.syncNow("plaid", "plaid-org-finance-demo", "full");

      expect(qb.status).toBe("succeeded");
      expect(stripe.status).toBe("succeeded");
      expect(square.status).toBe("succeeded");
      expect(plaid.status).toBe("succeeded");
      expect(qb.recordsFetched).toBeGreaterThan(5);
      expect(stripe.recordsFetched).toBeGreaterThan(4);

      const snap = financeStore.listForOrganization("org-finance-demo");
      expect(snap.map((s) => s.provider).sort()).toEqual([
        "plaid",
        "quickbooks",
        "square",
        "stripe",
      ]);
    });
  });

  describe("Financial Knowledge Graph", () => {
    it("builds canonical financial nodes and scores", async () => {
      const platform = createIntegrationPlatformCore();
      registerFinancePlatformConnectors(platform);
      for (const id of [
        "quickbooks-org-finance-demo",
        "stripe-org-finance-demo",
        "square-org-finance-demo",
        "plaid-org-finance-demo",
      ]) {
        platform.lifecycle.seed(id, "connected");
      }
      await platform.syncNow("quickbooks", "quickbooks-org-finance-demo", "full");
      await platform.syncNow("stripe", "stripe-org-finance-demo", "full");
      await platform.syncNow("square", "square-org-finance-demo", "full");
      await platform.syncNow("plaid", "plaid-org-finance-demo", "full");

      const graph = buildFinancialGraph("org-finance-demo");
      expect(graph).toBeTruthy();
      expect(graph!.nodes.length).toBeGreaterThan(0);
      expect(graph!.scores.cashPosition).toBeGreaterThan(0);
      expect(graph!.scores.revenue).toBeGreaterThan(0);
      expect(graph!.scores.receivables).toBeGreaterThan(0);
      expect(graph!.scores.payables).toBeGreaterThan(0);
      expect(graph!.scores.subscriptionMrr).toBeGreaterThan(0);
      expect(graph!.scores.revenueForecast).toBeGreaterThan(0);
      expect(typeof graph!.scores.ebitda).toBe("number");
      expect(graph!.scores.profitability).toBeGreaterThanOrEqual(0);
      expect(graph!.scores.expenseAnomalyScore).toBeGreaterThan(0);
      expect(graph!.scores.expenseAnomalies.length).toBeGreaterThan(0);
      expect(graph!.providersConnected).toContain("stripe");
    });
  });

  describe("ECC widgets", () => {
    it("builds cash, revenue, forecast, burn, AR/AP, subscriptions, anomalies, profitability, EBITDA", async () => {
      const platform = createIntegrationPlatformCore();
      registerFinancePlatformConnectors(platform);
      platform.lifecycle.seed("quickbooks-org-finance-demo", "connected");
      platform.lifecycle.seed("stripe-org-finance-demo", "connected");
      platform.lifecycle.seed("plaid-org-finance-demo", "connected");
      await platform.syncNow("quickbooks", "quickbooks-org-finance-demo", "full");
      await platform.syncNow("stripe", "stripe-org-finance-demo", "full");
      await platform.syncNow("plaid", "plaid-org-finance-demo", "full");

      const widgets = buildFinanceEccWidgets("exec-demo-org");
      expect(widgets).toBeTruthy();
      expect(widgets!.cashPosition.kind).toBe("cash_position");
      expect(widgets!.revenue.kind).toBe("revenue");
      expect(widgets!.burnRate.kind).toBe("burn_rate");
      expect(widgets!.receivables.kind).toBe("receivables");
      expect(widgets!.payables.kind).toBe("payables");
      expect(widgets!.subscriptions.kind).toBe("subscriptions");
      expect(widgets!.revenueForecast.kind).toBe("revenue_forecast");
      expect(widgets!.expenseAnomalies.kind).toBe("expense_anomalies");
      expect(widgets!.profitability.kind).toBe("profitability");
      expect(widgets!.ebitda.kind).toBe("ebitda");
      expect(widgets!.subscriptions.subscriptionMrr).toBeGreaterThan(0);
      expect(widgets!.revenueForecast.revenueForecast).toBeGreaterThan(0);
      expect(widgets!.expenseAnomalies.anomalies.length).toBeGreaterThan(0);
    });
  });

  describe("executive feed", () => {
    it("feeds Accounting, Finance, Forecasting, Portfolio, and Digital Twin soft lights", async () => {
      const platform = createIntegrationPlatformCore();
      registerFinancePlatformConnectors(platform);
      platform.lifecycle.seed("quickbooks-org-finance-demo", "connected");
      platform.lifecycle.seed("stripe-org-finance-demo", "connected");
      platform.lifecycle.seed("plaid-org-finance-demo", "connected");
      await platform.syncNow("quickbooks", "quickbooks-org-finance-demo", "full");
      await platform.syncNow("stripe", "stripe-org-finance-demo", "full");
      await platform.syncNow("plaid", "plaid-org-finance-demo", "full");

      const feed = buildFinanceExecutiveFeed("org-finance-demo");
      expect(feed).toBeTruthy();
      expect(feed!.accounting.ar).toBeGreaterThan(0);
      expect(feed!.finance.cashPosition).toBeGreaterThan(0);
      expect(feed!.finance.ebitda).toBeDefined();
      expect(feed!.finance.profitability).toBeGreaterThanOrEqual(0);
      expect(feed!.forecasting.subscriptionMrr).toBeGreaterThan(0);
      expect(feed!.forecasting.revenueForecast).toBeGreaterThan(0);
      expect(feed!.softLights.financial.financialScore.value).toBeGreaterThan(0);
      expect(feed!.softLights.portfolio.portfolioScore.value).toBeGreaterThan(0);
      expect(feed!.softLights.digitalTwin.twinScore.value).toBeGreaterThan(0);
      expect(feed!.briefBullets.length).toBeGreaterThan(0);
    });
  });

  describe("OIOS registration", () => {
    it("registers finance connectors on Integration Platform Core via OIOS", () => {
      const oios = createOiosOperatingSystem({ wireOrganizationDna: false });
      expect(oios.integrations?.registry.has("quickbooks")).toBe(true);
      expect(oios.integrations?.registry.has("stripe")).toBe(true);
      expect(oios.integrations?.registry.has("square")).toBe(true);
      expect(oios.integrations?.registry.has("plaid")).toBe(true);
      expect(oios.integrations?.registry.getVersion("stripe")).toBe("1.0.0");
    });
  });
});
