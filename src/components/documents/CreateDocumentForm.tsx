"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createDocumentAction,
  duplicateFromTemplateAction,
} from "@/lib/documents/server-actions";
import { DOCUMENT_CATEGORIES } from "@/lib/documents/types";

interface CreateDocumentFormProps {
  schoolId?: string | null;
  templateId?: string | null;
  templates?: Array<{ id: string; name: string }>;
}

export function CreateDocumentForm({
  schoolId,
  templateId: initialTemplateId,
  templates = [],
}: CreateDocumentFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState(initialTemplateId ?? "");

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      if (templateId) {
        formData.set("template_id", templateId);
        const result = await duplicateFromTemplateAction(templateId, formData);
        if ("error" in result && result.error) {
          setError(result.error);
          return;
        }
        if ("documentId" in result && result.documentId) {
          router.push(`/dashboard/documents/${result.documentId}`);
          router.refresh();
          return;
        }
      }

      const result = await createDocumentAction(formData);
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      if ("documentId" in result && result.documentId) {
        router.push(`/dashboard/documents/${result.documentId}`);
        router.refresh();
      }
    });
  }

  return (
    <form action={onSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Upload / Create Document</h2>
        <p className="text-sm text-slate-500">
          PDF, DOCX, XLSX, images, CSV, and TXT are supported. File bytes may be linked via URL
          or storage path (storage upload UI can attach later).
        </p>
      </div>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {templates.length > 0 && (
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Start from template</span>
          <select
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="">— None —</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-700">Title</span>
        <input
          name="title"
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
          placeholder="Document title"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-700">Description</span>
        <textarea
          name="description"
          rows={3}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Category</span>
          <select name="category" defaultValue="other" className="w-full rounded-lg border border-slate-300 px-3 py-2">
            {DOCUMENT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Status</span>
          <select name="status" defaultValue="active" className="w-full rounded-lg border border-slate-300 px-3 py-2">
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="pending_review">Pending review</option>
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">File name</span>
          <input name="file_name" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">MIME type</span>
          <select name="mime_type" defaultValue="application/pdf" className="w-full rounded-lg border border-slate-300 px-3 py-2">
            <option value="application/pdf">PDF</option>
            <option value="application/vnd.openxmlformats-officedocument.wordprocessingml.document">
              DOCX
            </option>
            <option value="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet">
              XLSX
            </option>
            <option value="image/png">PNG</option>
            <option value="image/jpeg">JPEG</option>
            <option value="text/csv">CSV</option>
            <option value="text/plain">TXT</option>
          </select>
        </label>
      </div>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-700">File URL (optional)</span>
        <input
          name="file_url"
          type="url"
          placeholder="https://…"
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-700">Tags (comma-separated)</span>
        <input name="tags" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Student ID</span>
          <input name="student_id" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Family ID</span>
          <input name="family_id" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Employee ID</span>
          <input name="employee_id" className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        </label>
      </div>

      <input type="hidden" name="school_id" value={schoolId ?? ""} />

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {pending ? "Saving…" : templateId ? "Create from template" : "Create document"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/dashboard/documents")}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
