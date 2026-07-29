import Link from "next/link";
import { requireSchoolLeaderExperienceContext } from "@/lib/school-leader/experience/access";
import { getSchoolLeaderStudentsSummary } from "@/lib/school-leader/experience/summaries";
import { publishSchoolLeaderExperienceEvent } from "@/lib/school-leader/experience/events";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function SchoolLeaderStudentsPage({ searchParams }: Props) {
  const ctx = await requireSchoolLeaderExperienceContext();
  const sp = await searchParams;
  const data = await getSchoolLeaderStudentsSummary({ query: sp.q });

  publishSchoolLeaderExperienceEvent({
    type: "school_leader.students_reviewed",
    organizationId: ctx.organizationId,
    recordType: "campus",
    recordId: ctx.schoolId ?? ctx.organizationId,
    actorUserId: ctx.actorUserId,
    projectLive: false,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Students</h1>
        <p className="mt-1 text-slate-600">
          Search and launch student profiles — attendance, academic, and intervention flags surface
          from existing SIS / SSIS records when present.
        </p>
      </div>

      <form className="flex flex-wrap gap-2" method="get">
        <input
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Search by name or status"
          className="min-w-[16rem] flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white"
        >
          Search
        </button>
      </form>

      <section className="grid gap-4 sm:grid-cols-3">
        <Tile label="Total (active list)" value={data.stats.total} />
        <Tile label="Enrolled" value={data.stats.enrolled} />
        <Tile label="Matched" value={data.totalMatched} />
      </section>

      <section className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Student</th>
              <th className="px-4 py-3 font-medium">Enrollment</th>
              <th className="px-4 py-3 font-medium">IEP / 504</th>
              <th className="px-4 py-3 font-medium">Profile</th>
            </tr>
          </thead>
          <tbody>
            {data.students.map((s) => (
              <tr key={s.id} className="border-b border-slate-100">
                <td className="px-4 py-3">{s.name}</td>
                <td className="px-4 py-3 capitalize">{s.enrollmentStatus ?? "—"}</td>
                <td className="px-4 py-3">{s.iepOr504 ? "Indicated" : "—"}</td>
                <td className="px-4 py-3">
                  <Link href={s.href} className="text-brand-700 underline">
                    Open
                  </Link>
                </td>
              </tr>
            ))}
            {!data.students.length && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  No students matched.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <Link href="/dashboard/students" className="text-sm underline">
        Full Student Success workspace
      </Link>
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
