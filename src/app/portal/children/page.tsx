import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { getParentDashboardData } from "@/lib/portal/dashboard";

export default async function MyChildrenPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/login?next=/portal/children");

  const supabase = await createAuthClient();
  const dashboard = await getParentDashboardData(supabase, sessionUser.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">My Children</h1>
        <p className="mt-1 text-slate-600">
          Profiles, learning snapshots, attendance signals, progress, and upcoming sessions.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {dashboard.students.map((s) => (
          <article
            key={s.id}
            className="rounded-2xl border border-slate-200 bg-white p-5"
          >
            <h2 className="text-xl font-semibold">
              {s.first_name} {s.last_name}
            </h2>
            <p className="text-sm capitalize text-slate-500">
              {s.program?.replace(/_/g, " ") ?? "Student"} · Grade {s.grade_level ?? "—"}
            </p>
            <ul className="mt-4 space-y-1 text-sm text-slate-700">
              <li>Today&apos;s sessions: {s.todaySessions}</li>
              <li>Upcoming meetings: {s.upcomingMeetings}</li>
              <li>
                Attendance:{" "}
                {s.attendanceAlert ? (
                  <span className="text-amber-700">Needs attention</span>
                ) : (
                  "On track"
                )}
              </li>
              <li>
                Success score: {s.successScore?.overallScore ?? "—"} (
                {s.successScore?.statusIndicator ?? "n/a"})
              </li>
            </ul>
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <Link href={`/portal/students/${s.id}`} className="font-medium text-brand-700 underline">
                Profile
              </Link>
              <Link href={`/portal/learning?studentId=${s.id}`} className="underline">
                Learning
              </Link>
              <Link href={`/portal/attendance?studentId=${s.id}`} className="underline">
                Attendance
              </Link>
              <Link href={`/portal/calendar?studentId=${s.id}`} className="underline">
                Calendar
              </Link>
            </div>
          </article>
        ))}
        {!dashboard.students.length && (
          <p className="text-slate-500">No students linked to this guardian account.</p>
        )}
      </div>
    </div>
  );
}
