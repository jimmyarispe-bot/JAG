import Link from "next/link";
import { requireTeacherExperienceContext } from "@/lib/teacher/experience/access";
import { getTeacherClassesInRange } from "@/lib/teacher/experience/classes";
import { getTeacherExperience } from "@/lib/teacher/experience/orchestrator";

interface ClassesPageProps {
  searchParams: Promise<{ view?: string }>;
}

export default async function TeacherClassesPage({ searchParams }: ClassesPageProps) {
  const ctx = await requireTeacherExperienceContext();
  const sp = await searchParams;
  const view =
    sp.view === "weekly" || sp.view === "monthly" ? sp.view : "daily";

  const classes = await getTeacherClassesInRange(ctx.supabase, ctx.employeeId, view);

  getTeacherExperience().publishDashboardViewed({
    organizationId: ctx.organizationId,
    actorUserId: ctx.actorUserId,
    employeeId: ctx.employeeId,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">My Classes</h1>
        <p className="mt-1 text-slate-600">
          Daily, weekly, and monthly views from Scheduling — roster counts, meeting links, attendance
          status.
        </p>
        <div className="mt-3 flex gap-2 text-sm">
          {(["daily", "weekly", "monthly"] as const).map((v) => (
            <Link
              key={v}
              href={`/dashboard/teacher/classes?view=${v}`}
              className={`rounded-full px-3 py-1 capitalize ${
                view === v ? "bg-brand-100 font-medium text-brand-800" : "bg-slate-100 text-slate-700"
              }`}
            >
              {v}
            </Link>
          ))}
        </div>
      </div>

      <ul className="space-y-3">
        {classes.map((c) => (
          <li key={c.id}>
            <Link
              href={c.href}
              className="block rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-brand-200"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">
                    {c.courseName} {c.sectionCode ? `· ${c.sectionCode}` : ""}
                  </p>
                  <p className="text-sm text-slate-600">{c.timeDisplay}</p>
                </div>
                <div className="text-right text-sm text-slate-600">
                  <p>{c.studentCount} students</p>
                  <p className="capitalize">Lesson: {c.lessonStatus.replace(/_/g, " ")}</p>
                  <p>
                    Attendance:{" "}
                    {c.attendanceStarted ? (
                      <span className="text-emerald-700">started</span>
                    ) : (
                      <span className="text-amber-700">pending</span>
                    )}
                  </p>
                </div>
              </div>
              {c.meetingUrl && (
                <p className="mt-2 text-xs text-brand-700">Meeting link on file</p>
              )}
            </Link>
          </li>
        ))}
        {!classes.length && (
          <li className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
            No classes in this range.
          </li>
        )}
      </ul>
    </div>
  );
}
