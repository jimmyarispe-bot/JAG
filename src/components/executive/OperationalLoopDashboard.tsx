import { formatCount } from "@/lib/format";
import type { LoopGapReport, OperationalLoopSummary } from "@/lib/platform/operational-loop/types";
import { OPERATIONAL_LOOP_STAGES } from "@/lib/platform/operational-loop/types";
import { RetryLoopButton } from "@/components/executive/RetryLoopButton";
import { ActionChip } from "@/components/experience-system/feedback/ActionChip";

interface OperationalLoopDashboardProps {
  summary: OperationalLoopSummary;
  gapReports: LoopGapReport[];
}

function stageLabel(stage: string) {
  return stage.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function OperationalLoopDashboard({ summary, gapReports }: OperationalLoopDashboardProps) {
  return (
    <div className="space-y-8">
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">JAG Operational Loop™</h2>
            <p className="text-sm text-slate-600">
              Admissions → Enrollment → Scheduling → Instruction → Evidence → Progress → Parent
              Communication → Billing → Repeat
            </p>
          </div>
          <div className="flex gap-2 text-sm">
            <span className="rounded-lg bg-emerald-50 px-3 py-1 text-emerald-800">
              {formatCount(summary.completedTransitions24h)} transitions (24h)
            </span>
            {summary.failedTransitions24h > 0 && (
              <span className="rounded-lg bg-rose-50 px-3 py-1 text-rose-800">
                {formatCount(summary.failedTransitions24h)} failed (24h)
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <article className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Active students</p>
            <p className="mt-1 text-2xl font-semibold">{formatCount(summary.activeStudents)}</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Open handoff gaps</p>
            <p className="mt-1 text-2xl font-semibold text-amber-700">{formatCount(summary.openGaps)}</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-4 lg:col-span-2">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Students by loop stage</p>
            <div className="flex flex-wrap gap-2">
              {OPERATIONAL_LOOP_STAGES.map((stage) => (
                <span
                  key={stage}
                  className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700"
                >
                  {stageLabel(stage)}: {summary.byStage[stage] ?? 0}
                </span>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="font-semibold">Recent transitions</h3>
          <ul className="mt-3 max-h-80 space-y-2 overflow-y-auto text-sm">
            {summary.recentTransitions.map((t) => (
              <li
                key={t.id}
                className={`rounded-lg px-3 py-2 ${
                  t.status === "failed" ? "bg-rose-50" : "bg-slate-50"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{t.transitionKey.replace(/_/g, " → ")}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(t.createdAt).toLocaleString()} · {t.status}
                    </p>
                  </div>
                  {t.status === "failed" && <RetryLoopButton auditEntryId={t.id} />}
                </div>
              </li>
            ))}
            {!summary.recentTransitions.length && (
              <li className="text-slate-500">No loop transitions recorded yet.</li>
            )}
          </ul>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="font-semibold">Handoff gap report</h3>
          <p className="mt-1 text-sm text-slate-600">Incomplete transitions detected across active students.</p>
          <ul className="mt-3 max-h-80 space-y-3 overflow-y-auto text-sm">
            {gapReports.slice(0, 15).map((report) => (
              <li key={report.studentId} className="rounded-lg border border-slate-100 p-3">
                <div className="flex items-center justify-between gap-2">
                  <ActionChip href={`/dashboard/students/${report.studentId}`} size="sm">
                    {report.studentName}
                  </ActionChip>
                  <span className="text-xs text-slate-500">{report.completenessPct}% complete</span>
                </div>
                <ul className="mt-2 space-y-1">
                  {report.gaps.slice(0, 3).map((gap) => (
                    <li key={gap.transitionKey} className="text-xs text-slate-600">
                      <span
                        className={
                          gap.severity === "critical"
                            ? "text-rose-600"
                            : gap.severity === "warning"
                              ? "text-amber-600"
                              : ""
                        }
                      >
                        {gap.label}:
                      </span>{" "}
                      {gap.reason}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
            {!gapReports.length && (
              <li className="text-emerald-700">No handoff gaps detected for sampled active students.</li>
            )}
          </ul>
        </article>
      </section>
    </div>
  );
}
