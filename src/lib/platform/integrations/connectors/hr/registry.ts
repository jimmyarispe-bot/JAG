import type { IntegrationPlatformCore } from "@/lib/platform/integrations/services/create-integration-platform-core";
import { HR_PROVIDERS } from "@/lib/platform/integrations/connectors/hr/entities";
import { createHrProviderPlatformConnector } from "@/lib/platform/integrations/connectors/hr/providers";

export function registerHrPlatformConnectors(
  platform: IntegrationPlatformCore
): void {
  for (const provider of HR_PROVIDERS) {
    const connector = createHrProviderPlatformConnector(provider, {
      publisher: platform.publisher,
    });
    if (platform.registry.has(connector.id)) {
      platform.registry.register(connector, { replace: true });
    } else {
      platform.registerConnector(connector);
    }
  }
}
