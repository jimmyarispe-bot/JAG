import { describe, expect, it, beforeEach } from "vitest";
import {
  createIntegrationPlatformCore,
  registerCrmPlatformConnectors,
  createHubspotPlatformConnector,
  createDemoCrmClient,
  reconnectCrmConnector,
  crmCanonicalType,
  CRM_OBJECT_TYPES,
  CRM_KG_KINDS,
  buildCrmEccWidgets,
  buildCrmExecutiveFeed,
  computeCrmSignals,
  buildExecutiveRelationshipGraph,
  crmStore,
  registerAllConnectors,
  createIntegrationPlatform,
  hubspotMetadata,
  salesforceMetadata,
} from "@/lib/platform/integrations";
import { createOiosOperatingSystem } from "@/lib/platform/oios";

describe("RC-3.04 — CRM Connectors", () => {
  beforeEach(() => {
    crmStore.clear();
  });

  describe("catalog", () => {
    it("registers HubSpot and Salesforce as non-placeholder production connectors", () => {
      const platform = registerAllConnectors(createIntegrationPlatform());
      expect(platform.getConnector("hubspot")!.metadata.placeholder).toBe(false);
      expect(platform.getConnector("salesforce")!.metadata.placeholder).toBe(false);
      expect(platform.getConnector("hubspot")!.metadata.version).toBe(hubspotMetadata.version);
      expect(platform.getConnector("salesforce")!.metadata.version).toBe(
        salesforceMetadata.version
      );
      expect(platform.getConnector("hubspot")!.metadata.objectTypes).toContain("lead");
      expect(platform.getConnector("hubspot")!.metadata.objectTypes).toContain("deal");
      expect(platform.getConnector("salesforce")!.metadata.objectTypes).toContain(
        "opportunity"
      );
    });
  });

  describe("auth lifecycle", () => {
    it("installs, refreshes, disconnects, and reconnects HubSpot", async () => {
      const connector = createHubspotPlatformConnector({
        client: createDemoCrmClient("hubspot"),
      });
      expect((await connector.authenticate("hubspot-org-1")).ok).toBe(true);
      expect((await connector.refreshAuthentication("hubspot-org-1")).ok).toBe(true);
      await connector.disconnect("hubspot-org-1");
      expect((await connector.validate("hubspot-org-1")).ok).toBe(false);
      expect((await reconnectCrmConnector(connector, "hubspot-org-1")).ok).toBe(true);
    });
  });

  describe("canonical mapping", () => {
    it("maps Lead / Contact / Company / Deal / Opportunity / Activity / Pipeline", () => {
      expect(crmCanonicalType("lead")).toBe("crm.lead");
      expect(crmCanonicalType("contact")).toBe("crm.contact");
      expect(crmCanonicalType("company")).toBe("crm.account");
      expect(crmCanonicalType("deal")).toBe("crm.opportunity");
      expect(crmCanonicalType("opportunity")).toBe("crm.opportunity");
      expect(crmCanonicalType("activity")).toBe("crm.activity");
      expect(crmCanonicalType("pipeline")).toBe("crm.pipeline");
      expect(CRM_OBJECT_TYPES).toEqual(
        expect.arrayContaining([
          "lead",
          "contact",
          "company",
          "deal",
          "opportunity",
          "activity",
          "pipeline",
        ])
      );
      expect(CRM_KG_KINDS).toEqual(
        expect.arrayContaining(["Lead", "Person", "Organization", "Opportunity", "Task"])
      );
    });
  });

  describe("sync & intelligence", () => {
    it("syncs HubSpot and Salesforce into crmStore with RC-3.04 signals", async () => {
      const platform = createIntegrationPlatformCore();
      registerCrmPlatformConnectors(platform);
      platform.lifecycle.seed("hubspot-org-crm-demo", "connected");
      platform.lifecycle.seed("salesforce-org-crm-demo", "connected");

      expect((await platform.syncNow("hubspot", "hubspot-org-crm-demo", "full")).status).toBe(
        "succeeded"
      );
      expect(
        (await platform.syncNow("salesforce", "salesforce-org-crm-demo", "full")).status
      ).toBe("succeeded");

      const records = crmStore.allRecords("org-crm-demo");
      expect(records.length).toBeGreaterThan(10);
      expect(records.some((r) => r.objectType === "lead")).toBe(true);

      const signals = computeCrmSignals(records);
      expect(signals.pipelineValue).toBeGreaterThan(0);
      expect(signals.salesForecast).toBeGreaterThan(0);
      expect(signals.pipelineHealth).toBeGreaterThan(0);
      expect(signals.customerConcentration).toBeGreaterThan(0);
      expect(signals.revenueAttributionByCompany.length).toBeGreaterThan(0);
      expect(signals.revenueAttributionBySource.length).toBeGreaterThan(0);

      const graph = buildExecutiveRelationshipGraph("org-crm-demo");
      expect(graph).toBeTruthy();
      expect(graph!.nodes.length).toBeGreaterThan(0);
      expect(graph!.edges.length).toBeGreaterThan(0);
    });
  });

  describe("ECC widgets", () => {
    it("builds forecast, health, concentration, relationship, and attribution widgets", async () => {
      const platform = createIntegrationPlatformCore();
      registerCrmPlatformConnectors(platform);
      platform.lifecycle.seed("hubspot-org-crm-demo", "connected");
      await platform.syncNow("hubspot", "hubspot-org-crm-demo", "full");

      const widgets = buildCrmEccWidgets("exec-demo-org");
      expect(widgets).toBeTruthy();
      expect(widgets!.crmPipeline.kind).toBe("crm_pipeline");
      expect(widgets!.salesForecast.kind).toBe("sales_forecast");
      expect(widgets!.pipelineHealth.kind).toBe("pipeline_health");
      expect(widgets!.customerConcentration.kind).toBe("customer_concentration");
      expect(widgets!.executiveRelationshipGraph.kind).toBe("executive_relationship_graph");
      expect(widgets!.revenueAttribution.kind).toBe("revenue_attribution");
      expect(widgets!.salesForecast.salesForecast).toBeGreaterThan(0);
    });
  });

  describe("executive feed", () => {
    it("feeds opportunity soft lights without vendor-specific branching", async () => {
      const platform = createIntegrationPlatformCore();
      registerCrmPlatformConnectors(platform);
      platform.lifecycle.seed("salesforce-org-crm-demo", "connected");
      await platform.syncNow("salesforce", "salesforce-org-crm-demo", "full");

      const feed = buildCrmExecutiveFeed("org-crm-demo");
      expect(feed).toBeTruthy();
      expect(feed!.crm.salesForecast).toBeGreaterThan(0);
      expect(feed!.softLights.opportunity.opportunityScore.value).toBeGreaterThan(0);
      expect(feed!.briefBullets.every((b) => !b.toLowerCase().includes("salesforce api"))).toBe(
        true
      );
    });
  });

  describe("OIOS registration", () => {
    it("registers CRM connectors on Integration Platform Core via OIOS", () => {
      const oios = createOiosOperatingSystem({ wireOrganizationDna: false });
      expect(oios.integrations?.registry.has("hubspot")).toBe(true);
      expect(oios.integrations?.registry.has("salesforce")).toBe(true);
      expect(oios.integrations?.registry.getVersion("hubspot")).toBe("1.1.0");
    });
  });
});
