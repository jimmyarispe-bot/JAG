/**
 * Integration Platform — public entry.
 *
 * Sprint 073 — Integration Platform Core (canonical foundation for all connectors)
 * B4.x — Enterprise Integration Platform (existing vendor connectors & management)
 *
 * Platform infrastructure peer of Intelligence, Security, Identity, Observability.
 * Not part of the intelligence DAG.
 */

/* ── Sprint 073 Integration Platform Core ─────────────────────────────── */

export {
  INTEGRATION_PLATFORM_VERSION,
  type AuthStrategy,
  type SyncMode as PlatformSyncMode,
  type ConnectorLifecycleState,
  type RateLimitState,
  type CircuitState,
  type ConnectorIdentity,
  type ConnectorMetadata as PlatformConnectorMetadata,
  type AuthContext,
  type AuthSession,
  type SyncRequest as PlatformSyncRequest,
  type SyncRecord as PlatformSyncRecord,
  type SyncResult as PlatformSyncResult,
  type HealthSnapshot,
  type TelemetryCounters,
  type TelemetrySnapshot,
  type LifecycleTransition,
  type RetryPolicy,
  type RateLimitPolicy,
  type CircuitBreakerPolicy,
  type ConnectorPolicies,
  type CanonicalEntity,
  type GraphNodeHint,
  type GraphRelationshipHint,
  type PlatformInfrastructurePillar,
} from "@/lib/platform/integrations/types";

export type {
  PlatformConnector,
  PlatformConnectorFactory,
  AuthAdapter,
  AuthFramework,
  SyncEngine,
  SyncScheduler as PlatformSyncScheduler,
  ScheduleEntry as PlatformScheduleEntry,
  WebhookEnvelope,
  WebhookProcessor,
  NormalizationContext,
  FieldMapper,
  RecordValidator,
  Deduplicator,
  IdentityResolver,
  NormalizationPipeline,
} from "@/lib/platform/integrations/contracts";

export {
  assertPlatformConnector,
  createStubPlatformConnector,
  PlatformConnectorRegistry,
  PlatformRegistryError,
  createPlatformConnectorRegistry,
  IntegrationAuthFramework,
  createAuthFramework,
  createDefaultAuthAdapters,
  buildOAuthAuthorizeUrl as buildPlatformOAuthAuthorizeUrl,
  createOAuthState,
  IntegrationScheduler,
  createScheduler,
  computeNextRunAt as computePlatformNextRunAt,
  IntegrationSyncEngine,
  createSyncEngine,
  IntegrationWebhookProcessor,
  createWebhookProcessor,
  withRetry as withPlatformRetry,
  computeBackoff,
  CircuitBreaker,
  DEFAULT_RETRY_POLICY,
  RateLimiter as PlatformRateLimiter,
  RateLimitRegistry,
  DEFAULT_RATE_LIMIT_POLICY,
  IntegrationCache,
  buildHealthSnapshot,
  deriveOperationalStatus,
  TelemetryCollector,
  LifecycleManager,
  LIFECYCLE_TRANSITIONS,
} from "@/lib/platform/integrations/core";

export {
  createNormalizationPipeline,
  IntegrationNormalizationPipeline,
  createFieldMapper,
  createRecordValidator,
  createDeduplicator,
  createIdentityResolver,
} from "@/lib/platform/integrations/normalization";

export {
  PLATFORM_EVENT_TYPES,
  IntegrationEventBus as PlatformEventBus,
  createEventBus,
  EventPublisher,
  createEventPublisher,
  EventSubscriber,
  createEventSubscriber,
  EventDispatcher,
  createEventDispatcher,
  type PlatformEventType,
  type PlatformEvent,
  type PlatformEventHandler,
} from "@/lib/platform/integrations/events";

export {
  GraphEntityBuilder,
  createGraphEntityBuilder,
  GraphRelationshipBuilder,
  createGraphRelationshipBuilder,
  publishGraphIngestHints,
} from "@/lib/platform/integrations/graph";

export {
  createIntegrationPlatformCore,
  PLATFORM_INFRASTRUCTURE_PILLARS,
  PlatformInfrastructureRegistry,
  createPlatformInfrastructureRegistry,
  INTEGRATIONS_PLATFORM_DESCRIPTOR,
  type CreateIntegrationPlatformCoreOptions,
  type IntegrationPlatformCore,
} from "@/lib/platform/integrations/services";

export { registerConnector } from "@/lib/platform/integrations/registry";

/* ── B4.x Enterprise Integration Platform (backward compatible) ───────── */

export type * from "@/lib/platform/integrations/common/types";
export type { Connector, ConnectorFactory } from "@/lib/platform/integrations/common/contracts";

