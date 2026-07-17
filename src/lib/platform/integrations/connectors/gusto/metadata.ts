import type { ConnectorMetadata } from "@/lib/platform/integrations/common/types";

export const gustoMetadata: ConnectorMetadata = {
  id: "gusto",
  name: "Gusto",
  description: "Payroll and employee sync (scaffold).",
  vendor: "Gusto",
  category: "hr",
  authMethods: ["oauth2"],
  supportsWebhook: true,
  supportsIncremental: true,
  supportsFullSync: true,
  supportsPolling: true,
  objectTypes: ["employee", "payment"],
  version: "0.1.0",
  placeholder: true,
};
