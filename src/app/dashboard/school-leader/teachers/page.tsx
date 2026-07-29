import Link from "next/link";
import { requireSchoolLeaderExperienceContext } from "@/lib/school-leader/experience/access";
import { getSchoolLeaderTeachersSummary } from "@/lib/school-leader/experience/summaries";
import { publishSchoolLeaderExperienceEvent } from "@/lib/school-leader/experience/events";

export default async function SchoolLeaderTeachersPage() {
  const ctx = await requireSchoolLeaderExperienceContext();
  const data = await getSchoolLeaderTeachersSummary(ctx.supabase, ctx.schoolId);

  publishSchoolLeaderExperienceEvent({
    type: "school_leader.teachers_reviewed",
    organizationId: ctx.organizationId,
    recordType: "campus",
    recordId: ctx.schoolId ?? ctx.organizationId,
    actorUserId: ctx.actorUserId,
    projectLive: false,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Teachers</h1>
        <p className="mt-1 text-slate-600">{data.note}</p>
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold">Teacher roster</h2>
          <ul className="mt-3 max-h-96 space-y-2 overflow-y-auto text-sm">
            {data.teachers.map((t) => (
              <li key={t.id} className="rounded-lg bg-slate-50 px-3 py-2">
                {t.name}
                {t.title ? ` · ${t.title}` : ""}
              </li>
            ))}
            {!data.teachers.length && <li className="text-slate-500">No active employees.</li>}
          </ul>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold">Workload / coverage</h2>
          <ul className="mt-3 max-h-96 space-y-2 overflow-y-auto text-sm">
            {data.workload.map((w) => (
              <li key={w.employeeId} className="rounded-lg bg-slate-50 px-3 py-2">
                {w.name} · {w.sessionCount} sessions · {w.weeklyHours}h
                {w.overloaded ? " · overloaded" : ""}
              </li>
            ))}
            {!data.workload.length && (
              <li className="text-slate-500">
                Workload available when school is assigned. See{" "}
                <Link href="/dashboard/scheduling" className="underline">
                  Scheduling
                </Link>
                .
              </li>
            )}
          </ul>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Open positions</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {data.openPositions.map((p) => (
            <li key={p.id} className="rounded-lg bg-slate-50 px-3 py-2">
              {p.title}
              {p.department ? ` · ${p.department}` : ""}
            </li>
          ))}
          {!data.openPositions.length && <li className="text-slate-500">No open positions.</li>}
        </ul>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <Link href="/dashboard/hr" className="underline">
            HR / workforce
          </Link>
          <Link href="/dashboard/school-leader/hr" className="underline">
            HR summary
          </Link>
        </div>
      </section>
    </div>
  );
}
