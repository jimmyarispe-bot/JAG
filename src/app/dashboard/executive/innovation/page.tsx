import { requireExecutiveExperienceContext } from "@/lib/executive/experience/access";
import { getExecutiveInnovationSummary } from "@/lib/executive/experience/summaries";
import { publishExecutiveExperienceEvent } from "@/lib/executive/experience/events";

export default async function ExecutiveInnovationPage() {
  const ctx = await requireExecutiveExperienceContext();
  const data = await getExecutiveInnovationSummary(ctx.organizationId);

  publishExecutiveExperienceEvent({
    type: "executive.innovation_reviewed",
    organizationId: ctx.organizationId,
    recordType: "organization",
    recordId: ctx.organizationId,
    actorUserId: ctx.actorUserId,
    payload: { source: data.source },
    projectLive: false,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Innovation</h1>
        <p className="mt-1 text-slate-600">{data.note}</p>
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold">Portfolio</h2>
          <pre className="mt-3 max-h-96 overflow-auto rounded-lg bg-slate-50 p-3 text-xs">
            {JSON.stringify(data.portfolio ?? {}, null, 2).slice(0, 4000)}
          </pre>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold">Roadmap / dashboard</h2>
          <pre className="mt-3 max-h-96 overflow-auto rounded-lg bg-slate-50 p-3 text-xs">
            {JSON.stringify(
              { roadmap: data.roadmap, dashboard: data.dashboard },
              null,
              2
            ).slice(0, 4000)}
          </pre>
        </article>
      </section>
    </div>
  );
}
