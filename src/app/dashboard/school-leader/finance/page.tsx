import Link from "next/link";
import { requireSchoolLeaderExperienceContext } from "@/lib/school-leader/experience/access";
import { getSchoolLeaderFinanceSummary } from "@/lib/school-leader/experience/summaries";
import { publishSchoolLeaderExperienceEvent } from "@/lib/school-leader/experience/events";

export default async function SchoolLeaderFinancePage() {
  const ctx = await requireSchoolLeaderExperienceContext();
  const data = await getSchoolLeaderFinanceSummary(ctx.supabase, ctx.schoolId);

  publishSchoolLeaderExperienceEvent({
    type: "school_leader.finance_reviewed",
    organizationId: ctx.organizationId,
    recordType: "campus",
    recordId: ctx.schoolId ?? ctx.organizationId,
    actorUserId: ctx.actorUserId,
    payload: { readOnly: true, engines: data.engines.join(",") },
    projectLive: false,
  });

  const s = data.summary;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Finance</h1>
        <p className="mt-1 text-slate-600">{data.note}</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Tile label="Outstanding tuition" value={formatMoney(s.outstandingBalance)} />
        <Tile label="Cash received" value={formatMoney(s.cashReceived)} />
        <Tile label="Projected revenue" value={formatMoney(s.projectedRevenue)} />
        <Tile label="Scholarships applied" value={formatMoney(s.scholarshipsApplied)} />
        <Tile label="Overdue accounts" value={s.overdueAccounts} />
        <Tile label="Collection rate" value={`${s.collectionsRate ?? 0}%`} />
      </section>

      <p className="text-xs text-slate-500">
        Read-only operational summaries via FinanceEngine / CFO operational views — no accounting
        logic in this workspace.
      </p>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href={data.deepLinks.finance} className="underline">
          Finance workspace
        </Link>
        <Link href={data.deepLinks.scholarships} className="underline">
          Scholarships
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

function formatMoney(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}
