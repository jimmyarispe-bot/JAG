/**
 * Monitoring summaries for Executive Integration Center.
 */

import type { IntegrationPersistence } from "@/lib/platform/integrations/common/persistence";
import type { ConnectorMetadata, ConnectorStatus, HealthStatus } from "@/lib/platform/integrations/common/types";

export type ConnectorMonitorRow = {
  instanceId: string;
  connectorId: string;
  name: string;
  category: string;
  status: ConnectorStatus;
  health: HealthStatus;
  lastSyncAt: string | null;
  nextSyncAt: string | null;
  recordsImported: number;
  failures: number;
  retries: number;
  durationMsAvg: number | null;
  latencyMs: number | null;
  availability: number | null;
  enabled: boolean;
  paused: boolean;
  placeholder: boolean;
  lastError: string | null;
  version: string | null;
  lifecyclePhase: string | null;
};

export function buildConnectorMonitorRows(
  persistence: IntegrationPersistence,
  catalog: Map<string, ConnectorMetadata>
): ConnectorMonitorRow[] {
  return persistence.listConfigurations().map((config) => {
    const meta = catalog.get(config.connectorId);
    const runtime = persistence.getRuntime(config.instanceId);
    const health = persistence.getHealth(config.instanceId);
    const metrics = persistence.getMetrics(config.instanceId);
    const schedule = persistence.getSchedule(config.instanceId);
    const lifecycle = persistence.getLifecycle(config.instanceId);
    return {
      instanceId: config.instanceId,
      connectorId: config.connectorId,
      name: meta?.name ?? config.connectorId,
      category: meta?.category ?? "other",
      status: runtime?.status ?? "disconnected",
      health: health?.status ?? "unknown",
      lastSyncAt: runtime?.lastSyncAt ?? health?.lastSyncAt ?? null,
      nextSyncAt: schedule?.nextScheduledSyncAt ?? lifecycle?.nextScheduledSyncAt ?? null,
      recordsImported: metrics.recordsImported,
      failures: metrics.failures,
      retries: metrics.retries,
      durationMsAvg:
        metrics.syncCount > 0 ? Math.round(metrics.totalDurationMs / metrics.syncCount) : null,
      latencyMs: health?.latencyMs ?? null,
      availability: health?.availability ?? null,
      enabled: config.enabled,
      paused: Boolean(config.paused),
      placeholder: meta?.placeholder ?? true,
      lastError: runtime?.lastError ?? health?.lastError ?? null,
      version: meta?.version ?? null,
      lifecyclePhase: lifecycle?.phase ?? runtime?.lifecyclePhase ?? null,
    };
  });
}
