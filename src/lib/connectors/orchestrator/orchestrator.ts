/**
 * ConnectorOrchestrator™ — run, schedule, monitor, govern connectors.
 * Knows capabilities only — never vendor products. Runtimes are injected.
 */

import { randomUUID } from "node:crypto";
import { listInstallationsForOrganization } from "@/lib/connectors/store";
import { createConnectorAudit } from "@/lib/connectors/orchestrator/audit";
import { createConnectorCatalog } from "@/lib/connectors/orchestrator/catalog";
import { createConnectorDependencyManager } from "@/lib/connectors/orchestrator/dependency-manager";
import { createOrchestratorHealthService } from "@/lib/connectors/orchestrator/health";
import { createConnectorLifecycle } from "@/lib/connectors/orchestrator/lifecycle";
import { createConnectorMetricsService } from "@/lib/connectors/orchestrator/metrics";
import { createConnectorRateLimitManager } from "@/lib/connectors/orchestrator/rate-limit-manager";
import { createConnectorOrgRegistry } from "@/lib/connectors/orchestrator/registry";
import { createConnectorRetryManager } from "@/lib/connectors/orchestrator/retry-manager";
import {
  createConnectorRuntimeRegistry,
  type ConnectorRuntimeRegistry,
} from "@/lib/connectors/orchestrator/runtime";
import { createOrchestratorScheduler } from "@/lib/connectors/orchestrator/scheduler";
import {
  getOrchestratorJob,
  listOrchestratorJobs,
  upsertOrchestratorJob,
} from "@/lib/connectors/orchestrator/store";
import { createConnectorTokenManager } from "@/lib/connectors/orchestrator/token-manager";
import type {
  OrchestratorJob,
  OrchestratorSchedule,
  RuntimeContext,
  RuntimeResult,
} from "@/lib/connectors/orchestrator/types";

export type ConnectorOrchestrator = {
  readonly catalog: ReturnType<typeof createConnectorCatalog>;
  readonly registry: ReturnType<typeof createConnectorOrgRegistry>;
  readonly runtime: ConnectorRuntimeRegistry;
  readonly scheduler: ReturnType<typeof createOrchestratorScheduler>;
  readonly lifecycle: ReturnType<typeof createConnectorLifecycle>;
  readonly health: ReturnType<typeof createOrchestratorHealthService>;
  readonly metrics: ReturnType<typeof createConnectorMetricsService>;
  readonly dependencies: ReturnType<typeof createConnectorDependencyManager>;
  readonly retry: ReturnType<typeof createConnectorRetryManager>;
  readonly rateLimits: ReturnType<typeof createConnectorRateLimitManager>;
  readonly tokens: ReturnType<typeof createConnectorTokenManager>;
  readonly audit: ReturnType<typeof createConnectorAudit>;
  connect(ctx: RuntimeContext): Promise<RuntimeResult>;
  disconnect(ctx: RuntimeContext): Promise<RuntimeResult>;
  validate(ctx: RuntimeContext): Promise<RuntimeResult>;
  sync(ctx: RuntimeContext): Promise<RuntimeResult>;
  refresh(ctx: RuntimeContext): Promise<RuntimeResult>;
  schedule(
    ctx: RuntimeContext,
    frequency: OrchestratorSchedule
  ): Promise<RuntimeResult>;
  runDue(organizationId: string, actor: RuntimeContext): Promise<{
    readonly jobs: readonly OrchestratorJob[];
    readonly results: readonly RuntimeResult[];
  }>;
  getDashboard(organizationId: string): {
    readonly catalog: ReturnType<ReturnType<typeof createConnectorCatalog>["listForOrganization"]>;
    readonly registry: ReturnType<ReturnType<typeof createConnectorOrgRegistry>["list"]>;
    readonly queue: readonly OrchestratorJob[];
    readonly retryQueue: readonly OrchestratorJob[];
    readonly health: ReturnType<ReturnType<typeof createOrchestratorHealthService>["summarize"]>;
    readonly metrics: ReturnType<ReturnType<typeof createConnectorMetricsService>["get"]>;
    readonly rateLimits: readonly ReturnType<
      ReturnType<typeof createConnectorRateLimitManager>["get"]
    >[];
    readonly audit: ReturnType<ReturnType<typeof createConnectorAudit>["list"]>;
    readonly activeJobs: number;
  };
};

