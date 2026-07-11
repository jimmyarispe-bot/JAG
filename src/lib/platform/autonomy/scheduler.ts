/**
 * Autonomous Executive Operating Loop — scheduler.
 *
 * Supports future background execution via injected runners.
 * No timers/cron are started here.
 */

import type { AutonomousExecutiveLoop } from "@/lib/platform/autonomy/executive-loop";
import type {
  AutonomyLoopRequest,
  AutonomyLoopResult,
  AutonomyScheduleJob,
} from "@/lib/platform/autonomy/types";

/** Contract for a background job runner. */
export interface AutonomyScheduleRunner {
  schedule(
    jobId: string,
    run: () => Promise<AutonomyLoopResult>
  ): Promise<string> | string;
  cancel?(jobId: string): Promise<boolean> | boolean;
}

/** In-memory runner for tests / local orchestration (no real background threads). */
export class InMemoryAutonomyScheduleRunner implements AutonomyScheduleRunner {
  private readonly jobs = new Map<string, () => Promise<AutonomyLoopResult>>();
  private readonly results = new Map<string, AutonomyLoopResult>();

  async schedule(
    jobId: string,
    run: () => Promise<AutonomyLoopResult>
  ): Promise<string> {
    this.jobs.set(jobId, run);
    return jobId;
  }

  async cancel(jobId: string): Promise<boolean> {
    return this.jobs.delete(jobId);
  }

  async runNow(jobId: string): Promise<AutonomyLoopResult> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Autonomy schedule job not found: ${jobId}`);
    }
    const result = await job();
    this.results.set(jobId, result);
    return result;
  }

  getResult(jobId: string): AutonomyLoopResult | null {
    return this.results.get(jobId) ?? null;
  }

  listJobs(): string[] {
    return Array.from(this.jobs.keys());
  }
}

export interface AutonomySchedulerDependencies {
  loop: AutonomousExecutiveLoop;
  runner?: AutonomyScheduleRunner;
  now?: () => Date;
  createId?: (prefix: string) => string;
}

/**
 * Schedules autonomous loop cycles without owning a clock/timer.
 */
export class AutonomyScheduler {
  private readonly loop: AutonomousExecutiveLoop;
  private readonly runner: AutonomyScheduleRunner;
  private readonly now: () => Date;
  private readonly createId: (prefix: string) => string;
  private readonly registry = new Map<string, AutonomyScheduleJob>();

  constructor(dependencies: AutonomySchedulerDependencies) {
    this.loop = dependencies.loop;
    this.runner =
      dependencies.runner ?? new InMemoryAutonomyScheduleRunner();
    this.now = dependencies.now ?? (() => new Date());
    let n = 0;
    this.createId =
      dependencies.createId ?? ((prefix) => `${prefix}-${++n}`);
  }

  async schedule(request: AutonomyLoopRequest): Promise<AutonomyScheduleJob> {
    const jobId = this.createId("job");
    const job: AutonomyScheduleJob = {
      jobId,
      requestId: request.requestId,
      scheduledAt: this.now().toISOString(),
      status: "scheduled",
    };
    this.registry.set(jobId, job);

    await this.runner.schedule(jobId, async () => {
      this.registry.set(jobId, { ...job, status: "running" });
      const result = await this.loop.run(request);
      this.registry.set(jobId, { ...job, status: "completed" });
      return result;
    });

    return job;
  }

  async cancel(jobId: string): Promise<boolean> {
    const cancelled = (await this.runner.cancel?.(jobId)) ?? false;
    if (cancelled) {
      const existing = this.registry.get(jobId);
      if (existing) {
        this.registry.set(jobId, { ...existing, status: "cancelled" });
      }
    }
    return cancelled;
  }

  getJob(jobId: string): AutonomyScheduleJob | null {
    return this.registry.get(jobId) ?? null;
  }

  /** Explicitly execute a scheduled job when using the in-memory runner. */
  async runNow(jobId: string): Promise<AutonomyLoopResult> {
    const runner = this.runner;
    if (!(runner instanceof InMemoryAutonomyScheduleRunner)) {
      throw new Error("runNow requires InMemoryAutonomyScheduleRunner");
    }
    return runner.runNow(jobId);
  }
}
