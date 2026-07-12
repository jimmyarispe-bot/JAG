/**
 * Intelligence Platform Infrastructure — contracts / interfaces only (Sprint 027).
 *
 * Leaf module relative to implementations: imports types only (avoids cycles).
 */

import type {
  IntelligenceCacheEntryMeta,
  IntelligenceConfigurationSnapshot,
  IntelligenceDiagnosticsReport,
  IntelligenceExecutionRequest,
  IntelligenceHealthStatus,
  IntelligenceLifecyclePhase,
  IntelligenceMetricSample,
  IntelligenceModuleCapability,
  IntelligenceModuleHealth,
  IntelligenceModuleId,
  IntelligenceModuleResult,
  IntelligenceModuleVersion,
  IntelligencePipelineResult,
  IntelligencePlatformEvent,
  IntelligencePlatformEventKind,
  IntelligencePlatformHealth,
  IntelligencePlatformMetadata,
  IntelligencePlatformScope,
  IntelligenceSchedulerJob,
} from "@/lib/platform/intelligence/infrastructure/types";

/** Shared clock / id helpers injectable across infrastructure. */
export interface IntelligencePlatformClock {
  now(): Date;
  createId(prefix: string): string;
}

/** Mutable execution context passed through the pipeline. */
export interface IntelligenceExecutionContext {
  readonly runId: string;
  readonly scope: IntelligencePlatformScope;
  readonly startedAt: string;
  readonly metadata: IntelligencePlatformMetadata;
  readonly bypassCache: boolean;
  readonly failFast: boolean;
  input: unknown;
  set(key: string, value: unknown): void;
  get<T = unknown>(key: string): T | undefined;
  has(key: string): boolean;
  keys(): string[];
  snapshot(): IntelligencePlatformMetadata;
}

/**
 * Contract every platform intelligence module must satisfy.
 * Distinct from {@link IntelligenceDomainModule} (domain routing packs).
 */
export interface IntelligenceModule {
  readonly id: IntelligenceModuleId;
  readonly name: string;
  readonly version: string;
  readonly dependencies: readonly IntelligenceModuleId[];
  readonly capabilities: readonly IntelligenceModuleCapability[];
  initialize?(context: IntelligenceExecutionContext): Promise<void> | void;
  execute(
    context: IntelligenceExecutionContext,
    input?: unknown
  ): Promise<IntelligenceModuleResult>;
  shutdown?(): Promise<void> | void;
  health?(): IntelligenceModuleHealth | Promise<IntelligenceModuleHealth>;
}

export interface IntelligenceRegistry {
  register(module: IntelligenceModule): void;
  unregister(moduleId: IntelligenceModuleId): boolean;
  get(moduleId: IntelligenceModuleId): IntelligenceModule | undefined;
  has(moduleId: IntelligenceModuleId): boolean;
  list(): IntelligenceModule[];
  ids(): IntelligenceModuleId[];
  resolveOrder(moduleIds?: IntelligenceModuleId[]): IntelligenceModuleId[];
  clear(): void;
  size(): number;
}

export interface IntelligencePipeline {
  run(request?: IntelligenceExecutionRequest): Promise<IntelligencePipelineResult>;
  runModule(
    moduleId: IntelligenceModuleId,
    request?: IntelligenceExecutionRequest
  ): Promise<IntelligenceModuleResult>;
}

export interface IntelligenceProvider {
  readonly id: string;
  readonly moduleIds: readonly IntelligenceModuleId[];
  provide(): IntelligenceModule[];
}

export interface IntelligenceLifecycle {
  getPhase(moduleId?: IntelligenceModuleId): IntelligenceLifecyclePhase;
  setPhase(moduleId: IntelligenceModuleId, phase: IntelligenceLifecyclePhase): void;
  initializeAll(context: IntelligenceExecutionContext): Promise<void>;
  shutdownAll(): Promise<void>;
  markRunning(moduleId: IntelligenceModuleId): void;
  markReady(moduleId: IntelligenceModuleId): void;
  markFailed(moduleId: IntelligenceModuleId, message?: string): void;
}

