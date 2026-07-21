/**
 * Stripe connector — production via Financial Intelligence package (Sprint 077).
 */

import type { PlaceholderConnectorDeps } from "@/lib/platform/integrations/common/services/placeholder-connector";
import { createFinanceB4Connector } from "@/lib/platform/integrations/connectors/finance/b4-connector";
import { stripeMetadata } from "@/lib/platform/integrations/connectors/finance/stripe";

export { stripeMetadata } from "@/lib/platform/integrations/connectors/finance/stripe";
export {
  createStripePlatformConnector,
  createDemoStripeClient,
  reconnectStripe,
} from "@/lib/platform/integrations/connectors/finance/stripe";

export function createStripeConnector(deps: PlaceholderConnectorDeps) {
  return createFinanceB4Connector(stripeMetadata, "stripe", deps);
}
