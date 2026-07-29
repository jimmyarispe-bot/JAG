import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { getLinkedStudentsForPortal } from "@/lib/portal/dashboard";
import { getParentLearningSummary } from "@/lib/portal/experience/learning";

interface LearningPageProps {
  searchParams: Promise<{ studentId?: string }>;
}

export default async function ParentLearningPage({ searchParams }: LearningPageProps) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/login?next=/portal/learning");

  const { studentId: requestedId } = await searchParams;
  const supabase = await createAuthClient();
  const students = await getLinkedStudentsForPortal(supabase, sessionUser.id);
  if (!students.length) {
    return (
      <p className="text-slate-600">
        Link a student to view learning summaries.{" "}
        <Link href="/portal/children" className="underline">
          My Children
        </Link>
      </p>
    );
  }

  const student =
    students.find((s) => s.id === requestedId) ?? students[0]!;

  const summary = await getParentLearningSummary(supabase, student.id, {
    organizationId: student.school_id,
    actorUserId: sessionUser.id,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Learning</h1>
        <p className="mt-1 text-slate-600">
          Mastery, assessments, interventions, and evidence-backed summaries — reasoned by
          Learning Intelligence over existing AcademyOS learning services.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          {students.map((s) => (
            <Link
              key={s.id}
              href={`/portal/learning?studentId=${s.id}`}
              className={`rounded-full px-3 py-1 ${
                s.id === student.id
                  ? "bg-brand-100 font-medium text-brand-800"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {s.first_name}
            </Link>
          ))}
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-900">Strengths</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {summary.strengths.map((s) => (
              <li key={s}>{s}</li>
            ))}
            {!summary.strengths.length && <li>No completed goals yet.</li>}
          </ul>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-900">Areas for growth</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {summary.areasForGrowth.map((s) => (
              <li key={s}>{s}</li>
            ))}
            {!summary.areasForGrowth.length && <li>No active interventions.</li>}
          </ul>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-900">Mastery & skills (Learning Intelligence)</h2>
        <p className="mt-1 text-xs text-slate-500">
          SoR remains AcademyOS learning via LearningIntelligenceEngine — not a parallel model.
        </p>
        {summary.learningIntelligenceError && (
          <p className="mt-2 text-sm text-amber-700">{summary.learningIntelligenceError}</p>
        )}
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          {(summary.masteryFromLearningIntelligence as Array<{ id?: string; level?: string; objectiveId?: string }>).slice(0, 12).map((m, i) => (
            <li key={m.id ?? i} className="rounded-lg bg-slate-50 px-3 py-2">
              {m.objectiveId ?? "Objective"} — {m.level ?? "—"}
            </li>
          ))}
          {!summary.masteryFromLearningIntelligence.length && (
            <li className="text-slate-500">No mastery records in Learning Intelligence store for this student yet.</li>
          )}
        </ul>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-900">Assessments</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {summary.progress.assessments.slice(0, 8).map((a) => (
              <li key={a.id} className="rounded-lg bg-slate-50 px-3 py-2">
                {a.assessment_type ?? a.subject_domain ?? "Assessment"} · {a.assessed_on ?? ""}
              </li>
            ))}
            {!summary.progress.assessments.length && (
              <li className="text-slate-500">No assessments on file.</li>
            )}
          </ul>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-900">Teacher feedback</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {summary.teacherFeedback.map((o) => {
              const row = o as Record<string, unknown>;
              return (
                <li key={String(row.id)} className="rounded-lg bg-slate-50 px-3 py-2">
                  {String(row.observation_notes ?? row.notes ?? "Observation")} ·{" "}
                  {String(row.observed_at ?? "")}
                </li>
              );
            })}
            {!summary.teacherFeedback.length && (
              <li className="text-slate-500">No recent teacher feedback.</li>
            )}
          </ul>
        </article>
      </section>

      <p className="text-sm">
        <Link href="/portal/progress" className="underline">
          Open Progress Center
        </Link>
        {" · "}
        <Link href="/portal/portfolio" className="underline">
          Portfolio
        </Link>
      </p>
    </div>
  );
}