export interface IntelligenceCache {
  get<T = unknown>(key: string): T | undefined;
  set(key: string, value: unknown, ttlMs?: number, moduleId?: IntelligenceModuleId): void;
  has(key: string): boolean;
  delete(key: string): boolean;
  clear(): void;
  size(): number;
  stats(): { hits: number; misses: number; size: number };
  listMeta(): IntelligenceCacheEntryMeta[];
}

export interface IntelligenceMetrics {
  increment(name: string, value?: number, tags?: Record<string, string>, moduleId?: IntelligenceModuleId): void;
  gauge(name: string, value: number, tags?: Record<string, string>, moduleId?: IntelligenceModuleId): void;
  timing(name: string, durationMs: number, tags?: Record<string, string>, moduleId?: IntelligenceModuleId): void;
  list(filter?: { name?: string; moduleId?: IntelligenceModuleId }): IntelligenceMetricSample[];
  snapshot(): IntelligenceMetricSample[];
  clear(): void;
}

export interface IntelligenceTelemetry {
  emit(kind: IntelligencePlatformEventKind, options?: {
    moduleId?: IntelligenceModuleId;
    runId?: string;
    payload?: IntelligencePlatformMetadata;
  }): IntelligencePlatformEvent;
  subscribe(
    listener: (event: IntelligencePlatformEvent) => void,
    filter?: IntelligencePlatformEventKind | IntelligencePlatformEventKind[]
  ): () => void;
  recent(limit?: number): IntelligencePlatformEvent[];
  clear(): void;
}

export interface IntelligenceEvents {
  emit: IntelligenceTelemetry["emit"];
  on: IntelligenceTelemetry["subscribe"];
  recent: IntelligenceTelemetry["recent"];
}

export interface IntelligenceScheduler {
  schedule(job: Omit<IntelligenceSchedulerJob, "lastRunAt" | "nextRunAt" | "runCount"> & {
    lastRunAt?: string | null;
    nextRunAt?: string | null;
    runCount?: number;
  }): IntelligenceSchedulerJob;
  unschedule(jobId: string): boolean;
  list(): IntelligenceSchedulerJob[];
  get(jobId: string): IntelligenceSchedulerJob | undefined;
  tick(now?: Date): Promise<IntelligenceSchedulerJob[]>;
  enable(jobId: string): void;
  disable(jobId: string): void;
  clear(): void;
}

export interface IntelligenceConfiguration {
  get<T = unknown>(key: string, fallback?: T): T | undefined;
  set(key: string, value: unknown): void;
  has(key: string): boolean;
  delete(key: string): boolean;
  snapshot(): IntelligenceConfigurationSnapshot;
  merge(values: Record<string, unknown>): void;
  reset(): void;
}

export interface IntelligenceHealth {
  checkModule(moduleId: IntelligenceModuleId): Promise<IntelligenceModuleHealth>;
  checkAll(): Promise<IntelligencePlatformHealth>;
  status(): IntelligenceHealthStatus;
}

export interface IntelligenceDiagnostics {
  collect(): Promise<IntelligenceDiagnosticsReport>;
}

export interface IntelligenceVersioning {
  record(module: IntelligenceModule): IntelligenceModuleVersion;
  get(moduleId: IntelligenceModuleId): IntelligenceModuleVersion | undefined;
  list(): IntelligenceModuleVersion[];
  isCompatible(moduleId: IntelligenceModuleId, minVersion?: string): boolean;
  platformVersion(): string;
}

/** Dependencies injectable into the platform stack. */
export interface IntelligencePlatformDependencies {
  clock?: IntelligencePlatformClock;
  registry?: IntelligenceRegistry;
  cache?: IntelligenceCache;
  metrics?: IntelligenceMetrics;
  telemetry?: IntelligenceTelemetry;
  events?: IntelligenceEvents;
  lifecycle?: IntelligenceLifecycle;
  scheduler?: IntelligenceScheduler;
  configuration?: IntelligenceConfiguration;
  health?: IntelligenceHealth;
  diagnostics?: IntelligenceDiagnostics;
  versioning?: IntelligenceVersioning;
  pipeline?: IntelligencePipeline;
  providers?: IntelligenceProvider[];
  /** When true (default), auto-register built-in module providers. */
  registerDefaults?: boolean;
}
