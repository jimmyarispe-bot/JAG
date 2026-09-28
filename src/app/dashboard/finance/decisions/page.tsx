import Link from "next/link";
import { redirect } from "next/navigation";

import {
  awardsNobodyIsWaitingOn,
  loadDecisionQueue,
  type UndecidedAward,
} from "@/lib/finance/decision-queue";
import { formatUsd } from "@/lib/finance/plan-builder";
import { hasPermission } from "@/lib/platform/identity/authorization-service";
import { getIdentityContext } from "@/lib/platform/identity/context";

export const dynamic = "force-dynamic";

export const metadata = { title: "Waiting on a decision · The JAG™" };

function claimedAmount(a: UndecidedAward): string {
  if (a.expectedAmount === null) return "no expected amount given";
  const who =
    a.expectedAmountSource === "family_stated"
      ? "the family says"
      : a.expectedAmountSource === "school_estimate"
        ? "we estimate"
        : "expected";
  return `${who} ${formatUsd(a.expectedAmount)}`;
}

/** Red past a week. A figure nobody has chased in eight days is not "in progress". */
function ageClass(days: number): string {
  if (days >= 14) return "text-rose-700";
  if (days >= 7) return "text-amber-700";
  return "text-slate-500";
}

export default async function DecisionQueuePage() {
  const identity = await getIdentityContext();
  if (!identity) redirect("/login");

  // Money, so the same gate as every other finance screen.
  if (!hasPermission(identity, "finance.view") && !hasPermission(identity, "finance.billing")) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-slate-900">Waiting on a decision</h1>
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          This page needs the <span className="font-mono">finance.view</span> permission.
        </div>
      </div>
    );
  }

  const queue = await loadDecisionQueue();

  if ("error" in queue) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-slate-900">Waiting on a decision</h1>
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          {queue.error}
        </div>
      </div>
    );
  }

  const orphanAwards = awardsNobodyIsWaitingOn(queue);
  const nothingOutstanding =
    queue.waitingPlans.length === 0 && orphanAwards.length === 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link
        href="/dashboard/finance/schedules"
        className="text-sm text-slate-500 hover:text-slate-700"
      >
        ‹ Payment Schedules
      </Link>

      <h1 className="mt-2 text-2xl font-semibold text-slate-900">Waiting on a decision</h1>
      <p className="mt-1 max-w-2xl text-slate-500">
        Every plan here is finished except for a figure somebody has to decide. No contract
        can go out against one, because the amount on it would be invented.
      </p>

      {nothingOutstanding ? (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Nothing is waiting on a decision. Every plan either has all its figures or has not
          been started.
        </div>
      ) : null}

      {/* ---------------- plans that cannot proceed ---------------- */}
      {queue.waitingPlans.length > 0 ? (
        <section className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Plans that cannot become a contract ({queue.waitingPlans.length})
          </h2>

          <ul className="mt-3 space-y-3">
            {queue.waitingPlans.map((p) => {
              const awards = queue.awardsByStudent.get(p.studentId) ?? [];
              return (
                <li
                  key={p.planId}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <Link
                      href={`/dashboard/finance/plan/${p.studentId}`}
                      className="text-base font-medium text-slate-900 hover:underline"
                    >
                      {p.student}
                    </Link>
                    <span className={`text-xs tabular-nums ${ageClass(p.daysWaiting)}`}>
                      {p.daysWaiting === 0
                        ? "since today"
                        : p.daysWaiting === 1
                          ? "1 day"
                          : `${p.daysWaiting} days`}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500">
                    {p.school} · {p.schoolYear}
                  </p>

                  <p className="mt-2 text-sm text-slate-800">
                    {p.awaitingReason ??
                      "Started but not finished. Nothing is recorded as outstanding, so this is a draft somebody left."}
                  </p>

                  {awards.length > 0 ? (
                    <ul className="mt-2 space-y-1">
                      {awards.map((a) => (
                        <li key={a.awardId} className="text-xs text-slate-600">
                          <span className="text-slate-900">{a.programName}</span> ·{" "}
                          {claimedAmount(a)}
                          {a.appliedOn ? ` · applied ${a.appliedOn}` : " · no application date recorded"}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {/* ---------------- applications with no plan waiting ---------------- */}
      {orphanAwards.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Applications with no plan waiting on them ({orphanAwards.length})
          </h2>
          <p className="mt-1 max-w-2xl text-xs text-slate-500">
            These children have applied for something undecided, but no plan is marked as
            blocked on it. Either the plan was never built, or it was built before the family
            applied and does not know. Both end in a contract at the wrong figure.
          </p>

          <ul className="mt-3 space-y-2">
            {orphanAwards.map((a) => (
              <li
                key={a.awardId}
                className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <Link
                    href={`/dashboard/finance/plan/${a.studentId}`}
                    className="text-sm font-medium text-slate-900 hover:underline"
                  >
                    {a.student}
                  </Link>
                  <span
                    className={`text-xs tabular-nums ${ageClass(a.daysSinceApplied ?? 0)}`}
                  >
                    {a.daysSinceApplied === null
                      ? "no application date"
                      : `${a.daysSinceApplied} days since applying`}
                  </span>
                </div>
                <p className="text-xs text-slate-700">
                  {a.school} · {a.programName} · {a.awardYear} · {claimedAmount(a)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
