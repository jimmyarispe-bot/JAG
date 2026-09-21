"use client";

import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";
import { setClassHeldAction } from "@/lib/finance/teacher-week-actions";

/**
 * Held, or not held.
 *
 * The default is HELD, because the default is that a class happened and the
 * teacher is paid for it. Marking it not held is the exception, and it is what
 * removes the class from the week's pay - so the label says which way round it
 * is rather than leaving the teacher to work it out from a colour.
 */
export function ClassHeldToggle({
  sessionId,
  held,
  courseName,
  disabled,
}: {
  sessionId: string;
  held: boolean;
  courseName: string;
  disabled: boolean;
}) {
  const labels = held
    ? { idle: "Held", loading: "Saving…", success: "✓ Saved" }
    : { idle: "Not held", loading: "Saving…", success: "✓ Saved" };

  const action = useActionFeedback({
    verb: "custom",
    labels,
    successToast: held
      ? `${courseName} marked NOT held. It will not be paid this week.`
      : `${courseName} marked held. It is back in this week's pay.`,
    errorToast: `Could not change ${courseName}.`,
    progressLabel: "Saving…",
  });

  if (disabled) {
    return (
      <span
        className={
          held
            ? "rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
            : "rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500"
        }
      >
        {held ? "Held" : "Not held"}
      </span>
    );
  }

  return (
    <ActionButton
      status={action.status}
      variant={held ? "secondary" : "primary"}
      size="xs"
      errorMessage={action.errorMessage}
      labels={labels}
      onClick={() =>
        void action.run(async () => {
          const result = await setClassHeldAction(sessionId, !held);
          if (result && "error" in result && result.error) throw new Error(result.error);
          return { success: true };
        })
      }
    />
  );
}
