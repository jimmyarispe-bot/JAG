/**
 * Google Workspace Connector — Sprint 074
 * Production connector on Integration Platform Core + B4 compatibility.
 */

export { googleWorkspaceMetadata, googleMetadata } from "./metadata";
export {
  createGoogleWorkspaceConnector,
  createGoogleConnector,
} from "./connector";
export {
  createGoogleWorkspacePlatformConnector,
  reconnectGoogleWorkspace,
  type CreateGoogleWorkspacePlatformConnectorOptions,
} from "./platform-connector";
export { registerGoogleWorkspacePlatformConnector } from "./registry";

export {
  createDemoGoogleWorkspaceClient,
  allGoogleWorkspaceObjectTypes,
  googleWorkspaceStore,
  buildGoogleWorkspaceIntelligenceFeed,
  getGoogleWorkspaceFeed,
  correlateGoogleWorkspace,
  buildGoogleWorkspaceEccWidgets,
  projectEccWidgets,
  publishGoogleWorkspaceEvents,
  type GoogleWorkspaceClient,
  type GoogleWorkspaceListPage,
  type GoogleWorkspaceIntelligenceFeed,
  type GoogleWorkspaceCorrelation,
  type WorkspaceCorrelationLink,
  type GoogleWorkspaceEccWidgets,
} from "./services";

export {
  googleWorkspaceCanonicalType,
  googleWorkspaceKgKind,
  buildGoogleWorkspaceGraph,
  toPlatformCanonicalEntity,
  CANONICAL_TYPE,
} from "./mapping";

export {
  normalizeGoogleWorkspaceRecords,
  toSyncRecords,
  scrubPayloadForPrivacy,
  resolvePrivacyPolicy,
  jagInternalId,
} from "./normalization";

export {
  GOOGLE_WORKSPACE_OBJECT_TYPES,
  GOOGLE_WORKSPACE_KG_KINDS,
  DEFAULT_GOOGLE_WORKSPACE_PRIVACY,
  type GoogleWorkspaceObjectType,
  type GoogleWorkspacePrivacyPolicy,
  type GoogleWorkspaceKgKind,
  type GoogleWorkspaceCanonicalEntity,
  type GoogleWorkspaceRawEntity,
} from "./entities";

export {
  googleWorkspaceOAuthConfig,
  buildGoogleWorkspaceAuthorizeUrl,
  GOOGLE_WORKSPACE_OAUTH_SCOPES,
  GoogleWorkspaceSessionStore,
  type GoogleWorkspaceDomain,
  type GoogleWorkspaceAuthSession,
  type StoredGoogleSession,
} from "./auth";
