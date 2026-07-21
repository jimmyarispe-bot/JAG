import type { ConnectorMetadata } from "@/lib/platform/integrations/common/types";
import { GOOGLE_WORKSPACE_OBJECT_TYPES } from "@/lib/platform/integrations/connectors/google-workspace/entities";

/** Connector catalog id remains `google` for Integration Center / phase-1 continuity. */
export const googleWorkspaceMetadata: ConnectorMetadata = {
  id: "google",
  name: "Google Workspace",
  description:
    "Production Google Workspace connector (Sprint 074) — Gmail, Calendar, Drive, Docs, Sheets, Slides, Contacts, Meet, Directory. Metadata-only by default.",
  vendor: "Google",
  category: "productivity",
  authMethods: ["oauth2", "service_account"],
  supportsWebhook: true,
  supportsIncremental: true,
  supportsFullSync: true,
  supportsPolling: true,
  objectTypes: [...GOOGLE_WORKSPACE_OBJECT_TYPES],
  version: "1.1.0",
  docsUrl: "/docs/platform/google-workspace-connector.md",
  placeholder: false,
};

/** @deprecated Use googleWorkspaceMetadata — kept for path re-exports. */
export const googleMetadata = googleWorkspaceMetadata;
