import Link from "next/link";
import { requireSchoolLeaderExperienceContext } from "@/lib/school-leader/experience/access";
import { getSchoolLeaderExperienceHome } from "@/lib/school-leader/experience/home";
import { getSchoolLeaderExperience } from "@/lib/school-leader/experience/orchestrator";

export default async function SchoolLeaderHomePage() {
  const ctx = await requireSchoolLeaderExperienceContext();
  const home = await getSchoolLeaderExperienceHome(ctx.supabase, ctx.schoolId);

  getSchoolLeaderExperience().publishDashboardViewed({
    organizationId: ctx.organizationId,
    actorUserId: ctx.actorUserId,
    schoolId: ctx.schoolId,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">School Leader Workspace</h1>
        <p className="mt-1 text-slate-600">
          Campus overview — enrollment, attendance, teachers, alerts, and tasks from existing
          platform services.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title="Enrolled students" value={home.campus.enrolledStudents} />
        <Metric title="Sessions this week" value={home.campus.sessionsThisWeek} />
        <Metric title="Teacher utilization" value={`${home.campus.teacherUtilization}%`} />
        <Metric title="Active staff" value={home.teacherAvailability.staffCount} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold">Today&apos;s attendance / sessions</h2>
          <p className="mt-2 text-sm text-slate-600">{home.attendanceToday.note}</p>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div>
              <dt className="text-slate-500">Scheduled</dt>
              <dd className="text-xl font-semibold">{home.attendanceToday.sessionsScheduled}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Completed</dt>
              <dd className="text-xl font-semibold">{home.attendanceToday.sessionsCompleted}</dd>
            </div>
          </dl>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold">Enrollment summary</h2>
          <ul className="mt-3 space-y-1 text-sm text-slate-700">
            <li>New inquiries: {home.enrollment.newInquiries}</li>
            <li>Applications submitted: {home.enrollment.applicationsSubmitted}</li>
            <li>Accepted: {home.enrollment.accepted}</li>
            <li>Waitlist: {home.enrollment.waitlisted}</li>
            <li>Enrolled (funnel): {home.enrollment.enrolled}</li>
          </ul>
          <Link href="/dashboard/school-leader/enrollment" className="mt-3 inline-block text-sm underline">
            Open enrollment
          </Link>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold">Teacher availability</h2>
          <ul className="mt-3 space-y-1 text-sm">
            <li>Staff: {home.teacherAvailability.staffCount}</li>
            <li>Overloaded: {home.teacherAvailability.overCapacity}</li>
            <li>Under-scheduled: {home.teacherAvailability.underUtilized}</li>
          </ul>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-2">
          <h2 className="font-semibold">Alerts</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {home.alerts.map((a) => (
              <li key={a.id}>
                <Link href={a.href} className="text-brand-700 underline">
                  {a.title}
                </Link>
              </li>
            ))}
            {!home.alerts.length && <li className="text-slate-500">No open campus alerts.</li>}
          </ul>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold">Tasks</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {home.tasks.map((t) => (
              <li key={t.id}>
                <Link href={t.href} className="underline">
                  {t.title}
                </Link>
              </li>
            ))}
          </ul>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold">Announcements</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {home.announcements.slice(0, 6).map((a) => (
              <li key={a.id} className="rounded-lg bg-slate-50 px-3 py-2">
                {a.title}
              </li>
            ))}
            {!home.announcements.length && (
              <li className="text-slate-500">No announcements yet.</li>
            )}
          </ul>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Quick actions</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {home.quickActions.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
            >
              {a.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function Metric({ title, value }: { title: string; value: string | number }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
    </article>
  );
}
