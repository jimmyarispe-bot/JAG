/**
 * Microsoft 365 Connector — Sprint 075
 * Same canonical entities as Google Workspace for Copilot neutrality.
 */

export { microsoft365Metadata, microsoftMetadata } from "./metadata";
export {
  createMicrosoft365Connector,
  createMicrosoftConnector,
} from "./connector";
export {
  createMicrosoft365PlatformConnector,
  reconnectMicrosoft365,
  type CreateMicrosoft365PlatformConnectorOptions,
} from "./platform-connector";
export { registerMicrosoft365PlatformConnector } from "./registry";

export {
  createDemoMicrosoft365Client,
  allMicrosoft365ObjectTypes,
  microsoft365Store,
  buildMicrosoft365IntelligenceFeed,
  getMicrosoft365Feed,
  buildUnifiedCommunicationDashboard,
  buildMicrosoft365EccWidgets,
  publishMicrosoft365Events,
  type Microsoft365Client,
  type Microsoft365ListPage,
  type Microsoft365IntelligenceFeed,
  type UnifiedCommunicationDashboard,
  type Microsoft365EccWidgets,
} from "./services";

export {
  runMicrosoft365Sync,
  processMicrosoft365SyncJobs,
  getMicrosoft365SyncProgress,
  memoryMicrosoftSyncRegistry,
  MICROSOFT_365_PROVIDER_VERSION,
  microsoft365InstanceId,
} from "./sync";

export {
  microsoft365CanonicalType,
  microsoft365KgKind,
  buildMicrosoft365Graph,
  toPlatformCanonicalEntity,
  CANONICAL_TYPE,
} from "./mapping";

export {
  normalizeMicrosoft365Records,
  toSyncRecords,
  scrubPayloadForPrivacy,
  resolvePrivacyPolicy,
  jagInternalId,
} from "./normalization";

export {
  MICROSOFT_365_OBJECT_TYPES,
  MICROSOFT_365_KG_KINDS,
  DEFAULT_MICROSOFT_365_PRIVACY,
  type Microsoft365ObjectType,
  type Microsoft365PrivacyPolicy,
  type Microsoft365KgKind,
  type Microsoft365CanonicalEntity,
  type Microsoft365RawEntity,
} from "./entities";

export {
  microsoft365OAuthConfig,
  buildMicrosoft365AuthorizeUrl,
  MICROSOFT_365_OAUTH_SCOPES,
  Microsoft365SessionStore,
  type Microsoft365Tenant,
  type Microsoft365AuthSession,
  type StoredMicrosoft365Session,
} from "./auth";
