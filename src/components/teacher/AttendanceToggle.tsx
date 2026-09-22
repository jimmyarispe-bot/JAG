"use client";

import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";
import { setAttendanceAction } from "@/lib/finance/teacher-week-actions";

/**
 * Was this child in the class.
 *
 * THE LABEL IS THE STATE, NOT THE ACTION - the same rule as the taught/not
 * taught button beside it. It says what is currently recorded; clicking
 * changes it.
 *
 * HERE IS THE DEFAULT. No attendance row means the child was there. A teacher
 * who never opens a class has said nothing, and saying nothing must mean the
 * ordinary thing happened. Marking somebody absent is a deliberate act.
 *
 * ATTENDANCE HAS NEVER BEEN RECORDED IN JAG - zero rows since migration 082
 * shipped, against 1,025 classes taught. This button is the first thing that
 * writes one.
 */
export function AttendanceToggle({
  sessionId,
  studentId,
  studentName,
  present,
  disabled,
}: {
  sessionId: string;
  studentId: string;
  studentName: string;
  present: boolean;
  disabled: boolean;
}) {
  const labels = present
    ? { idle: "Here", loading: "Saving…", success: "✓" }
    : { idle: "Absent", loading: "Saving…", success: "✓" };

  const action = useActionFeedback({
    verb: "custom",
    labels,
    successToast: present
      ? `${studentName || "That child"} marked absent.`
      : `${studentName || "That child"} marked here.`,
    errorToast: `Could not change attendance for ${studentName || "that child"}.`,
    progressLabel: "Saving…",
  });

  if (disabled) {
    return (
      <span
        className={
          present
            ? "rounded-lg bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700"
            : "rounded-lg bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700"
        }
      >
        {present ? "Here" : "Absent"}
      </span>
    );
  }

  return (
    <ActionButton
      status={action.status}
      variant={present ? "secondary" : "primary"}
      size="xs"
      errorMessage={action.errorMessage}
      labels={labels}
      onClick={() =>
        void action.run(async () => {
          const result = await setAttendanceAction(sessionId, studentId, !present);
          if (result && "error" in result && result.error) throw new Error(result.error);
          return { success: true };
        })
      }
    />
  );
}
