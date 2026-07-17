import type { IntegrationPlatform } from "@/lib/platform/integrations/common/services/platform";
import type { SyncResult } from "@/lib/platform/integrations/common/types";
import type { SyncQueueService } from "@/lib/platform/integrations/management/sync-queue";

const DEFAULT_MAX_ATTEMPTS = 3;

export class RetryManager {
  constructor(
    private readonly platform: IntegrationPlatform,
    private readonly queue: SyncQueueService
  ) {}

  async scheduleRetry(
    instanceId: string,
    reason: string,
    options: { maxAttempts?: number; jobId?: string | null } = {}
  ) {
    const config = this.platform.persistence.getConfiguration(instanceId);
    if (!config) throw new Error(`Unknown instance: ${instanceId}`);
    const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
    const lifecycle = this.platform.persistence.getLifecycle(instanceId);
    const attempt = (lifecycle?.retryCount ?? 0) + 1;

    if (attempt > maxAttempts) {
      this.platform.persistence.appendRetryHistory({
        instanceId,
        connectorId: config.connectorId,
        jobId: options.jobId ?? null,
        attempt,
        maxAttempts,
        outcome: "exhausted",
        reason,
      });
      await this.platform.events.publish({
        type: "RetryExhausted",
        instanceId,
        connectorId: config.connectorId,
        payload: { attempt, maxAttempts, reason },
      });
      return null;
    }

    this.platform.persistence.appendRetryHistory({
      instanceId,
      connectorId: config.connectorId,
      jobId: options.jobId ?? null,
      attempt,
      maxAttempts,
      outcome: "scheduled",
      reason,
    });

    if (lifecycle) {
      this.platform.persistence.saveLifecycle({
        ...lifecycle,
        phase: "retrying",
        retryCount: attempt,
      });
    }

    await this.platform.events.publish({
      type: "RetryScheduled",
      instanceId,
      connectorId: config.connectorId,
      payload: { attempt, maxAttempts, reason },
    });

    return this.queue.enqueue({
      instanceId,
      mode: "incremental",
      triggeredBy: "retry",
      priority: 80,
    });
  }

  async recover(instanceId: string): Promise<SyncResult | null> {
    const item = await this.scheduleRetry(instanceId, "manual_recovery");
    if (!item) return null;
    const results = await this.queue.drain(1);
    const result = results[0] ?? null;
    if (result && (result.status === "succeeded" || result.status === "partial")) {
      const config = this.platform.persistence.getConfiguration(instanceId);
      this.platform.persistence.appendRetryHistory({
        instanceId,
        connectorId: config?.connectorId ?? "unknown",
        jobId: result.jobId,
        attempt: this.platform.persistence.getLifecycle(instanceId)?.retryCount ?? 1,
        maxAttempts: DEFAULT_MAX_ATTEMPTS,
        outcome: "succeeded",
        reason: "recovery",
      });
      await this.platform.events.publish({
        type: "RetrySucceeded",
        instanceId,
        connectorId: config?.connectorId,
        payload: { jobId: result.jobId },
      });
    }
    return result;
  }

  history(instanceId?: string, limit = 50) {
    return this.platform.persistence.listRetryHistory(instanceId, limit);
  }
}
