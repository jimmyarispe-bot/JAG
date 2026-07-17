/**
 * Sprint 024 — Publisher API (publish / publishMany / schedule / cancel).
 */

import { getEventBusAnalytics } from "@/lib/platform/events/analytics";
import {
  publishEvent,
  type PublishEventOptions,
} from "@/lib/platform/events/publisher/publish";
import {
  assertPublishPermission,
  assertPublishSecurity,
  enrichAuditMetadata,
  type EventSecurityOptions,
} from "@/lib/platform/events/security";
import type {
  EventDispatchResult,
  PublishEventInput,
  ScheduledEventRecord,
} from "@/lib/platform/events/types";

export type EventPublisherDependencies = {
  now?: () => Date;
  createId?: (prefix: string) => string;
  security?: EventSecurityOptions;
  publishOptions?: PublishEventOptions;
};

export class EventPublisher {
  private readonly now: () => Date;
  private readonly createId: (prefix: string) => string;
  private readonly security: EventSecurityOptions;
  private readonly publishOptions: PublishEventOptions;
  private readonly scheduled = new Map<string, ScheduledEventRecord>();

  constructor(dependencies: EventPublisherDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date());
    let n = 0;
    this.createId =
      dependencies.createId ?? ((prefix) => `${prefix}-${++n}`);
    this.security = dependencies.security ?? {};
    this.publishOptions = dependencies.publishOptions ?? {};
  }

  async publish(
    input: PublishEventInput,
    options?: PublishEventOptions
  ): Promise<EventDispatchResult> {
    const started = this.now().getTime();
    assertPublishSecurity(input, this.security);
    await assertPublishPermission(input, this.security);

    const requestId =
      input.requestId ??
      (typeof input.metadata?.requestId === "string"
        ? input.metadata.requestId
        : undefined);
    const applicationId =
      input.applicationId ??
      (typeof input.metadata?.applicationId === "string"
        ? input.metadata.applicationId
        : undefined);

    const enriched: PublishEventInput = {
      ...input,
      requestId,
      applicationId,
      metadata: {
        ...enrichAuditMetadata(input.metadata, {
          publishedAt: this.now().toISOString(),
        }),
        requestId,
        applicationId,
        busDelivery: input.delivery ?? "immediate",
      },
    };

    if (input.delivery === "queued") {
      enriched.dispatchMode = enriched.dispatchMode ?? "async";
    }

    const result = await publishEvent(enriched, {
      ...this.publishOptions,
      ...options,
    });
    getEventBusAnalytics().recordPublish(this.now().getTime() - started);
    return result;
  }

  async publishMany(
    inputs: readonly PublishEventInput[],
    options?: PublishEventOptions
  ): Promise<EventDispatchResult[]> {
    const results: EventDispatchResult[] = [];
    for (const input of inputs) {
      results.push(await this.publish(input, options));
    }
    return results;
  }

  schedule(input: PublishEventInput, runAt: Date | string): ScheduledEventRecord {
    const runAtIso = typeof runAt === "string" ? runAt : runAt.toISOString();
    const record: ScheduledEventRecord = {
      scheduleId: this.createId("sched"),
      input: {
        ...input,
        delivery: "scheduled",
        metadata: {
          ...input.metadata,
          busDelivery: "scheduled",
        },
      },
      runAt: runAtIso,
      cancelled: false,
      createdAt: this.now().toISOString(),
    };
    this.scheduled.set(record.scheduleId, record);
    getEventBusAnalytics().setScheduledPending(this.pendingScheduled().length);
    return record;
  }

  cancel(scheduleId: string): boolean {
    const existing = this.scheduled.get(scheduleId);
    if (!existing || existing.cancelled) return false;
    this.scheduled.set(scheduleId, { ...existing, cancelled: true });
    getEventBusAnalytics().setScheduledPending(this.pendingScheduled().length);
    return true;
  }

  pendingScheduled(): ScheduledEventRecord[] {
    return [...this.scheduled.values()].filter((r) => !r.cancelled);
  }

  /** Flush due scheduled publishes (call from scheduler / tests). */
  async flushDue(options?: PublishEventOptions): Promise<EventDispatchResult[]> {
    const nowIso = this.now().toISOString();
    const due = this.pendingScheduled().filter((r) => r.runAt <= nowIso);
    const results: EventDispatchResult[] = [];
    for (const record of due) {
      this.scheduled.set(record.scheduleId, { ...record, cancelled: true });
      results.push(
        await this.publish(
          { ...record.input, delivery: "immediate" },
          options
        )
      );
    }
    getEventBusAnalytics().setScheduledPending(this.pendingScheduled().length);
    return results;
  }
}

const defaultPublisher = new EventPublisher();

export async function publish(
  input: PublishEventInput,
  options?: PublishEventOptions
): Promise<EventDispatchResult> {
  return defaultPublisher.publish(input, options);
}

export async function publishMany(
  inputs: readonly PublishEventInput[],
  options?: PublishEventOptions
): Promise<EventDispatchResult[]> {
  return defaultPublisher.publishMany(inputs, options);
}

export function schedule(
  input: PublishEventInput,
  runAt: Date | string
): ScheduledEventRecord {
  return defaultPublisher.schedule(input, runAt);
}

export function cancel(scheduleId: string): boolean {
  return defaultPublisher.cancel(scheduleId);
}

export function getDefaultEventPublisher(): EventPublisher {
  return defaultPublisher;
}
