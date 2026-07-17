import type { ConnectorMetadata } from "@/lib/platform/integrations/common/types";

export const salesforceMetadata: ConnectorMetadata = {
  id: "salesforce",
  name: "Salesforce",
  description: "Salesforce CRM objects (scaffold).",
  vendor: "Salesforce",
  category: "crm",
  authMethods: ["oauth2"],
  supportsWebhook: true,
  supportsIncremental: true,
  supportsFullSync: true,
  supportsPolling: true,
  objectTypes: ["contact", "company", "deal"],
  version: "0.1.0",
  placeholder: true,
};
