import Link from "next/link";
import { requireStudentExperienceContext } from "@/lib/portal/student-experience/access";
import { getParentLearningSummary } from "@/lib/portal/experience/learning";
import { getStudentExperience } from "@/lib/portal/student-experience/orchestrator";

export default async function StudentLearningPage() {
  const ctx = await requireStudentExperienceContext("/portal/student/learning");
  const summary = await getParentLearningSummary(ctx.supabase, ctx.studentId, {
    organizationId: ctx.organizationId,
    actorUserId: ctx.sessionUser.id,
  });

  getStudentExperience().publishLearningViewed({
    organizationId: ctx.organizationId,
    actorUserId: ctx.sessionUser.id,
    studentId: ctx.studentId,
  });

  const mastery = summary.masteryFromLearningIntelligence as Array<{
    id?: string;
    level?: string;
    objectiveId?: string;
  }>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">My Learning</h1>
        <p className="mt-1 text-slate-600">
          Learning profile, mastery, skills, goals, and evidence-backed summaries from Learning
          Intelligence — not a separate pedagogy model.
        </p>
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold">Strengths</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {summary.strengths.map((s) => (
              <li key={s}>{s}</li>
            ))}
            {!summary.strengths.length && <li>Keep practicing — strengths appear as goals complete.</li>}
          </ul>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold">Areas for growth</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {summary.areasForGrowth.map((s) => (
              <li key={s}>{s}</li>
            ))}
            {!summary.areasForGrowth.length && <li>No active growth interventions on file.</li>}
          </ul>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Mastery progress &amp; competencies</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {mastery.slice(0, 15).map((m, i) => (
            <li key={m.id ?? i} className="rounded-lg bg-slate-50 px-3 py-2">
              {m.objectiveId ?? "Skill"} — {m.level ?? "—"}
            </li>
          ))}
          {!mastery.length && (
            <li className="text-slate-500">No mastery records yet in Learning Intelligence.</li>
          )}
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Goals &amp; growth trends</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {summary.progress.goals.slice(0, 10).map((g) => (
            <li key={g.id} className="rounded-lg bg-emerald-50 px-3 py-2">
              {g.title ?? "Goal"} · {g.status ?? ""} · {g.progress_pct != null ? `${g.progress_pct}%` : ""}
            </li>
          ))}
          {!summary.progress.goals.length && (
            <li className="text-slate-500">No goals yet — check with your teacher.</li>
          )}
        </ul>
        <Link href="/portal/student/goals" className="mt-3 inline-block text-sm font-medium underline">
          Open Goals
        </Link>
      </section>

      <p className="text-sm">
        <Link href="/portal/student/coach" className="underline">
          Ask Learning Coach
        </Link>
        {" · "}
        <Link href="/portal/portfolio" className="underline">
          Portfolio
        </Link>
      </p>
    </div>
  );
}
