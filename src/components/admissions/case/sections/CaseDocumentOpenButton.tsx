"use client";

import { useState, useTransition } from "react";
import { getAdmissionsDocumentUrl } from "@/lib/admissions/documents/inquiry-documents";

/**
 * Opens one uploaded document in a new tab.
 *
 * The signed link is fetched on click rather than rendered with the page, so a
 * URL never outlives the permission that produced it.
 */
export function CaseDocumentOpenButton({
  documentId,
  label,
}: {
  documentId: string;
  label: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function open() {
    setError(null);
    startTransition(async () => {
      const result = await getAdmissionsDocumentUrl(documentId);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      window.open(result.url, "_blank", "noopener,noreferrer");
    });
  }

  return (
    <span className="inline-flex flex-col">
      <button
        type="button"
        onClick={open}
        disabled={pending}
        className="text-left text-sm font-medium text-brand-700 hover:underline disabled:opacity-60"
      >
        {pending ? "Opening…" : label}
      </button>
      {error && <span className="text-xs text-rose-600">{error}</span>}
    </span>
  );
}
