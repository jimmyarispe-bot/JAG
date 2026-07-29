import Link from "next/link";
import { requireTeacherExperienceContext } from "@/lib/teacher/experience/access";
import { getTeacherLessonPlans, getTeacherNotes } from "@/lib/teacher/queries";

export default async function TeacherResourcesPage() {
  const ctx = await requireTeacherExperienceContext();
  const [plans, notes] = await Promise.all([
    getTeacherLessonPlans(ctx.supabase, ctx.employeeId),
    getTeacherNotes(ctx.supabase, ctx.employeeId, { category: "resource" }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Resources</h1>
        <p className="mt-1 text-slate-600">
          Curriculum, lesson library, templates, and activities from existing lesson-plan and notes
          services.
        </p>
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold">Lesson library</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {plans.map((p) => (
              <li key={p.id} className="rounded-lg bg-slate-50 px-3 py-2">
                {p.title ?? "Lesson"}
              </li>
            ))}
            {!plans.length && <li className="text-slate-500">No lesson plans in library.</li>}
          </ul>
          <Link href="/dashboard/teacher/lessons" className="mt-3 inline-block text-sm underline">
            Lesson planning
          </Link>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold">Templates &amp; activities</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {notes.map((n) => (
              <li key={n.id} className="rounded-lg bg-slate-50 px-3 py-2">
                {n.title}
              </li>
            ))}
            {!notes.length && (
              <li className="text-slate-500">
                Add resource-category instructional notes, or browse{" "}
                <Link href="/dashboard/teacher/documents" className="underline">
                  Documents
                </Link>
                .
              </li>
            )}
          </ul>
        </article>
      </section>
    </div>
  );
}
