/**
 * Plaid — accounts, transactions, balances, cash flow.
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

/** Platform Core metadata (B4 uses connectors/plaid/metadata.ts). */
export const financePlaidMetadata: ConnectorMetadata = {
  id: "plaid",
  name: "Plaid",
  description:
    "Financial intelligence — Plaid accounts, transactions, balances, and cash flow.",
  vendor: "Plaid",
  category: "banking",
  authMethods: ["oauth2"],
  supportsWebhook: true,
  supportsIncremental: true,
  supportsFullSync: true,
  supportsPolling: true,
  objectTypes: [...objectTypesForProvider("plaid")],
  version: "1.0.0",
  placeholder: false,
};

export function createFinancePlaidPlatformConnector(options: {
  client?: FinanceClient;
  publisher?: EventPublisher;
} = {}) {
  return createFinancePlatformConnector(
    {
      provider: "plaid",
      displayName: "Plaid",
      description: financePlaidMetadata.description,
      capabilities: ["accounts", "transactions", "balances", "cash_flow"],
    },
    options
  );
}

export function createDemoFinancePlaidClient() {
  return createDemoFinanceClient("plaid");
}

export { reconnectFinanceConnector as reconnectFinancePlaid };
