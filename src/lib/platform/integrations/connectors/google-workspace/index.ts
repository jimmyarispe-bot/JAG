export { googleWorkspaceMetadata, googleMetadata } from "./metadata";
export {
  createGoogleWorkspaceConnector,
  createGoogleConnector,
} from "./connector";
export {
  createDemoGoogleWorkspaceClient,
  type GoogleWorkspaceClient,
  type GoogleWorkspaceListPage,
} from "./client";
export { googleWorkspaceStore } from "./store";
export {
  buildGoogleWorkspaceIntelligenceFeed,
  getGoogleWorkspaceFeed,
  type GoogleWorkspaceIntelligenceFeed,
} from "./intelligence-feed";
export {
  googleWorkspaceCanonicalType,
  normalizeGoogleWorkspaceRecords,
  toSyncRecords,
  scrubPayloadForPrivacy,
  resolvePrivacyPolicy,
} from "./normalize";
export {
  GOOGLE_WORKSPACE_OBJECT_TYPES,
  DEFAULT_GOOGLE_WORKSPACE_PRIVACY,
  type GoogleWorkspaceObjectType,
  type GoogleWorkspacePrivacyPolicy,
} from "./entities";
export {
  googleWorkspaceOAuthConfig,
  GOOGLE_WORKSPACE_OAUTH_SCOPES,
  type GoogleWorkspaceDomain,
  type GoogleWorkspaceAuthSession,
} from "./auth";
export {
  correlateGoogleWorkspace,
  type GoogleWorkspaceCorrelation,
  type WorkspaceCorrelationLink,
} from "./correlation";
