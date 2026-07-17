import type { ConnectorMetadata } from "@/lib/platform/integrations/common/types";
import { PLAID_OBJECT_TYPES } from "./entities";

export const plaidMetadata: ConnectorMetadata = {
  id: "plaid",
  name: "Plaid",
  description:
    "Production banking connector — institutions, accounts, transactions, balances, liabilities, investments, and identity via Plaid Link.",
  vendor: "Plaid",
  category: "banking",
  authMethods: ["oauth2"],
  supportsWebhook: true,
  supportsIncremental: true,
  supportsFullSync: true,
  supportsPolling: true,
  objectTypes: [...PLAID_OBJECT_TYPES],
  version: "1.0.0",
  docsUrl: "/docs/product/PLAID_CONNECTOR.md",
  placeholder: false,
};
