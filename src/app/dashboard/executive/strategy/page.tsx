import Link from "next/link";
import { requireExecutiveExperienceContext } from "@/lib/executive/experience/access";
import { getExecutiveStrategySummary } from "@/lib/executive/experience/summaries";
import { publishExecutiveExperienceEvent } from "@/lib/executive/experience/events";

export default async function ExecutiveStrategyPage() {
  const ctx = await requireExecutiveExperienceContext();
  const data = await getExecutiveStrategySummary(
    ctx.supabase,
    ctx.organizationId,
    ctx.schoolId
  );

  publishExecutiveExperienceEvent({
    type: "executive.strategy_reviewed",
    organizationId: ctx.organizationId,
    recordType: "organization",
    recordId: ctx.organizationId,
    actorUserId: ctx.actorUserId,
    payload: { strategyEngine: "StrategyEngine" },
    projectLive: false,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Strategy</h1>
        <p className="mt-1 text-slate-600">{data.note}</p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">StrategyEngine chain</h2>
        {data.strategyEngine ? (
          <>
            <p className="mt-2 text-sm text-slate-600">Mode: {data.strategyEngine.mode}</p>
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm">
              {data.strategyEngine.chain.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </>
        ) : (
          <p className="mt-2 text-sm text-slate-500">
            Organization strategy pack not initialized for this org id yet.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Goals / initiatives</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {data.goals.map((g) => (
            <li key={g.id} className="rounded-lg bg-slate-50 px-3 py-2">
              {g.title ?? g.id}
              {g.status ? ` · ${g.status}` : ""}
            </li>
          ))}
          {!data.goals.length && (
            <li className="text-slate-500">No OrganizationEngine goals on file.</li>
          )}
        </ul>
      </section>

      <Link href={data.deepLink} className="text-sm underline">
        Open strategic planning workspace
      </Link>
    </div>
  );
}
