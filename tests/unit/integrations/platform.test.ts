import { describe, expect, it } from "vitest";
import {
  createIntegrationPlatform,
  registerAllConnectors,
  processWebhook,
} from "@/lib/platform/integrations";

describe("Enterprise Integration Platform", () => {
  it("registers Phase 1 connectors and runs the shared sync pipeline", async () => {
    const platform = registerAllConnectors(createIntegrationPlatform());
    expect(platform.listCatalog().length).toBeGreaterThanOrEqual(9);

    const config = await platform.ensureInstance({
      connectorId: "hubspot",
      scope: { organizationId: "org-test", schoolId: null },
    });
    await platform.authenticate(config.instanceId);

    const result = await platform.syncNow(config.instanceId, "full");
    expect(result.status === "succeeded" || result.status === "partial").toBe(true);
    expect(result.recordsFetched).toBeGreaterThan(0);
    expect(platform.persistence.listSyncHistory(config.instanceId).length).toBe(1);
    expect(platform.events.list().some((e) => e.type === "SyncCompleted" || e.type === "SyncFailed")).toBe(
      true
    );

    const health = platform.persistence.getHealth(config.instanceId);
    expect(health).toBeTruthy();
    expect(platform.monitorRows().some((r) => r.connectorId === "hubspot")).toBe(true);
  });

  it("processes webhooks through the same sync flow", async () => {
    const platform = registerAllConnectors(createIntegrationPlatform());
    const config = await platform.ensureInstance({
      connectorId: "stripe",
      scope: { organizationId: "org-test" },
    });
    await platform.authenticate(config.instanceId);
    const result = await processWebhook(platform, {
      instanceId: config.instanceId,
      body: { type: "invoice.paid" },
    });
    expect(result.mode).toBe("webhook");
    expect(platform.events.list().some((e) => e.type === "WebhookReceived")).toBe(true);
  });

  it("supports idempotent bootstrap without overwriting catalog entries", async () => {
    const platform = createIntegrationPlatform();
    registerAllConnectors(platform);
    const before = platform.listCatalog().length;
    const version = platform.getConnectorVersion("hubspot");
    registerAllConnectors(platform);
    expect(platform.listCatalog().length).toBe(before);
    expect(platform.getConnectorVersion("hubspot")).toBe(version);
  });
});

