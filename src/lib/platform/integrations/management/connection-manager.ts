/**
 * Connection Manager — full connector lifecycle over the shared contract.
 */

import type { IntegrationPlatform } from "@/lib/platform/integrations/common/services/platform";
import type {
  AuthMethod,
  ConnectionLifecycleRecord,
  ConnectorConfiguration,
  IntegrationScope,
  SyncMode,
  SyncResult,
} from "@/lib/platform/integrations/common/types";
import type { ConnectorRegistryService } from "@/lib/platform/integrations/management/connector-registry";
import type { CredentialManager } from "@/lib/platform/integrations/management/credential-manager";
import type { IntegrationAuditService } from "@/lib/platform/integrations/management/audit-service";
import type { ConnectorHealthMonitor } from "@/lib/platform/integrations/management/health-monitor";
import type { SyncHistoryService } from "@/lib/platform/integrations/management/sync-history";
import type { SyncQueueService } from "@/lib/platform/integrations/management/sync-queue";
import type { SyncScheduler } from "@/lib/platform/integrations/management/sync-scheduler";
import type { RetryManager } from "@/lib/platform/integrations/management/retry-manager";

type Deps = {
  registry: ConnectorRegistryService;
  credentials: CredentialManager;
  audit: IntegrationAuditService;
  health: ConnectorHealthMonitor;
  history: SyncHistoryService;
  queue: SyncQueueService;
  scheduler: SyncScheduler;
  retries: RetryManager;
};

export class ConnectionManager {
  constructor(
    private readonly platform: IntegrationPlatform,
    private readonly deps: Deps
  ) {}

  /** Register catalog connector id into an org-scoped instance (does not connect yet). */
  async register(input: {
    connectorId: string;
    scope: IntegrationScope;
    authMethod?: AuthMethod;
    settings?: Record<string, unknown>;
    scheduleCron?: string;
    syncStrategy?: ConnectorConfiguration["syncStrategy"];
    actor?: string;
  }): Promise<ConnectorConfiguration> {
    if (!this.deps.registry.has(input.connectorId)) {
      throw new Error(`Connector not in registry: ${input.connectorId}`);
    }
    if (!this.deps.registry.isEnabled(input.connectorId)) {
      throw new Error(`Connector disabled in catalog: ${input.connectorId}`);
    }
    const connector = this.deps.registry.get(input.connectorId)!;
    const now = new Date().toISOString();
    const instanceId = `${input.connectorId}-${input.scope.organizationId}`;
    const existing = this.platform.persistence.getConfiguration(instanceId);
    if (existing && this.platform.persistence.getLifecycle(instanceId)?.phase !== "removed") {
      return existing;
    }

    const config: ConnectorConfiguration = {
      connectorId: input.connectorId,
      instanceId,
      scope: input.scope,
      enabled: true,
      paused: false,
      authMethod: input.authMethod ?? connector.metadata.authMethods[0] ?? "none",
      settings: input.settings ?? {},
      scheduleCron: input.scheduleCron ?? "0 */6 * * *",
      syncStrategy: input.syncStrategy ?? "scheduled",
      rateLimitPerMinute: 60,
      createdAt: now,
      updatedAt: now,
    };
    this.platform.persistence.saveConfiguration(config);
    this.platform.persistence.saveLifecycle({
      instanceId,
      connectorId: input.connectorId,
      phase: "registered",
      authenticated: false,
      validated: false,
      lastSuccessfulSyncAt: null,
      lastFailedSyncAt: null,
      nextScheduledSyncAt: null,
      retryCount: 0,
      updatedAt: now,
    });
    this.platform.persistence.saveRuntime({
      instanceId,
      connectorId: input.connectorId,
      status: "disconnected",
      lastSyncAt: null,
      lastError: null,
      connectedAt: null,
      lifecyclePhase: "registered",
    });
    this.deps.audit.record({
      instanceId,
      connectorId: input.connectorId,
      action: "connection_created",
      actor: input.actor ?? "system",
      detail: { phase: "registered" },
    });
    this.deps.scheduler.ensureSchedule(instanceId);
    return config;
  }

  async configure(
    instanceId: string,
    patch: Partial<
      Pick<
        ConnectorConfiguration,
        "settings" | "authMethod" | "scheduleCron" | "syncStrategy" | "rateLimitPerMinute" | "enabled"
      >
    >,
    actor = "system"
  ): Promise<ConnectorConfiguration> {
    const config = this.requireConfig(instanceId);
    const next = { ...config, ...patch, updatedAt: new Date().toISOString() };
    this.platform.persistence.saveConfiguration(next);
    this.setPhase(instanceId, "configured");
    this.deps.scheduler.configure(instanceId, {
      cron: next.scheduleCron,
      strategy: next.syncStrategy,
      enabled: next.enabled && !next.paused,
    });
    this.deps.audit.record({
      instanceId,
      connectorId: config.connectorId,
      action: "connection_configured",
      actor,
      detail: patch as Record<string, unknown>,
    });
    return next;
  }

