import Link from "next/link";
import { requireTeacherExperienceContext } from "@/lib/teacher/experience/access";
import { getTeacherLessonPlans } from "@/lib/teacher/queries";
import { getTeachingAssistantGuidance } from "@/lib/teacher/experience/assistant";
import { publishTeacherExperienceEvent } from "@/lib/teacher/experience/events";

export default async function TeacherLessonsPage() {
  const ctx = await requireTeacherExperienceContext();
  const [plans, assistant] = await Promise.all([
    getTeacherLessonPlans(ctx.supabase, ctx.employeeId),
    getTeachingAssistantGuidance(ctx.supabase, ctx.employeeId, {
      organizationId: ctx.organizationId,
      actorUserId: ctx.actorUserId,
    }),
  ]);

  publishTeacherExperienceEvent({
    type: "teacher.lesson_planned",
    organizationId: ctx.organizationId,
    recordType: "employee",
    recordId: ctx.employeeId,
    actorUserId: ctx.actorUserId,
    payload: { view: "lesson_planning" },
    projectLive: false,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Lesson planning</h1>
        <p className="mt-1 text-slate-600">
          Existing curriculum / lesson plans, objectives, resources, and AI suggestions grounded in
          Learning Intelligence evidence.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Your lesson plans</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {plans.map((p) => (
            <li key={p.id} className="rounded-lg bg-slate-50 px-3 py-2">
              <span className="font-medium">{p.title ?? "Lesson plan"}</span>
              {p.status && (
                <span className="ml-2 capitalize text-slate-500">{p.status}</span>
              )}
              {p.standards && (
                <p className="text-xs text-slate-500">Standards: {String(p.standards)}</p>
              )}
            </li>
          ))}
          {!plans.length && (
            <li className="text-slate-500">
              No saved lesson plans yet. Open a class session to deliver with existing curriculum
              services.
            </li>
          )}
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">AI lesson suggestions (evidence-backed)</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
          {assistant.lessonRecommendations.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-slate-500">Source: {assistant.source}</p>
        <Link href="/dashboard/teacher/assistant" className="mt-2 inline-block text-sm underline">
          Open AI Teaching Assistant
        </Link>
      </section>

      <p className="text-sm">
        <Link href="/dashboard/teacher/resources" className="underline">
          Resources library
        </Link>
        {" · "}
        <Link href="/dashboard/teacher/classes" className="underline">
          My Classes
        </Link>
      </p>
    </div>
  );
}
