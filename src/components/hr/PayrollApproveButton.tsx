"use client";

import { approvePayrollRecordAction } from "@/lib/hr/actions";
import { ActionButton, useActionFeedback } from "@/components/experience-system/feedback";
import { assertActionResult } from "@/components/experience-system/feedback/runMutation";

export function PayrollApproveButton({ payrollId }: { payrollId: string }) {
  const action = useActionFeedback({
    verb: "approve",
    labels: { idle: "Approve & allocate", loading: "Approving…", success: "✓ Approved" },
    successToast: "✓ Payroll approved and allocated.",
    errorToast: "Unable to approve payroll.",
    progressLabel: "Approving payroll…",
  });

  return (
    <ActionButton
      type="button"
      status={action.status}
      verb="approve"
      variant="success"
      size="xs"
      labels={{ idle: "Approve & allocate", loading: "Approving…", success: "✓ Approved" }}
      errorMessage={action.errorMessage}
      onClick={() => {
        void action.run(async () => {
          const fd = new FormData();
          fd.set("payroll_id", payrollId);
          const result = await approvePayrollRecordAction(fd);
          assertActionResult(result);
          return result;
        });
      }}
    />
  );
}
