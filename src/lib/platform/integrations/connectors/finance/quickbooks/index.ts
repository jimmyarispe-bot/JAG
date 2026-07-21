/**
 * QuickBooks — customers, vendors, bills, invoices, payments, accounts.
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

/** Platform Core metadata (B4 uses connectors/quickbooks/metadata.ts). */
export const financeQuickBooksMetadata: ConnectorMetadata = {
  id: "quickbooks",
  name: "QuickBooks",
  description:
    "Financial intelligence — QuickBooks customers, vendors, bills, invoices, payments, and accounts.",
  vendor: "Intuit",
  category: "finance",
  authMethods: ["oauth2"],
  supportsWebhook: true,
  supportsIncremental: true,
  supportsFullSync: true,
  supportsPolling: true,
  objectTypes: [...objectTypesForProvider("quickbooks")],
  version: "1.0.0",
  placeholder: false,
};

export function createFinanceQuickBooksPlatformConnector(options: {
  client?: FinanceClient;
  publisher?: EventPublisher;
} = {}) {
  return createFinancePlatformConnector(
    {
      provider: "quickbooks",
      displayName: "QuickBooks",
      description: financeQuickBooksMetadata.description,
      capabilities: ["customers", "vendors", "bills", "invoices", "payments", "accounts"],
    },
    options
  );
}

export function createDemoFinanceQuickBooksClient() {
  return createDemoFinanceClient("quickbooks");
}

export { reconnectFinanceConnector as reconnectFinanceQuickBooks };