  async authenticate(instanceId: string, actor = "system") {
    const result = await this.deps.credentials.authenticate(instanceId, actor);
    if (!result.ok) throw new Error(result.error ?? "Authentication failed");
    const lifecycle = this.requireLifecycle(instanceId);
    this.platform.persistence.saveLifecycle({
      ...lifecycle,
      authenticated: true,
      phase: "authenticated",
    });
    this.setPhase(instanceId, "authenticated");
    return result;
  }

  async validate(instanceId: string, actor = "system"): Promise<{ ok: boolean; issues: string[] }> {
    const config = this.requireConfig(instanceId);
    const issues: string[] = [];
    if (!config.enabled) issues.push("Connector is disabled");
    if (!this.deps.registry.has(config.connectorId)) issues.push("Connector missing from registry");
    const auth = this.deps.credentials.summarize(instanceId);
    if (config.authMethod !== "none" && !auth.present) {
      issues.push("Credentials missing");
    }
    const ok = issues.length === 0;
    const lifecycle = this.requireLifecycle(instanceId);
    this.platform.persistence.saveLifecycle({
      ...lifecycle,
      validated: ok,
      phase: ok ? "validated" : lifecycle.phase,
    });
    this.deps.audit.record({
      instanceId,
      connectorId: config.connectorId,
      action: "connector_validated",
      actor,
      detail: { ok, issues },
    });
    if (!ok) {
      this.platform.persistence.appendErrorHistory({
        instanceId,
        connectorId: config.connectorId,
        code: "validation_failed",
        message: issues.join("; "),
        source: "system",
      });
    }
    return { ok, issues };
  }

  async connect(instanceId: string, actor = "system") {
    const config = this.requireConfig(instanceId);
    await this.platform.connect(instanceId);
    this.setPhase(instanceId, "connected");
    const lifecycle = this.requireLifecycle(instanceId);
    this.platform.persistence.saveLifecycle({ ...lifecycle, phase: "connected" });
    this.deps.scheduler.ensureSchedule(instanceId);
    this.deps.audit.record({
      instanceId,
      connectorId: config.connectorId,
      action: "connector_connected",
      actor,
      detail: {},
    });
    await this.deps.health.check(instanceId);
  }

  async initialSync(instanceId: string): Promise<SyncResult> {
    return this.runSync(instanceId, "full", "manual");
  }

  async incrementalSync(instanceId: string): Promise<SyncResult> {
    return this.runSync(instanceId, "incremental", "manual");
  }

  async sync(
    instanceId: string,
    mode: SyncMode = "incremental",
    triggeredBy: SyncResult extends never ? never : "manual" | "schedule" | "webhook" | "reconnect" | "retry" | "realtime" = "manual"
  ): Promise<SyncResult> {
    return this.runSync(instanceId, mode, triggeredBy);
  }

  private async runSync(
    instanceId: string,
    mode: SyncMode,
    triggeredBy: "manual" | "schedule" | "webhook" | "reconnect" | "retry" | "realtime"
  ): Promise<SyncResult> {
    const config = this.requireConfig(instanceId);
    if (config.paused) throw new Error(`Connector paused: ${instanceId}`);
    if (!config.enabled) throw new Error(`Connector disabled: ${instanceId}`);

    this.deps.queue.enqueue({ instanceId, mode, triggeredBy, priority: 90 });
    const results = await this.deps.queue.drain(1);
    const result = results[0];
    if (!result) throw new Error("Sync queue produced no result");

    this.deps.scheduler.recordSyncOutcome(instanceId, result);
    await this.deps.health.check(instanceId);

    if (result.status === "failed") {
      await this.platform.events.publish({
        type: "SyncFailed",
        instanceId,
        connectorId: config.connectorId,
        payload: { jobId: result.jobId, errors: result.errors },
      });
      await this.deps.retries.scheduleRetry(instanceId, result.errors[0] ?? "sync_failed", {
        jobId: result.jobId,
      });
    }

    return result;
  }

  async monitor(instanceId: string) {
    this.setPhase(instanceId, "monitoring");
    return this.deps.health.check(instanceId);
  }

  async retryRecovery(instanceId: string) {
    this.setPhase(instanceId, "retrying");
    return this.deps.retries.recover(instanceId);
  }

