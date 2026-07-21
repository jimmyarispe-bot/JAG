import { beforeEach, describe, expect, it } from "vitest";
import {
  createIntegrationPlatformCore,
  registerHrPlatformConnectors,
  createGustoPlatformConnector,
  createBambooHrPlatformConnector,
  createDemoHrClient,
  hrCanonicalType,
  HR_KG_KINDS,
  HR_PROVIDERS,
  HR_OBJECT_TYPES,
  buildHrEccWidgets,
  buildHrExecutiveFeed,
  computeHrSignals,
  hrStore,
  normalizeHrRecords,
  registerAllConnectors,
  createIntegrationPlatform,
  adpMetadata,
  gustoMetadata,
  paylocityMetadata,
  bambooHrMetadata,
} from "@/lib/platform/integrations";
import { createOiosOperatingSystem } from "@/lib/platform/oios";
import { reconnectHrConnector } from "@/lib/platform/integrations/connectors/hr";
import type { ConnectorConfiguration } from "@/lib/platform/integrations/common/types";

describe("RC-3.05 — HR Connectors", () => {
  beforeEach(() => {
    hrStore.clear();
  });

  describe("catalog", () => {
    it("promotes ADP, Gusto, Paylocity, and BambooHR to non-placeholder production", () => {
      const platform = registerAllConnectors(createIntegrationPlatform());
      for (const [id, meta] of [
        ["adp", adpMetadata],
        ["gusto", gustoMetadata],
        ["paylocity", paylocityMetadata],
        ["bamboohr", bambooHrMetadata],
      ] as const) {
        const connector = platform.getConnector(id);
        expect(connector).toBeTruthy();
        expect(connector!.metadata.placeholder).toBe(false);
        expect(connector!.metadata.version).toBe(meta.version);
        expect(connector!.metadata.objectTypes).toEqual(
          expect.arrayContaining([
            "employee",
            "payroll",
            "benefit",
            "time_off",
            "department",
            "manager",
            "hiring",
          ])
        );
      }
      expect(HR_PROVIDERS).toHaveLength(4);
      expect(HR_OBJECT_TYPES).toEqual(
        expect.arrayContaining(["employee", "department", "manager", "time_off"])
      );
    });
  });

  describe("auth lifecycle", () => {
    it("installs, refreshes, disconnects, and reconnects Gusto", async () => {
      const connector = createGustoPlatformConnector({
        client: createDemoHrClient("gusto"),
      });
      expect((await connector.authenticate("gusto-org-1")).ok).toBe(true);
      expect((await connector.refreshAuthentication("gusto-org-1")).ok).toBe(true);
      await connector.disconnect("gusto-org-1");
      expect((await connector.validate("gusto-org-1")).ok).toBe(false);
      expect((await reconnectHrConnector(connector, "gusto-org-1")).ok).toBe(true);
    });
  });

  describe("normalize", () => {
    it("maps provider objects into Employee / Payroll / Benefits / Time Off / Department / Manager", () => {
      expect(hrCanonicalType("employee")).toBe("person.employee");
      expect(hrCanonicalType("payroll")).toBe("hr.payroll");
      expect(hrCanonicalType("benefit")).toBe("hr.benefit");
      expect(hrCanonicalType("time_off")).toBe("hr.time_off");
      expect(hrCanonicalType("department")).toBe("hr.department");
      expect(hrCanonicalType("manager")).toBe("hr.manager");
      expect(HR_KG_KINDS).toEqual(
        expect.arrayContaining(["Employee", "Person", "Organization", "FinancialTransaction"])
      );

      const config: ConnectorConfiguration = {
        connectorId: "gusto",
        instanceId: "gusto-test",
        scope: { organizationId: "org-1", schoolId: null },
        enabled: true,
        authMethod: "oauth2",
        settings: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const normalized = normalizeHrRecords(
        [
          {
            externalId: "e1",
            objectType: "employee",
            updatedAt: "2026-07-13T00:00:00.000Z",
            payload: {
              name: "Casey",
              ssn: "000-00-0000",
              departmentId: "d1",
              managerId: "m1",
              status: "active",
              organizationId: "org-1",
              version: 1,
            },
          },
          {
            externalId: "p1",
            objectType: "payroll",
            updatedAt: "2026-07-13T00:00:00.000Z",
            payload: {
              name: "July",
              totalAmt: 9000,
              employeeId: "e1",
              organizationId: "org-1",
              version: 1,
            },
          },
        ],
        config,
        "gusto"
      );
      const employee = normalized[0]!.data as { attributes: Record<string, unknown> };
      expect(employee.attributes.kind).toBe("Employee");
      expect(employee.attributes.ssn).toBeUndefined();
      expect((normalized[1]!.data as { attributes: Record<string, unknown> }).attributes.kind).toBe(
        "Payroll"
      );
    });
  });

  describe("sync & intelligence", () => {
    it("syncs BambooHR into canonical store and builds intelligence widgets", async () => {
      const platform = createIntegrationPlatformCore();
      registerHrPlatformConnectors(platform);
      platform.lifecycle.seed("bamboohr-org-hr-demo", "connected");

      const result = await platform.syncNow("bamboohr", "bamboohr-org-hr-demo", "full");
      expect(result.status).toBe("succeeded");
      expect(result.recordsNormalized).toBeGreaterThan(10);

      const widgets = buildHrEccWidgets("org-hr-demo");
      expect(widgets).toBeTruthy();
      expect(widgets!.turnover.kind).toBe("hr_turnover");
      expect(widgets!.hiring.kind).toBe("hr_hiring");
      expect(widgets!.capacity.kind).toBe("hr_capacity");
      expect(widgets!.payroll.kind).toBe("hr_payroll");
      expect(widgets!.compensation.kind).toBe("hr_compensation");
      expect(widgets!.succession.kind).toBe("hr_succession");
      expect(widgets!.turnover.terminations12m).toBeGreaterThan(0);
      expect(widgets!.hiring.openRoles).toBeGreaterThan(0);
      expect(widgets!.succession.successionCoveragePct).toBeGreaterThan(0);

      const signals = computeHrSignals(hrStore.allRecords("org-hr-demo"));
      expect(signals.headcount).toBeGreaterThan(0);
      expect(signals.avgCompensation).toBeGreaterThan(0);

      const feed = buildHrExecutiveFeed("org-hr-demo");
      expect(feed?.briefBullets.length).toBeGreaterThan(0);
      expect(feed?.providersConnected).toContain("bamboohr");
    });

    it("supports incremental sync", async () => {
      const connector = createBambooHrPlatformConnector();
      await connector.authenticate("bamboohr-org-1");
      const full = await connector.sync({
        instanceId: "bamboohr-org-1",
        mode: "full",
        objectTypes: [],
      });
      expect(full.status).toBe("succeeded");
      const incremental = await connector.sync({
        instanceId: "bamboohr-org-1",
        mode: "incremental",
        objectTypes: [],
        cursor: full.cursor ?? undefined,
      });
      expect(incremental.status).toBe("succeeded");
    });
  });

  describe("OIOS registration", () => {
    it("registers HR connectors on Integration Platform Core", () => {
      const oios = createOiosOperatingSystem({ wireOrganizationDna: false });
      expect(oios.integrations?.registry.has("adp")).toBe(true);
      expect(oios.integrations?.registry.has("gusto")).toBe(true);
      expect(oios.integrations?.registry.has("paylocity")).toBe(true);
      expect(oios.integrations?.registry.has("bamboohr")).toBe(true);
      expect(oios.integrations?.registry.getVersion("bamboohr")).toBe("1.1.0");
    });
  });
});
