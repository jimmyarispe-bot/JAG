"use client";

import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";
import { submitWeekAction } from "@/lib/finance/teacher-week-actions";

/**
 * One Submit, and the week is closed.
 *
 * The amount shown on the button is the amount that gets frozen. A teacher
 * should never press this and then find out what they agreed to afterwards.
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
    <ActionButton
      status={action.status}
      variant="primary"
      size="sm"
      errorMessage={action.errorMessage}
      labels={labels}
      onClick={() =>
        void action.run(async () => {
          const result = await submitWeekAction(weekStart);
          if (result && "error" in result && result.error) throw new Error(result.error);
          return { success: true };
        })
      }
    />
  );
}
