"use client";

import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";
import { convertLeadToStudentAction } from "@/lib/admissions/handoff/actions";

/**
 * Put one accepted family on the student roster.
 *
 * DELIBERATELY LESS THAN THE ENROLLMENT HANDOFF. This creates the student,
 * family, guardian and enrolment, and records the conversion. It does not
 * activate, does not create a tuition plan, does not bill, and does not invite
 * the parent to the portal. The labels say so, because a button that reads
 * "Enroll" while doing none of the money is the same silent lie this platform
 * keeps getting caught by.
 */
export function ConvertLeadButton({
  leadId,
  mode,
  studentName,
}: {
  leadId: string;
  /** "link" ties the lead to a student already on the roster; "create" makes one. */
  mode: "link" | "create";
  studentName: string;
}) {
  const labels =
    mode === "link"
      ? { idle: "Link to student", loading: "Linking…", success: "✓ Linked" }
      : { idle: "Create student", loading: "Creating…", success: "✓ Created" };

  const action = useActionFeedback({
    verb: "custom",
    labels,
    successToast:
      mode === "link"
        ? `${studentName} is now linked to their admissions record. Not activated, not billed.`
        : `${studentName} is on the student roster. Not activated, not billed - tuition is still manual.`,
    errorToast: `Could not convert ${studentName}.`,
    progressLabel: mode === "link" ? "Linking…" : "Creating the student…",
  });

  return (
    <ActionButton
      status={action.status}
      variant={mode === "link" ? "secondary" : "primary"}
      size="xs"
      errorMessage={action.errorMessage}
      labels={labels}
      onClick={() =>
        void action.run(async () => {
          const result = await convertLeadToStudentAction(leadId);
          if (result && "error" in result && result.error) throw new Error(result.error);
          return { success: true };
        })
      }
    />
  );
}
