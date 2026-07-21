/**
 * Synchronization framework — manual, scheduled, incremental, full.
 */

import type { PlatformConnector } from "@/lib/platform/integrations/contracts";
import type { SyncEngine } from "@/lib/platform/integrations/contracts/sync-contract";
import type { SyncMode, SyncRequest, SyncResult } from "@/lib/platform/integrations/types";
import { RateLimitRegistry } from "@/lib/platform/integrations/core/rate-limit";
import { CircuitBreaker, withRetry } from "@/lib/platform/integrations/core/retry";
import type { ConnectorPolicies } from "@/lib/platform/integrations/types";
import { TelemetryCollector } from "@/lib/platform/integrations/core/telemetry";
import { LifecycleManager } from "@/lib/platform/integrations/core/lifecycle";

export type SyncEngineDependencies = {
  telemetry?: TelemetryCollector;
  lifecycle?: LifecycleManager;
  rateLimits?: RateLimitRegistry;
  policiesFor?: (connectorId: string) => ConnectorPolicies;
  now?: () => Date;
  createJobId?: () => string;
};

export class IntegrationSyncEngine implements SyncEngine {
  private readonly cursors = new Map<string, string | null>();
  private readonly circuits = new Map<string, CircuitBreaker>();
  private readonly telemetry: TelemetryCollector;
  private readonly lifecycle: LifecycleManager;
  private readonly rateLimits: RateLimitRegistry;
  private readonly policiesFor: (connectorId: string) => ConnectorPolicies;
  private readonly now: () => Date;
  private readonly createJobId: () => string;
  private jobSeq = 0;

  constructor(deps: SyncEngineDependencies = {}) {
    this.telemetry = deps.telemetry ?? new TelemetryCollector();
    this.lifecycle = deps.lifecycle ?? new LifecycleManager();
    this.rateLimits = deps.rateLimits ?? new RateLimitRegistry();
    this.policiesFor = deps.policiesFor ?? (() => ({}));
    this.now = deps.now ?? (() => new Date());
    this.createJobId =
      deps.createJobId ?? (() => `sync-${++this.jobSeq}-${this.now().getTime().toString(36)}`);
  }

  resolveMode(requested: SyncMode | undefined, hasCursor: boolean): SyncMode {
    if (requested === "manual" || requested === "scheduled") return requested;
    if (requested === "full") return "full";
    if (requested === "incremental") return hasCursor ? "incremental" : "full";
    return hasCursor ? "incremental" : "full";
  }

  getCursor(instanceId: string): string | null {
    return this.cursors.get(instanceId) ?? null;
  }

  setCursor(instanceId: string, cursor: string | null): void {
    this.cursors.set(instanceId, cursor);
  }

  async run(connector: PlatformConnector, request: SyncRequest): Promise<SyncResult> {
    const policies = this.policiesFor(connector.id);
    const mode = this.resolveMode(request.mode, this.getCursor(request.instanceId) != null);
    const startedAt = this.now();
    const jobId = this.createJobId();

    this.telemetry.recordSyncStart(connector.id, request.instanceId);
    try {
      this.lifecycle.transition({
        connectorId: connector.id,
        instanceId: request.instanceId,
        to: "syncing",
        reason: `sync:${mode}`,
      });
    } catch {
      // Allow sync when already syncing/healthy/connected; seed if disconnected.
      if (this.lifecycle.getState(request.instanceId) === "disconnected") {
        this.lifecycle.seed(request.instanceId, "connected");
        this.lifecycle.transition({
          connectorId: connector.id,
          instanceId: request.instanceId,
          to: "syncing",
          reason: `sync:${mode}`,
        });
      }
    }

    const limiter = this.rateLimits.forConnector(connector.id, policies.rateLimit);
    const circuit = this.getCircuit(connector.id, policies);

    try {
      const result = await withRetry(
        async () => {
          await limiter.acquire();
          return circuit.execute(async () =>
            connector.sync({
              ...request,
              mode,
              cursor: request.cursor ?? this.getCursor(request.instanceId),
            })
          );
        },
        {
          policy: policies.retry,
          timeoutMs: policies.timeoutMs,
          onRetry: () => this.telemetry.recordRetry(connector.id, request.instanceId),
        }
      );

      if (result.cursor !== undefined) {
        this.setCursor(request.instanceId, result.cursor);
      }

      const finishedAt = this.now();
      const durationMs = result.durationMs || finishedAt.getTime() - startedAt.getTime();
      const normalized: SyncResult = {
        ...result,
        jobId: result.jobId || jobId,
        mode,
        durationMs,
        startedAt: result.startedAt || startedAt.toISOString(),
        finishedAt: result.finishedAt || finishedAt.toISOString(),
      };

      if (normalized.status === "failed") {
        this.telemetry.recordSyncFailure({
          connectorId: connector.id,
          instanceId: request.instanceId,
          durationMs,
        });
        this.safeLifecycle(connector.id, request.instanceId, "error", "sync failed");
      } else {
        this.telemetry.recordSyncSuccess({
          connectorId: connector.id,
          instanceId: request.instanceId,
          durationMs,
          recordsProcessed: normalized.recordsFetched,
        });
        this.safeLifecycle(
          connector.id,
          request.instanceId,
          normalized.status === "partial" ? "warning" : "healthy",
          "sync completed"
        );
      }

      return normalized;
    } catch (error) {
      const finishedAt = this.now();
      const durationMs = finishedAt.getTime() - startedAt.getTime();
      const message = error instanceof Error ? error.message : String(error);
      this.telemetry.recordSyncFailure({
        connectorId: connector.id,
        instanceId: request.instanceId,
        durationMs,
      });
      if (/rate.?limit|429/i.test(message)) {
        limiter.signalProviderLimit();
        this.telemetry.recordRateLimit(connector.id, request.instanceId, limiter.getState());
      }
      this.safeLifecycle(connector.id, request.instanceId, "error", message);
      return {
        jobId,
        connectorId: connector.id,
        instanceId: request.instanceId,
        mode,
        status: "failed",
        recordsFetched: 0,
        recordsNormalized: 0,
        recordsDeduped: 0,
        durationMs,
        error: message,
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
      };
    }
  }

  private getCircuit(connectorId: string, policies: ConnectorPolicies): CircuitBreaker {
    let circuit = this.circuits.get(connectorId);
    if (!circuit) {
      circuit = new CircuitBreaker(
        policies.circuitBreaker ?? {
          failureThreshold: 5,
          successThreshold: 2,
          openMs: 30_000,
        }
      );
      this.circuits.set(connectorId, circuit);
    }
    return circuit;
  }

  private safeLifecycle(
    connectorId: string,
    instanceId: string,
    to: "healthy" | "warning" | "error",
    reason: string
  ): void {
    try {
      this.lifecycle.transition({ connectorId, instanceId, to, reason });
    } catch {
      this.lifecycle.seed(instanceId, to);
    }
  }
}

export function createSyncEngine(deps?: SyncEngineDependencies): IntegrationSyncEngine {
  return new IntegrationSyncEngine(deps);
}
