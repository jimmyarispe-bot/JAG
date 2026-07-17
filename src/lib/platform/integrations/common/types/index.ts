/**
 * Enterprise Integration Platform — shared types.
 * Connector metadata only; no business intelligence.
 */

export type IntegrationScope = {
  organizationId: string;
  schoolId?: string | null;
};

export type AuthMethod = "oauth2" | "api_key" | "service_account" | "none";

export type ConnectorStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "authenticating"
  | "syncing"
  | "paused"
  | "degraded"
  | "error"
  | "offline";

export type SyncMode = "full" | "incremental" | "webhook" | "poll";

export type SyncJobStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "partial"
  | "cancelled";

/** Expanded connector health states for Integration Management. */
export type HealthStatus =
  | "healthy"
  | "warning"
  | "degraded"
  | "offline"
  | "auth_required"
  | "rate_limited"
  | "error"
  | "unhealthy"
  | "unknown";

export type LifecyclePhase =
  | "registered"
  | "configured"
  | "authenticated"
  | "validated"
  | "connected"
  | "initial_sync"
  | "incremental_sync"
  | "monitoring"
  | "retrying"
  | "paused"
  | "disconnected"
  | "removed";

export type SyncTrigger = "manual" | "schedule" | "webhook" | "reconnect" | "retry" | "realtime";

export type ConnectorCategory =
  | "productivity"
  | "finance"
  | "banking"
  | "crm"
  | "hr"
  | "education"
  | "payments"
  | "files"
  | "other";

export type IntegrationEventType =
  | "OrganizationCreated"
  | "TransactionImported"
  | "EmployeeUpdated"
  | "StudentAdded"
  | "InvoicePaid"
  | "OpportunityCreated"
  | "DocumentIndexed"
  | "RecommendationAccepted"
  | "RecommendationRejected"
  | "SyncStarted"
  | "SyncCompleted"
  | "SyncFailed"
  | "ConnectorConnected"
  | "ConnectorDisconnected"
  | "ConnectorOffline"
  | "ConnectorRecovered"
  | "ConnectorPaused"
  | "ConnectorResumed"
  | "ConnectorRemoved"
  | "ConnectorDisabled"
  | "CredentialsUpdated"
  | "AuthenticationExpired"
  | "ApiQuotaWarning"
  | "WebhookReceived"
  | "TokenRefreshed"
  | "ValidationFailed"
  | "DeadLetterEnqueued"
  | "RetryScheduled"
  | "RetrySucceeded"
  | "RetryExhausted";

export interface ConnectorMetadata {
  id: string;
  name: string;
  description: string;
  vendor: string;
  category: ConnectorCategory;
  authMethods: AuthMethod[];
  supportsWebhook: boolean;
  supportsIncremental: boolean;
  supportsFullSync: boolean;
  supportsPolling: boolean;
  objectTypes: string[];
  version: string;
  docsUrl?: string;
  placeholder: boolean;
}

