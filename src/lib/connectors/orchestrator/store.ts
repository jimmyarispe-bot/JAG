import type {
  OrchestratorAuditEvent,
  OrchestratorJob,
  OrchestratorMetrics,
  RateLimitState,
  RetryPolicy,
} from "@/lib/connectors/orchestrator/types";

type OrchestratorStore = {
  jobs: Map<string, OrchestratorJob>;
  audit: OrchestratorAuditEvent[];
  rateLimits: Map<string, RateLimitState>;
  consecutiveFailures: Map<string, number>;
  metrics: Map<string, OrchestratorMetrics>;
  retryPolicies: Map<string, RetryPolicy>;
  priorities: Map<string, "High" | "Normal" | "Low">;
  owners: Map<string, string>;
};

const DEFAULT_RETRY: RetryPolicy = {
  maxRetries: 3,
  backoffMs: 1_000,
  retryWindowMs: 60 * 60 * 1000,
  failureThreshold: 5,
};

const g = globalThis as typeof globalThis & {
  __jagConnectorOrchestratorStore?: OrchestratorStore;
};

function store(): OrchestratorStore {
  if (!g.__jagConnectorOrchestratorStore) {
    g.__jagConnectorOrchestratorStore = {
      jobs: new Map(),
      audit: [],
      rateLimits: new Map(),
      consecutiveFailures: new Map(),
      metrics: new Map(),
      retryPolicies: new Map(),
      priorities: new Map(),
      owners: new Map(),
    };
  }
  return g.__jagConnectorOrchestratorStore;
}

export function resetOrchestratorStoreForTests(): void {
  g.__jagConnectorOrchestratorStore = {
    jobs: new Map(),
    audit: [],
    rateLimits: new Map(),
    consecutiveFailures: new Map(),
    metrics: new Map(),
    retryPolicies: new Map(),
    priorities: new Map(),
    owners: new Map(),
  };
}

function orgConnectorKey(organizationId: string, connectorId: string): string {
  return `${organizationId}::${connectorId}`;
}

export function upsertOrchestratorJob(job: OrchestratorJob): OrchestratorJob {
  store().jobs.set(job.id, job);
  return job;
}

export function getOrchestratorJob(jobId: string): OrchestratorJob | null {
  return store().jobs.get(jobId) ?? null;
}

export function listOrchestratorJobs(
  organizationId: string
): readonly OrchestratorJob[] {
  return Object.freeze(
    [...store().jobs.values()]
      .filter((j) => j.organizationId === organizationId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  );
}

export function appendOrchestratorAudit(
  event: OrchestratorAuditEvent
): OrchestratorAuditEvent {
  store().audit.push(event);
  if (store().audit.length > 5000) {
    store().audit = store().audit.slice(-4000);
  }
  return event;
}

export function listOrchestratorAudit(
  organizationId: string
): readonly OrchestratorAuditEvent[] {
  return Object.freeze(
    store()
      .audit.filter((e) => e.organizationId === organizationId)
      .sort((a, b) => b.at.localeCompare(a.at))
  );
}

export function getRateLimitState(
  organizationId: string,
  connectorId: string
): RateLimitState | null {
  return store().rateLimits.get(orgConnectorKey(organizationId, connectorId)) ?? null;
}

export function upsertRateLimitState(state: RateLimitState): RateLimitState {
  store().rateLimits.set(
    orgConnectorKey(state.organizationId, state.connectorId),
    state
  );
  return state;
}

export function getConsecutiveFailures(
  organizationId: string,
  connectorId: string
): number {
  return (
    store().consecutiveFailures.get(
      orgConnectorKey(organizationId, connectorId)
    ) ?? 0
  );
}

export function setConsecutiveFailures(
  organizationId: string,
  connectorId: string,
  count: number
): void {
  store().consecutiveFailures.set(
    orgConnectorKey(organizationId, connectorId),
    count
  );
}

export function getRetryPolicy(
  organizationId: string,
  connectorId: string
): RetryPolicy {
  return (
    store().retryPolicies.get(orgConnectorKey(organizationId, connectorId)) ??
    DEFAULT_RETRY
  );
}

export function setRetryPolicy(
  organizationId: string,
  connectorId: string,
  policy: RetryPolicy
): void {
  store().retryPolicies.set(
    orgConnectorKey(organizationId, connectorId),
    policy
  );
}

export function getMetrics(
  organizationId: string
): OrchestratorMetrics {
  return (
    store().metrics.get(organizationId) ?? {
      syncDurationMsTotal: 0,
      syncCount: 0,
      recordsImported: 0,
      evidenceCreated: 0,
      twinEntitiesUpdated: 0,
      failures: 0,
      retries: 0,
      apiUsage: 0,
      averageSyncDurationMs: 0,
    }
  );
}

export function setMetrics(
  organizationId: string,
  metrics: OrchestratorMetrics
): void {
  store().metrics.set(organizationId, metrics);
}

export function getPriority(
  organizationId: string,
  connectorId: string
): "High" | "Normal" | "Low" {
  return (
    store().priorities.get(orgConnectorKey(organizationId, connectorId)) ??
    "Normal"
  );
}

export function setPriority(
  organizationId: string,
  connectorId: string,
  priority: "High" | "Normal" | "Low"
): void {
  store().priorities.set(
    orgConnectorKey(organizationId, connectorId),
    priority
  );
}

export function getOwner(
  organizationId: string,
  connectorId: string
): string | null {
  return store().owners.get(orgConnectorKey(organizationId, connectorId)) ?? null;
}

export function setOwner(
  organizationId: string,
  connectorId: string,
  owner: string
): void {
  store().owners.set(orgConnectorKey(organizationId, connectorId), owner);
}

export { DEFAULT_RETRY };
