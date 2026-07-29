import Link from "next/link";
import { requireTeacherExperienceContext } from "@/lib/teacher/experience/access";
import { getTeachingAssistantGuidance } from "@/lib/teacher/experience/assistant";
import { getTeacherRosterStudents } from "@/lib/teacher/queries";

interface AssistantPageProps {
  searchParams: Promise<{ student?: string }>;
}

export default async function TeacherAssistantPage({ searchParams }: AssistantPageProps) {
  const ctx = await requireTeacherExperienceContext();
  const sp = await searchParams;
  const roster = await getTeacherRosterStudents(ctx.supabase, ctx.employeeId);
  const focusStudentId =
    sp.student && roster.some((s) => (s as { id: string }).id === sp.student)
      ? sp.student
      : null;

  const guidance = await getTeachingAssistantGuidance(ctx.supabase, ctx.employeeId, {
    organizationId: ctx.organizationId,
    actorUserId: ctx.actorUserId,
    focusStudentId,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">AI Teaching Assistant</h1>
        <p className="mt-1 text-slate-600">
          Lesson recommendations, interventions, prompts, and targets — every item references
          Learning Intelligence evidence. No fabricated recommendations.
        </p>
        <p className="mt-1 text-xs text-slate-500">Source: {guidance.source}</p>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <Link
          href="/dashboard/teacher/assistant"
          className={`rounded-full px-3 py-1 ${!focusStudentId ? "bg-brand-100 text-brand-800" : "bg-slate-100"}`}
        >
          Roster overview
        </Link>
        {roster.slice(0, 12).map((s) => {
          const id = String((s as { id: string }).id);
          const name = `${(s as { first_name?: string }).first_name ?? ""} ${(s as { last_name?: string }).last_name ?? ""}`.trim();
          return (
            <Link
              key={id}
              href={`/dashboard/teacher/assistant?student=${id}`}
              className={`rounded-full px-3 py-1 ${
                focusStudentId === id ? "bg-brand-100 text-brand-800" : "bg-slate-100"
              }`}
            >
              {name || "Student"}
            </Link>
          );
        })}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Summary</h2>
        <p className="mt-2 text-sm text-slate-700">{guidance.summary}</p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold">Lesson recommendations</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {guidance.lessonRecommendations.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold">Intervention suggestions</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {guidance.interventionSuggestions.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold">Next instructional targets</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {guidance.nextInstructionalTargets.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold">Question prompts</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {guidance.questionPrompts.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Progress summaries</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {guidance.progressSummaries.map((r) => (
            <li key={r}>{r}</li>
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
    </div>
  );
}
