import Link from "next/link";
import { StudentAssignmentsDeadlinesWidget } from "@/components/portal/StudentAssignmentsDeadlinesWidget";
import type { DeadlineBucket } from "@/lib/compliance/types";

type SessionItem = {
  id: string;
  label: string;
  at: string;
  kind: "class" | "service";
};

export function StudentHomeDashboard({
  firstName,
  score,
  attendanceRate,
  goalCount,
  upcomingSessions,
  announcements,
  notifications,
  tasks,
  deadlines,
  quickActions,
}: {
  firstName: string;
  score?: number | null;
  attendanceRate?: number | null;
  goalCount: number;
  upcomingSessions: SessionItem[];
  announcements: { id: string; title?: string | null }[];
  notifications: { id: string; title?: string | null }[];
  tasks: { id: string; title: string }[];
  deadlines: DeadlineBucket;
  quickActions: readonly { href: string; label: string }[];
}) {
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Hi, {firstName}!
        </h1>
        <p className="mt-1 text-slate-600">
          Your day — classes, tasks, and next steps. Keep going.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Success score</p>
          <p className="text-2xl font-semibold">{score ?? "—"}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Attendance (30d)</p>
          <p className="text-2xl font-semibold">
            {attendanceRate != null ? `${attendanceRate}%` : "—"}
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Active goals</p>
          <p className="text-2xl font-semibold">{goalCount}</p>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-900">Today&apos;s schedule &amp; classes</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {upcomingSessions.map((s) => (
              <li key={s.id} className="flex justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
                <span className="capitalize">{s.label}</span>
                <time className="text-slate-500">
                  {s.at
                    ? new Date(s.at).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })
                    : "—"}
                </time>
              </li>
            ))}
            {!upcomingSessions.length && (
              <li className="text-slate-500">No sessions scheduled today.</li>
            )}
          </ul>
          <Link href="/portal/student/calendar" className="mt-3 inline-block text-sm font-medium text-brand-700 underline">
            Full calendar
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-900">Announcements &amp; notifications</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {(announcements.length ? announcements : notifications).slice(0, 5).map((n) => (
              <li key={n.id} className="rounded-lg bg-slate-50 px-3 py-2">
                {n.title ?? "Update"}
              </li>
            ))}
            {!announcements.length && !notifications.length && (
              <li className="text-slate-500">No new announcements.</li>
            )}
          </ul>
          <Link href="/portal/notifications" className="mt-3 inline-block text-sm font-medium text-brand-700 underline">
            All notifications
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-900">Quick actions</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {quickActions.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-100"
            >
              {a.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-900">Tasks</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {tasks.slice(0, 6).map((t) => (
            <li key={t.id} className="rounded-lg bg-amber-50 px-3 py-2">
              {t.title}
            </li>
          ))}
          {!tasks.length && <li className="text-slate-500">No open tasks right now.</li>}
        </ul>
      </section>

      <StudentAssignmentsDeadlinesWidget
        dueToday={deadlines.today}
        dueTomorrow={deadlines.dueTomorrow ?? []}
        upcoming={deadlines.upcoming ?? [...deadlines.thisWeek, ...deadlines.next30Days]}
        overdue={deadlines.overdue}
        completed={deadlines.completed ?? []}
      />
    </div>
  );
}
