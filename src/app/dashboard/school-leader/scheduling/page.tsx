import Link from "next/link";
import { requireSchoolLeaderExperienceContext } from "@/lib/school-leader/experience/access";
import { getSchoolLeaderSchedulingSummary } from "@/lib/school-leader/experience/summaries";
import { publishSchoolLeaderExperienceEvent } from "@/lib/school-leader/experience/events";

export default async function SchoolLeaderSchedulingPage() {
  const ctx = await requireSchoolLeaderExperienceContext();
  const data = await getSchoolLeaderSchedulingSummary(ctx.schoolId);

  publishSchoolLeaderExperienceEvent({
    type: "school_leader.scheduling_reviewed",
    organizationId: ctx.organizationId,
    recordType: "campus",
    recordId: ctx.schoolId ?? ctx.organizationId,
    actorUserId: ctx.actorUserId,
    projectLive: false,
  });

  const s = data.stats;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Scheduling</h1>
        <p className="mt-1 text-slate-600">{data.note}</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Tile label="Sessions this week" value={s.sessionsThisWeek} />
        <Tile label="Scheduled" value={s.scheduledSessions} />
        <Tile label="Completed" value={s.completedSessions} />
        <Tile label="Open conflicts" value={s.openConflicts} />
        <Tile label="Open sections" value={s.openSections} />
        <Tile label="Open seats" value={s.openSeats} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Conflicts &amp; coverage</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {data.conflicts.map((c) => (
            <li key={String((c as { id?: string }).id)} className="rounded-lg bg-slate-50 px-3 py-2">
              {String(
                (c as { conflict_type?: string; summary?: string }).summary ??
                  (c as { conflict_type?: string }).conflict_type ??
                  "Conflict"
              )}
            </li>
          ))}
          {!data.conflicts.length && <li className="text-slate-500">No unresolved conflicts.</li>}
        </ul>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <Link href={data.schedulingHref} className="underline">
            Scheduling workspace
          </Link>
          <Link href={data.calendarHref} className="underline">
            Calendar
          </Link>
        </div>
      </section>
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
