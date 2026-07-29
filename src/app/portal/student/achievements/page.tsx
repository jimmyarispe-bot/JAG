import Link from "next/link";
import { requireStudentExperienceContext } from "@/lib/portal/student-experience/access";
import { getParentLearningSummary } from "@/lib/portal/experience/learning";
import { listPortalStudentGrowthGoals } from "@/lib/portal/student-directory";
import { getStudentPortfolio } from "@/lib/portal/portfolio";

export default async function StudentAchievementsPage() {
  const ctx = await requireStudentExperienceContext("/portal/student/achievements");
  const [learning, goals, portfolio] = await Promise.all([
    getParentLearningSummary(ctx.supabase, ctx.studentId, {
      organizationId: ctx.organizationId,
      actorUserId: ctx.sessionUser.id,
    }),
    listPortalStudentGrowthGoals(ctx.supabase, ctx.studentId),
    getStudentPortfolio(ctx.supabase, ctx.studentId),
  ]);

  const mastery = learning.masteryFromLearningIntelligence as Array<{
    id?: string;
    level?: string;
    objectiveId?: string;
  }>;

  const mastered = mastery.filter((m) => {
    const level = String(m.level ?? "").toLowerCase();
    return (
      level.includes("master") ||
      level.includes("proficient") ||
      level.includes("secure") ||
      level.includes("advanced")
    );
  });

  const completedGoals = goals.filter((g) => {
    const status = String(g.status ?? "").toLowerCase();
    return status.includes("complete") || status.includes("met") || Number(g.progress_pct) >= 100;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Achievements</h1>
        <p className="mt-1 text-slate-600">
          Mastery badges, milestones, and recognitions derived from Learning Intelligence and goals —
          not invented awards.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Mastery badges</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {mastered.map((m, i) => (
            <li
              key={m.id ?? i}
              className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm text-emerald-900"
            >
              {m.objectiveId ?? "Skill"} · {m.level}
            </li>
          ))}
          {!mastered.length && (
            <li className="text-sm text-slate-500">
              Mastery badges appear when Learning Intelligence records proficient skills.
            </li>
          )}
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Milestones &amp; goal completions</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {completedGoals.map((g) => (
            <li key={g.id} className="rounded-lg bg-amber-50 px-3 py-2">
              {g.title} — {Number(g.progress_pct)}%
            </li>
          ))}
          {!completedGoals.length && (
            <li className="text-slate-500">Complete goals to unlock milestones.</li>
          )}
        </ul>
        <Link href="/portal/student/goals" className="mt-3 inline-block text-sm underline">
          View goals
        </Link>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Portfolio recognitions</h2>
        <p className="mt-1 text-sm text-slate-600">
          {portfolio.artifacts.length} artifact(s) in your evidence portfolio.
        </p>
        <Link href="/portal/portfolio" className="mt-3 inline-block text-sm underline">
          Open portfolio
        </Link>
      </section>
    </div>
  );
}
