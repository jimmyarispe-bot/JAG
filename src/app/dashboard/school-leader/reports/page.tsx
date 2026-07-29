import Link from "next/link";
import { requireSchoolLeaderExperienceContext } from "@/lib/school-leader/experience/access";
import { getSchoolLeaderReportsCatalog } from "@/lib/school-leader/experience/summaries";
import { publishSchoolLeaderExperienceEvent } from "@/lib/school-leader/experience/events";

export default async function SchoolLeaderReportsPage() {
  const ctx = await requireSchoolLeaderExperienceContext();
  const reports = getSchoolLeaderReportsCatalog();

  publishSchoolLeaderExperienceEvent({
    type: "school_leader.report_exported",
    organizationId: ctx.organizationId,
    recordType: "campus",
    recordId: ctx.schoolId ?? ctx.organizationId,
    actorUserId: ctx.actorUserId,
    payload: { view: "reports_catalog" },
    projectLive: false,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Reports</h1>
        <p className="mt-1 text-slate-600">
          Enrollment, attendance, academics, operations, and compliance exports via existing
          reporting surfaces — no parallel report engine.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((r) => (
          <Link
            key={r.id}
            href={r.href}
            className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-brand-300"
          >
            <h2 className="font-semibold text-slate-900">{r.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{r.description}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