export function createConnectorOrchestrator(deps?: {
  runtime?: ConnectorRuntimeRegistry;
}): ConnectorOrchestrator {
  const catalog = createConnectorCatalog();
  const registry = createConnectorOrgRegistry();
  const runtime = deps?.runtime ?? createConnectorRuntimeRegistry();
  const scheduler = createOrchestratorScheduler();
  const lifecycle = createConnectorLifecycle();
  const health = createOrchestratorHealthService();
  const metrics = createConnectorMetricsService();
  const dependencies = createConnectorDependencyManager();
  const retry = createConnectorRetryManager();
  const rateLimits = createConnectorRateLimitManager();
  const tokens = createConnectorTokenManager();
  const audit = createConnectorAudit();

  async function withRuntime(
    ctx: RuntimeContext,
    op: string,
    fn: (
      rt: NonNullable<ReturnType<ConnectorRuntimeRegistry["get"]>>
    ) => Promise<RuntimeResult>
  ): Promise<RuntimeResult> {
    const rt = runtime.get(ctx.connectorId);
    if (!rt) {
      return {
        ok: false,
        message: `No runtime registered for connector capability id “${ctx.connectorId}”.`,
      };
    }
    if (!rateLimits.canProceed(ctx.organizationId, ctx.connectorId)) {
      return {
        ok: false,
        message: "Rate limit exceeded for this connector.",
      };
    }
    rateLimits.consume(ctx.organizationId, ctx.connectorId);
    metrics.recordApiUsage(ctx.organizationId);
    return fn(rt);
  }

  const orchestrator: ConnectorOrchestrator = {
    catalog,
    registry,
    runtime,
    scheduler,
    lifecycle,
    health,
    metrics,
    dependencies,
    retry,
    rateLimits,
    tokens,
    audit,

    async connect(ctx) {
      const result = await withRuntime(ctx, "connect", (rt) => rt.connect(ctx));
      if (result.ok) {
        audit.record({
          organizationId: ctx.organizationId,
          connectorId: ctx.connectorId,
          kind: "Connected",
          actor: ctx.actorUserId,
          message: result.message,
        });
      }
      return result;
    },

    async disconnect(ctx) {
      const result = await withRuntime(ctx, "disconnect", (rt) =>
        rt.disconnect(ctx)
      );
      if (result.ok) {
        audit.record({
          organizationId: ctx.organizationId,
          connectorId: ctx.connectorId,
          kind: "Removed",
          actor: ctx.actorUserId,
          message: result.message,
        });
      }
      return result;
    },

    async validate(ctx) {
      const result = await withRuntime(ctx, "validate", (rt) =>
        rt.validate(ctx)
      );
      if (result.ok) {
        audit.record({
          organizationId: ctx.organizationId,
          connectorId: ctx.connectorId,
          kind: "Validated",
          actor: ctx.actorUserId,
          message: result.message,
        });
      }
      return result;
    },

    async refresh(ctx) {
      return withRuntime(ctx, "refresh", (rt) => rt.refresh(ctx));
    },

    async schedule(ctx, frequency) {
      const planned = scheduler.plan({
        organizationId: ctx.organizationId,
        connectorId: ctx.connectorId,
        schedule: frequency,
        actor: ctx.actorUserId,
      });
      if (!planned.ok) {
        return { ok: false, message: planned.error ?? "Schedule failed." };
      }
      const result = await withRuntime(ctx, "schedule", (rt) =>
        rt.schedule(ctx, frequency)
      );
      return result;
    },

    async sync(ctx) {
      const depsOk = dependencies.areDependenciesSatisfied(
        ctx.organizationId,
        ctx.connectorId
      );
      if (!depsOk.ok) {
        return {
          ok: false,
          message: `Dependencies not satisfied: ${depsOk.missing.join(", ")}`,
        };
      }

      const installation = listInstallationsForOrganization(
        ctx.organizationId
      ).find((i) => i.connectorId === ctx.connectorId);
      const job: OrchestratorJob = {
        id: randomUUID(),
        organizationId: ctx.organizationId,
        connectorId: ctx.connectorId,
        installationId: installation?.id ?? "unknown",
        priority: scheduler.getPriority(ctx.organizationId, ctx.connectorId),
        status: "Running",
        attempt: 1,
        maxAttempts: retry.getPolicy(ctx.organizationId, ctx.connectorId)
          .maxRetries,
        createdAt: new Date().toISOString(),
        startedAt: new Date().toISOString(),
        completedAt: null,
        lastError: null,
        recordsImported: 0,
        durationMs: null,
      };
      upsertOrchestratorJob(job);
      audit.record({
        organizationId: ctx.organizationId,
        connectorId: ctx.connectorId,
        kind: "Started",
        actor: ctx.actorUserId,
        message: "Orchestrated sync started.",
        metadata: { jobId: job.id },
      });

      const started = Date.now();
      let result = await withRuntime(ctx, "sync", (rt) => rt.sync(ctx));
      let attempt = 1;
      let retried = false;

      while (
        !result.ok &&
        retry.shouldRetry({
          organizationId: ctx.organizationId,
          connectorId: ctx.connectorId,
          attempt,
        })
      ) {
        retried = true;
        attempt += 1;
        retry.recordFailure(ctx.organizationId, ctx.connectorId);
        upsertOrchestratorJob({
          ...job,
          status: "Retrying",
          attempt,
          lastError: result.message,
        });
        audit.record({
          organizationId: ctx.organizationId,
          connectorId: ctx.connectorId,
          kind: "Retried",
          actor: ctx.actorUserId,
          message: `Retry attempt ${attempt}: ${result.message}`,
          metadata: { jobId: job.id },
        });
        const delay = retry.nextDelayMs({
          organizationId: ctx.organizationId,
          connectorId: ctx.connectorId,
          attempt,
        });
        if (delay > 0 && delay < 50) {
          // keep unit tests fast — tiny backoff only
          await new Promise((r) => setTimeout(r, Math.min(delay, 5)));
        }
        result = await withRuntime(ctx, "sync", (rt) => rt.sync(ctx));
      }

      const durationMs = Date.now() - started;
      if (result.ok) {
        retry.recordSuccess(ctx.organizationId, ctx.connectorId);
        upsertOrchestratorJob({
          ...getOrchestratorJob(job.id)!,
          status: "Completed",
          attempt,
          completedAt: new Date().toISOString(),
          recordsImported: result.recordsImported ?? 0,
          durationMs,
          lastError: null,
        });
        metrics.recordSync({
          organizationId: ctx.organizationId,
          durationMs,
          recordsImported: result.recordsImported ?? 0,
          evidenceCreated: result.evidenceCreated ?? 0,
          twinEntitiesUpdated: result.twinEntitiesUpdated ?? 0,
          failed: false,
          retried,
        });
        audit.record({
          organizationId: ctx.organizationId,
          connectorId: ctx.connectorId,
          kind: "Completed",
          actor: ctx.actorUserId,
          message: result.message,
          metadata: { jobId: job.id },
        });
      } else {
        retry.recordFailure(ctx.organizationId, ctx.connectorId);
        upsertOrchestratorJob({
          ...getOrchestratorJob(job.id)!,
          status: "Failed",
          attempt,
          completedAt: new Date().toISOString(),
          durationMs,
          lastError: result.message,
        });
        metrics.recordSync({
          organizationId: ctx.organizationId,
          durationMs,
          recordsImported: 0,
          evidenceCreated: 0,
          twinEntitiesUpdated: 0,
          failed: true,
          retried,
        });
        audit.record({
          organizationId: ctx.organizationId,
          connectorId: ctx.connectorId,
          kind: "Failed",
          actor: ctx.actorUserId,
          message: result.message,
          metadata: { jobId: job.id },
        });
        if (
          retry.isFailureThresholdExceeded(
            ctx.organizationId,
            ctx.connectorId
          )
        ) {
          lifecycle.disable({
            organizationId: ctx.organizationId,
            connectorId: ctx.connectorId,
            actor: "orchestrator",
          });
        }
      }

      return { ...result, jobId: job.id };
    },

    async runDue(organizationId, actor) {
      const queued = scheduler.enqueueDue(organizationId);
      const ordered = dependencies.orderForSync(
        organizationId,
        queued.map((j) => j.connectorId)
      );
      const byConnector = new Map(queued.map((j) => [j.connectorId, j]));
      const results: RuntimeResult[] = [];
      const jobs: OrchestratorJob[] = [];
      for (const connectorId of ordered) {
        const job = byConnector.get(connectorId);
        if (!job) continue;
        const result = await orchestrator.sync({
          ...actor,
          organizationId,
          connectorId,
          installationId: job.installationId,
        });
        results.push(result);
        const updated = getOrchestratorJob(result.jobId ?? job.id);
        if (updated) jobs.push(updated);
      }
      return { jobs: Object.freeze(jobs), results: Object.freeze(results) };
    },

    getDashboard(organizationId) {
      const installs = listInstallationsForOrganization(organizationId);
      return {
        catalog: catalog.listForOrganization(organizationId),
        registry: registry.list(organizationId),
        queue: scheduler.listQueue(organizationId),
        retryQueue: Object.freeze(
          listOrchestratorJobs(organizationId).filter(
            (j) => j.status === "Retrying"
          )
        ),
        health: health.summarize(organizationId),
        metrics: metrics.get(organizationId),
        rateLimits: Object.freeze(
          installs.map((i) =>
            rateLimits.get(organizationId, i.connectorId)
          )
        ),
        audit: audit.list(organizationId),
        activeJobs: metrics.activeJobs(organizationId),
      };
    },
  };

  return orchestrator;
}
