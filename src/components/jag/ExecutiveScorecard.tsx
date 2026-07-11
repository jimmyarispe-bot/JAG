import type { ExecutionScorecard } from "@/lib/platform/execution/types";
import type { OrganizationHealthScore } from "@/lib/platform/intelligence/organization/types";
import type { ExecutiveKPIs } from "@/lib/executive/kpis";

interface ExecutiveScorecardProps {
  scorecards: readonly ExecutionScorecard[];
  health: OrganizationHealthScore | null;
  kpis: ExecutiveKPIs | null;
}

export function ExecutiveScorecard({ scorecards, health, kpis }: ExecutiveScorecardProps) {
  return (
    <section id="executive-scorecard" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" data-stream-ready="true">
      <h2 className="text-lg font-semibold text-slate-900">Executive Scorecard</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-slate-50 px-3 py-3">
          <p className="text-xs text-slate-500">Org health</p>
          <p className="text-2xl font-semibold text-slate-900">{health?.score ?? "—"}</p>
          <p className="text-xs uppercase text-slate-500">{health?.band ?? "n/a"}</p>
        </div>
        <div className="rounded-xl bg-slate-50 px-3 py-3">
          <p className="text-xs text-slate-500">Enrollment</p>
          <p className="text-2xl font-semibold text-slate-900">{kpis?.enrollment ?? "—"}</p>
        </div>
        <div className="rounded-xl bg-slate-50 px-3 py-3">
          <p className="text-xs text-slate-500">Attendance</p>
          <p className="text-2xl font-semibold text-slate-900">
            {kpis ? `${kpis.studentAttendance}%` : "—"}
          </p>
        </div>
      </div>
      {scorecards.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No goal scorecards generated for this cycle.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {scorecards.map((card) => (
            <li key={card.scorecardId} className="rounded-xl border border-slate-100 px-3 py-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-900">{card.summary}</p>
                <span className="text-xs uppercase text-slate-500">{card.healthLabel}</span>
              </div>
              <dl className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                <div>
                  <dt className="text-slate-500">Progress</dt>
                  <dd className="font-medium text-slate-900">{card.progressPercent}%</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Risk</dt>
                  <dd className="font-medium text-slate-900">{card.riskScore}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Timeline</dt>
                  <dd className="font-medium text-slate-900">{card.timelineAdherencePercent}%</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Ownership</dt>
                  <dd className="font-medium text-slate-900">{card.ownerAccountabilityScore}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
