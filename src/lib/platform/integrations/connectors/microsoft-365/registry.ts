import type { IntegrationPlatformCore } from "@/lib/platform/integrations/services/create-integration-platform-core";
import {
  createMicrosoft365PlatformConnector,
  type CreateMicrosoft365PlatformConnectorOptions,
} from "@/lib/platform/integrations/connectors/microsoft-365/platform-connector";

export function registerMicrosoft365PlatformConnector(
  platform: IntegrationPlatformCore,
  options: CreateMicrosoft365PlatformConnectorOptions = {}
): void {
  const connector = createMicrosoft365PlatformConnector({
    ...options,
    publisher: options.publisher ?? platform.publisher,
  });
  if (platform.registry.has(connector.id)) {
    platform.registry.register(connector, { replace: true });
    return;
  }
  platform.registerConnector(connector);
}
