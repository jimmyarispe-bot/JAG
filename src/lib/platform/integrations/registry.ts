/**
 * Integration Platform Core — public registry entry.
 */

export {
  PlatformConnectorRegistry,
  PlatformRegistryError,
  createPlatformConnectorRegistry,
  type PlatformRegistryEntry,
  type RegisterPlatformConnectorOptions,
  type PlatformRegistryErrorCode,
} from "@/lib/platform/integrations/core/registry";

/** Convenience: registerConnector(new SomeConnector()) */
export function registerConnector(
  registry: import("@/lib/platform/integrations/core/registry").PlatformConnectorRegistry,
  connector: import("@/lib/platform/integrations/contracts").PlatformConnector
): void {
  registry.register(connector);
}
