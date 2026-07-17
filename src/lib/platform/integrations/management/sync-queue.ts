import type { IntegrationPlatform } from "@/lib/platform/integrations/common/services/platform";
import type {
  SyncMode,
  SyncQueueItem,
  SyncResult,
  SyncTrigger,
} from "@/lib/platform/integrations/common/types";

export class SyncQueueService {
  constructor(private readonly platform: IntegrationPlatform) {}

  enqueue(input: {
    instanceId: string;
    mode?: SyncMode;
    triggeredBy?: SyncTrigger;
    priority?: number;
  }): SyncQueueItem {
    const config = this.platform.persistence.getConfiguration(input.instanceId);
    if (!config) throw new Error(`Unknown instance: ${input.instanceId}`);
    if (config.paused) throw new Error(`Connector paused: ${input.instanceId}`);
    if (!config.enabled) throw new Error(`Connector disabled: ${input.instanceId}`);

    return this.platform.persistence.enqueueSync({
      instanceId: input.instanceId,
      connectorId: config.connectorId,
      mode: input.mode ?? "incremental",
      triggeredBy: input.triggeredBy ?? "manual",
      priority: input.priority ?? (input.triggeredBy === "webhook" ? 100 : 50),
    });
  }

  list(instanceId?: string): SyncQueueItem[] {
    return this.platform.persistence.listQueue(instanceId);
  }

  async processNext(): Promise<SyncResult | null> {
    const next = this.platform.persistence
      .listQueue()
      .find((q) => q.status === "queued");
    if (!next) return null;

    this.platform.persistence.updateQueueItem(next.id, {
      status: "running",
      startedAt: new Date().toISOString(),
      attempts: next.attempts + 1,
    });

    try {
      const connector = this.platform.getConnector(next.connectorId);
      if (!connector) throw new Error(`Unknown connector: ${next.connectorId}`);

      this.platform.persistence.appendAudit({
        instanceId: next.instanceId,
        connectorId: next.connectorId,
        action: "sync_started",
        actor: "queue",
        detail: { queueId: next.id, mode: next.mode, triggeredBy: next.triggeredBy },
      });

      const result = await connector.sync({
        instanceId: next.instanceId,
        mode: next.mode,
        triggeredBy: next.triggeredBy,
      });

      this.platform.persistence.updateQueueItem(next.id, {
        status: result.status === "failed" ? "failed" : "completed",
        finishedAt: new Date().toISOString(),
      });

      this.platform.persistence.appendAudit({
        instanceId: next.instanceId,
        connectorId: next.connectorId,
        action: result.status === "failed" ? "sync_failed" : "sync_completed",
        actor: "queue",
        detail: {
          queueId: next.id,
          jobId: result.jobId,
          status: result.status,
          recordsAccepted: result.recordsAccepted,
          durationMs: result.durationMs,
        },
      });

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.platform.persistence.updateQueueItem(next.id, {
        status: "failed",
        finishedAt: new Date().toISOString(),
      });
      this.platform.persistence.appendErrorHistory({
        instanceId: next.instanceId,
        connectorId: next.connectorId,
        code: "queue_process_failed",
        message,
        source: "queue",
      });
      this.platform.persistence.appendAudit({
        instanceId: next.instanceId,
        connectorId: next.connectorId,
        action: "sync_failed",
        actor: "queue",
        detail: { queueId: next.id, error: message },
      });
      await this.platform.events.publish({
        type: "SyncFailed",
        instanceId: next.instanceId,
        connectorId: next.connectorId,
        payload: { queueId: next.id, error: message },
      });
      throw error;
    }
  }

  async drain(max = 10): Promise<SyncResult[]> {
    const results: SyncResult[] = [];
    for (let i = 0; i < max; i++) {
      const result = await this.processNext();
      if (!result) break;
      results.push(result);
    }
    return results;
  }
}
