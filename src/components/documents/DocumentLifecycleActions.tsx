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
  archiveDocumentAction,
  deleteDocumentAction,
  restoreDocumentAction,
} from "@/lib/documents/server-actions";

interface DocumentLifecycleActionsProps {
  documentId: string;
  title: string;
  status: string;
  auditId: string;
  policyLocked?: boolean;
  variant?: "header" | "menu";
}

export function DocumentLifecycleActions({
  documentId,
  title,
  status,
  auditId,
  policyLocked = false,
  variant = "header",
}: DocumentLifecycleActionsProps) {
  const router = useRouter();
  const toast = useToast();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const isArchived = status === "archived";

  const archiveFeedback = useActionFeedback({
    verb: "save",
    labels: { idle: "Archive", loading: "Archiving…", success: "✓ Archived" },
    successToast: "Document archived.",
    errorToast: "Unable to archive.",
  });

  const restoreFeedback = useActionFeedback({
    verb: "save",
    labels: { idle: "Restore", loading: "Restoring…", success: "✓ Restored" },
    successToast: "Document restored.",
    errorToast: "Unable to restore.",
  });

  function runArchive() {
    void archiveFeedback.run(async () => {
      const result = await archiveDocumentAction(documentId);
      if ("error" in result && result.error) throw new Error(result.error);
      router.refresh();
      return result;
    });
  }

  function runRestore() {
    void restoreFeedback.run(async () => {
      const result = await restoreDocumentAction(documentId);
      if ("error" in result && result.error) throw new Error(result.error);
      router.refresh();
      return result;
    });
  }

  const loadContext = useCallback(async () => {
    const canDelete = !policyLocked;
    const context: DeleteContext = {
      entityKey: "document",
      entityId: documentId,
      displayName: title,
      fields: [
        { label: "Audit ID", value: auditId },
        { label: "Status", value: status },
        { label: "Policy locked", value: policyLocked ? "Yes" : "No" },
      ],
      dependencies: {
        entityId: documentId,
        blocking: canDelete
          ? []
          : [{ key: "policy", label: "Retention / policy lock", count: 1 }],
        informational: [],
        canDelete,
      },
      suggestArchive: !canDelete,
    };
    return { ok: true as const, context };
  }, [auditId, documentId, policyLocked, status, title]);

  useEntityShortcuts(
    {
      onDelete: () => setDeleteOpen(true),
      onCancel: () => setDeleteOpen(false),
    },
    variant === "header"
  );

  const pending = archiveFeedback.isBusy || restoreFeedback.isBusy;

  const deleteDialog = (
    <DestructiveConfirmDialog
      open={deleteOpen}
      title="Delete Document"
      entityLabel="Document"
      loadContext={loadContext}
      onClose={() => setDeleteOpen(false)}
      archiveLabel="Archive Document"
      deleteLabel="Delete Document"
      onArchiveInstead={async () => {
        const result = await archiveDocumentAction(documentId);
        if ("error" in result && result.error) return { ok: false, error: result.error };
        toast.success("Document archived.");
        router.refresh();
        return { ok: true };
      }}
      onConfirmDelete={async ({ confirmationText, acknowledged }) => {
        const result = await deleteDocumentAction({
          documentId,
          confirmationText,
          acknowledged,
        });
        if ("error" in result && result.error) {
          return { ok: false, error: result.error };
        }
        toast.success("Document deleted.");
        router.push("/dashboard/documents");
        router.refresh();
        return { ok: true };
      }}
    />
  );

  const menuActions = [
    isArchived
      ? { id: "restore", label: "Restore", onSelect: runRestore, disabled: pending }
      : { id: "archive", label: "Archive", onSelect: runArchive, disabled: pending },
    {
      id: "history",
      label: "History",
      onSelect: () => router.push(`/dashboard/documents/${documentId}?tab=history`),
    },
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
        <EntityActionMenu ariaLabel={`Actions for ${title}`} actions={menuActions} />
        {deleteDialog}
      </>
    );
  }

  return (
    <>
      <EntityActionToolbar
        actions={[
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
