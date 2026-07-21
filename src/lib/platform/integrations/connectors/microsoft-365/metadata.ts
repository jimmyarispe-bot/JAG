import type { ConnectorMetadata } from "@/lib/platform/integrations/common/types";
import { MICROSOFT_365_OBJECT_TYPES } from "@/lib/platform/integrations/connectors/microsoft-365/entities";

/** Catalog id remains `microsoft` for Integration Center continuity. */
export const microsoft365Metadata: ConnectorMetadata = {
  id: "microsoft",
  name: "Microsoft 365",
  description:
    "Production Microsoft 365 connector (Sprint 075) — Outlook, Calendar, OneDrive, SharePoint, Teams, People, Groups. Metadata-only by default.",
  vendor: "Microsoft",
  category: "productivity",
  authMethods: ["oauth2"],
  supportsWebhook: true,
  supportsIncremental: true,
  supportsFullSync: true,
  supportsPolling: true,
  objectTypes: [...MICROSOFT_365_OBJECT_TYPES],
  version: "1.1.0",
  docsUrl: "/docs/platform/microsoft-365-connector.md",
  placeholder: false,
};

/** @deprecated Use microsoft365Metadata */
export const microsoftMetadata = microsoft365Metadata;
