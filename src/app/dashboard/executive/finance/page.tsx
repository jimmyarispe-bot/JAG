import Link from "next/link";
import { requireExecutiveExperienceContext } from "@/lib/executive/experience/access";
import { getExecutiveFinanceSummary } from "@/lib/executive/experience/summaries";
import { publishExecutiveExperienceEvent } from "@/lib/executive/experience/events";

export default async function ExecutiveFinancePage() {
  const ctx = await requireExecutiveExperienceContext();
  const data = await getExecutiveFinanceSummary(ctx.supabase, ctx.schoolId);

  publishExecutiveExperienceEvent({
    type: "executive.finance_reviewed",
    organizationId: ctx.organizationId,
    recordType: "organization",
    recordId: ctx.organizationId,
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
        <Tile label="Outstanding" value={formatMoney(s.outstandingBalance)} />
        <Tile label="Cash received" value={formatMoney(s.cashReceived)} />
        <Tile label="Projected revenue" value={formatMoney(s.projectedRevenue)} />
        <Tile label="Scholarships applied" value={formatMoney(s.scholarshipsApplied)} />
        <Tile label="Overdue accounts" value={s.overdueAccounts} />
        <Tile label="Collection rate" value={`${s.collectionsRate ?? 0}%`} />
      </section>

      <p className="text-xs text-slate-500">
        Executive summaries only — FinanceEngine / ChiefFinancialOfficerEngine. No accounting logic
        here.
      </p>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href={data.deepLinks.financeExecutive} className="underline">
          Finance executive
        </Link>
        <Link href={data.deepLinks.forecasting} className="underline">
          Forecasting
        </Link>
        <Link href={data.deepLinks.board} className="underline">
          Board
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
