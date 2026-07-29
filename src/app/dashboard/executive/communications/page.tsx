import Link from "next/link";
import { requireExecutiveExperienceContext } from "@/lib/executive/experience/access";
import { getExecutiveCommunicationsSummary } from "@/lib/executive/experience/summaries";
import { publishExecutiveExperienceEvent } from "@/lib/executive/experience/events";

export default async function ExecutiveCommunicationsPage() {
  const ctx = await requireExecutiveExperienceContext();
  const data = await getExecutiveCommunicationsSummary(ctx.supabase, ctx.schoolId);

  publishExecutiveExperienceEvent({
    type: "executive.communications_viewed",
    organizationId: ctx.organizationId,
    recordType: "organization",
    recordId: ctx.organizationId,
    actorUserId: ctx.actorUserId,
    projectLive: false,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Communications</h1>
        <p className="mt-1 text-slate-600">
          Executive announcements, leadership updates, and cross-campus messaging via existing
          Communications services.
        </p>
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold">Announcements</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {data.announcements.map((a) => (
              <li key={a.id} className="rounded-lg bg-slate-50 px-3 py-2">
                {a.title}
              </li>
            ))}
            {!data.announcements.length && (
              <li className="text-slate-500">No announcements.</li>
            )}
          </ul>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold">Recent messages</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {data.communications.slice(0, 15).map((c) => (
              <li key={c.id} className="rounded-lg bg-slate-50 px-3 py-2">
                {c.subject ?? c.type ?? "Message"}
              </li>
            ))}
            {!data.communications.length && (
              <li className="text-slate-500">No recent messages.</li>
            )}
          </ul>
        </article>
      </section>

      <Link
        href={data.deepLink}
        className="inline-flex rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white"
      >
        Open Communications center
      </Link>
    </div>
  );
}
