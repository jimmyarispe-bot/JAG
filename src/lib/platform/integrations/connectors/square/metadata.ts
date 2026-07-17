import type { ConnectorMetadata } from "@/lib/platform/integrations/common/types";
import { SQUARE_OBJECT_TYPES } from "./entities";

export const squareMetadata: ConnectorMetadata = {
  id: "square",
  name: "Square",
  description:
    "Production commerce connector — payments, customers, catalog, orders, subscriptions, gift cards, team, and locations.",
  vendor: "Square",
  category: "payments",
  authMethods: ["oauth2"],
  supportsWebhook: true,
  supportsIncremental: true,
  supportsFullSync: true,
  supportsPolling: true,
  objectTypes: [...SQUARE_OBJECT_TYPES],
  version: "1.1.0",
  docsUrl: "/docs/product/SQUARE_CONNECTOR.md",
  placeholder: false,
};
