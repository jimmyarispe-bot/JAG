import { requireStudentExperienceContext } from "@/lib/portal/student-experience/access";
import {
  getParentAttendanceHistory,
  summarizeAttendance,
} from "@/lib/portal/experience/attendance";

export default async function StudentAttendancePage() {
  const ctx = await requireStudentExperienceContext("/portal/student/attendance");
  const rows = await getParentAttendanceHistory(ctx.supabase, [ctx.studentId]);
  const summary = summarizeAttendance(rows);
  const today = new Date().toISOString().slice(0, 10);
  const todayRow = rows.find((r) => r.attendanceDate === today);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Attendance</h1>
        <p className="mt-1 text-slate-600">Today&apos;s status, history, and participation from SIS records.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 sm:col-span-1">
          <p className="text-sm text-slate-500">Today</p>
          <p className="text-xl font-semibold capitalize">
            {todayRow?.status?.replace(/_/g, " ") ?? "Not recorded"}
          </p>
        </article>
        {[
          ["Present", summary.present],
          ["Absent", summary.absent],
          ["Tardy", summary.tardy],
        ].map(([label, value]) => (
          <article key={label as string} className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="text-2xl font-semibold">{value as number}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">History</h2>
        <ul className="mt-3 divide-y divide-slate-100 text-sm">
          {rows.map((r) => (
            <li key={r.id} className="flex justify-between py-2">
              <span>{r.attendanceDate}</span>
              <span className="capitalize text-slate-600">{r.status.replace(/_/g, " ")}</span>
            </li>
          ))}
          {!rows.length && <li className="py-2 text-slate-500">No attendance history yet.</li>}
        </ul>
      </section>
    </div>
  );
}
