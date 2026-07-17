/**
 * Integration persistence — connector metadata only (no business intelligence).
 * In-memory default; swap for durable store later.
 */

import type {
  AuditLogEntry,
  ConnectionLifecycleRecord,
  ConnectorConfiguration,
  ConnectorHealthReport,
  ConnectorRuntimeState,
  DeadLetterItem,
  ErrorHistoryRecord,
  HealthHistoryRecord,
  RetryHistoryRecord,
  SyncHistoryRecord,
  SyncQueueItem,
  SyncScheduleState,
} from "@/lib/platform/integrations/common/types";

function id(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export class IntegrationPersistence {
  readonly configurations = new Map<string, ConnectorConfiguration>();
  readonly runtime = new Map<string, ConnectorRuntimeState>();
  readonly syncHistory: SyncHistoryRecord[] = [];
  readonly health = new Map<string, ConnectorHealthReport>();
  readonly auditLog: AuditLogEntry[] = [];
  readonly deadLetter: DeadLetterItem[] = [];
  readonly lifecycle = new Map<string, ConnectionLifecycleRecord>();
  readonly healthHistory: HealthHistoryRecord[] = [];
  readonly errorHistory: ErrorHistoryRecord[] = [];
  readonly retryHistory: RetryHistoryRecord[] = [];
  readonly syncQueue: SyncQueueItem[] = [];
  readonly schedules = new Map<string, SyncScheduleState>();
  readonly metrics = new Map<
    string,
    {
      recordsImported: number;
      failures: number;
      retries: number;
      totalDurationMs: number;
      syncCount: number;
    }
  >();

  saveConfiguration(config: ConnectorConfiguration): void {
    this.configurations.set(config.instanceId, {
      ...config,
      updatedAt: new Date().toISOString(),
    });
  }

  getConfiguration(instanceId: string): ConnectorConfiguration | null {
    return this.configurations.get(instanceId) ?? null;
  }

  listConfigurations(organizationId?: string): ConnectorConfiguration[] {
    const all = [...this.configurations.values()];
    if (!organizationId) return all;
    return all.filter((c) => c.scope.organizationId === organizationId);
  }

  removeConfiguration(instanceId: string): boolean {
    this.runtime.delete(instanceId);
    this.health.delete(instanceId);
    this.lifecycle.delete(instanceId);
    this.schedules.delete(instanceId);
    this.metrics.delete(instanceId);
    return this.configurations.delete(instanceId);
  }

  saveRuntime(state: ConnectorRuntimeState): void {
    this.runtime.set(state.instanceId, state);
  }

  getRuntime(instanceId: string): ConnectorRuntimeState | null {
    return this.runtime.get(instanceId) ?? null;
  }

  appendSyncHistory(record: SyncHistoryRecord): void {
    this.syncHistory.unshift(record);
    if (this.syncHistory.length > 500) this.syncHistory.length = 500;
    this.bumpMetrics(record.instanceId, record);
  }

  listSyncHistory(instanceId?: string, limit = 50): SyncHistoryRecord[] {
    const rows = instanceId
      ? this.syncHistory.filter((r) => r.instanceId === instanceId)
      : this.syncHistory;
    return rows.slice(0, limit);
  }

  saveHealth(report: ConnectorHealthReport): void {
    const previous = this.health.get(report.instanceId);
    this.health.set(report.instanceId, report);
    if (!previous || previous.status !== report.status) {
      this.appendHealthHistory({
        instanceId: report.instanceId,
        connectorId: report.connectorId,
        status: report.status,
        detail: report.lastError ?? `Health → ${report.status}`,
      });
    }
  }

  getHealth(instanceId: string): ConnectorHealthReport | null {
    return this.health.get(instanceId) ?? null;
  }

  listHealth(): ConnectorHealthReport[] {
    return [...this.health.values()];
  }

  appendHealthHistory(
    entry: Omit<HealthHistoryRecord, "id" | "recordedAt"> & { id?: string; recordedAt?: string }
  ): HealthHistoryRecord {
    const full: HealthHistoryRecord = {
      id: entry.id ?? id("health"),
      instanceId: entry.instanceId,
      connectorId: entry.connectorId,
      status: entry.status,
      detail: entry.detail,
      recordedAt: entry.recordedAt ?? new Date().toISOString(),
    };
    this.healthHistory.unshift(full);
    if (this.healthHistory.length > 1000) this.healthHistory.length = 1000;
    return full;
  }

  listHealthHistory(instanceId?: string, limit = 50): HealthHistoryRecord[] {
    const rows = instanceId
      ? this.healthHistory.filter((r) => r.instanceId === instanceId)
      : this.healthHistory;
    return rows.slice(0, limit);
  }

  appendErrorHistory(
    entry: Omit<ErrorHistoryRecord, "id" | "recordedAt"> & { id?: string; recordedAt?: string }
  ): ErrorHistoryRecord {
    const full: ErrorHistoryRecord = {
      id: entry.id ?? id("err"),
      instanceId: entry.instanceId,
      connectorId: entry.connectorId,
      code: entry.code,
      message: entry.message,
      source: entry.source,
      recordedAt: entry.recordedAt ?? new Date().toISOString(),
    };
    this.errorHistory.unshift(full);
    if (this.errorHistory.length > 1000) this.errorHistory.length = 1000;
    return full;
  }

  listErrorHistory(instanceId?: string, limit = 50): ErrorHistoryRecord[] {
    const rows = instanceId
      ? this.errorHistory.filter((r) => r.instanceId === instanceId)
      : this.errorHistory;
    return rows.slice(0, limit);
  }

  appendRetryHistory(
    entry: Omit<RetryHistoryRecord, "id" | "recordedAt"> & { id?: string; recordedAt?: string }
  ): RetryHistoryRecord {
    const full: RetryHistoryRecord = {
      id: entry.id ?? id("retry"),
      instanceId: entry.instanceId,
      connectorId: entry.connectorId,
      jobId: entry.jobId,
      attempt: entry.attempt,
      maxAttempts: entry.maxAttempts,
      outcome: entry.outcome,
      reason: entry.reason,
      recordedAt: entry.recordedAt ?? new Date().toISOString(),
    };
    this.retryHistory.unshift(full);
    if (this.retryHistory.length > 1000) this.retryHistory.length = 1000;
    const metrics = this.getMetrics(entry.instanceId);
    this.metrics.set(entry.instanceId, { ...metrics, retries: metrics.retries + 1 });
    return full;
  }

  listRetryHistory(instanceId?: string, limit = 50): RetryHistoryRecord[] {
    const rows = instanceId
      ? this.retryHistory.filter((r) => r.instanceId === instanceId)
      : this.retryHistory;
    return rows.slice(0, limit);
  }

  saveLifecycle(record: ConnectionLifecycleRecord): void {
    this.lifecycle.set(record.instanceId, { ...record, updatedAt: new Date().toISOString() });
  }

  getLifecycle(instanceId: string): ConnectionLifecycleRecord | null {
    return this.lifecycle.get(instanceId) ?? null;
  }

  saveSchedule(state: SyncScheduleState): void {
    this.schedules.set(state.instanceId, state);
  }

  getSchedule(instanceId: string): SyncScheduleState | null {
    return this.schedules.get(instanceId) ?? null;
  }

  listSchedules(): SyncScheduleState[] {
    return [...this.schedules.values()];
  }

  enqueueSync(item: Omit<SyncQueueItem, "id" | "enqueuedAt" | "status" | "attempts"> & {
    id?: string;
    attempts?: number;
  }): SyncQueueItem {
    const full: SyncQueueItem = {
      id: item.id ?? id("q"),
      instanceId: item.instanceId,
      connectorId: item.connectorId,
      mode: item.mode,
      triggeredBy: item.triggeredBy,
      status: "queued",
      enqueuedAt: new Date().toISOString(),
      priority: item.priority,
      attempts: item.attempts ?? 0,
    };
    this.syncQueue.push(full);
    this.syncQueue.sort((a, b) => b.priority - a.priority || a.enqueuedAt.localeCompare(b.enqueuedAt));
    return full;
  }

  listQueue(instanceId?: string): SyncQueueItem[] {
    if (!instanceId) return [...this.syncQueue];
    return this.syncQueue.filter((q) => q.instanceId === instanceId);
  }

  updateQueueItem(id: string, patch: Partial<SyncQueueItem>): SyncQueueItem | null {
    const idx = this.syncQueue.findIndex((q) => q.id === id);
    if (idx < 0) return null;
    const next = { ...this.syncQueue[idx]!, ...patch };
    this.syncQueue[idx] = next;
    return next;
  }

  appendAudit(entry: Omit<AuditLogEntry, "id" | "createdAt"> & { id?: string }): AuditLogEntry {
    const full: AuditLogEntry = {
      id: entry.id ?? id("audit"),
      instanceId: entry.instanceId,
      connectorId: entry.connectorId,
      action: entry.action,
      actor: entry.actor,
      detail: entry.detail,
      createdAt: new Date().toISOString(),
    };
    this.auditLog.unshift(full);
    if (this.auditLog.length > 1000) this.auditLog.length = 1000;
    return full;
  }

  listAudit(instanceId?: string, limit = 50): AuditLogEntry[] {
    const rows = instanceId
      ? this.auditLog.filter((a) => a.instanceId === instanceId)
      : this.auditLog;
    return rows.slice(0, limit);
  }

  enqueueDeadLetter(item: Omit<DeadLetterItem, "id" | "createdAt" | "lastAttemptAt" | "attempts"> & {
    attempts?: number;
  }): DeadLetterItem {
    const full: DeadLetterItem = {
      id: id("dlq"),
      instanceId: item.instanceId,
      connectorId: item.connectorId,
      reason: item.reason,
      payload: item.payload,
      attempts: item.attempts ?? 1,
      createdAt: new Date().toISOString(),
      lastAttemptAt: new Date().toISOString(),
    };
    this.deadLetter.unshift(full);
    return full;
  }

  listDeadLetter(instanceId?: string): DeadLetterItem[] {
    if (!instanceId) return [...this.deadLetter];
    return this.deadLetter.filter((d) => d.instanceId === instanceId);
  }

  getMetrics(instanceId: string) {
    return (
      this.metrics.get(instanceId) ?? {
        recordsImported: 0,
        failures: 0,
        retries: 0,
        totalDurationMs: 0,
        syncCount: 0,
      }
    );
  }

  private bumpMetrics(instanceId: string, record: SyncHistoryRecord): void {
    const current = this.getMetrics(instanceId);
    this.metrics.set(instanceId, {
      recordsImported: current.recordsImported + record.recordsAccepted,
      failures: current.failures + (record.status === "failed" || record.status === "partial" ? 1 : 0),
      retries: current.retries + (record.retryAttempts ?? 0),
      totalDurationMs: current.totalDurationMs + record.durationMs,
      syncCount: current.syncCount + 1,
    });
  }
}
