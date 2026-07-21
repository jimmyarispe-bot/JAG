"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/experience-system/feedback";
import {
  EntityActionMenu,
  EntityActionToolbar,
  useEntityShortcuts,
} from "@/components/platform/crud";
import {
  LifecycleConfirmationModal,
  type LifecycleConfirmAction,
} from "@/components/platform/modals";
import {
  archiveStudentAction,
  deleteStudentAction,
  restoreStudentAction,
} from "@/lib/students/lifecycle/actions";

interface StudentLifecycleActionsProps {
  studentId: string;
  isArchived: boolean;
  variant?: "header" | "menu";
  editHref?: string;
  historyHref?: string;
}

export function StudentLifecycleActions({
  studentId,
  isArchived,
  variant = "header",
  editHref,
  historyHref,
}: StudentLifecycleActionsProps) {
  const router = useRouter();
  const toast = useToast();
  const [modal, setModal] = useState<LifecycleConfirmAction | null>(null);

  useEntityShortcuts(
    {
      onEdit: editHref ? () => router.push(editHref) : undefined,
      onDelete: () => setModal("delete"),
      onCancel: () => setModal(null),
    },
    variant === "header"
  );

  const modals = (
    <>
      <LifecycleConfirmationModal
        open={modal === "archive"}
        action="archive"
        entityLabel="Student"
        onClose={() => setModal(null)}
        onConfirm={async () => {
          const result = await archiveStudentAction({ studentId });
          if (!result.ok) return { ok: false, error: result.error };
          toast.success("Student archived.");
          router.refresh();
          return { ok: true };
        }}
      />
      <LifecycleConfirmationModal
        open={modal === "restore"}
        action="restore"
        entityLabel="Student"
        onClose={() => setModal(null)}
        onConfirm={async () => {
          const result = await restoreStudentAction({ studentId });
          if (!result.ok) return { ok: false, error: result.error };
          toast.success("Student restored.");
          router.refresh();
          return { ok: true };
        }}
      />
      <LifecycleConfirmationModal
        open={modal === "delete"}
        action="delete"
        entityLabel="Student"
        onClose={() => setModal(null)}
        onConfirmDelete={async ({ confirmationText, acknowledged }) => {
          const result = await deleteStudentAction({
            studentId,
            confirmationText,
            acknowledged,
          });
          if (!result.ok) {
            return { ok: false, error: result.error, code: result.code };
          }
          toast.success("Student deleted.");
          router.push("/dashboard/students?view=students");
          router.refresh();
          return { ok: true };
        }}
      />
    </>
  );

  if (variant === "menu") {
    return (
      <>
        <EntityActionMenu
          ariaLabel="Student actions"
          actions={[
            isArchived
              ? {
                  id: "restore",
                  label: "Restore",
                  onSelect: () => setModal("restore"),
                }
              : {
                  id: "archive",
                  label: "Archive",
                  onSelect: () => setModal("archive"),
                },
            {
              id: "delete",
              label: "Delete",
              tone: "danger",
              onSelect: () => setModal("delete"),
              shortcut: "Del",
            },
          ]}
        />
        {modals}
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
          isArchived
            ? {
                id: "restore",
                label: "Restore",
                tone: "secondary" as const,
                onClick: () => setModal("restore"),
              }
            : {
                id: "archive",
                label: "Archive",
                tone: "secondary" as const,
                onClick: () => setModal("archive"),
              },
          {
            id: "delete",
            label: "Delete",
            tone: "danger" as const,
            onClick: () => setModal("delete"),
          },
        ]}
      />
      {modals}
    </>
  );
}
