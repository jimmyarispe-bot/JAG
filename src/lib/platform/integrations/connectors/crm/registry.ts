import type { IntegrationPlatformCore } from "@/lib/platform/integrations/services/create-integration-platform-core";
import { CRM_PROVIDERS } from "@/lib/platform/integrations/connectors/crm/entities";
import { createCrmProviderPlatformConnector } from "@/lib/platform/integrations/connectors/crm/providers";

export function registerCrmPlatformConnectors(
  platform: IntegrationPlatformCore
): void {
  for (const provider of CRM_PROVIDERS) {
    const connector = createCrmProviderPlatformConnector(provider, {
      publisher: platform.publisher,
    });
    if (platform.registry.has(connector.id)) {
      platform.registry.register(connector, { replace: true });
    } else {
      platform.registerConnector(connector);
    }
  }
}
