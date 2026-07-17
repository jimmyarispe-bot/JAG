import type { IntegrationPlatform } from "@/lib/platform/integrations/common/services/platform";
import type { SyncHistoryRecord } from "@/lib/platform/integrations/common/types";

export class SyncHistoryService {
  constructor(private readonly platform: IntegrationPlatform) {}

  list(instanceId?: string, limit = 50): SyncHistoryRecord[] {
    return this.platform.persistence.listSyncHistory(instanceId, limit);
  }

  lastSuccessful(instanceId: string): SyncHistoryRecord | null {
    return (
      this.list(instanceId, 50).find((r) => r.status === "succeeded" || r.status === "partial") ??
      null
    );
  }

  lastFailed(instanceId: string): SyncHistoryRecord | null {
    return this.list(instanceId, 50).find((r) => r.status === "failed") ?? null;
  }

  summary(instanceId: string) {
    const rows = this.list(instanceId, 100);
    const lastOk = this.lastSuccessful(instanceId);
    const lastFail = this.lastFailed(instanceId);
    return {
      total: rows.length,
      succeeded: rows.filter((r) => r.status === "succeeded").length,
      failed: rows.filter((r) => r.status === "failed").length,
      partial: rows.filter((r) => r.status === "partial").length,
      lastSuccessfulSyncAt: lastOk?.finishedAt ?? null,
      lastFailedSyncAt: lastFail?.finishedAt ?? null,
      lastDurationMs: rows[0]?.durationMs ?? null,
      lastRecordsProcessed: rows[0]
        ? rows[0].recordsAccepted + rows[0].recordsRejected
        : null,
      lastErrors: rows[0]?.errors ?? [],
      lastWarnings: rows[0]?.warnings ?? [],
      lastRetryAttempts: rows[0]?.retryAttempts ?? 0,
    };
  }
}
