import type { AutomationStatusSnapshot } from "@/lib/platform/automation/operating";
import {
  listEnabledAutomationRules,
  triggerLabel,
} from "@/lib/platform/automation/operating";

type AutomationStatusPanelProps = {
  status: AutomationStatusSnapshot | null;
};

const RUN_STATUS_CLASS: Record<string, string> = {
  success: "text-emerald-700",
  skipped: "text-slate-500",
  failed: "text-rose-700",
  partial: "text-amber-700",
};

/** Read-only Automation Status for Founder Workspace (Sprint 068). */
export function AutomationStatusPanel({ status }: AutomationStatusPanelProps) {
  if (!status) {
    return (
      <section
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        aria-labelledby="automation-status-heading"
      >
        <h2
          id="automation-status-heading"
          className="text-lg font-semibold text-slate-900"
        >
          Automation Status
        </h2>
        <p className="mt-2 text-sm text-slate-500">No automation data yet.</p>
      </section>
    );
  }

  const activeRules = status.activeRules;
  const activeRuleList = listEnabledAutomationRules();
  const recent = status.recentRuns.slice(0, 8);
  const created = status.recentRuns
    .flatMap((r) => r.decisionsCreated)
    .slice(0, 6);
  const failures = status.recentRuns.filter(
    (r) => r.status === "failed" || r.status === "partial"
  );

  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      aria-labelledby="automation-status-heading"
    >
      <h2
        id="automation-status-heading"
        className="text-lg font-semibold text-slate-900"
      >
        Automation Status
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Deterministic rules — read-only this sprint
      </p>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2">
          <dt className="text-xs font-semibold text-slate-600">Active Rules</dt>
          <dd className="mt-1 text-xl font-semibold text-slate-900">
            {activeRules}
            <span className="ml-1 text-xs font-normal text-slate-500">
              / {status.totalRules}
            </span>
          </dd>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2">
          <dt className="text-xs font-semibold text-slate-600">Recent Runs</dt>
          <dd className="mt-1 text-xl font-semibold text-slate-900">
            {status.recentRuns.length}
          </dd>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2">
          <dt className="text-xs font-semibold text-slate-600">
            Decisions Created
          </dt>
          <dd className="mt-1 text-xl font-semibold text-slate-900">
            {status.decisionsCreated}
          </dd>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2">
          <dt className="text-xs font-semibold text-slate-600">Failures</dt>
          <dd className="mt-1 text-xl font-semibold text-slate-900">
            {status.failures}
          </dd>
        </div>
      </dl>

      <div className="mt-5">
        <h3 className="text-sm font-semibold text-slate-800">Active Rules</h3>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          {activeRuleList.map((rule) => (
            <li
              key={rule.id}
              className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2 text-xs"
            >
              <p className="font-medium text-slate-900">{rule.name}</p>
              <p className="mt-0.5 text-slate-500">
                {triggerLabel(rule.trigger)} · {rule.schedule}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Recent Runs</h3>
          {recent.length === 0 ? (
            <p className="mt-2 text-xs text-slate-500">No runs recorded.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {recent.map((run) => (
                <li
                  key={run.id}
                  className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-slate-900">
                      {run.ruleName}
                    </span>
                    <span
                      className={`font-semibold capitalize ${RUN_STATUS_CLASS[run.status] ?? "text-slate-600"}`}
                    >
                      {run.status}
                    </span>
                  </div>
                  <p className="mt-1 text-slate-500">
                    {triggerLabel(run.trigger)}
                    {run.subjectKey ? ` · ${run.subjectKey}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">
              Decisions Created
            </h3>
            {created.length === 0 ? (
              <p className="mt-2 text-xs text-slate-500">
                No automation-created decisions in recent runs.
              </p>
            ) : (
              <ul className="mt-2 space-y-1 text-xs text-slate-600">
                {created.map((id) => (
                  <li key={id} className="truncate font-mono">
                    {id}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Failures</h3>
            {failures.length === 0 ? (
              <p className="mt-2 text-xs text-slate-500">No recent failures.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {failures.slice(0, 5).map((run) => (
                  <li
                    key={run.id}
                    className="rounded-lg border border-rose-100 bg-rose-50/50 px-3 py-2 text-xs text-rose-800"
                  >
                    <p className="font-medium">{run.ruleName}</p>
                    <p className="mt-0.5">{run.error ?? run.status}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
