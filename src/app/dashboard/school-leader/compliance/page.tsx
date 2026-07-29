import Link from "next/link";
import { requireSchoolLeaderExperienceContext } from "@/lib/school-leader/experience/access";
import { getSchoolLeaderComplianceSummary } from "@/lib/school-leader/experience/summaries";
import { publishSchoolLeaderExperienceEvent } from "@/lib/school-leader/experience/events";

export default async function SchoolLeaderCompliancePage() {
  const ctx = await requireSchoolLeaderExperienceContext();
  const data = await getSchoolLeaderComplianceSummary(ctx.supabase, ctx.schoolId);

  publishSchoolLeaderExperienceEvent({
    type: "school_leader.compliance_reviewed",
    organizationId: ctx.organizationId,
    recordType: "campus",
    recordId: ctx.schoolId ?? ctx.organizationId,
    actorUserId: ctx.actorUserId,
    projectLive: false,
  });

  const a = data.analytics;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Compliance</h1>
        <p className="mt-1 text-slate-600">{data.note}</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="School compliance" value={`${a.schoolCompliance}%`} />
        <Tile label="Teacher docs" value={`${a.teacherDocumentationCompliance}%`} />
        <Tile label="Family overdue" value={a.familyOverdue} />
        <Tile label="Staff overdue" value={a.staffOverdue} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Audit checklist</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>Attendance compliance via session / SIS records</li>
          <li>Required documents &amp; training via compliance obligations</li>
          <li>Licenses / credentials via HR compliance center</li>
          <li>IEP review reminders in student / compliance deadlines</li>
        </ul>
        {data.hrCompliance && (
          <pre className="mt-4 overflow-auto rounded-lg bg-slate-50 p-3 text-xs">
            {JSON.stringify(data.hrCompliance, null, 2).slice(0, 2000)}
          </pre>
        )}
        <Link href={data.checklistHref} className="mt-4 inline-block text-sm underline">
          Open Compliance workspace
        </Link>
      </section>
    </div>
  );
}

function Tile({ label, value }: { label: string | number; value: string | number }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </article>
  );
}
