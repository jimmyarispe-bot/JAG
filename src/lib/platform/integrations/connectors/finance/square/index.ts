/**
 * Square — transactions, orders, catalog, customers.
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

/** Platform Core metadata (B4 uses connectors/square/metadata.ts). */
export const financeSquareMetadata: ConnectorMetadata = {
  id: "square",
  name: "Square",
  description:
    "Financial intelligence — Square transactions, orders, catalog, and customers.",
  vendor: "Square",
  category: "payments",
  authMethods: ["oauth2"],
  supportsWebhook: true,
  supportsIncremental: true,
  supportsFullSync: true,
  supportsPolling: true,
  objectTypes: [...objectTypesForProvider("square")],
  version: "1.1.0",
  placeholder: false,
};

export function createFinanceSquarePlatformConnector(options: {
  client?: FinanceClient;
  publisher?: EventPublisher;
} = {}) {
  return createFinancePlatformConnector(
    {
      provider: "square",
      displayName: "Square",
      description: financeSquareMetadata.description,
      version: "1.1.0",
      capabilities: ["transactions", "orders", "catalog", "customers"],
    },
    options
  );
}

export function createDemoFinanceSquareClient() {
  return createDemoFinanceClient("square");
}

export { reconnectFinanceConnector as reconnectFinanceSquare };
