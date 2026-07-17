import { describe, expect, it } from "vitest";
import {
  ConnectorRegistryError,
  createConnectorRegistry,
  createIntegrationPlatform,
  createPlaceholderConnector,
  registerAllConnectors,
  type ConnectorMetadata,
} from "@/lib/platform/integrations";

function stubMetadata(overrides: Partial<ConnectorMetadata> = {}): ConnectorMetadata {
  return {
    id: "test-connector",
    name: "Test Connector",
    description: "Fixture",
    vendor: "test",
    category: "other",
    authMethods: ["none"],
    supportsWebhook: false,
    supportsIncremental: true,
    supportsFullSync: true,
    supportsPolling: false,
    objectTypes: ["item"],
    version: "1.0.0",
    placeholder: true,
    ...overrides,
  };
}

describe("Sprint 020 — Connector Registry", () => {
  it("registers, lists, and returns version", () => {
    const platform = createIntegrationPlatform();
    const connector = createPlaceholderConnector(stubMetadata(), {
      persistence: platform.persistence,
      credentials: platform.credentials,
      events: platform.events,
      cursors: platform.cursors,
    });

    platform.register(connector);
    expect(platform.registry.has("test-connector")).toBe(true);
    expect(platform.getConnectorVersion("test-connector")).toBe("1.0.0");
    expect(platform.listCatalog().map((m) => m.id)).toContain("test-connector");
  });

  it("rejects duplicate registration without replace", () => {
    const platform = createIntegrationPlatform();
    const deps = {
      persistence: platform.persistence,
      credentials: platform.credentials,
      events: platform.events,
      cursors: platform.cursors,
    };
    platform.register(createPlaceholderConnector(stubMetadata(), deps));
    expect(() =>
      platform.register(createPlaceholderConnector(stubMetadata({ version: "1.0.1" }), deps))
    ).toThrow(ConnectorRegistryError);

    platform.register(
      createPlaceholderConnector(stubMetadata({ version: "1.1.0" }), deps),
      { replace: true }
    );
    expect(platform.getConnectorVersion("test-connector")).toBe("1.1.0");
  });

  it("rejects invalid or missing version", () => {
    const registry = createConnectorRegistry();
    const platform = createIntegrationPlatform({ registry });
    const deps = {
      persistence: platform.persistence,
      credentials: platform.credentials,
      events: platform.events,
      cursors: platform.cursors,
    };

    expect(() =>
      registry.register(
        createPlaceholderConnector(stubMetadata({ version: "" }), deps)
      )
    ).toThrow(/version/);

    expect(() =>
      registry.register(
        createPlaceholderConnector(stubMetadata({ version: "v1" }), deps)
      )
    ).toThrow(ConnectorRegistryError);
  });

  it("supports catalog enable/disable and blocks ensureInstance when disabled", async () => {
    const platform = registerAllConnectors(createIntegrationPlatform());
    expect(platform.isConnectorEnabled("hubspot")).toBe(true);

    platform.disableConnector("hubspot");
    expect(platform.isConnectorEnabled("hubspot")).toBe(false);
    expect(platform.listCatalog({ enabledOnly: true }).some((m) => m.id === "hubspot")).toBe(
      false
    );
    expect(platform.listCatalog().some((m) => m.id === "hubspot")).toBe(true);

    await expect(
      platform.ensureInstance({
        connectorId: "hubspot",
        scope: { organizationId: "org-1" },
      })
    ).rejects.toMatchObject({ code: "CONNECTOR_DISABLED" });

    platform.enableConnector("hubspot");
    const config = await platform.ensureInstance({
      connectorId: "hubspot",
      scope: { organizationId: "org-1" },
    });
    expect(config.connectorId).toBe("hubspot");
  });

  it("filters catalog by placeholder and category", () => {
    const platform = registerAllConnectors(createIntegrationPlatform());
    const placeholders = platform.listCatalog({ placeholder: true });
    const production = platform.listCatalog({ placeholder: false });
    expect(placeholders.every((m) => m.placeholder)).toBe(true);
    expect(production.every((m) => !m.placeholder)).toBe(true);
    expect(platform.listCatalog({ category: "finance" }).length).toBeGreaterThan(0);
  });

  it("bootstrap registers the default connector set", () => {
    const platform = registerAllConnectors(createIntegrationPlatform());
    expect(platform.registry.size()).toBeGreaterThanOrEqual(13);
    expect(platform.getConnectorVersion("academyos")).toBe("1.0.0");
  });
});
