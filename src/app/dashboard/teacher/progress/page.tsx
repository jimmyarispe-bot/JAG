import Link from "next/link";
import { requireTeacherExperienceContext } from "@/lib/teacher/experience/access";
import {
  getTeacherInterventions,
  getTeacherRosterStudents,
} from "@/lib/teacher/queries";
import { getParentLearningSummary } from "@/lib/portal/experience/learning";
import { publishTeacherExperienceEvent } from "@/lib/teacher/experience/events";

export default async function TeacherProgressPage() {
  const ctx = await requireTeacherExperienceContext();
  const [roster, interventions] = await Promise.all([
    getTeacherRosterStudents(ctx.supabase, ctx.employeeId),
    getTeacherInterventions(ctx.supabase, ctx.employeeId),
  ]);

  const samples = await Promise.all(
    roster.slice(0, 6).map(async (s) => {
      const id = String((s as { id: string }).id);
      const learning = await getParentLearningSummary(ctx.supabase, id, {
        organizationId: ctx.organizationId,
        actorUserId: ctx.actorUserId,
      });
      return {
        id,
        name: `${(s as { first_name?: string }).first_name ?? ""} ${(s as { last_name?: string }).last_name ?? ""}`.trim(),
        masteryCount: learning.masteryFromLearningIntelligence.length,
        assessments: learning.progress.assessments.length,
        goals: learning.progress.goals.length,
        growth: learning.areasForGrowth.slice(0, 2),
      };
    })
  );

  publishTeacherExperienceEvent({
    type: "teacher.progress_reviewed",
    organizationId: ctx.organizationId,
    recordType: "employee",
    recordId: ctx.employeeId,
    actorUserId: ctx.actorUserId,
    projectLive: false,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Progress monitoring</h1>
        <p className="mt-1 text-slate-600">
          Mastery updates, interventions, assessment review, and evidence-backed summaries via
          Learning Intelligence — no parallel mastery calculations.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Active interventions</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {interventions.map((i) => {
            const st = Array.isArray(i.students) ? i.students[0] : i.students;
            const name = st
              ? `${(st as { first_name?: string }).first_name ?? ""} ${(st as { last_name?: string }).last_name ?? ""}`.trim()
              : "Student";
            return (
              <li key={i.id} className="rounded-lg bg-amber-50 px-3 py-2">
                {name} — {i.title ?? i.intervention_type} · review {i.review_date ?? "—"}
              </li>
            );
          })}
          {!interventions.length && (
            <li className="text-slate-500">No active interventions assigned.</li>
          )}
        </ul>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {samples.map((s) => (
          <article key={s.id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="font-semibold">{s.name}</h3>
            <ul className="mt-2 space-y-1 text-sm text-slate-700">
              <li>LI mastery records: {s.masteryCount}</li>
              <li>Assessments: {s.assessments}</li>
              <li>Goals: {s.goals}</li>
              {s.growth.map((g) => (
                <li key={g} className="text-amber-800">
                  Growth: {g}
                </li>
              ))}
            </ul>
            <Link
              href={`/dashboard/teacher/students/${s.id}`}
              className="mt-3 inline-block text-sm font-medium text-brand-700 underline"
            >
              Student profile
            </Link>
          </article>
        ))}
        {!samples.length && (
          <p className="text-slate-500">No roster students to monitor.</p>
        )}
      </section>
    </div>
  );
}
