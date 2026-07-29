import Link from "next/link";
import { requireStudentExperienceContext } from "@/lib/portal/student-experience/access";
import { getStudentLearningCoachGuidance } from "@/lib/portal/student-experience/coach";

export default async function StudentLearningCoachPage() {
  const ctx = await requireStudentExperienceContext("/portal/student/coach");
  const guidance = await getStudentLearningCoachGuidance(ctx.supabase, ctx.studentId, {
    organizationId: ctx.organizationId,
    actorUserId: ctx.sessionUser.id,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Learning Coach</h1>
        <p className="mt-1 text-slate-600">
          Evidence-backed guidance from Learning Intelligence. No invented scores or diagnoses.
        </p>
        <p className="mt-1 text-xs text-slate-500">Source: {guidance.source}</p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Summary</h2>
        <p className="mt-2 text-sm text-slate-700">{guidance.summary}</p>
        <p className="mt-3 text-sm font-medium text-emerald-800">{guidance.encouragement}</p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold">Suggested next skills</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {guidance.suggestedNextSkills.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold">Study recommendations</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {guidance.studyRecommendations.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Questions to try</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {guidance.questions.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
        <h2 className="font-semibold">Evidence used</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
          {guidance.evidenceNotes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </section>

      <p className="text-sm">
        <Link href="/portal/student/learning" className="underline">
          My Learning
        </Link>
        {" · "}
        <Link href="/portal/messages" className="underline">
          Message a teacher
        </Link>
      </p>
    </div>
  );
}
