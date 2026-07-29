import Link from "next/link";
import { requireExecutiveExperienceContext } from "@/lib/executive/experience/access";
import { getExecutiveIntelligenceSummary } from "@/lib/executive/experience/summaries";
import { publishExecutiveExperienceEvent } from "@/lib/executive/experience/events";

export default async function ExecutiveIntelligencePage() {
  const ctx = await requireExecutiveExperienceContext();
  const data = await getExecutiveIntelligenceSummary(ctx.organizationId);

  publishExecutiveExperienceEvent({
    type: "executive.intelligence_reviewed",
    organizationId: ctx.organizationId,
    recordType: "organization",
    recordId: ctx.organizationId,
    actorUserId: ctx.actorUserId,
    projectLive: false,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Organizational intelligence</h1>
        <p className="mt-1 text-slate-600">{data.recommendationsNote}</p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Memory highlights</h2>
        <pre className="mt-3 overflow-auto rounded-lg bg-slate-50 p-3 text-xs">
          {JSON.stringify(data.memorySummary ?? {}, null, 2).slice(0, 3500)}
        </pre>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Twin history</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {data.twinHistory.map((entry, i) => (
            <li key={i} className="rounded-lg bg-slate-50 px-3 py-2">
              {typeof entry === "object" && entry && "message" in entry
                ? String((entry as { message?: string }).message)
                : JSON.stringify(entry)}
            </li>
          ))}
          {!data.twinHistory.length && (
            <li className="text-slate-500">No twin history entries for this organization yet.</li>
          )}
        </ul>
      </section>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href={data.deepLinks.briefings} className="underline">
          Briefings
        </Link>
        <Link href={data.deepLinks.decisions} className="underline">
          Decisions
        </Link>
        <Link href={data.deepLinks.recommendations} className="underline">
          Recommendations
        </Link>
      </div>
    </div>
  );
}
