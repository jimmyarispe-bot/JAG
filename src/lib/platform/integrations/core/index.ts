export {
  assertPlatformConnector,
  createStubPlatformConnector,
  type StubConnectorOptions,
} from "./connector";
export {
  PlatformConnectorRegistry,
  PlatformRegistryError,
  createPlatformConnectorRegistry,
  type PlatformRegistryEntry,
  type RegisterPlatformConnectorOptions,
  type PlatformRegistryErrorCode,
} from "./registry";
export {
  IntegrationAuthFramework,
  createAuthFramework,
  createDefaultAuthAdapters,
  createApiKeyAdapter,
  createBasicAuthAdapter,
  createJwtAdapter,
  createServiceAccountAdapter,
  createOAuth2Adapter,
} from "./auth";
export {
  buildOAuthAuthorizeUrl,
  createOAuthState,
  type OAuth2Config,
  type OAuthAuthorizeParams,
} from "./oauth";
export {
  IntegrationScheduler,
  createScheduler,
  computeNextRunAt,
} from "./scheduler";
export {
  IntegrationSyncEngine,
  createSyncEngine,
  type SyncEngineDependencies,
} from "./sync";
export {
  IntegrationWebhookProcessor,
  createWebhookProcessor,
} from "./webhook";
export {
  withRetry,
  computeBackoff,
  isRetryable,
  CircuitBreaker,
  DEFAULT_RETRY_POLICY,
  type RetryExecutionOptions,
} from "./retry";
export {
  RateLimiter,
  RateLimitRegistry,
  DEFAULT_RATE_LIMIT_POLICY,
} from "./rate-limit";
export { IntegrationCache } from "./cache";
export {
  buildHealthSnapshot,
  deriveOperationalStatus,
  type HealthInput,
} from "./health";
export { TelemetryCollector } from "./telemetry";
export {
  LifecycleManager,
  LIFECYCLE_TRANSITIONS,
} from "./lifecycle";
