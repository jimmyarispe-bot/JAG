import type { ConnectorMetadata } from "@/lib/platform/integrations/common/types";

export const bambooHrMetadata: ConnectorMetadata = {
  id: "bamboohr",
  name: "BambooHR",
  description: "Employee roster and HRIS fields.",
  vendor: "BambooHR",
  category: "hr",
  authMethods: ["api_key"],
  supportsWebhook: false,
  supportsIncremental: true,
  supportsFullSync: true,
  supportsPolling: true,
  objectTypes: ["employee"],
  version: "0.1.0",
  placeholder: true,
};
