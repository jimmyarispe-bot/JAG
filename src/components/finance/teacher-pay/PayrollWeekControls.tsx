"use client";

import { useState, useTransition } from "react";
import {
  approveWeekAction,
  reopenWeekAction,
} from "@/lib/finance/teacher-pay/payroll-actions";
import { usd, type WeekStatus } from "@/lib/finance/teacher-pay/week-view";

/**
 * Approve, and reopen.
 *
 * THE AMOUNT ON THE BUTTON IS NOT THE AMOUNT SENT. It is a label. The action
 * takes an employee and a week, reloads the week on the server, and approves
 * the total it computes there. If this screen were stale the figure frozen
 * would be the true one, not the one that happened to be on a page somebody
 * left open over lunch.
 *
 * REOPENING ASKS FOR THE REASON BEFORE THE PRESS, not after. The database
 * requires one and will refuse without it; typing it first means finding
 * that out while you still remember why.
 *
 * NO CONFIRMATION DIALOG ON APPROVE. Approving is reversible - that is what
 * reopening is for, and every reopening is on the record. A dialog in front
 * of a reversible action trains people to click through dialogs.
 */
export function PayrollWeekControls(props: {
  employeeId: string;
  weekId: string | null;
  weekStart: string;
  status: WeekStatus;
  totalCents: number;
  /** Set when something in the week could not be priced. Approving is refused. */
  hasProblems: boolean;
}) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [asking, setAsking] = useState(false);
  const [reason, setReason] = useState("");

  function run(fn: () => Promise<{ success: true } | { error: string }>, ok: string) {
    setMessage(null);
    start(async () => {
      const r = await fn();
      if ("error" in r) setMessage({ ok: false, text: r.error });
      else {
        setMessage({ ok: true, text: ok });
        setAsking(false);
        setReason("");
      }
    });
  }

  if (!props.weekId) return null;

  return (
    <div className="mt-3 border-t border-slate-100 pt-3">
      <div className="flex flex-wrap items-center gap-2">
        {props.status === "submitted" ? (
          <button
            type="button"
            disabled={pending || props.hasProblems}
            onClick={() =>
              run(
                () => approveWeekAction(props.employeeId, props.weekStart),
                "Approved. The amount is now frozen at what it was worth."
              )
            }
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            title={
              props.hasProblems
                ? "Something in this week could not be priced. Look before approving."
                : undefined
            }
          >
            {pending ? "Approving…" : `Approve ${usd(props.totalCents)}`}
          </button>
        ) : null}

        {props.status === "approved" ? (
          <span className="rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">
            Approved · {usd(props.totalCents)} frozen
          </span>
        ) : null}

        {props.status === "open" ? (
          <span className="text-xs text-slate-500">
            Still open. Nothing to approve until the teacher submits it.
          </span>
        ) : null}

        {props.status !== "open" ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => setAsking((v) => !v)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            {asking ? "Cancel" : "Reopen"}
          </button>
        ) : null}
      </div>

      {asking ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why is it being reopened? This is recorded."
            className="min-w-[18rem] flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
          <button
            type="button"
            disabled={pending || reason.trim().length < 3}
            onClick={() =>
              run(
                () => reopenWeekAction(props.weekId as string, reason),
                "Reopened. The teacher can change it again, and the reason is on the record."
              )
            }
            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
          >
            {pending ? "Reopening…" : "Reopen this week"}
          </button>
        </div>
      ) : null}

      {message ? (
        <p
          className={`mt-2 text-sm ${message.ok ? "text-emerald-700" : "text-rose-700"}`}
        >
          {message.text}
        </p>
      ) : null}
    </div>
  );
}
