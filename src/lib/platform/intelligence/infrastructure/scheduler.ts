/**
 * Intelligence Platform Infrastructure — IntelligenceScheduler (Sprint 027).
 */

import type {
  IntelligencePlatformClock,
  IntelligenceScheduler as IntelligenceSchedulerContract,
  IntelligenceTelemetry,
} from "@/lib/platform/intelligence/infrastructure/contracts";
import type { IntelligenceSchedulerJob } from "@/lib/platform/intelligence/infrastructure/types";
import { createDefaultClock } from "@/lib/platform/intelligence/infrastructure/clock";

type JobHandler = (job: IntelligenceSchedulerJob) => Promise<void> | void;

export class IntelligenceSchedulerImpl implements IntelligenceSchedulerContract {
  private readonly jobs = new Map<string, IntelligenceSchedulerJob>();
  private readonly handlers = new Map<string, JobHandler>();
  private readonly clock: IntelligencePlatformClock;
  private readonly telemetry: IntelligenceTelemetry | null;

  constructor(options: {
    clock?: IntelligencePlatformClock;
    telemetry?: IntelligenceTelemetry;
  } = {}) {
    this.clock = options.clock ?? createDefaultClock();
    this.telemetry = options.telemetry ?? null;
  }

  schedule(
    job: Omit<IntelligenceSchedulerJob, "lastRunAt" | "nextRunAt" | "runCount"> & {
      lastRunAt?: string | null;
      nextRunAt?: string | null;
      runCount?: number;
    },
    handler?: JobHandler
  ): IntelligenceSchedulerJob {
    const now = this.clock.now();
    const record: IntelligenceSchedulerJob = {
      id: job.id,
      name: job.name,
      moduleId: job.moduleId,
      intervalMs: Math.max(1, job.intervalMs),
      enabled: job.enabled,
      lastRunAt: job.lastRunAt ?? null,
      nextRunAt:
        job.nextRunAt ??
        new Date(now.getTime() + Math.max(1, job.intervalMs)).toISOString(),
      runCount: job.runCount ?? 0,
    };
    this.jobs.set(record.id, record);
    if (handler) {
      this.handlers.set(record.id, handler);
    }
    return { ...record };
  }

  on(jobId: string, handler: JobHandler): void {
    this.handlers.set(jobId, handler);
  }

  unschedule(jobId: string): boolean {
    this.handlers.delete(jobId);
    return this.jobs.delete(jobId);
  }

  list(): IntelligenceSchedulerJob[] {
    return [...this.jobs.values()]
      .map((job) => ({ ...job }))
      .sort((a, b) => a.id.localeCompare(b.id));
  }

  get(jobId: string): IntelligenceSchedulerJob | undefined {
    const job = this.jobs.get(jobId);
    return job ? { ...job } : undefined;
  }

  enable(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (job) job.enabled = true;
  }

  disable(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (job) job.enabled = false;
  }

  clear(): void {
    this.jobs.clear();
    this.handlers.clear();
  }

  async tick(now: Date = this.clock.now()): Promise<IntelligenceSchedulerJob[]> {
    const due: IntelligenceSchedulerJob[] = [];
    for (const job of this.jobs.values()) {
      if (!job.enabled) continue;
      if (!job.nextRunAt || new Date(job.nextRunAt).getTime() > now.getTime()) {
        continue;
      }
      job.lastRunAt = now.toISOString();
      job.runCount += 1;
      job.nextRunAt = new Date(now.getTime() + job.intervalMs).toISOString();
      due.push({ ...job });
      const handler = this.handlers.get(job.id);
      if (handler) {
        await handler(job);
      }
      this.telemetry?.emit("scheduler.tick", {
        moduleId: job.moduleId,
        payload: { jobId: job.id, runCount: job.runCount },
      });
    }
    return due;
  }
}

/** Alias matching Sprint 027 naming. */
export { IntelligenceSchedulerImpl as IntelligenceScheduler };

export function createIntelligenceScheduler(options?: {
  clock?: IntelligencePlatformClock;
  telemetry?: IntelligenceTelemetry;
}): IntelligenceSchedulerImpl {
  return new IntelligenceSchedulerImpl(options);
}
