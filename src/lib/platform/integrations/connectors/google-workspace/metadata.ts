import type { ConnectorMetadata } from "@/lib/platform/integrations/common/types";
import { GOOGLE_WORKSPACE_OBJECT_TYPES } from "./entities";

/** Connector catalog id remains `google` for Integration Center / phase-1 continuity. */
export const googleWorkspaceMetadata: ConnectorMetadata = {
  id: "google",
  name: "Google Workspace",
  description:
    "Production productivity connector — Gmail metadata, Calendar, Drive, Docs, Sheets, Meet, Tasks, and Directory (metadata-only by default).",
  vendor: "Google",
  category: "productivity",
  authMethods: ["oauth2", "service_account"],
  supportsWebhook: true,
  supportsIncremental: true,
  supportsFullSync: true,
  supportsPolling: true,
  objectTypes: [...GOOGLE_WORKSPACE_OBJECT_TYPES],
  version: "1.0.0",
  docsUrl: "/docs/product/GOOGLE_WORKSPACE_CONNECTOR.md",
  placeholder: false,
};

/** @deprecated Use googleWorkspaceMetadata — kept for path re-exports. */
export const googleMetadata = googleWorkspaceMetadata;
