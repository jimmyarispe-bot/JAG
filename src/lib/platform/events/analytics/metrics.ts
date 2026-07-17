export type EventBusMetricsSnapshot = {
  published: number;
  subscriberInvocations: number;
  failures: number;
  retries: number;
  deadLetters: number;
  totalLatencyMs: number;
  averageLatencyMs: number;
  queueDepth: number;
  scheduledPending: number;
};

export class EventBusAnalytics {
  private published = 0;
  private subscriberInvocations = 0;
  private failures = 0;
  private retries = 0;
  private deadLetters = 0;
  private totalLatencyMs = 0;
  private queueDepth = 0;
  private scheduledPending = 0;

  recordPublish(latencyMs: number): void {
    this.published += 1;
    this.totalLatencyMs += Math.max(0, latencyMs);
  }

  recordSubscriber(success: boolean): void {
    this.subscriberInvocations += 1;
    if (!success) this.failures += 1;
  }

  recordRetry(): void {
    this.retries += 1;
  }

  recordDeadLetter(): void {
    this.deadLetters += 1;
  }

  setQueueDepth(depth: number): void {
    this.queueDepth = depth;
  }

  setScheduledPending(count: number): void {
    this.scheduledPending = count;
  }

  snapshot(): EventBusMetricsSnapshot {
    return {
      published: this.published,
      subscriberInvocations: this.subscriberInvocations,
      failures: this.failures,
      retries: this.retries,
      deadLetters: this.deadLetters,
      totalLatencyMs: this.totalLatencyMs,
      averageLatencyMs:
        this.published > 0 ? this.totalLatencyMs / this.published : 0,
      queueDepth: this.queueDepth,
      scheduledPending: this.scheduledPending,
    };
  }

  reset(): void {
    this.published = 0;
    this.subscriberInvocations = 0;
    this.failures = 0;
    this.retries = 0;
    this.deadLetters = 0;
    this.totalLatencyMs = 0;
    this.queueDepth = 0;
    this.scheduledPending = 0;
  }
}

let defaultAnalytics: EventBusAnalytics | null = null;

export function getEventBusAnalytics(): EventBusAnalytics {
  if (!defaultAnalytics) defaultAnalytics = new EventBusAnalytics();
  return defaultAnalytics;
}

export function resetEventBusAnalytics(): void {
  getEventBusAnalytics().reset();
}
