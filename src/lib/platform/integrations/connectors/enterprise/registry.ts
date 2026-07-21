import type { IntegrationPlatformCore } from "@/lib/platform/integrations/services/create-integration-platform-core";
import { ENTERPRISE_PROVIDERS } from "@/lib/platform/integrations/connectors/enterprise/entities";
import { createEnterpriseProviderPlatformConnector } from "@/lib/platform/integrations/connectors/enterprise/providers";

export function registerEnterprisePlatformConnectors(
  platform: IntegrationPlatformCore
): void {
  for (const provider of ENTERPRISE_PROVIDERS) {
    const connector = createEnterpriseProviderPlatformConnector(provider, {
      publisher: platform.publisher,
    });
    if (platform.registry.has(connector.id)) {
      platform.registry.register(connector, { replace: true });
    } else {
      platform.registerConnector(connector);
    }
  }
}