export interface ConnectorConfiguration {
  connectorId: string;
  instanceId: string;
  scope: IntegrationScope;
  enabled: boolean;
  paused?: boolean;
  authMethod: AuthMethod;
  settings: Record<string, unknown>;
  scheduleCron?: string;
  /** Prefer scheduled | webhook | manual | poll */
  syncStrategy?: "manual" | "scheduled" | "realtime" | "poll";
  rateLimitPerMinute?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectorCredentials {
  instanceId: string;
  authMethod: AuthMethod;
  /** Opaque secrets — never log raw values. */
  secrets: Record<string, string>;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  updatedAt: string;
}

export interface AuthResult {
  ok: boolean;
  method: AuthMethod;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  error?: string;
}

export interface SyncCursor {
  instanceId: string;
  objectType: string;
  cursor: string | null;
  updatedAt: string;
}

export interface SyncRequest {
  instanceId: string;
  mode: SyncMode;
  objectTypes?: string[];
  since?: string;
  triggeredBy: SyncTrigger;
}

export interface SyncRecord {
  externalId: string;
  objectType: string;
  payload: Record<string, unknown>;
  updatedAt?: string;
}

export interface NormalizedRecord {
  canonicalType: string;
  externalId: string;
  sourceSystem: string;
  scope: IntegrationScope;
  data: Record<string, unknown>;
  lineage: {
    connectorId: string;
    instanceId: string;
    syncedAt: string;
    rawHash?: string;
  };
}

export interface ValidationIssue {
  severity: "error" | "warning" | "info";
  code: string;
  message: string;
  field?: string;
  externalId?: string;
}

export interface ValidationResult {
  ok: boolean;
  issues: ValidationIssue[];
  accepted: NormalizedRecord[];
  rejected: NormalizedRecord[];
}

export interface SyncResult {
  jobId: string;
  instanceId: string;
  mode: SyncMode;
  status: SyncJobStatus;
  startedAt: string;
  finishedAt: string;
  recordsFetched: number;
  recordsNormalized: number;
  recordsAccepted: number;
  recordsRejected: number;
  errors: string[];
  durationMs: number;
}

export interface ConnectorHealthReport {
  instanceId: string;
  connectorId: string;
  status: HealthStatus;
  connectorStatus: ConnectorStatus;
  lastSyncAt: string | null;
  lastSuccessAt: string | null;
  lastFailedAt?: string | null;
  lastError: string | null;
  availability: number;
  latencyMs: number | null;
  recordsImported24h: number;
  failures24h: number;
  retries24h: number;
  checkedAt: string;
  apiStatus?: "ok" | "degraded" | "unreachable" | "auth_required" | "rate_limited";
  rateLimitRemaining?: number | null;
  rateLimitPerMinute?: number | null;
}

export interface SyncHistoryRecord {
  jobId: string;
  instanceId: string;
  connectorId: string;
  mode: SyncMode;
  status: SyncJobStatus;
  startedAt: string;
  finishedAt: string;
  recordsFetched: number;
  recordsAccepted: number;
  recordsRejected: number;
  durationMs: number;
  errors: string[];
  warnings?: string[];
  retryAttempts?: number;
  triggeredBy: SyncRequest["triggeredBy"];
}

export interface AuditLogEntry {
  id: string;
  instanceId: string;
  connectorId: string;
  action: string;
  actor: string;
  detail: Record<string, unknown>;
  createdAt: string;
}

export interface DeadLetterItem {
  id: string;
  instanceId: string;
  connectorId: string;
  reason: string;
  payload: unknown;
  attempts: number;
  createdAt: string;
  lastAttemptAt: string;
}

export interface IntegrationEvent {
  id: string;
  type: IntegrationEventType;
  instanceId?: string;
  connectorId?: string;
  scope?: IntegrationScope;
  payload: Record<string, unknown>;
  occurredAt: string;
}

export interface ConnectorRuntimeState {
  instanceId: string;
  connectorId: string;
  status: ConnectorStatus;
  lastSyncAt: string | null;
  lastError: string | null;
  connectedAt: string | null;
  lifecyclePhase?: LifecyclePhase;
  pausedAt?: string | null;
}

/** Connection lifecycle tracking for Integration Management. */
export interface ConnectionLifecycleRecord {
  instanceId: string;
  connectorId: string;
  phase: LifecyclePhase;
  authenticated: boolean;
  validated: boolean;
  lastSuccessfulSyncAt: string | null;
  lastFailedSyncAt: string | null;
  nextScheduledSyncAt: string | null;
  retryCount: number;
  updatedAt: string;
}

export interface HealthHistoryRecord {
  id: string;
  instanceId: string;
  connectorId: string;
  status: HealthStatus;
  detail: string;
  recordedAt: string;
}

export interface ErrorHistoryRecord {
  id: string;
  instanceId: string;
  connectorId: string;
  code: string;
  message: string;
  source: "sync" | "auth" | "health" | "queue" | "system";
  recordedAt: string;
}

export interface RetryHistoryRecord {
  id: string;
  instanceId: string;
  connectorId: string;
  jobId: string | null;
  attempt: number;
  maxAttempts: number;
  outcome: "scheduled" | "succeeded" | "failed" | "exhausted";
  reason: string;
  recordedAt: string;
}

export interface SyncQueueItem {
  id: string;
  instanceId: string;
  connectorId: string;
  mode: SyncMode;
  triggeredBy: SyncTrigger;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  enqueuedAt: string;
  startedAt?: string;
  finishedAt?: string;
  priority: number;
  attempts: number;
}

export interface SyncScheduleState {
  instanceId: string;
  connectorId: string;
  enabled: boolean;
  strategy: "manual" | "scheduled" | "realtime" | "poll";
  cron: string | null;
  lastSuccessfulSyncAt: string | null;
  lastFailedSyncAt: string | null;
  nextScheduledSyncAt: string | null;
  lastDurationMs: number | null;
  lastRecordsProcessed: number | null;
  lastErrors: string[];
  retryCount: number;
}
