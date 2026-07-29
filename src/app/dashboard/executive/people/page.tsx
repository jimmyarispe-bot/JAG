import Link from "next/link";
import { requireExecutiveExperienceContext } from "@/lib/executive/experience/access";
import { getExecutivePeopleSummary } from "@/lib/executive/experience/summaries";
import { publishExecutiveExperienceEvent } from "@/lib/executive/experience/events";

export default async function ExecutivePeoplePage() {
  const ctx = await requireExecutiveExperienceContext();
  const data = await getExecutivePeopleSummary(ctx.supabase, ctx.schoolId);

  publishExecutiveExperienceEvent({
    type: "executive.people_reviewed",
    organizationId: ctx.organizationId,
    recordType: "organization",
    recordId: ctx.organizationId,
    actorUserId: ctx.actorUserId,
    projectLive: false,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">People</h1>
        <p className="mt-1 text-slate-600">{data.note}</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <Tile label="Active employees" value={data.stats.activeEmployees} />
        <Tile label="Total employees" value={data.stats.totalEmployees} />
        <Tile label="Open positions" value={data.openPositions.length} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Open positions</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {data.openPositions.map((p) => (
            <li key={p.id} className="rounded-lg bg-slate-50 px-3 py-2">
              {p.title}
            </li>
          ))}
          {!data.openPositions.length && <li className="text-slate-500">None open.</li>}
        </ul>
      </section>

      {data.pipeline && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold">Hiring / onboarding</h2>
          <pre className="mt-3 overflow-auto rounded-lg bg-slate-50 p-3 text-xs">
            {JSON.stringify(data.pipeline, null, 2).slice(0, 2500)}
          </pre>
        </section>
      )}

      <Link href={data.deepLink} className="text-sm underline">
        Open Workforce / HR
      </Link>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </article>
  );
}
