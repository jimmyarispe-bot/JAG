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
  archiveCommunicationAction,
  deleteCommunicationAction,
  duplicateCommunicationAction,
  restoreCommunicationAction,
} from "@/lib/communications/actions";

interface CommunicationLifecycleActionsProps {
  communicationId: string;
  status: string;
  subject: string | null;
  auditId: string;
  variant?: "header" | "menu";
}

export function CommunicationLifecycleActions({
  communicationId,
  status,
  subject,
  auditId,
  variant = "header",
}: CommunicationLifecycleActionsProps) {
  const router = useRouter();
  const toast = useToast();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const isArchived = status === "archived";

  const archiveFeedback = useActionFeedback({
    verb: "save",
    labels: { idle: "Archive", loading: "Archiving…", success: "✓ Archived" },
    successToast: "Communication archived.",
    errorToast: "Unable to archive.",
  });

  const restoreFeedback = useActionFeedback({
    verb: "save",
    labels: { idle: "Restore", loading: "Restoring…", success: "✓ Restored" },
    successToast: "Communication restored.",
    errorToast: "Unable to restore.",
  });

  function runArchive() {
    void archiveFeedback.run(async () => {
      const result = await archiveCommunicationAction(communicationId);
      if ("error" in result && result.error) throw new Error(result.error);
      router.refresh();
      return result;
    });
  }

  function runRestore() {
    void restoreFeedback.run(async () => {
      const result = await restoreCommunicationAction(communicationId);
      if ("error" in result && result.error) throw new Error(result.error);
      router.refresh();
      return result;
    });
  }

  function runDuplicate() {
    void (async () => {
      const result = await duplicateCommunicationAction(communicationId);
      if ("error" in result && result.error) {
        toast.error("Unable to duplicate.", result.error);
        return;
      }
      if ("communicationId" in result && result.communicationId) {
        toast.success("Communication duplicated.");
        router.push(`/dashboard/communications/${result.communicationId}`);
      }
      router.refresh();
    })();
  }

  const loadContext = useCallback(async () => {
    const canDelete = status === "draft" || status === "failed";
    const context: DeleteContext = {
      entityKey: "communication",
      entityId: communicationId,
      displayName: subject || "(no subject)",
      fields: [
        { label: "Audit ID", value: auditId },
        { label: "Status", value: status },
      ],
      dependencies: {
        entityId: communicationId,
        blocking: canDelete
          ? []
          : [{ key: "sent", label: "Delivery history", count: 1 }],
        informational: [],
        canDelete,
      },
      suggestArchive: !canDelete,
    };
    return { ok: true as const, context };
  }, [auditId, communicationId, status, subject]);

  useEntityShortcuts(
    {
      onDuplicate: runDuplicate,
      onDelete: () => setDeleteOpen(true),
      onCancel: () => setDeleteOpen(false),
    },
    variant === "header"
  );

  const pending = archiveFeedback.isBusy || restoreFeedback.isBusy;

  const deleteDialog = (
    <DestructiveConfirmDialog
      open={deleteOpen}
      title="Delete Communication"
      entityLabel="Communication"
      loadContext={loadContext}
      onClose={() => setDeleteOpen(false)}
      archiveLabel="Archive Communication"
      deleteLabel="Delete Communication"
      onArchiveInstead={async (_ctx) => {
        const result = await archiveCommunicationAction(communicationId);
        if ("error" in result && result.error) return { ok: false, error: result.error };
        toast.success("Communication archived.");
        router.refresh();
        return { ok: true };
      }}
      onConfirmDelete={async ({ confirmationText, acknowledged }) => {
        const result = await deleteCommunicationAction({
          communicationId,
          confirmationText,
          acknowledged,
        });
        if (!result.ok) return { ok: false, error: result.error };
        toast.success("Communication deleted.");
        router.push("/dashboard/communications");
        router.refresh();
        return { ok: true };
      }}
    />
  );

  const menuActions = [
    {
      id: "duplicate",
      label: "Duplicate",
      onSelect: runDuplicate,
      shortcut: "Ctrl+D",
    },
    isArchived
      ? { id: "restore", label: "Restore", onSelect: runRestore, disabled: pending }
      : { id: "archive", label: "Archive", onSelect: runArchive, disabled: pending },
    {
      id: "delete",
      label: "Delete",
      tone: "danger" as const,
      onSelect: () => setDeleteOpen(true),
      shortcut: "Del",
    },
  ];

  if (variant === "menu") {
    return (
      <>
        <EntityActionMenu ariaLabel="Communication actions" actions={menuActions} />
        {deleteDialog}
      </>
    );
  }

  return (
    <>
      <EntityActionToolbar
        actions={[
          {
            id: "duplicate",
            label: "Duplicate",
            tone: "secondary",
            onClick: runDuplicate,
          },
          isArchived
            ? {
                id: "restore",
                label: "Restore",
                tone: "secondary",
                onClick: runRestore,
                disabled: pending,
              }
            : {
                id: "archive",
                label: "Archive",
                tone: "secondary",
                onClick: runArchive,
                disabled: pending,
              },
          {
            id: "delete",
            label: "Delete",
            tone: "danger",
            onClick: () => setDeleteOpen(true),
          },
        ]}
      />
      {deleteDialog}
    </>
  );
}
