/** Connector Orchestrator™ — connector-agnostic orchestration types (no vendor knowledge). */

import type {
  AuthenticationType,
  ConnectorCapability,
  ConnectorCategory,
  ConnectorHealth,
  ConnectorStatus,
  SyncType,
} from "@/lib/connectors/types";

export const CATALOG_STATUSES = [
  "Coming Soon",
  "Available",
  "Installed",
  "Disabled",
  "Deprecated",
] as const;
export type CatalogStatus = (typeof CATALOG_STATUSES)[number];

export const ORCHESTRATOR_SCHEDULES = [
  "Manual",
  "Hourly",
  "Daily",
  "Weekly",
  "Monthly",
  "Disabled",
] as const;
export type OrchestratorSchedule = (typeof ORCHESTRATOR_SCHEDULES)[number];

export const JOB_PRIORITIES = ["High", "Normal", "Low"] as const;
export type JobPriority = (typeof JOB_PRIORITIES)[number];

export const ORCHESTRATOR_HEALTH = [
  "Healthy",
  "Warning",
  "Critical",
  "Offline",
] as const;
export type OrchestratorHealth = (typeof ORCHESTRATOR_HEALTH)[number];

export type CatalogEntry = {
  readonly id: string;
  readonly name: string;
  readonly category: ConnectorCategory | string;
  readonly vendor: string;
  readonly connectorVersion: string;
  readonly authenticationType: AuthenticationType;
  readonly supportedCapabilities: readonly ConnectorCapability[];
  readonly supportedSyncModes: readonly SyncType[];
  readonly requiredPermissions: readonly string[];
  readonly documentationUrl: string;
  readonly status: CatalogStatus;
  readonly dependsOn: readonly string[];
  readonly description: string;
};

export type RegistryRecord = {
  readonly organizationId: string;
  readonly connectorId: string;
  readonly installationId: string;
  readonly installed: boolean;
  readonly enabled: boolean;
  readonly lastSyncAt: string | null;
  readonly nextSyncAt: string | null;
  readonly health: OrchestratorHealth;
  readonly owner: string | null;
  readonly oauthState: "none" | "connected" | "expired" | "revoked";
  readonly refreshTokenStatus: "ok" | "missing" | "expired" | "revoked";
  readonly currentVersion: string;
  readonly schedule: OrchestratorSchedule;
  readonly priority: JobPriority;
  readonly status: ConnectorStatus;
  readonly lastError: string | null;
};

export type RuntimeContext = {
  readonly organizationId: string;
  readonly organizationName: string;
  readonly connectorId: string;
  readonly installationId: string;
  readonly actorUserId: string;
  readonly actorDisplayName: string;
  readonly demo?: boolean;
};

export type RuntimeResult = {
  readonly ok: boolean;
  readonly message: string;
  readonly recordsImported?: number;
  readonly evidenceCreated?: number;
  readonly twinEntitiesUpdated?: number;
  readonly jobId?: string | null;
  readonly metadata?: Readonly<Record<string, string>>;
};

export type ConnectorRuntime = {
  readonly connectorId: string;
  connect(ctx: RuntimeContext): Promise<RuntimeResult>;
  disconnect(ctx: RuntimeContext): Promise<RuntimeResult>;
  validate(ctx: RuntimeContext): Promise<RuntimeResult>;
  sync(ctx: RuntimeContext): Promise<RuntimeResult>;
  health(ctx: RuntimeContext): Promise<RuntimeResult & { health: OrchestratorHealth }>;
  refresh(ctx: RuntimeContext): Promise<RuntimeResult>;
  schedule(
    ctx: RuntimeContext,
    frequency: OrchestratorSchedule
  ): Promise<RuntimeResult>;
  capabilities(): readonly ConnectorCapability[];
};

export type OrchestratorJob = {
  readonly id: string;
  readonly organizationId: string;
  readonly connectorId: string;
  readonly installationId: string;
  readonly priority: JobPriority;
  readonly status: "Queued" | "Running" | "Completed" | "Failed" | "Retrying";
  readonly attempt: number;
  readonly maxAttempts: number;
  readonly createdAt: string;
  readonly startedAt: string | null;
  readonly completedAt: string | null;
  readonly lastError: string | null;
  readonly recordsImported: number;
  readonly durationMs: number | null;
};

export type RetryPolicy = {
  readonly maxRetries: number;
  readonly backoffMs: number;
  readonly retryWindowMs: number;
  readonly failureThreshold: number;
};

export type RateLimitState = {
  readonly connectorId: string;
  readonly organizationId: string;
  readonly requests: number;
  readonly remaining: number;
  readonly resetAt: string;
  readonly providerQuota: number;
};

export type OrchestratorMetrics = {
  readonly syncDurationMsTotal: number;
  readonly syncCount: number;
  readonly recordsImported: number;
  readonly evidenceCreated: number;
  readonly twinEntitiesUpdated: number;
  readonly failures: number;
  readonly retries: number;
  readonly apiUsage: number;
  readonly averageSyncDurationMs: number;
};

export type AuditEventKind =
  | "Connected"
  | "Validated"
  | "Scheduled"
  | "Started"
  | "Completed"
  | "Retried"
  | "Failed"
  | "Disabled"
  | "Removed";

export type OrchestratorAuditEvent = {
  readonly id: string;
  readonly organizationId: string;
  readonly connectorId: string;
  readonly kind: AuditEventKind;
  readonly at: string;
  readonly actor: string;
  readonly message: string;
  readonly metadata: Readonly<Record<string, string>>;
};

export type HealthScoreInput = {
  readonly lastSuccessfulSyncAt: string | null;
  readonly consecutiveFailures: number;
  readonly tokenExpired: boolean;
  readonly queueBacklog: number;
  readonly installationHealth: ConnectorHealth;
  readonly enabled: boolean;
  readonly status: ConnectorStatus;
};
