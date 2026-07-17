import type { ConnectorMetadata } from "@/lib/platform/integrations/common/types";

export const microsoftMetadata: ConnectorMetadata = {
  id: "microsoft",
  name: "Microsoft 365",
  description: "Outlook, OneDrive, Teams, and Entra ID sync.",
  vendor: "Microsoft",
  category: "productivity",
  authMethods: ["oauth2"],
  supportsWebhook: true,
  supportsIncremental: true,
  supportsFullSync: true,
  supportsPolling: true,
  objectTypes: ["user", "message", "calendar_event", "file", "document"],
  version: "0.1.0",
  placeholder: true,
};
