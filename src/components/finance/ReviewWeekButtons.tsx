"use client";

import { useState, useTransition } from "react";
import { reviewWeekAction } from "@/lib/finance/timesheet-review-actions";

/**
 * Approve, or not approved with a reason.
 *
 * THE COMMENT BOX ONLY APPEARS FOR A REFUSAL. Approving needs no explanation;
 * declining is the whole reason the box exists. Showing it always would invite
 * a comment on an approval nobody will read, and hide the one that matters.
 *
 * TWENTY CHARACTERS, checked here and in the database. A week marked not
 * approved still reaches Jimmy, so the comment is the only thing that tells
 * him - and the teacher - what was wrong with it.
 */
export function ReviewWeekButtons({
  employeeId,
  weekStart,
  teacherName,
  status,
}: {
  employeeId: string;
  weekStart: string;
  teacherName: string;
  status: "submitted" | "approved" | "not_approved";
}) {
  const [declining, setDeclining] = useState(false);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const run = (approved: boolean) => {
    setMessage(null);
    startTransition(async () => {
      const result = await reviewWeekAction(employeeId, weekStart, approved, note);
      if (result && "error" in result && result.error) {
        setMessage(result.error);
        return;
      }
      setDeclining(false);
      setNote("");
    });
  };

  if (status !== "submitted") {
    return (
      <span
        className={
          status === "approved"
            ? "rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
            : "rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800"
        }
      >
        {status === "approved" ? "Approved" : "Not approved"}
      </span>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => run(true)}
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Approve"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setDeclining((open) => !open)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Not approved
        </button>
      </div>

      {declining ? (
        <div className="space-y-1.5">
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={`What is wrong with ${teacherName}'s week? This goes to Jimmy and to her.`}
            className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => run(false)}
              className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {pending ? "Saving…" : "Mark not approved"}
            </button>
            <span className="text-[11px] text-slate-400">
              It still goes to Jimmy, with this comment attached.
            </span>
          </div>
        </div>
      ) : null}

      {message ? <p className="text-xs text-rose-700">{message}</p> : null}
    </div>
  );
}
