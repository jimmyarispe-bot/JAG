import type { ConnectorMetadata } from "@/lib/platform/integrations/common/types";

export const hubspotMetadata: ConnectorMetadata = {
  id: "hubspot",
  name: "HubSpot",
  description: "CRM contacts, companies, and deals.",
  vendor: "HubSpot",
  category: "crm",
  authMethods: ["oauth2", "api_key"],
  supportsWebhook: true,
  supportsIncremental: true,
  supportsFullSync: true,
  supportsPolling: true,
  objectTypes: ["contact", "company", "deal"],
  version: "0.1.0",
  placeholder: true,
};
