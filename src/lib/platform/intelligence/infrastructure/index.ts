/**
 * Intelligence Platform Infrastructure — public API (Sprint 027).
 *
 * Shared platform infrastructure that every intelligence module uses:
 * registration, dependency ordering, execution pipeline, lifecycle,
 * metrics, cache, diagnostics, health, telemetry, scheduling, and versioning.
 */

export {
  INTELLIGENCE_HEALTH_STATUSES,
  INTELLIGENCE_LIFECYCLE_PHASES,
  INTELLIGENCE_MODULE_IDS,
  INTELLIGENCE_PIPELINE_STATUSES,
  INTELLIGENCE_PLATFORM_EVENT_KINDS,
  INTELLIGENCE_PLATFORM_VERSION,
  type IntelligenceCacheEntryMeta,
  type IntelligenceConfigurationSnapshot,
  type IntelligenceDiagnosticsReport,
  type IntelligenceExecutionRequest,
  type IntelligenceHealthStatus,
  type IntelligenceLifecyclePhase,
  type IntelligenceMetricSample,
  type IntelligenceModuleCapability,
  type IntelligenceModuleHealth,
  type IntelligenceModuleId,
  type IntelligenceModuleResult,
  type IntelligenceModuleVersion,
  type IntelligencePipelineResult,
  type IntelligencePipelineStageTiming,
  type IntelligencePipelineStatus,
  type IntelligencePlatformEvent,
  type IntelligencePlatformEventKind,
  type IntelligencePlatformHealth,
  type IntelligencePlatformMetadata,
  type IntelligencePlatformScope,
  type IntelligenceSchedulerJob,
} from "@/lib/platform/intelligence/infrastructure/types";

export type {
  IntelligenceCache as IntelligenceCacheContract,
  IntelligenceConfiguration as IntelligenceConfigurationContract,
  IntelligenceDiagnostics as IntelligenceDiagnosticsContract,
  IntelligenceEvents as IntelligenceEventsContract,
  IntelligenceExecutionContext as IntelligenceExecutionContextContract,
  IntelligenceHealth as IntelligenceHealthContract,
  IntelligenceLifecycle as IntelligenceLifecycleContract,
  IntelligenceMetrics as IntelligenceMetricsContract,
  IntelligenceModule,
  IntelligencePipeline as IntelligencePipelineContract,
  IntelligencePlatformClock,
  IntelligencePlatformDependencies,
  IntelligenceProvider as IntelligenceProviderContract,
  IntelligenceRegistry as IntelligenceRegistryContract,
  IntelligenceScheduler as IntelligenceSchedulerContract,
  IntelligenceTelemetry as IntelligenceTelemetryContract,
  IntelligenceVersioning as IntelligenceVersioningContract,
} from "@/lib/platform/intelligence/infrastructure/contracts";

export {
  createDefaultClock,
  resetPlatformIdSeqForTests,
} from "@/lib/platform/intelligence/infrastructure/clock";

export {
  IntelligenceExecutionContext,
  IntelligenceExecutionContextImpl,
  createExecutionContext,
} from "@/lib/platform/intelligence/infrastructure/execution-context";

export {
  IntelligenceRegistry,
  IntelligenceRegistryError,
  IntelligenceRegistryImpl,
  createIntelligenceRegistry,
} from "@/lib/platform/intelligence/infrastructure/registry";

export {
  IntelligenceCache,
  IntelligenceCacheImpl,
  createIntelligenceCache,
} from "@/lib/platform/intelligence/infrastructure/cache";

export {
  IntelligenceMetrics,
  IntelligenceMetricsImpl,
  createIntelligenceMetrics,
} from "@/lib/platform/intelligence/infrastructure/metrics";

export {
  IntelligenceTelemetry,
  IntelligenceTelemetryImpl,
  createIntelligenceTelemetry,
} from "@/lib/platform/intelligence/infrastructure/telemetry";

export {
  IntelligenceEvents,
  IntelligenceEventsImpl,
  createIntelligenceEvents,
} from "@/lib/platform/intelligence/infrastructure/events";

export {
  IntelligenceLifecycle,
  IntelligenceLifecycleImpl,
  createIntelligenceLifecycle,
} from "@/lib/platform/intelligence/infrastructure/lifecycle";

export {
  IntelligenceScheduler,
  IntelligenceSchedulerImpl,
  createIntelligenceScheduler,
} from "@/lib/platform/intelligence/infrastructure/scheduler";

export {
  IntelligenceConfiguration,
  IntelligenceConfigurationImpl,
  createIntelligenceConfiguration,
} from "@/lib/platform/intelligence/infrastructure/configuration";

export {
  IntelligenceVersioning,
  IntelligenceVersioningImpl,
  createIntelligenceVersioning,
} from "@/lib/platform/intelligence/infrastructure/versioning";

export {
  IntelligenceHealth,
  IntelligenceHealthImpl,
  createIntelligenceHealth,
} from "@/lib/platform/intelligence/infrastructure/health";

export {
  IntelligenceDiagnostics,
  IntelligenceDiagnosticsImpl,
  createIntelligenceDiagnostics,
} from "@/lib/platform/intelligence/infrastructure/diagnostics";

export {
  IntelligencePipeline,
  IntelligencePipelineImpl,
  createIntelligencePipeline,
} from "@/lib/platform/intelligence/infrastructure/pipeline";

export {
  IntelligenceProvider,
  IntelligenceProviderImpl,
  createIntelligenceProvider,
  registerProviders,
} from "@/lib/platform/intelligence/infrastructure/provider";

export { createModuleResult } from "@/lib/platform/intelligence/infrastructure/module-result";

export {
  createOrganizationHealthModule,
  createFinancialIntelligenceModule,
  createFounderIntelligenceModule,
  createExecutiveIntelligenceModule,
  createExecutiveGraphModule,
  createExecutiveDecisionModule,
  createPredictiveIntelligenceModule,
  createBoardGovernanceModule,
  createOrganizationDnaModule,
  createOiosCoreModule,
  createHumanCapitalModule,
  createRevenueModule,
  createFundingModule,
  createOpportunityModule,
  createOrganizationalImprovementModule,
  createDefaultIntelligenceModules,
  createDefaultIntelligenceProvider,
  ORGANIZATION_HEALTH_MODULE_VERSION,
  FINANCIAL_INTELLIGENCE_MODULE_VERSION,
  FOUNDER_INTELLIGENCE_MODULE_VERSION,
} from "@/lib/platform/intelligence/infrastructure/modules";

export {
  createIntelligencePlatform,
  type CreateIntelligencePlatformOptions,
  type IntelligencePlatformStack,
} from "@/lib/platform/intelligence/infrastructure/platform";
