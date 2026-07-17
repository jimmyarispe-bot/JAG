import { describe, expect, it } from "vitest";
import {
  createIntegrationManagement,
  createIntegrationPlatform,
  registerAllConnectors,
  academyOsStore,
  getAcademyOsFeed,
  academyOsMetadata,
} from "@/lib/platform/integrations";

describe("AcademyOS production connector (B4.3)", () => {
  it("registers as a non-placeholder production connector", () => {
    const platform = registerAllConnectors(createIntegrationPlatform());
    const connector = platform.getConnector("academyos");
    expect(connector).toBeTruthy();
    expect(connector!.metadata.placeholder).toBe(false);
    expect(connector!.metadata.version).toBe(academyOsMetadata.version);
    expect(connector!.metadata.objectTypes).toContain("student");
    expect(connector!.metadata.objectTypes).toContain("payroll_summary");
  });

  it("synchronizes AcademyOS entities into normalized JAG cache", async () => {
    academyOsStore.clear();
    const mgmt = createIntegrationManagement(registerAllConnectors(createIntegrationPlatform()));
    const { config, sync } = await mgmt.connections.bootstrap({
      connectorId: "academyos",
      scope: { organizationId: "exec-demo-org", schoolId: null },
      actor: "test",
    });

    expect(sync.status === "succeeded" || sync.status === "partial").toBe(true);
    expect(sync.recordsAccepted).toBeGreaterThan(10);

    const snapshot = academyOsStore.get(config.scope.organizationId);
    expect(snapshot).toBeTruthy();
    expect(snapshot!.records.length).toBe(sync.recordsAccepted);

    const student = snapshot!.byType.student?.[0];
    expect(student).toBeTruthy();
    expect(student!.id).toMatch(/^jag_student_/);
    expect(student!.externalId).toBeTruthy();
    expect(student!.sourceSystem).toBe("academyos");
    expect(student!.syncedAt).toBeTruthy();
    expect(student!.version).toBeGreaterThan(0);
    expect(student!.organizationId).toBeTruthy();
  });

  it("supports incremental sync via cursor", async () => {
    academyOsStore.clear();
    const mgmt = createIntegrationManagement(registerAllConnectors(createIntegrationPlatform()));
    const { config } = await mgmt.connections.bootstrap({
      connectorId: "academyos",
      scope: { organizationId: "exec-demo-org" },
    });

    const incremental = await mgmt.connections.incrementalSync(config.instanceId);
    expect(incremental.mode).toBe("incremental");
    expect(incremental.status === "succeeded" || incremental.status === "partial").toBe(true);
  });

  it("builds intelligence feed soft lights without new domains", async () => {
    academyOsStore.clear();
    const mgmt = createIntegrationManagement(registerAllConnectors(createIntegrationPlatform()));
    await mgmt.connections.bootstrap({
      connectorId: "academyos",
      scope: { organizationId: "exec-demo-org" },
    });

    const feed = getAcademyOsFeed("exec-demo-org");
    expect(feed?.live).toBe(true);
    expect(feed?.counts.students).toBeGreaterThan(0);
    expect(feed?.softLights.humanCapital.humanCapitalScore.value).toBeGreaterThan(0);
    expect(feed?.softLights.customer.customerScore.value).toBeGreaterThan(0);
    expect(feed?.briefBullets.length).toBeGreaterThan(0);
    expect(feed?.timeline.length).toBeGreaterThan(0);
  });
});
