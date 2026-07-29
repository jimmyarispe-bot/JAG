import Link from "next/link";
import { requireTeacherExperienceContext } from "@/lib/teacher/experience/access";
import { getTeacherTimesheetPreview } from "@/lib/teacher/experience/timesheets";

export default async function TeacherTimesheetsPage() {
  const ctx = await requireTeacherExperienceContext();
  const preview = await getTeacherTimesheetPreview(ctx.supabase, {
    organizationId: ctx.organizationId,
    employeeId: ctx.employeeId,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Timesheets</h1>
        <p className="mt-1 text-slate-600">
          Weekly hours, session summaries, and payroll preview — Finance / workforce timekeeping
          only. No duplicated payroll logic.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Completed sessions today</p>
          <p className="text-2xl font-semibold">
            {preview.payrollPreview.completedSessionsToday}
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Est. minutes (preview)</p>
          <p className="text-2xl font-semibold">
            {preview.payrollPreview.estimatedMinutesFromSessions}
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Timesheets on file</p>
          <p className="text-2xl font-semibold">{preview.weeklySheets.length}</p>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Session summaries (today)</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {preview.sessionSummaries.map((s) => (
            <li key={s.id} className="rounded-lg bg-slate-50 px-3 py-2">
              {s.label} · {s.timeDisplay} · {s.status}
            </li>
          ))}
          {!preview.sessionSummaries.length && (
            <li className="text-slate-500">No completed sessions today yet.</li>
          )}
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Weekly timesheets</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {preview.weeklySheets.map((t) => (
            <li key={t.id} className="rounded-lg bg-slate-50 px-3 py-2">
              Week of {t.weekStarting} · {t.status} · {t.totalMinutes ?? 0} min
            </li>
          ))}
          {!preview.weeklySheets.length && (
            <li className="text-slate-500">
              No pack timesheets yet for this organization/employee. Submission uses workforce
              timekeeping APIs (`/api/academyos/timesheets`).
            </li>
          )}
        </ul>
        <p className="mt-3 text-xs text-slate-500">{preview.payrollPreview.note}</p>
        <Link href="/api/academyos/timesheets" className="mt-2 inline-block text-sm underline">
          Timesheets API
        </Link>
      </section>
    </div>
  );
}
