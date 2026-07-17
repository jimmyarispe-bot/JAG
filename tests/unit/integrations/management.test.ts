import { describe, expect, it } from "vitest";
import {
  createIntegrationManagement,
  createIntegrationPlatform,
  registerAllConnectors,
} from "@/lib/platform/integrations";

describe("Integration Management (B4.2)", () => {
  function createMgmt() {
    return createIntegrationManagement(registerAllConnectors(createIntegrationPlatform()));
  }

  it("runs full connection lifecycle without vendor-specific code", async () => {
    const mgmt = createMgmt();
    const { config, sync } = await mgmt.connections.bootstrap({
      connectorId: "hubspot",
      scope: { organizationId: "org-mgmt", schoolId: null },
      actor: "test",
    });

    expect(config.instanceId).toContain("hubspot");
    expect(sync.status === "succeeded" || sync.status === "partial").toBe(true);

    const lifecycle = mgmt.connections.getLifecycle(config.instanceId);
    expect(lifecycle?.authenticated).toBe(true);
    expect(lifecycle?.validated).toBe(true);
    expect(["initial_sync", "incremental_sync", "monitoring", "connected"]).toContain(
      lifecycle?.phase
    );

    const schedule = mgmt.scheduler.get(config.instanceId);
    expect(schedule?.lastSuccessfulSyncAt).toBeTruthy();
    expect(schedule?.nextScheduledSyncAt).toBeTruthy();

    expect(mgmt.history.list(config.instanceId).length).toBeGreaterThan(0);
    expect(mgmt.audit.list(config.instanceId).some((a) => a.action === "connection_created")).toBe(
      true
    );
    expect(mgmt.health.get(config.instanceId)?.status).toBeTruthy();
  });

  it("supports pause, resume, and retry recovery", async () => {
    const mgmt = createMgmt();
    const { config } = await mgmt.connections.bootstrap({
      connectorId: "stripe",
      scope: { organizationId: "org-lifecycle" },
    });

    await mgmt.connections.pause(config.instanceId);
    expect(mgmt.platform.persistence.getConfiguration(config.instanceId)?.paused).toBe(true);
    expect(mgmt.platform.persistence.getRuntime(config.instanceId)?.status).toBe("paused");

    await expect(mgmt.connections.incrementalSync(config.instanceId)).rejects.toThrow(/paused/i);

    await mgmt.connections.resume(config.instanceId);
    const result = await mgmt.connections.incrementalSync(config.instanceId);
    expect(result.recordsFetched).toBeGreaterThan(0);

    const recovered = await mgmt.connections.retryRecovery(config.instanceId);
    expect(recovered).toBeTruthy();
  });

  it("schedules due syncs through the shared queue", async () => {
    const mgmt = createMgmt();
    const { config } = await mgmt.connections.bootstrap({
      connectorId: "csv",
      scope: { organizationId: "org-sched" },
    });

    mgmt.scheduler.configure(config.instanceId, {
      strategy: "scheduled",
      cron: "*/1 * * * *",
      enabled: true,
    });
    // Force due
    const schedule = mgmt.scheduler.get(config.instanceId)!;
    mgmt.platform.persistence.saveSchedule({
      ...schedule,
      nextScheduledSyncAt: new Date(Date.now() - 1000).toISOString(),
    });

    const results = await mgmt.scheduler.runDue(mgmt.queue);
    expect(results.length).toBeGreaterThanOrEqual(1);
  });

  it("keeps audit trail for lifecycle events", async () => {
    const mgmt = createMgmt();
    const { config } = await mgmt.connections.bootstrap({
      connectorId: "google",
      scope: { organizationId: "org-audit" },
    });
    await mgmt.connections.disconnect(config.instanceId);
    const audit = mgmt.audit.lifecycleEvents(config.instanceId, 50);
    expect(audit.some((a) => a.action === "connection_created")).toBe(true);
    expect(audit.some((a) => a.action === "connector_disabled")).toBe(true);
  });
});
