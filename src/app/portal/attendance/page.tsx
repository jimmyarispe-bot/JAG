import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { getLinkedStudentsForPortal } from "@/lib/portal/dashboard";
import {
  getParentAttendanceHistory,
  summarizeAttendance,
} from "@/lib/portal/experience/attendance";
import { AttendanceExcuseForm } from "@/components/portal/experience/AttendanceExcuseForm";

interface AttendancePageProps {
  searchParams: Promise<{ studentId?: string }>;
}

export default async function ParentAttendancePage({ searchParams }: AttendancePageProps) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/login?next=/portal/attendance");

  const { studentId: requestedId } = await searchParams;
  const supabase = await createAuthClient();
  const students = await getLinkedStudentsForPortal(supabase, sessionUser.id);
  const studentIds = requestedId
    ? students.filter((s) => s.id === requestedId).map((s) => s.id)
    : students.map((s) => s.id);

  const rows = await getParentAttendanceHistory(supabase, studentIds);
  const summary = summarizeAttendance(rows);
  const nameById = Object.fromEntries(
    students.map((s) => [s.id, `${s.first_name} ${s.last_name}`])
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Attendance</h1>
        <p className="mt-1 text-slate-600">
          Daily attendance, history, absences, and tardies from SIS records.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <Link
            href="/portal/attendance"
            className={`rounded-full px-3 py-1 ${!requestedId ? "bg-brand-100 text-brand-800" : "bg-slate-100"}`}
          >
            All children
          </Link>
          {students.map((s) => (
            <Link
              key={s.id}
              href={`/portal/attendance?studentId=${s.id}`}
              className={`rounded-full px-3 py-1 ${
                requestedId === s.id ? "bg-brand-100 text-brand-800" : "bg-slate-100"
              }`}
            >
              {s.first_name}
            </Link>
          ))}
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-4">
        {[
          ["Present", summary.present],
          ["Absent", summary.absent],
          ["Tardy", summary.tardy],
          ["Excused", summary.excused],
        ].map(([label, value]) => (
          <article key={label as string} className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="text-2xl font-semibold">{value as number}</p>
          </article>
        ))}
      </section>

      <AttendanceExcuseForm
        students={students.map((s) => ({ id: s.id, name: `${s.first_name} ${s.last_name}` }))}
        organizationId={students[0]?.school_id ?? "default"}
        userId={sessionUser.id}
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-900">History</h2>
        <ul className="mt-3 divide-y divide-slate-100 text-sm">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-wrap justify-between gap-2 py-2">
              <span>
                {nameById[r.studentId] ?? "Student"} · {r.attendanceDate}
              </span>
              <span className="capitalize text-slate-600">{r.status.replace(/_/g, " ")}</span>
            </li>
          ))}
          {!rows.length && <li className="py-2 text-slate-500">No attendance records in the last 60 days.</li>}
        </ul>
      </section>
    </div>
  );
}
