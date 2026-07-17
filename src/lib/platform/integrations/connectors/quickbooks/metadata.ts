import type { ConnectorMetadata } from "@/lib/platform/integrations/common/types";
import { QUICKBOOKS_OBJECT_TYPES } from "./entities";

export const quickbooksMetadata: ConnectorMetadata = {
  id: "quickbooks",
  name: "QuickBooks Online",
  description:
    "Production accounting connector — company, chart of accounts, AR/AP, journals, budgets, and dimensions.",
  vendor: "Intuit",
  category: "finance",
  authMethods: ["oauth2"],
  supportsWebhook: true,
  supportsIncremental: true,
  supportsFullSync: true,
  supportsPolling: true,
  objectTypes: [...QUICKBOOKS_OBJECT_TYPES],
  version: "1.0.0",
  docsUrl: "/docs/product/QUICKBOOKS_CONNECTOR.md",
  placeholder: false,
};
