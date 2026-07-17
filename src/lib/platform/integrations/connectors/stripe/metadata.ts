import type { ConnectorMetadata } from "@/lib/platform/integrations/common/types";

export const stripeMetadata: ConnectorMetadata = {
  id: "stripe",
  name: "Stripe",
  description: "Payments, invoices, and customers.",
  vendor: "Stripe",
  category: "payments",
  authMethods: ["api_key"],
  supportsWebhook: true,
  supportsIncremental: true,
  supportsFullSync: true,
  supportsPolling: true,
  objectTypes: ["payment", "invoice", "customer"],
  version: "0.1.0",
  placeholder: true,
};
