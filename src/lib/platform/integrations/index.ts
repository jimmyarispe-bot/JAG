/**
 * Enterprise Integration Platform — public entry.
 *
 * Connectors → Auth → Sync → Normalize → Validate → Persist → Event Bus
 * → (future) Intelligence adapters → Executive Command Center
 */

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
  createDemoGoogleWorkspaceClient,
  getGoogleWorkspaceFeed,
  googleWorkspaceStore,
  googleWorkspaceMetadata,
  googleMetadata,
  googleWorkspaceOAuthConfig,
  normalizeGoogleWorkspaceRecords,
  toSyncRecords as toGoogleWorkspaceSyncRecords,
  correlateGoogleWorkspace,
  scrubPayloadForPrivacy,
} from "@/lib/platform/integrations/connectors/google-workspace";
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
