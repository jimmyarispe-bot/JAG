/**
 * Organizational Intelligence — scheduler.
 *
 * Supports future background execution through dependency injection.
 * No timers/cron are started here — callers inject a runner.
 */

import type { OrganizationObserver } from "@/lib/platform/intelligence/organization/observer";
import type {
  OrganizationObservationRequest,
  OrganizationObservationResult,
} from "@/lib/platform/intelligence/organization/types";

/** Contract for a background job runner. */
export interface OrganizationScheduleRunner {
  schedule(
    jobId: string,
    run: () => Promise<OrganizationObservationResult>
  ): Promise<string> | string;
  cancel?(jobId: string): Promise<boolean> | boolean;
}

/** In-memory runner for tests / local orchestration (no real background threads). */
export class InMemoryOrganizationScheduleRunner implements OrganizationScheduleRunner {
  private readonly jobs = new Map<string, () => Promise<OrganizationObservationResult>>();
  private readonly results = new Map<string, OrganizationObservationResult>();

  async schedule(
    jobId: string,
    run: () => Promise<OrganizationObservationResult>
  ): Promise<string> {
    this.jobs.set(jobId, run);
    return jobId;
  }

  async cancel(jobId: string): Promise<boolean> {
    return this.jobs.delete(jobId);
  }

  /** Explicitly execute a scheduled job (no automatic timers). */
  async runNow(jobId: string): Promise<OrganizationObservationResult> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Organization schedule job not found: ${jobId}`);
    }
    const result = await job();
    this.results.set(jobId, result);
    return result;
  }

  getResult(jobId: string): OrganizationObservationResult | null {
    return this.results.get(jobId) ?? null;
  }

  listJobs(): string[] {
    return Array.from(this.jobs.keys());
  }
}

export interface OrganizationSchedulerDependencies {
  observer: OrganizationObserver;
  runner?: OrganizationScheduleRunner;
  createJobId?: (request: OrganizationObservationRequest) => string;
}

/**
 * Schedules organizational observations via an injected runner.
 */
export class OrganizationScheduler {
  private readonly observer: OrganizationObserver;
  private readonly runner: OrganizationScheduleRunner;
  private readonly createJobId: (request: OrganizationObservationRequest) => string;

  constructor(dependencies: OrganizationSchedulerDependencies) {
    this.observer = dependencies.observer;
    this.runner =
      dependencies.runner ?? new InMemoryOrganizationScheduleRunner();
    this.createJobId =
      dependencies.createJobId ??
      ((request) => `org-observe:${request.requestId}`);
  }

  /**
   * Register an observation for future/background execution.
   */
  async schedule(
    request: OrganizationObservationRequest
  ): Promise<{ jobId: string }> {
    const jobId = this.createJobId(request);
    await this.runner.schedule(jobId, () => this.observer.observe(request));
    return { jobId };
  }

  /**
   * Run a scheduled job immediately when using the in-memory runner.
   */
  async runScheduled(jobId: string): Promise<OrganizationObservationResult> {
    if (this.runner instanceof InMemoryOrganizationScheduleRunner) {
      return this.runner.runNow(jobId);
    }
    throw new Error(
      "runScheduled is only available with InMemoryOrganizationScheduleRunner"
    );
  }

  getRunner(): OrganizationScheduleRunner {
    return this.runner;
  }
}
