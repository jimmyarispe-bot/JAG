import { createAuthClient } from "@/lib/supabase/server-auth";

/**
 * Reading the job runner's own record of itself.
 *
 * platform_job_runs (migration 289) carries a comment that is the whole point:
 *
 *   "Exists because the runner spent months reporting success while doing
 *    nothing, and nothing recorded enough to notice."
 *
 * The table was built. The runner writes to it. Nothing ever read it back, so
 * "did the nightly job run?" stayed exactly as unanswerable as it was before -
 * the evidence was being collected into a room with no door. Fifteen runs are
 * sitting in there.
 *
 * RLS restricts reads to mission_control.access, CEO and FOUNDER, so this uses
 * the caller's own session rather than the service role: the people who should
 * see it are named in the policy, and nobody else should.
 */

/** Nightly plus a generous grace. Past this, silence means something. */
export const STALE_AFTER_HOURS = 26;

export interface JobRunFailure {
  name?: string;
  error?: string;
}

export interface JobRun {
  id: string;
  triggeredBy: "cron" | "human" | string;
  jobsRun: number;
  failureCount: number;
  durationMs: number;
  failures: JobRunFailure[];
  ranAt: string;
}

export interface JobRunHistory {
  runs: JobRun[];
  /** Hours since the most recent run, or null when nothing has ever run. */
  hoursSinceLastRun: number | null;
  /** True when nothing has run inside the window a nightly job should. */
  stale: boolean;
  /** Set when the read itself failed, so an error never reads as "no runs". */
  unavailable: string | null;
}

export async function getJobRunHistory(limit = 10): Promise<JobRunHistory> {
  const supabase = await createAuthClient();

  const { data, error } = await supabase
    .from("platform_job_runs")
    .select("id, triggered_by, jobs_run, failure_count, duration_ms, failures, ran_at")
    .order("ran_at", { ascending: false })
    .limit(limit);

  /* Checked, not assumed. A policy refusal resolves rather than throwing, and
     reporting one as "no runs recorded" would be the same silent empty this
     table exists to expose. */
  if (error) {
    return { runs: [], hoursSinceLastRun: null, stale: false, unavailable: error.message };
  }

  const runs: JobRun[] = ((data ?? []) as Record<string, unknown>[]).map((row) => ({
    id: String(row.id),
    triggeredBy: String(row.triggered_by ?? "unknown"),
    jobsRun: Number(row.jobs_run ?? 0),
    failureCount: Number(row.failure_count ?? 0),
    durationMs: Number(row.duration_ms ?? 0),
    failures: Array.isArray(row.failures) ? (row.failures as JobRunFailure[]) : [],
    ranAt: String(row.ran_at),
  }));

  const latest = runs[0];
  const hoursSinceLastRun = latest
    ? (Date.now() - new Date(latest.ranAt).getTime()) / 3_600_000
    : null;

  return {
    runs,
    hoursSinceLastRun,
    /* Never run at all is stale. A table that has only ever been empty is the
       loudest answer this panel can give. */
    stale: hoursSinceLastRun === null || hoursSinceLastRun > STALE_AFTER_HOURS,
    unavailable: null,
  };
}
