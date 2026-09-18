import { getJobRunHistory, STALE_AFTER_HOURS } from "@/lib/platform/automation/job-runs";

/**
 * Did the nightly job actually run?
 *
 * The runner has recorded every execution since migration 289 and nothing has
 * ever shown them, so the question stayed unanswerable while the answer sat in
 * the database. This panel exists to answer it in the first line, before any
 * detail: a green sentence or a red one.
 *
 * The failures are listed by name. Knowing three jobs failed is not knowing
 * which, and by the time anyone looks the logs are gone - which is why the
 * table keeps them as jsonb rather than a count.
 */

function ago(hours: number): string {
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} minutes ago`;
  if (hours < 48) return `${Math.round(hours)} hours ago`;
  return `${Math.round(hours / 24)} days ago`;
}

function when(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function JobRunsPanel() {
  const history = await getJobRunHistory();

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold text-slate-900">The job runner</h2>
        <p className="text-xs text-slate-500">
          One row per execution. Nightly, plus anything run by hand.
        </p>
      </div>

      {history.unavailable ? (
        /* An error and an empty table are different facts, and this panel of
           all panels must not report one as the other. */
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          The run history could not be read: {history.unavailable}
        </p>
      ) : (
        <>
          <p
            className={`mt-3 rounded-xl px-3 py-2 text-sm font-medium ${
              history.stale
                ? "bg-rose-50 text-rose-900"
                : "bg-emerald-50 text-emerald-900"
            }`}
          >
            {history.hoursSinceLastRun === null
              ? "No run has ever been recorded. The job runner has not executed since this record began."
              : history.stale
                ? `Last run ${ago(history.hoursSinceLastRun)} — longer than the ${STALE_AFTER_HOURS} hours a nightly job should go. Nothing has run.`
                : `Last run ${ago(history.hoursSinceLastRun)}.`}
          </p>

          {history.runs.length > 0 && (
            <ul className="mt-3 divide-y divide-slate-100">
              {history.runs.map((run) => (
                <li key={run.id} className="py-2">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-sm font-medium text-slate-800">{when(run.ranAt)}</span>
                    <span className="text-xs uppercase tracking-wide text-slate-400">
                      {run.triggeredBy === "cron" ? "Scheduled" : "By hand"}
                    </span>
                    <span className="text-xs text-slate-500">
                      {run.jobsRun} {run.jobsRun === 1 ? "job" : "jobs"} ·{" "}
                      {(run.durationMs / 1000).toFixed(1)}s
                    </span>
                    {run.failureCount > 0 ? (
                      <span className="text-xs font-medium text-rose-600">
                        {run.failureCount} failed
                      </span>
                    ) : (
                      <span className="text-xs text-emerald-600">clean</span>
                    )}
                  </div>

                  {run.failures.length > 0 && (
                    <ul className="mt-1 space-y-0.5 pl-1">
                      {run.failures.map((failure, i) => (
                        <li key={i} className="text-xs text-slate-600">
                          <span className="font-medium">{failure.name ?? "unnamed job"}</span>
                          {failure.error ? ` — ${failure.error}` : ""}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