export { CredentialStore } from "@/lib/platform/integrations/common/auth/credential-store";
export {
  authenticatePlaceholder,
  refreshTokenPlaceholder,
  buildOAuthAuthorizeUrl,
} from "@/lib/platform/integrations/common/auth";
export { CursorStore, createSyncJobId, resolveSyncMode } from "@/lib/platform/integrations/common/sync";
export { RateLimiter, withRetry, toErrorMessage } from "@/lib/platform/integrations/common/sync/resilience";
export {
  processWebhook,
  runScheduledPoll,
  listSchedules,
} from "@/lib/platform/integrations/common/sync/scheduling";
export { normalizeRecords } from "@/lib/platform/integrations/common/normalization";
export { validateNormalizedRecords } from "@/lib/platform/integrations/common/validation";
export { IntegrationPersistence } from "@/lib/platform/integrations/common/persistence";
export { IntegrationEventBus, createIntegrationEvent } from "@/lib/platform/integrations/common/events";
export { buildHealthReport, deriveHealthStatus } from "@/lib/platform/integrations/common/health";
export { buildConnectorMonitorRows } from "@/lib/platform/integrations/common/monitoring";
export {
  createIntegrationPlatform,
  createPlaceholderConnector,
  createConnectorRegistry,
  ConnectorRegistry,
  ConnectorRegistryError,
  type CreateIntegrationPlatformOptions,
  type IntegrationPlatform,
  type ConnectorRegistryEntry,
  type ListCatalogOptions,
  type RegisterConnectorOptions,
} from "@/lib/platform/integrations/common/services";
export { registerAllConnectors, CONNECTOR_CATALOG_METADATA } from "@/lib/platform/integrations/connectors/registry";
export {
  getOrCreateRegisteredIntegrationPlatform,
  resetRegisteredIntegrationPlatformForTests,
} from "@/lib/platform/integrations/shared-platform";
export { createVendorConnector } from "@/lib/platform/integrations/connectors/create-vendor-connector";
export {
  createAcademyOsConnector,
  createDemoAcademyOsClient,
  getAcademyOsFeed,
  academyOsStore,
  academyOsMetadata,
} from "@/lib/platform/integrations/connectors/academyos";
export {
  createSquareConnector,
  createDemoSquareClient,
  getSquareFeed,
  squareStore,
  squareMetadata,
  squareOAuthConfig,
  normalizeSquareRecords,
  toSyncRecords as toSquareSyncRecords,
  reconcileSquareQuickBooks,
} from "@/lib/platform/integrations/connectors/square";
export {
  createQuickBooksConnector,
  createDemoQuickBooksClient,
  getQuickBooksFeed,
  quickbooksStore,
  quickbooksMetadata,
  quickbooksOAuthConfig,
  normalizeQuickBooksRecords,
  toSyncRecords,
} from "@/lib/platform/integrations/connectors/quickbooks";
export {
  createPlaidConnector,
  createDemoPlaidClient,
  getPlaidFeed,
  plaidStore,
  plaidMetadata,
  plaidLinkConfig,
  normalizePlaidRecords,
  toSyncRecords as toPlaidSyncRecords,
  reconcilePlaidCash,
} from "@/lib/platform/integrations/connectors/plaid";
export {
  createGoogleWorkspaceConnector,
  createGoogleConnector,
  createGoogleWorkspacePlatformConnector,
  registerGoogleWorkspacePlatformConnector,
  reconnectGoogleWorkspace,
  createDemoGoogleWorkspaceClient,
  getGoogleWorkspaceFeed,
  googleWorkspaceStore,
  googleWorkspaceMetadata,
  googleMetadata,
  googleWorkspaceOAuthConfig,
  buildGoogleWorkspaceAuthorizeUrl,
  normalizeGoogleWorkspaceRecords,
  toSyncRecords as toGoogleWorkspaceSyncRecords,
  correlateGoogleWorkspace,
  scrubPayloadForPrivacy,
  buildGoogleWorkspaceGraph,
  buildGoogleWorkspaceEccWidgets,
  googleWorkspaceCanonicalType,
  GOOGLE_WORKSPACE_OBJECT_TYPES,
  GOOGLE_WORKSPACE_KG_KINDS,
} from "@/lib/platform/integrations/connectors/google-workspace";
export {
  createMicrosoft365Connector,
  createMicrosoftConnector,
  createMicrosoft365PlatformConnector,
  registerMicrosoft365PlatformConnector,
  reconnectMicrosoft365,
  createDemoMicrosoft365Client,
  getMicrosoft365Feed,
  microsoft365Store,
  microsoft365Metadata,
  microsoftMetadata,
  microsoft365OAuthConfig,
  buildMicrosoft365AuthorizeUrl,
  normalizeMicrosoft365Records,
  toSyncRecords as toMicrosoft365SyncRecords,
  scrubPayloadForPrivacy as scrubMicrosoft365PayloadForPrivacy,
  buildMicrosoft365Graph,
  buildUnifiedCommunicationDashboard,
  buildMicrosoft365EccWidgets,
  microsoft365CanonicalType,
  MICROSOFT_365_OBJECT_TYPES,
  MICROSOFT_365_KG_KINDS,
} from "@/lib/platform/integrations/connectors/microsoft-365";
export {
  createSlackPlatformConnector,
  createTeamsPlatformConnector,
  createZoomPlatformConnector,
  createGoogleMeetPlatformConnector,
  createDemoCollaborationClient,
  createDemoSlackClient,
  createDemoTeamsClient,
  createDemoZoomClient,
  createDemoGoogleMeetClient,
  reconnectSlack,
  reconnectTeams,
  reconnectZoom,
  reconnectGoogleMeet,
  registerCollaborationPlatformConnectors,
  buildCommunicationGraph,
  buildCollaborationEccWidgets,
  buildCollaborationExecutiveAlerts,
  collaborationStore,
  slackMetadata,
  teamsMetadata,
  zoomMetadata,
  googleMeetMetadata,
  collaborationCanonicalType,
  COLLABORATION_OBJECT_TYPES,
  COLLABORATION_KG_KINDS,
  COLLABORATION_PROVIDERS,
} from "@/lib/platform/integrations/connectors/collaboration";
export {
  createFinanceQuickBooksPlatformConnector,
  createStripePlatformConnector,
  createFinanceSquarePlatformConnector,
  createFinancePlaidPlatformConnector,
  createDemoFinanceClient,
  createDemoStripeClient,
  reconnectStripe,
  registerFinancePlatformConnectors,
  buildFinancialGraph,
  buildFinanceEccWidgets,
  buildFinanceExecutiveFeed,
  getFinanceExecutiveFeed,
  financeStore,
  stripeMetadata,
  financeCanonicalType,
  FINANCE_OBJECT_TYPES,
  FINANCE_KG_KINDS,
  createFinanceB4Connector,
} from "@/lib/platform/integrations/connectors/finance";
export {
  getGoogleWorkspaceStatus,
  connectGoogleWorkspaceDemo,
  disconnectGoogleWorkspace,
  GOOGLE_WORKSPACE_PROVIDER,
  type GoogleWorkspaceConnectionStatus,
} from "@/lib/platform/integrations/connections";
export {
  createGustoPlatformConnector,
  createEnterpriseProviderPlatformConnector,
  createDemoEnterpriseClient,
  registerEnterprisePlatformConnectors,
  buildEnterpriseGraph,
  buildEnterpriseEccWidgets,
  buildEnterpriseExecutiveFeed,
  getEnterpriseExecutiveFeed,
  enterpriseStore,
  gustoMetadata,
  enterpriseCanonicalType,
  ENTERPRISE_OBJECT_TYPES,
  ENTERPRISE_KG_KINDS,
  ENTERPRISE_PROVIDERS,
  createEnterpriseB4Connector,
} from "@/lib/platform/integrations/connectors/enterprise";
export {
  createAdpPlatformConnector,
  createPaylocityPlatformConnector,
  createBambooHrPlatformConnector,
  createHrProviderPlatformConnector,
  createDemoHrClient,
  registerHrPlatformConnectors,
  buildHrEccWidgets,
  buildHrExecutiveFeed,
  getHrExecutiveFeed,
  computeHrSignals,
  hrStore,
  adpMetadata,
  paylocityMetadata,
  bambooHrMetadata,
  hrCanonicalType,
  HR_OBJECT_TYPES,
  HR_KG_KINDS,
  HR_PROVIDERS,
  createHrB4Connector,
  normalizeHrRecords,
} from "@/lib/platform/integrations/connectors/hr";
export {
  createHubspotPlatformConnector,
  createSalesforcePlatformConnector,
  createCrmProviderPlatformConnector,
  createDemoCrmClient,
  registerCrmPlatformConnectors,
  buildCrmEccWidgets,
  buildCrmExecutiveFeed,
  getCrmExecutiveFeed,
  computeCrmSignals,
  buildExecutiveRelationshipGraph,
  crmStore,
  hubspotMetadata,
  salesforceMetadata,
  crmCanonicalType,
  CRM_OBJECT_TYPES,
  CRM_KG_KINDS,
  CRM_PROVIDERS,
  createCrmB4Connector,
  normalizeCrmRecords,
  reconnectCrmConnector,
} from "@/lib/platform/integrations/connectors/crm";
export {
  createCanvasPlatformConnector,
  createPowerschoolPlatformConnector,
  createGoogleClassroomPlatformConnector,
  createEducationProviderPlatformConnector,
  createDemoEducationClient,
  registerEducationPlatformConnectors,
  buildEducationEccWidgets,
  buildEducationExecutiveFeed,
  getEducationExecutiveFeed,
  computeEducationSignals,
  educationStore,
  canvasMetadata,
  powerschoolMetadata,
  googleClassroomMetadata,
  educationCanonicalType,
  EDUCATION_OBJECT_TYPES,
  EDUCATION_KG_KINDS,
  EDUCATION_PROVIDERS,
  createEducationB4Connector,
  normalizeEducationRecords,
  reconnectEducationConnector,
} from "@/lib/platform/integrations/connectors/education";
export {
  createIntegrationManagement,
  type IntegrationManagement,
  ConnectionManager,
  ConnectorRegistryService,
  CredentialManager,
  IntegrationAuditService,
  ConnectorHealthMonitor,
  RetryManager,
  SyncHistoryService,
  SyncQueueService,
  SyncScheduler,
  computeNextSyncAt,
} from "@/lib/platform/integrations/management";
