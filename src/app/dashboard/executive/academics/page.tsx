import { requireExecutiveExperienceContext } from "@/lib/executive/experience/access";
import { getExecutiveAcademicsSummary } from "@/lib/executive/experience/summaries";
import { publishExecutiveExperienceEvent } from "@/lib/executive/experience/events";

export default async function ExecutiveAcademicsPage() {
  const ctx = await requireExecutiveExperienceContext();
  const data = await getExecutiveAcademicsSummary(ctx.organizationId);

  publishExecutiveExperienceEvent({
    type: "executive.academics_reviewed",
    organizationId: ctx.organizationId,
    recordType: "organization",
    recordId: ctx.organizationId,
    actorUserId: ctx.actorUserId,
    payload: { source: data.source },
    projectLive: false,
  });

  const progress = data.progress as {
    assessmentCompletionRate?: number;
    growthTrendPercent?: number;
    studentsNeedingIntervention?: number;
  } | null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Academics</h1>
        <p className="mt-1 text-slate-600">{data.note}</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <Tile
          label="Assessment completion"
          value={
            progress?.assessmentCompletionRate != null
              ? `${progress.assessmentCompletionRate}%`
              : "—"
          }
        />
        <Tile
          label="Growth trend"
          value={
            progress?.growthTrendPercent != null ? `${progress.growthTrendPercent}%` : "—"
          }
        />
        <Tile
          label="Needing intervention"
          value={progress?.studentsNeedingIntervention ?? data.interventions.length}
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Mastery distribution</h2>
        <pre className="mt-3 overflow-auto rounded-lg bg-slate-50 p-3 text-xs">
          {JSON.stringify(data.masteryDistribution ?? {}, null, 2)}
        </pre>
      </section>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string | number }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </article>
  );
}
