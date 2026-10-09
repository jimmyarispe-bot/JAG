import Link from "next/link";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { mayReadPayroll } from "@/lib/finance/teacher-pay/payroll-store";
import {
  loadMonthlyTeacherPay,
  monthLabel,
} from "@/lib/finance/teacher-pay/monthly-store";
import { usd } from "@/lib/finance/teacher-pay/week-view";

/**
 * What each campus paid its teachers, by month — paysheet change 5 of 6.
 *
 * Jimmy, 8 October 2026: "provide totals each month per school for how much
 * was paid out to teachers".
 *
 * WHO SEES IT. mayReadPayroll, the same gate as the weekly screen, which asks
 * may_read_all_teacher_pay() rather than re-deciding in TypeScript. Jimmy and
 * Danni, and the standing rule that only they see anything to do with money.
 *
 * A REFUSAL SAYS SO. An empty page would read as "nothing was paid", which is
 * the one wrong answer this page must never give.
 */

export const dynamic = "force-dynamic";

function thisMonth(): string {
  /* Eastern, because the school runs on Eastern and a month that rolls over
     at 7pm for somebody in California is a month nobody can reconcile. */
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);
  const y = parts.find((p) => p.type === "year")?.value ?? "2026";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  return `${y}-${m}`;
}

function shiftMonth(month: string, by: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + by, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default async function MonthlyTeacherPayPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: monthParam } = await searchParams;
  const month = /^\d{4}-\d{2}$/.test(monthParam ?? "") ? (monthParam as string) : thisMonth();

  const supabase = await createAuthClient();

  if (!(await mayReadPayroll(supabase))) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-2xl font-semibold text-slate-900">Not your screen</h1>
        <p className="mt-3 text-slate-600">
          Teacher pay is Jimmy&rsquo;s and Danni&rsquo;s. If you need a figure from it, ask
          one of them rather than working it out another way.
        </p>
      </div>
    );
  }

  const m = await loadMonthlyTeacherPay(supabase, month);
  const difference = m.paidCents - m.computedCents;

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Paid to teachers</h1>
          <p className="mt-1 text-slate-600">
            {m.monthLabel}. Approved weeks only — a submitted week is a claim, an approved
            one is a decision.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Link
            href={`/dashboard/finance/teacher-pay/monthly?month=${shiftMonth(month, -1)}`}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-50"
          >
            ← {monthLabel(shiftMonth(month, -1))}
          </Link>
          <Link
            href={`/dashboard/finance/teacher-pay/monthly?month=${shiftMonth(month, 1)}`}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-50"
          >
            {monthLabel(shiftMonth(month, 1))} →
          </Link>
        </div>
      </div>

      {m.unavailable ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {m.unavailable}
        </div>
      ) : null}

      {/* The campuses, which is the question that was asked. */}
      <div className="grid gap-3 sm:grid-cols-4">
        {m.campuses.map((c) => (
          <div key={c.campus} className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">{c.label}</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{usd(c.cents)}</p>
          </div>
        ))}
        <div className="rounded-2xl border border-slate-900 bg-slate-900 px-5 py-4">
          <p className="text-xs uppercase tracking-wide text-slate-300">Paid out</p>
          <p className="mt-1 text-2xl font-semibold text-white">{usd(m.paidCents)}</p>
        </div>
      </div>

      {/*
        THE CAMPUS COLUMNS SUM TO THE COMPUTED TOTAL, NOT THE PAID ONE, and
        where those differ this says so rather than quietly reconciling.

        An override is a decision about a whole week. Nothing records which
        campus Jimmy had in mind, so apportioning it across them would be
        putting a number in his mouth.
      */}
      {difference !== 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-semibold">
            {usd(Math.abs(difference))} {difference > 0 ? "more" : "less"} was paid than the
            JAG worked out.
          </p>
          <p className="mt-0.5">
            The campus figures above add up to {usd(m.computedCents)}, which is what was
            computed. The difference is from weeks where an amount was set by hand, listed
            against the teacher below. It is not apportioned to a campus, because an
            override is a decision about a whole week and nothing records which campus it
            was meant for.
          </p>
        </div>
      ) : null}

      {m.waiting.length > 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <p className="font-semibold">
            {m.waiting.length} submitted {m.waiting.length === 1 ? "week is" : "weeks are"} not
            in these figures
          </p>
          <p className="mt-0.5 text-slate-600">
            Submitted and waiting to be approved. Named rather than folded in, so a month
            nobody has got to does not read as a month that is finished.
          </p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs text-slate-600">
            {m.waiting.map((w) => (
              <li key={`${w.teacherName}-${w.weekStart}`}>
                {w.teacherName} — week of {w.weekStart}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {m.teachers.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
          No approved weeks in {m.monthLabel}. That is not the same as nothing being owed —
          check the weekly screen before concluding the month cost nothing.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Teacher</th>
                <th className="px-4 py-3 font-semibold">Weeks</th>
                <th className="px-4 py-3 font-semibold">Virtual</th>
                <th className="px-4 py-3 font-semibold">HS</th>
                <th className="px-4 py-3 font-semibold">Extras</th>
                <th className="px-4 py-3 font-semibold">Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {m.teachers.map((t) => (
                <tr key={t.employeeId}>
                  <td className="px-4 py-3">
                    <span className="font-medium text-slate-900">{t.teacherName}</span>
                    {t.overrides.map((o) => (
                      <span key={o.weekStart} className="block text-xs text-amber-800">
                        week of {o.weekStart}: amount set by hand
                        {o.reason ? ` — ${o.reason}` : ""}
                      </span>
                    ))}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{t.weeksApproved}</td>
                  <td className="px-4 py-3 text-slate-600">{usd(t.virtualCents)}</td>
                  <td className="px-4 py-3 text-slate-600">{usd(t.hsCents)}</td>
                  <td className="px-4 py-3 text-slate-600">{usd(t.unattributedCents)}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {usd(t.paidCents)}
                    {t.paidCents !== t.computedCents ? (
                      <span className="block text-xs font-normal text-slate-500">
                        computed {usd(t.computedCents)}
                      </span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-slate-400">
        A week belongs to the month its Monday falls in. Splitting one across two months
        would mean apportioning a single figure by day, which is an arithmetic nobody asked
        for and nobody could check.
      </p>
    </div>
  );
}
