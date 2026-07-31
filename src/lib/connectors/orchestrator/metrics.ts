/**
 * ConnectorMetrics — orchestrator-level sync telemetry.
 */

import {
  getMetrics,
  listOrchestratorJobs,
  setMetrics,
} from "@/lib/connectors/orchestrator/store";
import type { OrchestratorMetrics } from "@/lib/connectors/orchestrator/types";

export type ConnectorMetricsService = {
  get(organizationId: string): OrchestratorMetrics;
  recordSync(input: {
    organizationId: string;
    durationMs: number;
    recordsImported: number;
    evidenceCreated: number;
    twinEntitiesUpdated: number;
    failed: boolean;
    retried: boolean;
  }): OrchestratorMetrics;
  recordApiUsage(organizationId: string, count?: number): void;
  activeJobs(organizationId: string): number;
};

export function createConnectorMetricsService(): ConnectorMetricsService {
  return {
    get: getMetrics,
    recordSync(input) {
      const current = getMetrics(input.organizationId);
      const syncCount = current.syncCount + 1;
      const syncDurationMsTotal =
        current.syncDurationMsTotal + Math.max(0, input.durationMs);
      const next: OrchestratorMetrics = {
        syncDurationMsTotal,
        syncCount,
        recordsImported:
          current.recordsImported + Math.max(0, input.recordsImported),
        evidenceCreated:
          current.evidenceCreated + Math.max(0, input.evidenceCreated),
        twinEntitiesUpdated:
          current.twinEntitiesUpdated +
          Math.max(0, input.twinEntitiesUpdated),
        failures: current.failures + (input.failed ? 1 : 0),
        retries: current.retries + (input.retried ? 1 : 0),
        apiUsage: current.apiUsage + 1,
        averageSyncDurationMs:
          syncCount > 0
            ? Math.round(syncDurationMsTotal / syncCount)
            : 0,
      };
      setMetrics(input.organizationId, next);
      return next;
    },
    recordApiUsage(organizationId, count = 1) {
      const current = getMetrics(organizationId);
      setMetrics(organizationId, {
        ...current,
        apiUsage: current.apiUsage + count,
      });
    },
    activeJobs(organizationId) {
      return listOrchestratorJobs(organizationId).filter(
        (j) =>
          j.status === "Queued" ||
          j.status === "Running" ||
          j.status === "Retrying"
      ).length;
    },
  };
}
