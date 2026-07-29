import Link from "next/link";
import { requireStudentExperienceContext } from "@/lib/portal/student-experience/access";
import { getStudentProgressCenter } from "@/lib/portal/progress";
import { publishStudentExperienceEvent } from "@/lib/portal/student-experience/events";

export default async function StudentAssessmentsPage() {
  const ctx = await requireStudentExperienceContext("/portal/student/assessments");
  const progress = await getStudentProgressCenter(ctx.supabase, ctx.studentId);

  publishStudentExperienceEvent({
    type: "student.assessment_viewed",
    organizationId: ctx.organizationId,
    recordType: "student",
    recordId: ctx.studentId,
    actorUserId: ctx.sessionUser.id,
    projectLive: false,
  });

  const today = new Date().toISOString().slice(0, 10);
  const completed = progress.assessments;
  const upcoming = progress.goals.filter((g) => {
    const due = (g as { target_date?: string | null }).target_date;
    return due && due >= today;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Assessments</h1>
        <p className="mt-1 text-slate-600">
          Results and growth from existing assessment records. Evidence links live in Knowledge /
          Learning Intelligence.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Completed &amp; results</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {completed.slice(0, 20).map((a) => {
            const row = a as Record<string, unknown>;
            return (
              <li key={String(row.id)} className="rounded-lg bg-slate-50 px-3 py-2">
                {String(row.assessment_type ?? row.subject_domain ?? "Assessment")} ·{" "}
                {String(row.assessed_on ?? "")}
                {row.score != null && (
                  <span className="ml-2 text-slate-500">score {String(row.score)}</span>
                )}
              </li>
            );
          })}
          {!completed.length && <li className="text-slate-500">No assessments on file yet.</li>}
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Growth signals</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {upcoming.slice(0, 8).map((g) => (
            <li key={g.id} className="rounded-lg bg-emerald-50 px-3 py-2">
              Goal checkpoint: {g.title}
            </li>
          ))}
          {!upcoming.length && (
            <li className="text-slate-500">Growth trends appear as goals and assessments accumulate.</li>
          )}
        </ul>
        <Link href="/portal/student/learning" className="mt-3 inline-block text-sm underline">
          See mastery &amp; learning profile
        </Link>
      </section>
    </div>
  );
}
