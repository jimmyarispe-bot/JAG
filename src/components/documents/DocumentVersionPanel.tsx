"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { restoreDocumentVersionAction } from "@/lib/documents/server-actions";
import { compareVersions } from "@/lib/documents/compare";
import type { DocumentVersionRow } from "@/lib/documents/types";

interface DocumentVersionPanelProps {
  documentId: string;
  versions: DocumentVersionRow[];
  canEdit: boolean;
}

export function DocumentVersionPanel({
  documentId,
  versions,
  canEdit,
}: DocumentVersionPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [compareA, setCompareA] = useState<number | "">("");
  const [compareB, setCompareB] = useState<number | "">("");
  const [error, setError] = useState<string | null>(null);

  const versionA =
    typeof compareA === "number"
      ? versions.find((v) => v.version_number === compareA)
      : null;
  const versionB =
    typeof compareB === "number"
      ? versions.find((v) => v.version_number === compareB)
      : null;
  const comparison =
    versionA && versionB ? compareVersions(versionA, versionB) : null;

  function restore(versionNumber: number) {
    setError(null);
    startTransition(async () => {
      const result = await restoreDocumentVersionAction(documentId, versionNumber);
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900">Version history</h3>
        <p className="text-sm text-slate-500">
          Every edit creates a new version. Previous versions are never overwritten.
        </p>
      </div>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Compare A</span>
          <select
            value={compareA === "" ? "" : String(compareA)}
            onChange={(e) => setCompareA(e.target.value ? Number(e.target.value) : "")}
            className="rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="">Select…</option>
            {versions.map((v) => (
              <option key={v.id} value={v.version_number}>
                v{v.version_number}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Compare B</span>
          <select
            value={compareB === "" ? "" : String(compareB)}
            onChange={(e) => setCompareB(e.target.value ? Number(e.target.value) : "")}
            className="rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="">Select…</option>
            {versions.map((v) => (
              <option key={v.id} value={v.version_number}>
                v{v.version_number}
              </option>
            ))}
          </select>
        </label>
      </div>

      {comparison ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
          <p className="font-medium text-slate-900">
            Comparing v{comparison.a.version_number} → v{comparison.b.version_number}
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Title: {comparison.titleChanged ? "changed" : "same"}</li>
            <li>Description: {comparison.descriptionChanged ? "changed" : "same"}</li>
            <li>File: {comparison.fileChanged ? "changed" : "same"}</li>
          </ul>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Version</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Summary</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {versions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  No versions yet.
                </td>
              </tr>
            ) : (
              versions.map((v) => (
                <tr key={v.id} className="border-b border-slate-50">
                  <td className="px-4 py-3 font-medium">v{v.version_number}</td>
                  <td className="px-4 py-3">{v.title}</td>
                  <td className="px-4 py-3 text-slate-600">{v.change_summary ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(v.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    {canEdit ? (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => restore(v.version_number)}
                        className="text-brand-700 hover:underline disabled:opacity-40"
                      >
                        Restore
                      </button>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
