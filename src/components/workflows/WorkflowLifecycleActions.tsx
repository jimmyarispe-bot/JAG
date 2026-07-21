"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/experience-system/feedback";
import {
  DestructiveConfirmDialog,
  EntityActionMenu,
  EntityActionToolbar,
  useEntityShortcuts,
} from "@/components/platform/crud";
import type { DeleteContext } from "@/lib/platform/crud";
import {
  archiveWorkflowAction,
  deleteWorkflowAction,
  duplicateWorkflowAction,
  getWorkflowDeleteContextAction,
  restoreWorkflowAction,
  setWorkflowEnabledAction,
} from "@/lib/workflows/server-actions";

interface WorkflowLifecycleActionsProps {
  workflowId: string;
  enabled: boolean;
  status: string;
  variant?: "header" | "menu";
}

export function WorkflowLifecycleActions({
  workflowId,
  enabled,
  status,
  variant = "header",
}: WorkflowLifecycleActionsProps) {
  const router = useRouter();
  const toast = useToast();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const isArchived = status === "archived";

  async function run(action: () => Promise<unknown>, success: string) {
    setPending(true);
    try {
      const result = (await action()) as { error?: string; ok?: boolean };
      if (result && "error" in result && result.error) {
        toast.error("Action failed", result.error);
        return;
      }
      toast.success(success);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  const loadContext = useCallback(async () => {
    const result = await getWorkflowDeleteContextAction(workflowId);
    if (!result.ok) return { ok: false as const, error: result.error };
    return { ok: true as const, context: result.context as DeleteContext };
  }, [workflowId]);

  useEntityShortcuts(
    {
      onEdit: () => router.push(`/dashboard/workflows/${workflowId}`),
      onDuplicate: () =>
        void run(() => duplicateWorkflowAction(workflowId), "Workflow duplicated."),
      onDelete: () => setDeleteOpen(true),
      onCancel: () => setDeleteOpen(false),
    },
    variant === "header"
  );

  const deleteDialog = (
    <DestructiveConfirmDialog
      open={deleteOpen}
      title="Delete Workflow"
      entityLabel="Workflow"
      loadContext={loadContext}
      onClose={() => setDeleteOpen(false)}
      archiveLabel="Archive Workflow"
      deleteLabel="Delete Workflow"
      onArchiveInstead={async () => {
        const result = await archiveWorkflowAction(workflowId);
        if ("error" in result && result.error) return { ok: false, error: result.error };
        toast.success("Workflow archived.");
        router.refresh();
        return { ok: true };
      }}
      onConfirmDelete={async ({ confirmationText, acknowledged }) => {
        const result = await deleteWorkflowAction({
          workflowId,
          confirmationText,
          acknowledged,
        });
        if (!result.ok) return { ok: false, error: result.error };
        toast.success("Workflow deleted.");
        router.push("/dashboard/workflows");
        router.refresh();
        return { ok: true };
      }}
    />
  );

  const menuActions = [
    {
      id: "edit",
      label: "Edit",
      onSelect: () => router.push(`/dashboard/workflows/${workflowId}`),
      shortcut: "E",
    },
    {
      id: "history",
      label: "Execution history",
      onSelect: () => router.push(`/dashboard/workflows/history?workflowId=${workflowId}`),
    },
    !isArchived
      ? {
          id: "toggle",
          label: enabled ? "Disable" : "Enable",
          onSelect: () =>
            void run(
              () => setWorkflowEnabledAction(workflowId, !enabled),
              enabled ? "Workflow disabled." : "Workflow enabled."
            ),
          disabled: pending,
        }
      : null,
    {
      id: "duplicate",
      label: "Duplicate",
      onSelect: () =>
        void run(() => duplicateWorkflowAction(workflowId), "Workflow duplicated."),
      shortcut: "Ctrl+D",
      disabled: pending,
    },
    isArchived
      ? {
          id: "restore",
          label: "Restore",
          onSelect: () =>
            void run(() => restoreWorkflowAction(workflowId), "Workflow restored."),
          disabled: pending,
        }
      : {
          id: "archive",
          label: "Archive",
          onSelect: () =>
            void run(() => archiveWorkflowAction(workflowId), "Workflow archived."),
          disabled: pending,
        },
    {
      id: "delete",
      label: "Delete",
      tone: "danger" as const,
      onSelect: () => setDeleteOpen(true),
      shortcut: "Del",
    },
  ].filter(Boolean) as Array<{
    id: string;
    label: string;
    onSelect: () => void;
    tone?: "danger";
    shortcut?: string;
    disabled?: boolean;
  }>;

  if (variant === "menu") {
    return (
      <>
        <EntityActionMenu ariaLabel="Workflow actions" actions={menuActions} />
        {deleteDialog}
      </>
    );
  }

  return (
    <>
      <EntityActionToolbar
        historyHref={`/dashboard/workflows/history?workflowId=${workflowId}`}
        actions={[
          {
            id: "edit",
            label: "Edit",
            href: `/dashboard/workflows/${workflowId}`,
            tone: "primary",
          },
          !isArchived
            ? {
                id: "toggle",
                label: enabled ? "Disable" : "Enable",
                tone: "secondary",
                onClick: () =>
                  void run(
                    () => setWorkflowEnabledAction(workflowId, !enabled),
                    enabled ? "Workflow disabled." : "Workflow enabled."
                  ),
                disabled: pending,
              }
            : {
                id: "restore",
                label: "Restore",
                tone: "secondary",
                onClick: () =>
                  void run(() => restoreWorkflowAction(workflowId), "Workflow restored."),
                disabled: pending,
              },
          {
            id: "duplicate",
            label: "Duplicate",
            tone: "secondary",
            onClick: () =>
              void run(() => duplicateWorkflowAction(workflowId), "Workflow duplicated."),
            disabled: pending,
          },
          !isArchived
            ? {
                id: "archive",
                label: "Archive",
                tone: "secondary",
                onClick: () =>
                  void run(() => archiveWorkflowAction(workflowId), "Workflow archived."),
                disabled: pending,
              }
            : null,
          {
            id: "delete",
            label: "Delete",
            tone: "danger",
            onClick: () => setDeleteOpen(true),
          },
        ].filter(Boolean) as Array<{
          id: string;
          label: string;
          href?: string;
          onClick?: () => void;
          tone?: "primary" | "secondary" | "danger";
          disabled?: boolean;
        }>}
      />
      {deleteDialog}
    </>
  );
}
