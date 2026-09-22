"use client";

import { useState } from "react";
import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";
import { submitWeekAction } from "@/lib/finance/teacher-week-actions";

/**
 * One Submit, and the week is closed.
 *
 * The amount shown on the button is the amount that gets frozen. A teacher
 * should never press this and then find out what they agreed to afterwards.
 *
 * THE BOX ABOVE IT IS THE LAST WORD SHE GETS.
 *
 * Jimmy, 22 September: "Is there anything cooky Jimmy needs to know about that
 * happened this week?" It sits ABOVE the button rather than behind a link,
 * because a teacher who has just been told a class showed no students, or that
 * she covered for somebody, needs somewhere obvious to say so - and by the time
 * she has pressed Submit the week is frozen and the moment has passed.
 *
 * OPTIONAL. A required box teaches people to type "n/a" and then nobody reads
 * it. Blank means she had nothing to say, which is most weeks.
 */
export function SubmitWeekButton({
  weekStart,
  gross,
  classes,
}: {
  weekStart: string;
  gross: number;
  classes: number;
}) {
  const [note, setNote] = useState("");
  const money = gross.toLocaleString("en-US", { style: "currency", currency: "USD" });
  const labels = {
    idle: `Submit this week — ${money}`,
    loading: "Submitting…",
    success: "✓ Submitted",
  };

  const action = useActionFeedback({
    verb: "custom",
    labels,
    successToast: `Week submitted: ${classes} classes, ${money}. This figure is now fixed.`,
    errorToast: "Could not submit this week.",
    progressLabel: "Submitting…",
  });

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-slate-700">
          Is there anything cooky Jimmy needs to know about that happened this week?
        </span>
        <textarea
          name="teacher_note"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional. Anything odd, anything you had to work around, anything that does not look right above."
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
        />
        <span className="mt-1 block text-xs text-slate-400">
          This goes to Jimmy with your week. Leave it empty if there is nothing.
        </span>
      </label>

      <ActionButton
        status={action.status}
        variant="primary"
        size="sm"
        errorMessage={action.errorMessage}
        labels={labels}
        onClick={() =>
          void action.run(async () => {
            const result = await submitWeekAction(weekStart, note);
            if (result && "error" in result && result.error) throw new Error(result.error);
            return { success: true };
          })
        }
      />
    </div>
  );
}
