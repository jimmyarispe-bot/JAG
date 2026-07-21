/**
 * Integration Platform Core (Sprint 073) — shared types.
 * Provider-agnostic; no vendor-specific assumptions.
 */

export const INTEGRATION_PLATFORM_VERSION = "0.1.0";

export type AuthStrategy =
  | "oauth2"
  | "api_key"
  | "service_account"
  | "jwt"
  | "basic";

export type SyncMode = "manual" | "scheduled" | "incremental" | "full";

export type ConnectorLifecycleState =
  | "installing"
  | "authenticating"
  | "connected"
  | "syncing"
  | "healthy"
  | "warning"
  | "error"
  | "disabled"
  | "disconnected";

export type RateLimitState = "open" | "throttled" | "blocked";

export type CircuitState = "closed" | "open" | "half_open";

export interface ConnectorIdentity {
  readonly id: string;
  readonly version: string;
  readonly displayName: string;
  readonly provider: string;
}

export interface ConnectorMetadata extends ConnectorIdentity {
  readonly description?: string;
  readonly authStrategies: readonly AuthStrategy[];
  readonly syncModes: readonly SyncMode[];
  readonly supportsWebhooks: boolean;
  readonly capabilities: readonly string[];
}

export interface AuthContext {
  readonly connectorId: string;
  readonly instanceId: string;
  readonly strategy: AuthStrategy;
  readonly credentials: Record<string, string>;
  readonly expiresAt?: string;
  readonly metadata?: Record<string, unknown>;
}

export interface AuthSession {
  readonly ok: boolean;
  readonly strategy: AuthStrategy;
  readonly accessToken?: string;
  readonly refreshToken?: string;
  readonly expiresAt?: string;
  readonly error?: string;
  readonly metadata?: Record<string, unknown>;
}

export interface SyncRequest {
  readonly connectorId: string;
  readonly instanceId: string;
  readonly mode: SyncMode;
  readonly objectTypes?: readonly string[];
  readonly since?: string;
  readonly cursor?: string | null;
  readonly triggeredBy: "manual" | "scheduler" | "webhook" | "retry";
}

export interface SyncRecord {
  readonly externalId: string;
  readonly objectType: string;
  readonly payload: Record<string, unknown>;
  readonly updatedAt?: string;
}

export interface SyncResult {
  readonly jobId: string;
  readonly connectorId: string;
  readonly instanceId: string;
  readonly mode: SyncMode;
  readonly status: "succeeded" | "failed" | "partial" | "cancelled";
  readonly recordsFetched: number;
  readonly recordsNormalized: number;
  readonly recordsDeduped: number;
  readonly durationMs: number;
  readonly cursor?: string | null;
  readonly error?: string;
  readonly startedAt: string;
  readonly finishedAt: string;
}

export interface HealthSnapshot {
  readonly connectorId: string;
  readonly instanceId: string;
  readonly connectionStatus: ConnectorLifecycleState;
  readonly lastSuccessfulSync: string | null;
  readonly lastFailedSync: string | null;
  readonly lastSyncDurationMs: number | null;
  readonly recordsProcessed: number;
  readonly errorCount: number;
  readonly rateLimitState: RateLimitState;
  readonly circuitState: CircuitState;
  readonly message?: string;
  readonly checkedAt: string;
}

export interface TelemetryCounters {
  syncStarted: number;
  syncSucceeded: number;
  syncFailed: number;
  recordsProcessed: number;
  errors: number;
  retries: number;
  rateLimitHits: number;
}

export interface TelemetrySnapshot {
  readonly connectorId: string;
  readonly instanceId: string;
  readonly counters: TelemetryCounters;
  readonly lastSuccessfulSync: string | null;
  readonly lastFailedSync: string | null;
  readonly lastSyncDurationMs: number | null;
  readonly rateLimitState: RateLimitState;
  readonly updatedAt: string;
}

export interface LifecycleTransition {
  readonly id: string;
  readonly connectorId: string;
  readonly instanceId: string;
  readonly from: ConnectorLifecycleState;
  readonly to: ConnectorLifecycleState;
  readonly reason: string;
  readonly occurredAt: string;
  readonly metadata?: Record<string, unknown>;
}

export interface RetryPolicy {
  readonly maxAttempts: number;
  readonly baseDelayMs: number;
  readonly maxDelayMs: number;
  readonly jitter?: boolean;
  readonly retryableErrors?: readonly string[];
}

export interface RateLimitPolicy {
  readonly maxRequests: number;
  readonly windowMs: number;
  readonly burst?: number;
}

export interface CircuitBreakerPolicy {
  readonly failureThreshold: number;
  readonly successThreshold: number;
  readonly openMs: number;
}

export interface ConnectorPolicies {
  readonly retry?: RetryPolicy;
  readonly rateLimit?: RateLimitPolicy;
  readonly circuitBreaker?: CircuitBreakerPolicy;
  readonly timeoutMs?: number;
}

export interface CanonicalEntity {
  readonly id: string;
  readonly canonicalType: string;
  readonly externalId: string;
  readonly sourceSystem: string;
  readonly connectorId: string;
  readonly instanceId: string;
  readonly data: Record<string, unknown>;
  readonly identityKey: string;
  readonly contentHash: string;
  readonly syncedAt: string;
}

export interface GraphNodeHint {
  readonly nodeId: string;
  readonly label: string;
  readonly entityType: string;
  readonly properties: Record<string, unknown>;
  readonly sourceEntityId: string;
}

export interface GraphRelationshipHint {
  readonly relationshipId: string;
  readonly type: string;
  readonly fromNodeId: string;
  readonly toNodeId: string;
  readonly properties?: Record<string, unknown>;
}

export interface PlatformInfrastructurePillar {
  readonly id:
    | "intelligence"
    | "integrations"
    | "security"
    | "identity"
    | "observability";
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly intelligenceDag: boolean;
}
