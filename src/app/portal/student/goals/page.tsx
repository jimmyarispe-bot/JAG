import Link from "next/link";
import { requireStudentExperienceContext } from "@/lib/portal/student-experience/access";
import { listPortalStudentGrowthGoals } from "@/lib/portal/student-directory";
import { publishStudentExperienceEvent } from "@/lib/portal/student-experience/events";

export default async function StudentGoalsPage() {
  const ctx = await requireStudentExperienceContext("/portal/student/goals");
  const goals = await listPortalStudentGrowthGoals(ctx.supabase, ctx.studentId);

  publishStudentExperienceEvent({
    type: "student.goal_viewed",
    organizationId: ctx.organizationId,
    recordType: "student",
    recordId: ctx.studentId,
    actorUserId: ctx.sessionUser.id,
    projectLive: false,
  });

  const academic = goals.filter((g) => {
    const t = `${g.title ?? ""} ${g.description ?? ""}`.toLowerCase();
    return t.includes("math") || t.includes("read") || t.includes("writ") || t.includes("academic");
  });
  const personal = goals.filter((g) => !academic.includes(g));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Goals</h1>
        <p className="mt-1 text-slate-600">
          Academic and personal goals, progress, achievements, and milestones from existing growth
          goal records.
        </p>
      </div>

      <GoalSection title="Academic goals" goals={academic.length ? academic : goals} />
      {academic.length > 0 && <GoalSection title="Personal & other goals" goals={personal} />}

      <p className="text-sm">
        <Link href="/portal/student/achievements" className="underline">
          Achievements
        </Link>
        {" · "}
        <Link href="/portal/student/learning" className="underline">
          My Learning
        </Link>
      </p>
    </div>
  );
}

function GoalSection({
  title,
  goals,
}: {
  title: string;
  goals: { id: string; title: string; description?: string | null; progress_pct?: number | null; status?: string | null }[];
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="font-semibold text-slate-900">{title}</h2>
      <ul className="mt-3 space-y-3">
        {goals.map((g) => (
          <li key={g.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="font-semibold">{g.title}</p>
            {g.description && <p className="mt-1 text-sm text-slate-600">{g.description}</p>}
            <p className="mt-2 text-sm text-brand-700">
              {Number(g.progress_pct ?? 0)}% progress
              {g.status ? ` · ${g.status}` : ""}
            </p>
          </li>
        ))}
        {!goals.length && <li className="text-slate-500">No goals in this group right now.</li>}
      </ul>
    </section>
  );
}
