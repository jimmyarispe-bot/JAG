import Link from "next/link";
import { requireSchoolLeaderExperienceContext } from "@/lib/school-leader/experience/access";
import { getSchoolLeaderEnrollmentSummary } from "@/lib/school-leader/experience/summaries";
import { publishSchoolLeaderExperienceEvent } from "@/lib/school-leader/experience/events";

export default async function SchoolLeaderEnrollmentPage() {
  const ctx = await requireSchoolLeaderExperienceContext();
  const data = await getSchoolLeaderEnrollmentSummary(ctx.schoolId);

  publishSchoolLeaderExperienceEvent({
    type: "school_leader.enrollment_reviewed",
    organizationId: ctx.organizationId,
    recordType: "campus",
    recordId: ctx.schoolId ?? ctx.organizationId,
    actorUserId: ctx.actorUserId,
    projectLive: false,
  });

  const p = data.pipeline;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Enrollment</h1>
        <p className="mt-1 text-slate-600">{data.trendsNote}</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="New inquiries" value={p.newInquiries} />
        <Tile label="Applications" value={p.applicationsSubmitted} />
        <Tile label="Acceptances" value={p.accepted} />
        <Tile label="Waitlist" value={p.waitlisted} />
        <Tile label="Awaiting decision" value={p.awaitingDecision} />
        <Tile label="Awaiting documents" value={p.awaitingDocuments} />
        <Tile label="Active leads" value={p.activeLeads} />
        <Tile label="Enrolled (funnel)" value={p.enrolled} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Capacity by program</h2>
        {data.capacity ? (
          <pre className="mt-3 overflow-auto rounded-lg bg-slate-50 p-3 text-xs">
            {JSON.stringify(data.capacity, null, 2)}
          </pre>
        ) : (
          <p className="mt-2 text-sm text-slate-500">
            Capacity report requires a school assignment. Open{" "}
            <Link href="/dashboard/scheduling" className="underline">
              Scheduling
            </Link>{" "}
            for seat inventory.
          </p>
        )}
      </section>

      <Link
        href="/dashboard/admissions"
        className="inline-flex rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
      >
        Open Admissions CRM
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
