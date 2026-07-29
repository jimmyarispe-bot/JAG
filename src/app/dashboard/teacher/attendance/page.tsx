import Link from "next/link";
import { requireTeacherExperienceContext } from "@/lib/teacher/experience/access";
import { getTeacherTodaySessions } from "@/lib/teacher/queries";
import { TeacherAttendancePanel } from "@/components/teacher/experience/TeacherAttendancePanel";

export default async function TeacherAttendancePage() {
  const ctx = await requireTeacherExperienceContext();
  const sessions = await getTeacherTodaySessions(ctx.supabase, ctx.employeeId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Attendance</h1>
        <p className="mt-1 text-slate-600">
          Take attendance using the existing scheduling attendance bridge — present, late, excused,
          absent, comments, bulk actions.
        </p>
      </div>

      {sessions.map((session) => (
        <section key={session.id as string} className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-semibold">
                {(session.course as { name?: string } | null)?.name ?? "Session"} ·{" "}
                {session.timeDisplay}
              </h2>
              <p className="text-sm text-slate-500 capitalize">
                Lesson: {session.lessonStatus.replace(/_/g, " ")}
              </p>
            </div>
            <Link
              href={`/dashboard/teacher/sessions/${session.id}`}
              className="text-sm font-medium text-brand-700 underline"
            >
              Open class session
            </Link>
          </div>
          <div className="mt-4">
            <TeacherAttendancePanel
              sessionId={session.id as string}
              organizationId={ctx.organizationId}
              students={session.students.map((s: { id: string; first_name?: string; last_name?: string; attendanceStatus?: string }) => ({
                id: s.id,
                name: `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim() || "Student",
                status: s.attendanceStatus ?? "pending",
              }))}
            />
          </div>
        </section>
      ))}

      {!sessions.length && (
        <p className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
          No sessions today. Check{" "}
          <Link href="/dashboard/teacher/classes" className="underline">
            My Classes
          </Link>
          .
        </p>
      )}
    </div>
  );
}
