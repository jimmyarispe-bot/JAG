import { getIntegrationManagement } from "@/lib/exec/integration-platform";
import type { ConnectorMonitorRow } from "@/lib/platform/integrations/common/monitoring";
import type {
  AuditLogEntry,
  ConnectorConfiguration,
  ConnectorHealthReport,
  ConnectorMetadata,
  ConnectionLifecycleRecord,
  ErrorHistoryRecord,
  HealthHistoryRecord,
  RetryHistoryRecord,
  SyncHistoryRecord,
  SyncScheduleState,
} from "@/lib/platform/integrations/common/types";

export type ExecIntegrationsViewModel = {
  generatedAt: string;
  rows: ConnectorMonitorRow[];
  catalog: ConnectorMetadata[];
  recentSyncs: SyncHistoryRecord[];
  recentAudit: AuditLogEntry[];
  recentEvents: Array<{ id: string; type: string; connectorId?: string; occurredAt: string }>;
  dataMode: "synthetic";
};

export type ExecIntegrationDetailViewModel = {
  generatedAt: string;
  instanceId: string;
  row: ConnectorMonitorRow;
  config: ConnectorConfiguration;
  metadata: ConnectorMetadata | null;
  health: ConnectorHealthReport | null;
  lifecycle: ConnectionLifecycleRecord | null;
  schedule: SyncScheduleState | null;
  auth: {
    present: boolean;
    authMethod: string | null;
    expiresAt: string | null;
    hasRefreshToken: boolean;
  };
  syncHistory: SyncHistoryRecord[];
  healthHistory: HealthHistoryRecord[];
  errorHistory: ErrorHistoryRecord[];
  retryHistory: RetryHistoryRecord[];
  audit: AuditLogEntry[];
  dataMode: "synthetic";
};

export async function loadExecIntegrations(): Promise<ExecIntegrationsViewModel> {
  const management = await getIntegrationManagement();
  const rows = management.platform.monitorRows();
  const catalog = management.registry.list();
  const recentSyncs = management.history.list(undefined, 20);
  const recentAudit = management.audit.lifecycleEvents(undefined, 20);
  const recentEvents = management.platform.events.list(20).map((e) => ({
    id: e.id,
    type: e.type,
    connectorId: e.connectorId,
    occurredAt: e.occurredAt,
  }));

  return {
    generatedAt: new Date().toISOString(),
    rows,
    catalog,
    recentSyncs,
    recentAudit,
    recentEvents,
    dataMode: "synthetic",
  };
}

export async function loadExecIntegrationDetail(
  instanceId: string
): Promise<ExecIntegrationDetailViewModel | null> {
  const management = await getIntegrationManagement();
  const config = management.platform.persistence.getConfiguration(instanceId);
  if (!config) return null;

  const rows = management.platform.monitorRows();
  const row = rows.find((r) => r.instanceId === instanceId);
  if (!row) return null;

  return {
    generatedAt: new Date().toISOString(),
    instanceId,
    row,
    config,
    metadata: management.registry.get(config.connectorId)?.metadata ?? null,
    health: management.health.get(instanceId),
    lifecycle: management.connections.getLifecycle(instanceId),
    schedule: management.scheduler.get(instanceId),
    auth: management.credentials.summarize(instanceId),
    syncHistory: management.history.list(instanceId, 30),
    healthHistory: management.health.history(instanceId, 20),
    errorHistory: management.platform.persistence.listErrorHistory(instanceId, 20),
    retryHistory: management.retries.history(instanceId, 20),
    audit: management.audit.list(instanceId, 30),
    dataMode: "synthetic",
  };
}

export async function execSyncNow(instanceId: string) {
  const management = await getIntegrationManagement();
  return management.connections.sync(instanceId, "full", "manual");
}

export async function execReconnect(instanceId: string) {
  const management = await getIntegrationManagement();
  await management.connections.connect(instanceId);
  await management.connections.authenticate(instanceId);
  return management.connections.monitor(instanceId);
}

export async function execPause(instanceId: string) {
  const management = await getIntegrationManagement();
  return management.connections.pause(instanceId, "exec-ui");
}

export async function execResume(instanceId: string) {
  const management = await getIntegrationManagement();
  return management.connections.resume(instanceId, "exec-ui");
}

export async function execRetry(instanceId: string) {
  const management = await getIntegrationManagement();
  return management.connections.retryRecovery(instanceId);
}
