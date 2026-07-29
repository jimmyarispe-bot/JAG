import { requireSchoolLeaderExperienceContext } from "@/lib/school-leader/experience/access";
import { getSchoolLeaderAcademicsSummary } from "@/lib/school-leader/experience/summaries";
import { publishSchoolLeaderExperienceEvent } from "@/lib/school-leader/experience/events";

export default async function SchoolLeaderAcademicsPage() {
  const ctx = await requireSchoolLeaderExperienceContext();
  const data = await getSchoolLeaderAcademicsSummary(ctx.organizationId);

  publishSchoolLeaderExperienceEvent({
    type: "school_leader.academics_reviewed",
    organizationId: ctx.organizationId,
    recordType: "campus",
    recordId: ctx.schoolId ?? ctx.organizationId,
    actorUserId: ctx.actorUserId,
    payload: { source: data.source },
    projectLive: false,
  });

  const progress = data.progress as {
    assessmentCompletionRate?: number;
    growthTrendPercent?: number;
    studentsNeedingIntervention?: number;
    masteryDistribution?: Record<string, number>;
  } | null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Academics</h1>
        <p className="mt-1 text-slate-600">{data.note}</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Assessment completion</p>
          <p className="text-2xl font-semibold">
            {progress?.assessmentCompletionRate ?? "—"}
            {progress?.assessmentCompletionRate != null ? "%" : ""}
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Growth trend</p>
          <p className="text-2xl font-semibold">
            {progress?.growthTrendPercent ?? "—"}
            {progress?.growthTrendPercent != null ? "%" : ""}
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Needing intervention</p>
          <p className="text-2xl font-semibold">
            {progress?.studentsNeedingIntervention ?? data.interventions.length}
          </p>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Mastery distribution</h2>
        <pre className="mt-3 overflow-auto rounded-lg bg-slate-50 p-3 text-xs">
          {JSON.stringify(
            data.masteryDistribution ?? progress?.masteryDistribution ?? {},
            null,
            2
          )}
        </pre>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Active interventions (sample)</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {data.interventions.slice(0, 10).map((item, i) => (
            <li key={i} className="rounded-lg bg-slate-50 px-3 py-2">
              {typeof item === "object" && item && "title" in item
                ? String((item as { title?: string }).title ?? JSON.stringify(item))
                : String(item)}
            </li>
          ))}
          {!data.interventions.length && (
            <li className="text-slate-500">
              No pack interventions for this organization yet — LI engine returns empty until data
              is projected.
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
