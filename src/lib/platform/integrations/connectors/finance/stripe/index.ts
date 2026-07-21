/**
 * Stripe — customers, payments, refunds, subscriptions.
 */

import {
  createFinancePlatformConnector,
  reconnectFinanceConnector,
} from "@/lib/platform/integrations/connectors/finance/services/platform-connector";
import type { EventPublisher } from "@/lib/platform/integrations/events/publisher";
import type { FinanceClient } from "@/lib/platform/integrations/connectors/finance/services/client";
import { createDemoFinanceClient } from "@/lib/platform/integrations/connectors/finance/services/client";
import type { ConnectorMetadata } from "@/lib/platform/integrations/common/types";
import { objectTypesForProvider } from "@/lib/platform/integrations/connectors/finance/services/demo-catalog";

export const stripeMetadata: ConnectorMetadata = {
  id: "stripe",
  name: "Stripe",
  description:
    "Financial intelligence — Stripe customers, payments, refunds, and subscriptions.",
  vendor: "Stripe",
  category: "payments",
  authMethods: ["api_key", "oauth2"],
  supportsWebhook: true,
  supportsIncremental: true,
  supportsFullSync: true,
  supportsPolling: true,
  objectTypes: [...objectTypesForProvider("stripe")],
  version: "1.0.0",
  placeholder: false,
};

export function createStripePlatformConnector(options: {
  client?: FinanceClient;
  publisher?: EventPublisher;
} = {}) {
  return createFinancePlatformConnector(
    {
      provider: "stripe",
      displayName: "Stripe",
      description: stripeMetadata.description,
      capabilities: ["customers", "payments", "refunds", "subscriptions"],
    },
    options
  );
}

export function createDemoStripeClient() {
  return createDemoFinanceClient("stripe");
}

export { reconnectFinanceConnector as reconnectStripe };
