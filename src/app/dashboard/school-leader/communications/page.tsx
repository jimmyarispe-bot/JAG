import Link from "next/link";
import { requireSchoolLeaderExperienceContext } from "@/lib/school-leader/experience/access";
import { getSchoolLeaderCommunicationsSummary } from "@/lib/school-leader/experience/summaries";
import { publishSchoolLeaderExperienceEvent } from "@/lib/school-leader/experience/events";

export default async function SchoolLeaderCommunicationsPage() {
  const ctx = await requireSchoolLeaderExperienceContext();
  const data = await getSchoolLeaderCommunicationsSummary(ctx.supabase, ctx.schoolId);

  publishSchoolLeaderExperienceEvent({
    type: "school_leader.communications_viewed",
    organizationId: ctx.organizationId,
    recordType: "campus",
    recordId: ctx.schoolId ?? ctx.organizationId,
    actorUserId: ctx.actorUserId,
    projectLive: false,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Communications</h1>
        <p className="mt-1 text-slate-600">
          Announcements, staff messages, and family broadcasts via existing Communications
          services.
        </p>
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold">Announcements</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {data.announcements.map((a) => (
              <li key={a.id} className="rounded-lg bg-slate-50 px-3 py-2">
                {a.title}
                {a.status ? ` · ${a.status}` : ""}
              </li>
            ))}
            {!data.announcements.length && (
              <li className="text-slate-500">No announcements.</li>
            )}
          </ul>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold">Recent communications</h2>
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
