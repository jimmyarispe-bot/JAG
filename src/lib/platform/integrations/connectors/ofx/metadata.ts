import type { ConnectorMetadata } from "@/lib/platform/integrations/common/types";

export const ofxMetadata: ConnectorMetadata = {
  id: "ofx",
  name: "OFX Import",
  description: "OFX bank file import (scaffold).",
  vendor: "JAG",
  category: "files",
  authMethods: ["none"],
  supportsWebhook: false,
  supportsIncremental: false,
  supportsFullSync: true,
  supportsPolling: false,
  objectTypes: ["transaction", "account"],
  version: "0.1.0",
  placeholder: true,
};
