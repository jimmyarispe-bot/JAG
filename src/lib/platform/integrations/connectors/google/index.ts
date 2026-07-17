/** Compatibility shim — production implementation lives in `google-workspace/`. */
export {
  googleMetadata,
  googleWorkspaceMetadata,
  createGoogleConnector,
  createGoogleWorkspaceConnector,
  googleWorkspaceStore,
  getGoogleWorkspaceFeed,
} from "@/lib/platform/integrations/connectors/google-workspace";
