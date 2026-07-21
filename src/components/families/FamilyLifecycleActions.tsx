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
  archiveFamilyAction,
  deleteFamilyAction,
  getFamilyDeleteContextAction,
  restoreFamilyAction,
} from "@/lib/families/lifecycle/actions";

interface FamilyLifecycleActionsProps {
  familyId: string;
  isArchived: boolean;
  variant?: "header" | "menu";
  editHref?: string;
  historyHref?: string;
}

export function FamilyLifecycleActions({
  familyId,
  isArchived,
  variant = "header",
  editHref,
  historyHref,
}: FamilyLifecycleActionsProps) {
  const router = useRouter();
  const toast = useToast();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const archiveFeedback = useActionFeedback({
    verb: "save",
    labels: { idle: "Archive", loading: "Archiving…", success: "✓ Archived" },
    successToast: "Family archived.",
    errorToast: "Unable to archive family.",
  });

  const restoreFeedback = useActionFeedback({
    verb: "save",
    labels: { idle: "Restore", loading: "Restoring…", success: "✓ Restored" },
    successToast: "Family restored.",
    errorToast: "Unable to restore family.",
  });

  function runArchive() {
    void archiveFeedback.run(async () => {
      const result = await archiveFamilyAction({ familyId });
      if (!result.ok) throw new Error(result.error);
      router.refresh();
      return result;
    });
  }

  function runRestore() {
    void restoreFeedback.run(async () => {
      const result = await restoreFamilyAction({ familyId });
      if (!result.ok) throw new Error(result.error);
      router.refresh();
      return result;
    });
  }

  const loadContext = useCallback(async () => {
    const result = await getFamilyDeleteContextAction(familyId);
    if (!result.ok) return { ok: false as const, error: result.error };
    const context: DeleteContext = {
      entityKey: "family",
      entityId: result.family.id,
      displayName: result.family.name,
      fields: [
        { label: "School", value: result.family.schoolName ?? "—" },
        { label: "Status", value: result.family.status ?? "—" },
      ],
      dependencies: {
        entityId: familyId,
        blocking: result.dependencies.blocking,
        informational: [],
        canDelete: result.dependencies.canDelete,
      },
      suggestArchive: !result.dependencies.canDelete,
    };
    return { ok: true as const, context };
  }, [familyId]);

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
      title="Delete Family"
      entityLabel="Family"
      loadContext={loadContext}
      onClose={() => setDeleteOpen(false)}
      archiveLabel="Archive Family"
      deleteLabel="Delete Family"
      onArchiveInstead={async (_ctx) => {
        const result = await archiveFamilyAction({ familyId });
        if (!result.ok) return { ok: false, error: result.error };
        toast.success("Family archived.");
        router.refresh();
        return { ok: true };
      }}
      onConfirmDelete={async ({ confirmationText, acknowledged }) => {
        const result = await deleteFamilyAction({
          familyId,
          confirmationText,
          acknowledged,
        });
        if (!result.ok) return { ok: false, error: result.error, code: result.code };
        toast.success("Family deleted.");
        router.push("/dashboard/families");
        router.refresh();
        return { ok: true };
      }}
    />
  );

  if (variant === "menu") {
    return (
      <>
        <EntityActionMenu
          ariaLabel="Family actions"
          actions={[
            isArchived
              ? { id: "restore", label: "Restore", onSelect: runRestore, disabled: pending }
              : { id: "archive", label: "Archive", onSelect: runArchive, disabled: pending },
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
