"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useActionFeedback, useToast } from "@/components/experience-system/feedback";
import {
  DestructiveConfirmDialog,
  EntityActionMenu,
} from "@/components/platform/crud";
import type { DeleteContext } from "@/lib/platform/crud";
import {
  archiveInvoiceAction,
  deleteInvoiceAction,
  duplicateInvoiceAction,
  voidInvoiceAction,
} from "@/lib/finance-platform/server-actions";

interface InvoiceLifecycleActionsProps {
  invoiceId: string;
  invoiceNumber: string;
  status: string;
  amountPaid: number;
  policyLocked?: boolean;
  auditId?: string;
}

export function InvoiceLifecycleActions({
  invoiceId,
  invoiceNumber,
  status,
  amountPaid,
  policyLocked = true,
  auditId,
}: InvoiceLifecycleActionsProps) {
  const router = useRouter();
  const toast = useToast();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const voidFeedback = useActionFeedback({
    verb: "save",
    labels: { idle: "Void", loading: "Voiding…", success: "✓ Voided" },
    successToast: "Invoice voided.",
    errorToast: "Unable to void invoice.",
  });

  const archiveFeedback = useActionFeedback({
    verb: "save",
    labels: { idle: "Archive", loading: "Archiving…", success: "✓ Archived" },
    successToast: "Invoice archived.",
    errorToast: "Unable to archive.",
  });

  function runVoid() {
    void voidFeedback.run(async () => {
      const result = await voidInvoiceAction(invoiceId, "Voided by staff");
      if ("error" in result && result.error) throw new Error(result.error);
      router.refresh();
      return result;
    });
  }

  function runArchive() {
    void archiveFeedback.run(async () => {
      const result = await archiveInvoiceAction(invoiceId);
      if ("error" in result && result.error) throw new Error(result.error);
      router.refresh();
      return result;
    });
  }

  function runDuplicate() {
    void (async () => {
      const result = await duplicateInvoiceAction(invoiceId);
      if ("error" in result && result.error) {
        toast.error("Unable to duplicate.", result.error);
        return;
      }
      toast.success("Invoice duplicated as draft.");
      router.refresh();
    })();
  }

  const loadContext = useCallback(async () => {
    const canDelete =
      !policyLocked && status === "draft" && Number(amountPaid) === 0;
    const context: DeleteContext = {
      entityKey: "invoice",
      entityId: invoiceId,
      displayName: invoiceNumber,
      fields: [
        { label: "Status", value: status },
        { label: "Audit ID", value: auditId ?? "—" },
        { label: "Policy locked", value: policyLocked ? "Yes" : "No" },
      ],
      dependencies: {
        entityId: invoiceId,
        blocking: canDelete
          ? []
          : [{ key: "policy", label: "Policy / payments / non-draft", count: 1 }],
        informational: [],
        canDelete,
      },
      suggestArchive: !canDelete,
    };
    return { ok: true as const, context };
  }, [amountPaid, auditId, invoiceId, invoiceNumber, policyLocked, status]);

  return (
    <>
      <EntityActionMenu
        ariaLabel={`Actions for ${invoiceNumber}`}
        actions={[
          { id: "duplicate", label: "Duplicate", onSelect: runDuplicate },
          {
            id: "void",
            label: "Void",
            onSelect: runVoid,
            disabled: ["paid", "void", "voided"].includes(status) || amountPaid > 0,
          },
          {
            id: "archive",
            label: "Archive",
            onSelect: runArchive,
            disabled: status === "archived",
          },
          {
            id: "delete",
            label: "Delete",
            tone: "danger",
            onSelect: () => setDeleteOpen(true),
          },
        ]}
      />
      <DestructiveConfirmDialog
        open={deleteOpen}
        title="Delete Invoice"
        entityLabel="Invoice"
        loadContext={loadContext}
        onClose={() => setDeleteOpen(false)}
        archiveLabel="Archive Invoice"
        deleteLabel="Delete Invoice"
        onArchiveInstead={async () => {
          const result = await archiveInvoiceAction(invoiceId);
          if ("error" in result && result.error) return { ok: false, error: result.error };
          toast.success("Invoice archived.");
          router.refresh();
          return { ok: true };
        }}
        onConfirmDelete={async ({ confirmationText, acknowledged }) => {
          const result = await deleteInvoiceAction({
            invoiceId,
            confirmationText,
            acknowledged,
          });
          if ("error" in result && result.error) {
            return { ok: false, error: result.error };
          }
          toast.success("Invoice deleted.");
          router.refresh();
          return { ok: true };
        }}
      />
    </>
  );
}
