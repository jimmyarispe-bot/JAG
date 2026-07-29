import Link from "next/link";
import { requireExecutiveExperienceContext } from "@/lib/executive/experience/access";
import { getExecutiveOperationsSummary } from "@/lib/executive/experience/summaries";
import { publishExecutiveExperienceEvent } from "@/lib/executive/experience/events";

export default async function ExecutiveOperationsPage() {
  const ctx = await requireExecutiveExperienceContext();
  const data = await getExecutiveOperationsSummary(ctx.supabase, ctx.schoolId);

  publishExecutiveExperienceEvent({
    type: "executive.operations_reviewed",
    organizationId: ctx.organizationId,
    recordType: "organization",
    recordId: ctx.organizationId,
    actorUserId: ctx.actorUserId,
    projectLive: false,
  });

  const a = data.admissions;
  const s = data.scheduling;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Operations</h1>
        <p className="mt-1 text-slate-600">{data.note}</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="New inquiries" value={a?.newInquiries ?? "—"} />
        <Tile label="Apps submitted" value={a?.applicationsSubmitted ?? "—"} />
        <Tile label="Accepted" value={a?.accepted ?? "—"} />
        <Tile label="Waitlist" value={a?.waitlisted ?? "—"} />
        <Tile label="Sessions this week" value={s?.sessionsThisWeek ?? "—"} />
        <Tile label="Open conflicts" value={data.openConflicts} />
        <Tile
          label="School compliance"
          value={
            data.compliance?.schoolCompliance != null
              ? `${data.compliance.schoolCompliance}%`
              : "—"
          }
        />
        <Tile label="Awaiting decision" value={a?.awaitingDecision ?? "—"} />
      </section>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/dashboard/admissions" className="underline">
          Admissions
        </Link>
        <Link href="/dashboard/scheduling" className="underline">
          Scheduling
        </Link>
        <Link href="/dashboard/executive/compliance" className="underline">
          Compliance
        </Link>
        <Link href="/dashboard/executive/capacity" className="underline">
          Capacity
        </Link>
        <Link href="/dashboard/executive/risk" className="underline">
          Risk
        </Link>
      </div>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string | number }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </article>
  );
}
