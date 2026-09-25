"use client";

import { useState } from "react";
import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";
import { setGreatnessReportsAction } from "@/lib/finance/teacher-week-actions";
import { GREATNESS_DROPDOWN_MAX } from "@/lib/finance/greatness-reports";

/**
 * "How many GREATNESS Reports did you complete this week?"
 *
 * ONE QUESTION, ASKED ONCE A WEEK. Jimmy asked for a dropdown of numbers, not a
 * list of children to tick, so the screen stays a glance rather than a form.
 *
 * THE LIST STOPS AT WHAT SHE MAY CLAIM, and says why underneath. A dropdown
 * that offers 50 and then refuses 9 teaches a teacher that the screen is
 * unreliable; one that offers 0 to 8 and explains where 8 came from teaches her
 * the rule in one reading. The server checks the number again on save and again
 * on submit - the short list is a courtesy, not the enforcement.
 *
 * SAVED ON ITS OWN, BEFORE SUBMIT. She can change it, see the money move, and
 * change it back. Nothing here freezes anything.
 */
export function GreatnessReportsPicker({
  weekStart,
  claimed,
  max,
  distinctChildren,
  claimedElsewhereThisMonth,
  ratePerReport,
  gross,
}: {
  weekStart: string;
  claimed: number;
  max: number;
  distinctChildren: number;
  claimedElsewhereThisMonth: number;
  ratePerReport: number | null;
  gross: number;
}) {
  const [value, setValue] = useState(claimed);

  const money = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD" });

  const labels = { idle: "Save", loading: "Saving…", success: "✓ Saved" };
  const action = useActionFeedback({
    verb: "custom",
    labels,
    successToast: "GREATNESS Reports saved.",
    errorToast: "Could not save your GREATNESS Reports.",
    progressLabel: "Saving…",
  });

  /* Never offer more than she may have, and never offer fewer than she has
     already saved - a ceiling that drops below the number on screen would
     leave her unable to select what is already there. */
  const ceiling = Math.max(0, Math.min(GREATNESS_DROPDOWN_MAX, Math.max(max, claimed)));
  const options = Array.from({ length: ceiling + 1 }, (_, n) => n);

  const noRate = ratePerReport === null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
      <label className="block">
        <span className="block text-sm font-medium text-slate-900">
          How many GREATNESS Reports did you complete this week?
        </span>

        <div className="mt-2 flex flex-wrap items-center gap-3">
          <select
            value={value}
            disabled={noRate}
            onChange={(e) => setValue(Number(e.target.value))}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
            aria-label="Number of GREATNESS Reports completed this week"
          >
            {options.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>

          <ActionButton
            status={action.status}
            variant="secondary"
            size="sm"
            errorMessage={action.errorMessage}
            labels={labels}
            onClick={() =>
              void action.run(async () => {
                const result = await setGreatnessReportsAction(weekStart, value);
                if (result && "error" in result && result.error) {
                  throw new Error(result.error);
                }
                return { success: true };
              })
            }
          />

          {ratePerReport !== null ? (
            <span className="text-sm text-slate-600">
              {value === claimed ? (
                <>
                  <span className="font-semibold text-slate-900">{money(gross)}</span> at{" "}
                  {money(ratePerReport)} each
                </>
              ) : (
                <>
                  Save to add{" "}
                  <span className="font-semibold text-slate-900">
                    {money(value * ratePerReport)}
                  </span>{" "}
                  to your week
                </>
              )}
            </span>
          ) : null}
        </div>
      </label>

      {/*
        * WHERE THE CEILING CAME FROM.
        *
        * Two different rules can produce it and they need different actions
        * from her, so the sentence names which one bit. "You taught 8 children"
        * is nothing to fix; "you have already claimed 6 this month" means wait
        * for next month.
        */}
      {noRate ? (
        <p className="mt-2 text-sm text-amber-800">
          There is no GREATNESS Report rate set up yet, so this cannot be claimed. Tell Jimmy.
        </p>
      ) : (
        <p className="mt-2 text-xs text-slate-500">
          One report per child per month, at {money(ratePerReport)} each. You taught{" "}
          {distinctChildren} {distinctChildren === 1 ? "child" : "different children"} this week
          {claimedElsewhereThisMonth > 0 ? (
            <>
              , and have already claimed {claimedElsewhereThisMonth} this month — so you can add
              up to {ceiling} here.
            </>
          ) : (
            <>, so you can claim up to {ceiling} this week.</>
          )}
        </p>
      )}
    </div>
  );
}
