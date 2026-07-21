import { describe, expect, it, beforeEach } from "vitest";
import {
  createIntegrationPlatformCore,
  registerEnterprisePlatformConnectors,
  registerHrPlatformConnectors,
  registerCrmPlatformConnectors,
  registerEducationPlatformConnectors,
  createHubspotPlatformConnector,
  createDemoCrmClient,
  enterpriseCanonicalType,
  ENTERPRISE_KG_KINDS,
  ENTERPRISE_PROVIDERS,
  buildEnterpriseGraph,
  buildEnterpriseEccWidgets,
  buildEnterpriseExecutiveFeed,
  enterpriseStore,
  hrStore,
  crmStore,
  educationStore,
  registerAllConnectors,
  createIntegrationPlatform,
  hubspotMetadata,
  gustoMetadata,
  salesforceMetadata,
  reconnectCrmConnector,
} from "@/lib/platform/integrations";
import { createOiosOperatingSystem } from "@/lib/platform/oios";

describe("Sprint 078 — Enterprise Connectors", () => {
  beforeEach(() => {
    enterpriseStore.clear();
    hrStore.clear();
    crmStore.clear();
    educationStore.clear();
  });

  describe("catalog", () => {
    it("promotes HubSpot, Salesforce, and Gusto to non-placeholder production", () => {
      const platform = registerAllConnectors(createIntegrationPlatform());
      for (const [id, meta] of [
        ["hubspot", hubspotMetadata],
        ["salesforce", salesforceMetadata],
        ["gusto", gustoMetadata],
      ] as const) {
        const connector = platform.getConnector(id);
        expect(connector).toBeTruthy();
        expect(connector!.metadata.placeholder).toBe(false);
        expect(connector!.metadata.version).toBe(meta.version);
      }
      expect(platform.getConnector("hubspot")!.metadata.objectTypes).toContain("pipeline");
      expect(platform.getConnector("adp")).toBeTruthy();
      expect(platform.getConnector("canvas")).toBeTruthy();
      expect(platform.getConnector("grant")).toBeTruthy();
    });

    it("registers four government enterprise providers (CRM/HR/Edu extracted)", () => {
      expect(ENTERPRISE_PROVIDERS).toHaveLength(4);
      const platform = registerAllConnectors(createIntegrationPlatform());
      for (const id of ENTERPRISE_PROVIDERS) {
        expect(platform.getConnector(id)?.metadata.placeholder).toBe(false);
      }
    });
  });

  describe("auth lifecycle", () => {
    it("installs, refreshes, disconnects, and reconnects HubSpot via CRM package", async () => {
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
    it("maps CRM/HR/Education/Government into shared canonical types and KG kinds", () => {
      expect(enterpriseCanonicalType("contact")).toBe("crm.contact");
      expect(enterpriseCanonicalType("deal")).toBe("crm.opportunity");
      expect(enterpriseCanonicalType("employee")).toBe("person.employee");
      expect(enterpriseCanonicalType("student")).toBe("education.student");
      expect(enterpriseCanonicalType("award")).toBe("finance.award");
      expect(ENTERPRISE_KG_KINDS).toEqual(
        expect.arrayContaining([
          "Person",
          "Organization",
          "Student",
          "Employee",
          "Opportunity",
          "Initiative",
          "Portfolio",
          "Risk",
          "Decision",
          "Task",
          "FinancialTransaction",
        ])
      );
    });
  });

  describe("sync & graph", () => {
    it("syncs CRM, HR, Education, and Government into one canonical graph", async () => {
      const platform = createIntegrationPlatformCore();
      registerEnterprisePlatformConnectors(platform);
      registerHrPlatformConnectors(platform);
      registerCrmPlatformConnectors(platform);
      registerEducationPlatformConnectors(platform);
      const instances = [
        "hubspot-org-enterprise-demo",
        "gusto-org-enterprise-demo",
        "canvas-org-enterprise-demo",
        "grant-org-enterprise-demo",
      ] as const;
      for (const id of instances) platform.lifecycle.seed(id, "connected");

      expect((await platform.syncNow("hubspot", instances[0], "full")).status).toBe("succeeded");
      expect((await platform.syncNow("gusto", instances[1], "full")).status).toBe("succeeded");
      expect((await platform.syncNow("canvas", instances[2], "full")).status).toBe("succeeded");
      expect((await platform.syncNow("grant", instances[3], "full")).status).toBe("succeeded");

      const graph = buildEnterpriseGraph("org-enterprise-demo");
      expect(graph).toBeTruthy();
      expect(graph!.nodes.length).toBeGreaterThan(0);
      expect(graph!.domainsConnected).toEqual(
        expect.arrayContaining(["crm", "hr", "education", "government"])
      );
      expect(graph!.scores.pipelineValue).toBeGreaterThan(0);
      expect(graph!.scores.headcount).toBeGreaterThan(0);
      expect(graph!.scores.activeStudents).toBeGreaterThan(0);
      expect(graph!.scores.programFunding).toBeGreaterThan(0);
      expect(graph!.kgKindsPresent.length).toBeGreaterThan(3);
    });
  });

  describe("ECC widgets", () => {
    it("builds provider-neutral CRM / Workforce / Enrollment / Funding widgets", async () => {
      const platform = createIntegrationPlatformCore();
      registerEnterprisePlatformConnectors(platform);
      registerHrPlatformConnectors(platform);
      registerCrmPlatformConnectors(platform);
      registerEducationPlatformConnectors(platform);
      for (const id of [
        "hubspot-org-enterprise-demo",
        "adp-org-enterprise-demo",
        "powerschool-org-enterprise-demo",
        "medicaid-org-enterprise-demo",
      ]) {
        platform.lifecycle.seed(id, "connected");
      }
      await platform.syncNow("hubspot", "hubspot-org-enterprise-demo", "full");
      await platform.syncNow("adp", "adp-org-enterprise-demo", "full");
      await platform.syncNow("powerschool", "powerschool-org-enterprise-demo", "full");
      await platform.syncNow("medicaid", "medicaid-org-enterprise-demo", "full");

      const widgets = buildEnterpriseEccWidgets("exec-demo-org");
      expect(widgets).toBeTruthy();
      expect(widgets!.crmPipeline.kind).toBe("crm_pipeline");
      expect(widgets!.workforce.kind).toBe("workforce");
      expect(widgets!.workforce.headcount).toBeGreaterThan(0);
      expect(widgets!.studentEnrollment.kind).toBe("student_enrollment");
      expect(widgets!.programFunding.kind).toBe("program_funding");
    });
  });

  describe("executive feed & phase exit", () => {
    it("feeds soft lights without provider-specific branching in consumers", async () => {
      const platform = createIntegrationPlatformCore();
      registerEnterprisePlatformConnectors(platform);
      registerCrmPlatformConnectors(platform);
      platform.lifecycle.seed("salesforce-org-enterprise-demo", "connected");
      platform.lifecycle.seed("scholarship-org-enterprise-demo", "connected");
      await platform.syncNow("salesforce", "salesforce-org-enterprise-demo", "full");
      await platform.syncNow("scholarship", "scholarship-org-enterprise-demo", "full");

      const feed = buildEnterpriseExecutiveFeed("org-enterprise-demo");
      expect(feed).toBeTruthy();
      expect(feed!.softLights.opportunity.opportunityScore.value).toBeGreaterThan(0);
      expect(feed!.canonicalGraphKinds).toEqual(ENTERPRISE_KG_KINDS);
      expect(feed!.briefBullets.every((b) => !b.toLowerCase().includes("salesforce api"))).toBe(
        true
      );
    });
  });

  describe("OIOS registration", () => {
    it("registers enterprise connectors on Integration Platform Core", () => {
      const oios = createOiosOperatingSystem({ wireOrganizationDna: false });
      expect(oios.integrations?.registry.has("hubspot")).toBe(true);
      expect(oios.integrations?.registry.has("paylocity")).toBe(true);
      expect(oios.integrations?.registry.has("google_classroom")).toBe(true);
      expect(oios.integrations?.registry.has("state_education")).toBe(true);
      expect(oios.integrations?.registry.getVersion("hubspot")).toBe("1.1.0");
    });
  });
});
