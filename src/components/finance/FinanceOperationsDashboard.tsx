import Link from "next/link";
import { formatCurrency, formatCount } from "@/lib/format";
import type { FinanceOperationsSummary } from "@/lib/finance-platform/types";
import type { FamilyFinancialAccountView } from "@/lib/finance-platform/types";

interface FinanceOperationsDashboardProps {
  summary: FinanceOperationsSummary;
  accounts: FamilyFinancialAccountView[];
  refundQueue: Array<{
    id: string;
    amount: number;
    status: string;
    reason: string;
    requested_at: string;
  }>;
  canEdit: boolean;
}

function AgingBar({
  label,
  amount,
  total,
}: {
  label: string;
  amount: number;
  total: number;
}) {
  const pct = total > 0 ? Math.min(100, Math.round((amount / total) * 100)) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-600">
        <span>{label}</span>
        <span>{formatCurrency(amount)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function FinanceOperationsDashboard({
  summary,
  accounts,
  refundQueue,
  canEdit,
}: FinanceOperationsDashboardProps) {
  const aging = summary.aging;
  const alerts: string[] = [];
  if (summary.overdueAccounts > 0) {
    alerts.push(`${summary.overdueAccounts} overdue account(s)`);
  }
  if (aging.days90 > 0 || aging.days120Plus > 0) {
    alerts.push("Balances aging 90+ days require collections attention");
  }
  if (summary.refundQueueCount > 0) {
    alerts.push(`${summary.refundQueueCount} refund(s) in queue`);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SectionCard title="Revenue Summary" value={formatCurrency(summary.revenueSummary)} hint="Total billed" />
        <SectionCard
          title="Outstanding Balance"
          value={formatCurrency(summary.outstandingBalance)}
          hint="Open AR"
        />
        <SectionCard
          title="Payments Received"
          value={formatCurrency(summary.paymentsReceived)}
          hint={`${summary.collectionsRate}% collection rate`}
        />
        <SectionCard
          title="Overdue Accounts"
          value={formatCount(summary.overdueAccounts)}
          hint="Aging 30+ days"
        />
        <SectionCard
          title="Scholarships Applied"
          value={formatCurrency(summary.scholarshipsApplied)}
          hint="Credits on invoices"
        />
        <SectionCard
          title="Payment Plans"
          value={formatCount(summary.activePaymentPlans)}
          hint="Active plans"
        />
        <SectionCard
          title="Refund Queue"
          value={formatCount(summary.refundQueueCount)}
          hint="Pending review"
        />
        <SectionCard
          title="Projected Revenue"
          value={formatCurrency(summary.projectedRevenue)}
          hint="Open AR + near-term"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-900">Aging</h3>
          <p className="mb-4 text-xs text-slate-500">Current · 30 · 60 · 90 · 120+</p>
          <div className="space-y-3">
            <AgingBar label="Current" amount={aging.current} total={aging.total} />
            <AgingBar label="30 days" amount={aging.days30} total={aging.total} />
            <AgingBar label="60 days" amount={aging.days60} total={aging.total} />
            <AgingBar label="90 days" amount={aging.days90} total={aging.total} />
            <AgingBar label="120+" amount={aging.days120Plus} total={aging.total} />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-900">Financial Alerts</h3>
          {alerts.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No active financial alerts.</p>
          ) : (
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
              {alerts.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/dashboard/finance?view=invoices"
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
            >
              Invoices
            </Link>
            <Link
              href="/dashboard/finance?view=accounts"
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
            >
              Family accounts
            </Link>
            <Link
              href="/dashboard/finance/executive"
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
            >
              Executive reports
            </Link>
            {canEdit ? (
              <Link
                href="/dashboard/finance?view=create"
                className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
              >
                Create
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-900">Family Accounts</h3>
          </div>
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2">Account</th>
                <th className="px-4 py-2">Family</th>
                <th className="px-4 py-2">Balance</th>
                <th className="px-4 py-2">Credits</th>
                <th className="px-4 py-2">Aging</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {accounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                    No family financial accounts yet.
                  </td>
                </tr>
              ) : (
                accounts.slice(0, 12).map((a) => (
                  <tr key={a.id} className="border-t border-slate-50">
                    <td className="px-4 py-2 font-mono text-xs">{a.accountNumber ?? a.id.slice(0, 8)}</td>
                    <td className="px-4 py-2">
                      <Link
                        href={`/dashboard/finance/families/${a.familyId}`}
                        className="text-brand-700 hover:underline"
                      >
                        {a.familyName ?? "Family"}
                      </Link>
                    </td>
                    <td className="px-4 py-2">{formatCurrency(a.currentBalance)}</td>
                    <td className="px-4 py-2">{formatCurrency(a.availableCredits)}</td>
                    <td className="px-4 py-2 capitalize text-slate-600">
                      {(a.agingBucket ?? "current").replace(/_/g, " ")}
                    </td>
                    <td className="px-4 py-2 capitalize">{a.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-900">Refund Queue</h3>
          </div>
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2">Amount</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Reason</th>
                <th className="px-4 py-2">Requested</th>
              </tr>
            </thead>
            <tbody>
              {refundQueue.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                    Refund queue is empty.
                  </td>
                </tr>
              ) : (
                refundQueue.slice(0, 12).map((r) => (
                  <tr key={r.id} className="border-t border-slate-50">
                    <td className="px-4 py-2 font-medium">{formatCurrency(Number(r.amount))}</td>
                    <td className="px-4 py-2 capitalize">{r.status.replace(/_/g, " ")}</td>
                    <td className="px-4 py-2 text-slate-600">{r.reason || "—"}</td>
                    <td className="px-4 py-2 text-slate-600">
                      {new Date(r.requested_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  value,
  hint,
}: {
  title: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  );
}
