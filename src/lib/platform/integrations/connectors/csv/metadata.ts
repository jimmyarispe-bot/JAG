import type { ConnectorMetadata } from "@/lib/platform/integrations/common/types";

export const csvMetadata: ConnectorMetadata = {
  id: "csv",
  name: "CSV Import",
  description: "File-based CSV import connector.",
  vendor: "JAG",
  category: "files",
  authMethods: ["none"],
  supportsWebhook: false,
  supportsIncremental: false,
  supportsFullSync: true,
  supportsPolling: false,
  objectTypes: ["student", "employee", "transaction", "contact"],
  version: "0.1.0",
  placeholder: true,
};
