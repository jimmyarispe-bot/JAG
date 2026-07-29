import Link from "next/link";
import { requireStudentExperienceContext } from "@/lib/portal/student-experience/access";
import { getStudentSchedule } from "@/lib/scheduling/queries";
import { getStudentSelfDashboard } from "@/lib/portal/student-dashboard";
import { getStudentDeadlines } from "@/lib/compliance/deadlines";

export default async function StudentCalendarPage() {
  const ctx = await requireStudentExperienceContext("/portal/student/calendar");
  const [schedule, dashboard, deadlines] = await Promise.all([
    getStudentSchedule(ctx.studentId),
    getStudentSelfDashboard(ctx.supabase, ctx.studentId),
    getStudentDeadlines(ctx.supabase, ctx.studentId),
  ]);

  const deadlineItems = [
    ...deadlines.today,
    ...deadlines.thisWeek,
    ...(deadlines.upcoming ?? deadlines.next30Days),
  ].slice(0, 15);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Calendar</h1>
        <p className="mt-1 text-slate-600">
          Classes, assessments, meetings, events, and deadlines from Scheduling and compliance services.
        </p>
        <Link href="/portal/student/schedule" className="mt-2 inline-block text-sm underline">
          Classic schedule view
        </Link>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Classes</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {(schedule.sessions ?? []).slice(0, 20).map((s) => {
            const cs = Array.isArray(s.course_sections) ? s.course_sections[0] : s.course_sections;
            const c = cs?.courses;
            const name = Array.isArray(c) ? c[0]?.name : c?.name;
            return (
              <li key={s.id} className="rounded-lg bg-slate-50 px-3 py-2">
                {name ?? "Class"} — {new Date(s.scheduled_start).toLocaleString()}
              </li>
            );
          })}
          {!schedule.sessions?.length && <li className="text-slate-500">No classes listed.</li>}
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Events &amp; meetings</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {(dashboard.upcomingEvents ?? []).map((e) => (
            <li key={e.id} className="rounded-lg bg-sky-50 px-3 py-2">
              {e.title ?? "Event"} — {e.starts_at ? new Date(e.starts_at).toLocaleString() : ""}
            </li>
          ))}
          {!dashboard.upcomingEvents?.length && (
            <li className="text-slate-500">No upcoming calendar events.</li>
          )}
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Deadlines &amp; assessments</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {deadlineItems.map((d) => (
            <li key={d.id} className="rounded-lg bg-amber-50 px-3 py-2">
              {d.title} — due {d.due_date}
            </li>
          ))}
          {!deadlineItems.length && <li className="text-slate-500">No upcoming deadlines.</li>}
        </ul>
      </section>
    </div>
  );
}
