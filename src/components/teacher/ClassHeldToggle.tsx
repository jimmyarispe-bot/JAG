"use client";

import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";
import { setClassHeldAction } from "@/lib/finance/teacher-week-actions";

/**
 * Taught it, or did not teach it.
 *
 * THE LABEL IS THE STATE, NOT THE ACTION. It says what is currently recorded
 * about the class; clicking changes it. A button labelled with what would
 * happen next reads as an instruction, and a teacher confirming a week needs to
 * see what she is confirming.
 *
 * "Taught class" and "Did not teach class" rather than "Held" and "Not held" -
 * 21 September 2026, Jimmy's wording. Held is scheduling language. The person
 * reading this is being paid for teaching, and the question she is actually
 * being asked is whether she taught it.
 *
 * The default is TAUGHT, because the default is that a class happened and the
 * teacher is paid for it. Saying she did not teach it is the exception, and it
 * is what removes the class from the week's pay - so the label says which way
 * round it is rather than leaving her to work it out from a colour.
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
    ? { idle: "Taught class", loading: "Saving…", success: "✓ Saved" }
    : { idle: "Did not teach class", loading: "Saving…", success: "✓ Saved" };

  const action = useActionFeedback({
    verb: "custom",
    labels,
    successToast: held
      ? `${courseName} marked as NOT taught. It will not be paid this week.`
      : `${courseName} marked as taught. It is back in this week's pay.`,
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
        {held ? "Taught class" : "Did not teach class"}
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
