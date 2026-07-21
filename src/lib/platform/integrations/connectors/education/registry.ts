import type { IntegrationPlatformCore } from "@/lib/platform/integrations/services/create-integration-platform-core";
import { EDUCATION_PROVIDERS } from "@/lib/platform/integrations/connectors/education/entities";
import { createEducationProviderPlatformConnector } from "@/lib/platform/integrations/connectors/education/providers";

export function registerEducationPlatformConnectors(
  platform: IntegrationPlatformCore
): void {
  for (const provider of EDUCATION_PROVIDERS) {
    const connector = createEducationProviderPlatformConnector(provider, {
      publisher: platform.publisher,
    });
    if (platform.registry.has(connector.id)) {
      platform.registry.register(connector, { replace: true });
    } else {
      platform.registerConnector(connector);
    }
  }
}
