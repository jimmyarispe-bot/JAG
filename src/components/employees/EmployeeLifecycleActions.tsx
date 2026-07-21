"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useActionFeedback } from "@/components/experience-system/feedback";
import { ConfirmDialog } from "@/components/experience-system/interaction";
import {
  EntityActionMenu,
  EntityActionToolbar,
  useEntityShortcuts,
} from "@/components/platform/crud";
import {
  deactivateEmployeeAction,
  restoreEmployeeAction,
} from "@/lib/employees/lifecycle/actions";

interface EmployeeLifecycleActionsProps {
  employeeId: string;
  employmentStatus: string;
  variant?: "header" | "menu";
  historyHref?: string;
  editHref?: string;
}

export function EmployeeLifecycleActions({
  employeeId,
  employmentStatus,
  variant = "header",
  historyHref,
  editHref,
}: EmployeeLifecycleActionsProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isActive = employmentStatus === "active";

  const deactivateFeedback = useActionFeedback({
    verb: "save",
    labels: { idle: "Deactivate", loading: "Deactivating…", success: "✓ Deactivated" },
    successToast: "Employee deactivated.",
    errorToast: "Unable to deactivate employee.",
  });

  const restoreFeedback = useActionFeedback({
    verb: "save",
    labels: { idle: "Restore", loading: "Restoring…", success: "✓ Restored" },
    successToast: "Employee restored.",
    errorToast: "Unable to restore employee.",
  });

  function runDeactivate() {
    void deactivateFeedback.run(async () => {
      const result = await deactivateEmployeeAction({
        employeeId,
        status: "inactive",
      });
      if (!result.ok) throw new Error(result.error);
      setConfirmOpen(false);
      router.refresh();
      return result;
    });
  }

  function runRestore() {
    void restoreFeedback.run(async () => {
      const result = await restoreEmployeeAction({ employeeId });
      if (!result.ok) throw new Error(result.error);
      router.refresh();
      return result;
    });
  }

  useEntityShortcuts(
    {
      onEdit: editHref ? () => router.push(editHref) : undefined,
      onDelete: isActive ? () => setConfirmOpen(true) : undefined,
      onCancel: () => setConfirmOpen(false),
    },
    variant === "header"
  );

  const pending = deactivateFeedback.isBusy || restoreFeedback.isBusy;

  const confirm = (
    <ConfirmDialog
      open={confirmOpen}
      title="Deactivate employee"
      message="This sets the employee to inactive. Payroll and history are retained. Continue?"
      confirmLabel="Deactivate"
      tone="danger"
      onCancel={() => setConfirmOpen(false)}
      onConfirm={runDeactivate}
    />
  );

  if (variant === "menu") {
    return (
      <>
        <EntityActionMenu
          ariaLabel="Employee actions"
          actions={[
            isActive
              ? {
                  id: "deactivate",
                  label: "Deactivate",
                  tone: "danger",
                  onSelect: () => setConfirmOpen(true),
                  disabled: pending,
                }
              : {
                  id: "restore",
                  label: "Restore",
                  onSelect: runRestore,
                  disabled: pending,
                },
          ]}
        />
        {confirm}
      </>
    );
  }

  return (
    <>
      <EntityActionToolbar
        historyHref={historyHref}
        actions={[
          ...(editHref
            ? [{ id: "edit", label: "Edit", href: editHref, tone: "primary" as const }]
            : []),
          isActive
            ? {
                id: "deactivate",
                label: "Deactivate",
                tone: "danger" as const,
                onClick: () => setConfirmOpen(true),
                disabled: pending,
              }
            : {
                id: "restore",
                label: "Restore",
                tone: "secondary" as const,
                onClick: runRestore,
                disabled: pending,
              },
        ]}
      />
      {confirm}
    </>
  );
}
