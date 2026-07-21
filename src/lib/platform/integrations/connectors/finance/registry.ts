import type { IntegrationPlatformCore } from "@/lib/platform/integrations/services/create-integration-platform-core";
import { createFinanceQuickBooksPlatformConnector } from "@/lib/platform/integrations/connectors/finance/quickbooks";
import { createStripePlatformConnector } from "@/lib/platform/integrations/connectors/finance/stripe";
import { createFinanceSquarePlatformConnector } from "@/lib/platform/integrations/connectors/finance/square";
import { createFinancePlaidPlatformConnector } from "@/lib/platform/integrations/connectors/finance/plaid";

export function registerFinancePlatformConnectors(
  platform: IntegrationPlatformCore
): void {
  const connectors = [
    createFinanceQuickBooksPlatformConnector({ publisher: platform.publisher }),
    createStripePlatformConnector({ publisher: platform.publisher }),
    createFinanceSquarePlatformConnector({ publisher: platform.publisher }),
    createFinancePlaidPlatformConnector({ publisher: platform.publisher }),
  ];
  for (const connector of connectors) {
    if (platform.registry.has(connector.id)) {
      platform.registry.register(connector, { replace: true });
    } else {
      platform.registerConnector(connector);
    }
  }
}
