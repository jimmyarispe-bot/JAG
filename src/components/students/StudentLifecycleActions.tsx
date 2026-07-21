"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useActionFeedback, useToast } from "@/components/experience-system/feedback";
import {
  DestructiveConfirmDialog,
  EntityActionMenu,
  EntityActionToolbar,
  useEntityShortcuts,
} from "@/components/platform/crud";
import type { DeleteContext } from "@/lib/platform/crud";
import {
  archiveStudentAction,
  deleteStudentAction,
  getStudentDeleteContextAction,
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
  const [deleteOpen, setDeleteOpen] = useState(false);

  const archiveFeedback = useActionFeedback({
    verb: "save",
    labels: { idle: "Archive", loading: "Archiving…", success: "✓ Archived" },
    successToast: "Student archived.",
    errorToast: "Unable to archive student.",
  });

  const restoreFeedback = useActionFeedback({
    verb: "save",
    labels: { idle: "Restore", loading: "Restoring…", success: "✓ Restored" },
    successToast: "Student restored.",
    errorToast: "Unable to restore student.",
  });

  function runArchive() {
    void archiveFeedback.run(async () => {
      const result = await archiveStudentAction({ studentId });
      if (!result.ok) throw new Error(result.error);
      router.refresh();
      return result;
    });
  }

  function runRestore() {
    void restoreFeedback.run(async () => {
      const result = await restoreStudentAction({ studentId });
      if (!result.ok) throw new Error(result.error);
      router.refresh();
      return result;
    });
  }

  const loadContext = useCallback(async () => {
    const result = await getStudentDeleteContextAction(studentId);
    if (!result.ok) return { ok: false as const, error: result.error };
    const context: DeleteContext = {
      entityKey: "student",
      entityId: result.student.id,
      displayName: result.student.name,
      fields: [
        {
          label: "Student ID",
          value: result.student.studentNumber ?? result.student.id.slice(0, 8),
        },
        { label: "School", value: result.student.schoolName ?? "—" },
        { label: "Program", value: result.student.program ?? "—" },
        {
          label: "Status",
          value: result.student.status ?? result.student.enrollmentStatus ?? "—",
        },
      ],
      dependencies: {
        entityId: studentId,
        blocking: result.dependencies?.blocking ?? [],
        informational: result.dependencies?.informational ?? [],
        canDelete: result.dependencies?.canDelete ?? false,
      },
      suggestArchive: !(result.dependencies?.canDelete ?? false),
      notices: result.importOrigin
        ? [
            {
              title: "Imported from Job",
              body: `Import ID: ${result.importOrigin.jobId}. Deleting does not remove import history.`,
              tone: "warning",
            },
          ]
        : undefined,
    };
    return { ok: true as const, context };
  }, [studentId]);

  useEntityShortcuts(
    {
      onEdit: editHref ? () => router.push(editHref) : undefined,
      onDelete: () => setDeleteOpen(true),
      onCancel: () => setDeleteOpen(false),
    },
    variant === "header"
  );

  const pending = archiveFeedback.isBusy || restoreFeedback.isBusy;

  const deleteDialog = (
    <DestructiveConfirmDialog
      open={deleteOpen}
      title="Delete Student"
      entityLabel="Student"
      loadContext={loadContext}
      onClose={() => setDeleteOpen(false)}
      archiveLabel="Archive Student"
      deleteLabel="Delete Student"
      onArchiveInstead={async (ctx) => {
        // Use the verified UUID from delete-context load (never a display/student_number).
        const archiveId = ctx.entityId || studentId;
        const result = await archiveStudentAction({ studentId: archiveId });
        if (!result.ok) return { ok: false, error: result.error };
        toast.success("Student archived.");
        router.refresh();
        return { ok: true };
      }}
      onConfirmDelete={async ({ confirmationText, acknowledged }) => {
        const result = await deleteStudentAction({
          studentId,
          confirmationText,
          acknowledged,
        });
        if (!result.ok) return { ok: false, error: result.error, code: result.code };
        toast.success("Student deleted.");
        router.push("/dashboard/students?view=students");
        router.refresh();
        return { ok: true };
      }}
    />
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
                  onSelect: runRestore,
                  disabled: pending,
                }
              : {
                  id: "archive",
                  label: "Archive",
                  onSelect: runArchive,
                  disabled: pending,
                },
            {
              id: "delete",
              label: "Delete",
              tone: "danger",
              onSelect: () => setDeleteOpen(true),
              shortcut: "Del",
            },
          ]}
        />
        {deleteDialog}
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
                onClick: runRestore,
                disabled: pending,
              }
            : {
                id: "archive",
                label: "Archive",
                tone: "secondary" as const,
                onClick: runArchive,
                disabled: pending,
              },
          {
            id: "delete",
            label: "Delete",
            tone: "danger" as const,
            onClick: () => setDeleteOpen(true),
            disabled: pending,
          },
        ]}
      />
      {deleteDialog}
    </>
  );
}
