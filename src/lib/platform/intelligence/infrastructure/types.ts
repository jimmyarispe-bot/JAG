/**
 * Intelligence Platform Infrastructure — shared types / DTOs (Sprint 027).
 *
 * Leaf module: no imports from infrastructure implementations (avoids cycles).
 */

/** Semantic version of the shared intelligence platform runtime. */
export const INTELLIGENCE_PLATFORM_VERSION = "0.1.0";

/** Canonical module identifiers registered on the platform. */
export const INTELLIGENCE_MODULE_IDS = [
  "organization-dna",
  "oios-core",
  "organization-health",
  "financial",
  "founder",
  "executive",
  "executive-graph",
  "executive-decision",
  "predictive",
  "board-governance",
  "human-capital",
  "revenue",
  "funding",
  "opportunity",
  "organizational-improvement",
  "business-model",
  "operations",
  "customer",
  "knowledge",
  "document",
] as const;

export type IntelligenceModuleId = (typeof INTELLIGENCE_MODULE_IDS)[number] | (string & {});

/** Module lifecycle phases. */
export const INTELLIGENCE_LIFECYCLE_PHASES = [
  "uninitialized",
  "initializing",
  "ready",
  "running",
  "degraded",
  "shutting_down",
  "stopped",
  "failed",
] as const;

export type IntelligenceLifecyclePhase =
  (typeof INTELLIGENCE_LIFECYCLE_PHASES)[number];

/** Pipeline execution statuses. */
export const INTELLIGENCE_PIPELINE_STATUSES = [
  "pending",
  "running",
  "completed",
  "failed",
  "cancelled",
  "partial",
] as const;

export type IntelligencePipelineStatus =
  (typeof INTELLIGENCE_PIPELINE_STATUSES)[number];

/** Health status bands for modules and the platform. */
export const INTELLIGENCE_HEALTH_STATUSES = [
  "healthy",
  "degraded",
  "unhealthy",
  "unknown",
] as const;

export type IntelligenceHealthStatus =
  (typeof INTELLIGENCE_HEALTH_STATUSES)[number];

/** Platform telemetry / event kinds. */
export const INTELLIGENCE_PLATFORM_EVENT_KINDS = [
  "module.registered",
  "module.unregistered",
  "module.initialized",
  "module.shutdown",
  "module.failed",
  "pipeline.started",
  "pipeline.completed",
  "pipeline.failed",
  "module.executed",
  "cache.hit",
  "cache.miss",
  "scheduler.tick",
  "health.changed",
  "diagnostics.collected",
  "config.updated",
  "metrics.recorded",
] as const;

export type IntelligencePlatformEventKind =
  (typeof INTELLIGENCE_PLATFORM_EVENT_KINDS)[number];

/** Tenant / actor scope for platform execution. */
export interface IntelligencePlatformScope {
  organizationId?: string | null;
  schoolId?: string | null;
  userId?: string | null;
  workspaceId?: string | null;
}

/** Arbitrary metadata bag used across platform surfaces. */
export type IntelligencePlatformMetadata = Record<string, unknown>;

/** Capability descriptor advertised by a module. */
export interface IntelligenceModuleCapability {
  key: string;
  description?: string;
}

/** Health snapshot for a single module. */
export interface IntelligenceModuleHealth {
  moduleId: IntelligenceModuleId;
  status: IntelligenceHealthStatus;
  phase: IntelligenceLifecyclePhase;
  message: string;
  checkedAt: string;
  details?: IntelligencePlatformMetadata;
}

/** Aggregate platform health. */
export interface IntelligencePlatformHealth {
  status: IntelligenceHealthStatus;
  checkedAt: string;
  modules: IntelligenceModuleHealth[];
  summary: string;
}

/** Result produced by a module execution. */
export interface IntelligenceModuleResult {
  moduleId: IntelligenceModuleId;
  ok: boolean;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  data?: unknown;
  error?: string;
  metadata?: IntelligencePlatformMetadata;
}

/** Timed stage record inside a pipeline run. */
export interface IntelligencePipelineStageTiming {
  moduleId: IntelligenceModuleId;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  ok: boolean;
  cached?: boolean;
}

/** Full pipeline run result. */
export interface IntelligencePipelineResult {
  runId: string;
  status: IntelligencePipelineStatus;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  moduleOrder: IntelligenceModuleId[];
  stages: IntelligencePipelineStageTiming[];
  results: IntelligenceModuleResult[];
  errors: Array<{ moduleId: IntelligenceModuleId; message: string }>;
  metadata?: IntelligencePlatformMetadata;
}

/** Module version record. */
export interface IntelligenceModuleVersion {
  moduleId: IntelligenceModuleId;
  version: string;
  platformVersion: string;
  registeredAt: string;
  compatible: boolean;
  notes?: string;
}

/** Metric sample. */
export interface IntelligenceMetricSample {
  name: string;
  value: number;
  unit?: string;
  moduleId?: IntelligenceModuleId;
  tags?: Record<string, string>;
  recordedAt: string;
}

/** Telemetry / platform event envelope. */
export interface IntelligencePlatformEvent {
  eventId: string;
  kind: IntelligencePlatformEventKind;
  occurredAt: string;
  moduleId?: IntelligenceModuleId;
  runId?: string;
  payload?: IntelligencePlatformMetadata;
}

/** Cache entry metadata. */
export interface IntelligenceCacheEntryMeta {
  key: string;
  createdAt: string;
  expiresAt: string | null;
  hits: number;
  moduleId?: IntelligenceModuleId;
}

/** Scheduler job definition. */
export interface IntelligenceSchedulerJob {
  id: string;
  name: string;
  moduleId?: IntelligenceModuleId;
  intervalMs: number;
  enabled: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  runCount: number;
}

/** Diagnostics bundle. */
export interface IntelligenceDiagnosticsReport {
  collectedAt: string;
  platformVersion: string;
  health: IntelligencePlatformHealth;
  versions: IntelligenceModuleVersion[];
  metrics: IntelligenceMetricSample[];
  recentEvents: IntelligencePlatformEvent[];
  cache: {
    size: number;
    hits: number;
    misses: number;
  };
  configuration: IntelligencePlatformMetadata;
  notes: string[];
}

/** Configuration snapshot. */
export interface IntelligenceConfigurationSnapshot {
  updatedAt: string;
  values: Record<string, unknown>;
}

/** Input for a pipeline / module execution request. */
export interface IntelligenceExecutionRequest {
  runId?: string;
  moduleIds?: IntelligenceModuleId[];
  scope?: IntelligencePlatformScope;
  input?: unknown;
  metadata?: IntelligencePlatformMetadata;
  /** When true, skip cache reads (still write on success). */
  bypassCache?: boolean;
  /** When false, do not fail the pipeline if a non-critical module errors. */
  failFast?: boolean;
}