  async pause(instanceId: string, actor = "system") {
    const config = this.requireConfig(instanceId);
    this.platform.persistence.saveConfiguration({ ...config, paused: true, enabled: true });
    const runtime = this.platform.persistence.getRuntime(instanceId);
    this.platform.persistence.saveRuntime({
      instanceId,
      connectorId: config.connectorId,
      status: "paused",
      lastSyncAt: runtime?.lastSyncAt ?? null,
      lastError: runtime?.lastError ?? null,
      connectedAt: runtime?.connectedAt ?? null,
      lifecyclePhase: "paused",
      pausedAt: new Date().toISOString(),
    });
    this.setPhase(instanceId, "paused");
    this.deps.scheduler.configure(instanceId, { enabled: false });
    this.deps.audit.record({
      instanceId,
      connectorId: config.connectorId,
      action: "connector_paused",
      actor,
      detail: {},
    });
    await this.platform.events.publish({
      type: "ConnectorPaused",
      instanceId,
      connectorId: config.connectorId,
      payload: {},
    });
  }

  async resume(instanceId: string, actor = "system") {
    const config = this.requireConfig(instanceId);
    this.platform.persistence.saveConfiguration({ ...config, paused: false, enabled: true });
    await this.platform.connect(instanceId);
    this.setPhase(instanceId, "connected");
    this.deps.scheduler.configure(instanceId, { enabled: true });
    this.deps.audit.record({
      instanceId,
      connectorId: config.connectorId,
      action: "connector_resumed",
      actor,
      detail: {},
    });
    await this.platform.events.publish({
      type: "ConnectorResumed",
      instanceId,
      connectorId: config.connectorId,
      payload: {},
    });
    await this.deps.health.check(instanceId);
  }

  async disconnect(instanceId: string, actor = "system") {
    const config = this.requireConfig(instanceId);
    await this.platform.disconnect(instanceId);
    this.setPhase(instanceId, "disconnected");
    this.deps.scheduler.configure(instanceId, { enabled: false });
    this.deps.audit.record({
      instanceId,
      connectorId: config.connectorId,
      action: "connector_disabled",
      actor,
      detail: {},
    });
    await this.platform.events.publish({
      type: "ConnectorDisabled",
      instanceId,
      connectorId: config.connectorId,
      payload: {},
    });
  }

  async remove(instanceId: string, actor = "system") {
    const config = this.requireConfig(instanceId);
    try {
      await this.platform.disconnect(instanceId);
    } catch {
      // already disconnected
    }
    this.deps.credentials.remove(instanceId);
    this.setPhase(instanceId, "removed");
    this.deps.audit.record({
      instanceId,
      connectorId: config.connectorId,
      action: "connector_removed",
      actor,
      detail: {},
    });
    await this.platform.events.publish({
      type: "ConnectorRemoved",
      instanceId,
      connectorId: config.connectorId,
      payload: {},
    });
    this.platform.persistence.removeConfiguration(instanceId);
  }

  /**
   * Full happy-path bootstrap: register → configure → auth → validate → connect → initial sync.
   */
  async bootstrap(input: {
    connectorId: string;
    scope: IntegrationScope;
    actor?: string;
  }) {
    const config = await this.register(input);
    await this.configure(config.instanceId, {}, input.actor);
    await this.authenticate(config.instanceId, input.actor);
    const validation = await this.validate(config.instanceId, input.actor);
    if (!validation.ok) {
      throw new Error(`Validation failed: ${validation.issues.join("; ")}`);
    }
    await this.connect(config.instanceId, input.actor);
    const sync = await this.initialSync(config.instanceId);
    await this.monitor(config.instanceId);
    return { config, sync };
  }

  getLifecycle(instanceId: string): ConnectionLifecycleRecord | null {
    return this.platform.persistence.getLifecycle(instanceId);
  }

  private requireConfig(instanceId: string): ConnectorConfiguration {
    const config = this.platform.persistence.getConfiguration(instanceId);
    if (!config) throw new Error(`Unknown instance: ${instanceId}`);
    return config;
  }

  private requireLifecycle(instanceId: string): ConnectionLifecycleRecord {
    const lifecycle = this.platform.persistence.getLifecycle(instanceId);
    if (!lifecycle) throw new Error(`Unknown lifecycle: ${instanceId}`);
    return lifecycle;
  }

  private setPhase(instanceId: string, phase: ConnectionLifecycleRecord["phase"]) {
    const lifecycle = this.platform.persistence.getLifecycle(instanceId);
    if (lifecycle) {
      this.platform.persistence.saveLifecycle({ ...lifecycle, phase });
    }
    const runtime = this.platform.persistence.getRuntime(instanceId);
    if (runtime) {
      this.platform.persistence.saveRuntime({ ...runtime, lifecyclePhase: phase });
    }
  }
}
