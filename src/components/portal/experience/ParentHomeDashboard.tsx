import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import type { PortalStudentSummary } from "@/lib/portal/dashboard";
import type { DeadlineBucket } from "@/lib/compliance/types";
import type { TodayScheduleItem } from "@/lib/portal/experience/home";
import { MyDeadlinesWidget } from "@/components/portal/MyDeadlinesWidget";
import { ActionChip } from "@/components/ui/cta";

interface ParentHomeDashboardProps {
  welcomeName?: string | null;
  students: PortalStudentSummary[];
  financial: { combinedBalance: number; combinedCredits: number };
  tasks: {
    id: string;
    title: string;
    dueDate?: string;
    category: string;
    href?: string;
    studentId?: string;
    actionType?: string;
    parentCanComplete?: boolean;
  }[];
  deadlines: DeadlineBucket;
  unreadNotifications: number;
  todaySchedule: TodayScheduleItem[];
  announcements: { id: string; title?: string | null; body?: string | null; created_at?: string }[];
  recentNotifications: { id: string; title?: string | null; is_read?: boolean }[];
  quickActions: readonly { href: string; label: string }[];
}

function scoreColor(status?: string | null) {
  if (status === "green") return "text-emerald-600 bg-emerald-50 border-emerald-200";
  if (status === "yellow") return "text-amber-700 bg-amber-50 border-amber-200";
  return "text-rose-700 bg-rose-50 border-rose-200";
}

export function ParentHomeDashboard({
  welcomeName,
  students,
  financial,
  tasks,
  deadlines,
  unreadNotifications,
  todaySchedule,
  announcements,
  recentNotifications,
  quickActions,
}: ParentHomeDashboardProps) {
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          {welcomeName ? `Welcome, ${welcomeName}` : "Welcome"}
        </h1>
        <p className="mt-1 text-slate-600">
          Your family hub — schedule, learning, billing, and school communications.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Children</p>
          <p className="text-3xl font-semibold">{students.length}</p>
          <ActionChip href="/portal/children" size="xs" className="mt-2">
            My Children
          </ActionChip>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Outstanding balance</p>
          <p className="text-2xl font-semibold text-amber-700">
            {formatCurrency(financial.combinedBalance)}
          </p>
          <ActionChip href="/portal/billing" size="xs" className="mt-2">
            Billing
          </ActionChip>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Outstanding tasks</p>
          <p className="text-3xl font-semibold">{tasks.length}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Notifications</p>
          <p className="text-3xl font-semibold">{unreadNotifications}</p>
          <ActionChip href="/portal/notifications" size="xs" className="mt-2">
            View all
          </ActionChip>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-900">Today&apos;s schedule</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {todaySchedule.slice(0, 8).map((item) => (
              <li key={`${item.studentId}-${item.startsAt}-${item.label}`} className="flex justify-between gap-2">
                <span>
                  <span className="font-medium">{item.studentName}</span> — {item.label}
                </span>
                <time className="shrink-0 text-slate-500">
                  {new Date(item.startsAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                </time>
              </li>
            ))}
            {!todaySchedule.length && (
              <li className="text-slate-500">No sessions scheduled for today.</li>
            )}
          </ul>
          <ActionChip href="/portal/calendar" size="xs" className="mt-3">
            Full calendar
          </ActionChip>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-slate-900">Announcements</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {(announcements.length ? announcements : recentNotifications)
              .slice(0, 5)
              .map((n) => (
                <li key={n.id} className="rounded-lg bg-slate-50 px-3 py-2">
                  {n.title ?? "Update"}
                </li>
              ))}
            {!announcements.length && !recentNotifications.length && (
              <li className="text-slate-500">No announcements right now.</li>
            )}
          </ul>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">Quick actions</h2>
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

      <section>
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-900">Children summary</h2>
          <Link href="/portal/children" className="text-sm font-medium text-brand-700 underline">
            View all
          </Link>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {students.map((s) => (
            <Link
              key={s.id}
              href={`/portal/students/${s.id}`}
              className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-brand-200 hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">
                    {s.first_name} {s.last_name}
                  </h3>
                  <p className="text-sm capitalize text-slate-500">
                    {s.program?.replace(/_/g, " ") ?? "Student"} · Grade {s.grade_level ?? "—"}
                  </p>
                </div>
                {s.successScore && (
                  <span
                    className={`rounded-full border px-3 py-1 text-sm font-medium ${scoreColor(s.successScore.statusIndicator)}`}
                  >
                    {s.successScore.overallScore}
                  </span>
                )}
              </div>
              <ul className="mt-4 grid grid-cols-2 gap-2 text-sm text-slate-600">
                <li>Today: {s.todaySessions} session{s.todaySessions !== 1 ? "s" : ""}</li>
                <li>{s.upcomingMeetings} upcoming meeting{s.upcomingMeetings !== 1 ? "s" : ""}</li>
                {s.attendanceAlert && <li className="text-amber-700">Attendance alert</li>}
                {s.documentsNeeded > 0 && (
                  <li>
                    {s.documentsNeeded} document{s.documentsNeeded !== 1 ? "s" : ""} need attention
                  </li>
                )}
              </ul>
            </Link>
          ))}
          {!students.length && (
            <p className="col-span-full rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
              No enrolled students linked. Contact the registrar or continue admissions.
            </p>
          )}
        </div>
      </section>

      <MyDeadlinesWidget
        deadlines={deadlines}
        tasks={tasks}
        students={students.map((s) => ({
          id: s.id,
          first_name: s.first_name,
          last_name: s.last_name,
        }))}
      />
    </div>
  );
}
