export type {
  AuditEventKind,
  CatalogEntry,
  CatalogStatus,
  ConnectorRuntime,
  HealthScoreInput,
  JobPriority,
  OrchestratorAuditEvent,
  OrchestratorHealth,
  OrchestratorJob,
  OrchestratorMetrics,
  OrchestratorSchedule,
  RateLimitState,
  RegistryRecord,
  RetryPolicy,
  RuntimeContext,
  RuntimeResult,
} from "@/lib/connectors/orchestrator/types";
export {
  CATALOG_STATUSES,
  JOB_PRIORITIES,
  ORCHESTRATOR_HEALTH,
  ORCHESTRATOR_SCHEDULES,
} from "@/lib/connectors/orchestrator/types";
export { createConnectorCatalog } from "@/lib/connectors/orchestrator/catalog";
export { createConnectorOrgRegistry } from "@/lib/connectors/orchestrator/registry";
export {
  createConnectorRuntimeRegistry,
  type ConnectorRuntimeRegistry,
} from "@/lib/connectors/orchestrator/runtime";
export {
  createConnectorOrchestrator,
  type ConnectorOrchestrator,
} from "@/lib/connectors/orchestrator/orchestrator";
export { createOrchestratorScheduler } from "@/lib/connectors/orchestrator/scheduler";
export { createConnectorLifecycle } from "@/lib/connectors/orchestrator/lifecycle";
export {
  createOrchestratorHealthService,
  type OrchestratorHealthService,
} from "@/lib/connectors/orchestrator/health";
export { createConnectorMetricsService } from "@/lib/connectors/orchestrator/metrics";
export { createConnectorDependencyManager } from "@/lib/connectors/orchestrator/dependency-manager";
export { createConnectorRetryManager } from "@/lib/connectors/orchestrator/retry-manager";
export { createConnectorRateLimitManager } from "@/lib/connectors/orchestrator/rate-limit-manager";
export { createConnectorTokenManager } from "@/lib/connectors/orchestrator/token-manager";
export { createConnectorAudit } from "@/lib/connectors/orchestrator/audit";
export { createQuickBooksRuntime } from "@/lib/connectors/orchestrator/adapters/quickbooks";
export { createGoogleWorkspaceRuntime } from "@/lib/connectors/orchestrator/adapters/google-workspace";
export {
  resetOrchestratorStoreForTests,
  listOrchestratorJobs,
  listOrchestratorAudit,
} from "@/lib/connectors/orchestrator/store";

import { createGoogleWorkspaceRuntime } from "@/lib/connectors/orchestrator/adapters/google-workspace";
import { createQuickBooksRuntime } from "@/lib/connectors/orchestrator/adapters/quickbooks";
import {
  createConnectorOrchestrator,
  type ConnectorOrchestrator,
} from "@/lib/connectors/orchestrator/orchestrator";
import { createConnectorRuntimeRegistry } from "@/lib/connectors/orchestrator/runtime";

/** Platform composition root — registers known connector runtimes outside the orchestrator core. */
export function createPlatformConnectorOrchestrator(): ConnectorOrchestrator {
  const runtime = createConnectorRuntimeRegistry();
  runtime.register(createQuickBooksRuntime());
  runtime.register(createGoogleWorkspaceRuntime());
  return createConnectorOrchestrator({ runtime });
}

let singleton: ConnectorOrchestrator | null = null;

export function getConnectorOrchestrator(): ConnectorOrchestrator {
  if (!singleton) singleton = createPlatformConnectorOrchestrator();
  return singleton;
}

export function resetConnectorOrchestratorForTests(): void {
  singleton = null;
}
