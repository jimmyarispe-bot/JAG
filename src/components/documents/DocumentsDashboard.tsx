"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { DocumentLifecycleActions } from "@/components/documents/DocumentLifecycleActions";
import type { DocumentCategory, DocumentListFilter, DocumentListRow } from "@/lib/documents/types";
import { DOCUMENT_CATEGORIES } from "@/lib/documents/types";

const FILTERS: Array<{ value: DocumentListFilter; label: string }> = [
  { value: "all", label: "All Documents" },
  { value: "student", label: "Student Documents" },
  { value: "family", label: "Family Documents" },
  { value: "employee", label: "Employee Documents" },
  { value: "school", label: "School Documents" },
  { value: "templates", label: "Templates" },
  { value: "archived", label: "Archived" },
];

interface DocumentsDashboardProps {
  rows: DocumentListRow[];
  total: number;
  page: number;
  pageSize: number;
  filter: DocumentListFilter;
  search: string;
  category: DocumentCategory | "all";
  sort: string;
  sortDir: "asc" | "desc";
  canEdit: boolean;
  templates?: Array<{ id: string; name: string; category: string; description: string }>;
}

function formatCategory(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function DocumentsDashboard({
  rows,
  total,
  page,
  pageSize,
  filter,
  search: initialSearch,
  category,
  sort,
  sortDir,
  canEdit,
  templates = [],
}: DocumentsDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState(initialSearch);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function pushParams(patch: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value == null || value === "") params.delete(key);
      else params.set(key, value);
    }
    startTransition(() => {
      router.push(`/dashboard/documents?${params.toString()}`);
    });
  }

  const rangeLabel = useMemo(() => {
    if (filter === "templates") {
      return `${templates.length} templates`;
    }
    if (total === 0) return "0 documents";
    const from = (page - 1) * pageSize + 1;
    const to = Math.min(page * pageSize, total);
    return `${from}–${to} of ${total}`;
  }, [filter, page, pageSize, templates.length, total]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map((item) => {
            const active = filter === item.value;
            return (
              <button
                key={item.value}
                type="button"
                disabled={pending}
                onClick={() => pushParams({ filter: item.value, page: "1" })}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  active
                    ? "bg-brand-600 text-white"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
        {canEdit && (
          <Link
            href="/dashboard/documents?create=1"
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Upload / Create
          </Link>
        )}
      </div>

      {filter !== "templates" && (
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            pushParams({ search: search.trim() || null, page: "1" });
          }}
        >
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, description, file name, category…"
            className="w-full min-w-[220px] rounded-lg border border-slate-300 px-3 py-2 text-sm lg:w-96"
          />
          <select
            value={category}
            onChange={(e) =>
              pushParams({
                category: e.target.value === "all" ? null : e.target.value,
                page: "1",
              })
            }
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="all">All categories</option>
            {DOCUMENT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {formatCategory(c)}
              </option>
            ))}
          </select>
          <select
            value={`${sort}:${sortDir}`}
            onChange={(e) => {
              const [s, d] = e.target.value.split(":");
              pushParams({ sort: s ?? "updated_at", dir: d ?? "desc", page: "1" });
            }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="updated_at:desc">Modified (newest)</option>
            <option value="updated_at:asc">Modified (oldest)</option>
            <option value="created_at:desc">Uploaded (newest)</option>
            <option value="title:asc">Name A–Z</option>
            <option value="title:desc">Name Z–A</option>
            <option value="category:asc">Category</option>
          </select>
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Search
          </button>
        </form>
      )}

      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>{rangeLabel}</span>
        {filter !== "templates" && totalPages > 1 && (
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1 || pending}
              onClick={() => pushParams({ page: String(page - 1) })}
              className="rounded border border-slate-200 px-2 py-1 disabled:opacity-40"
            >
              Previous
            </button>
            <span>
              Page {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages || pending}
              onClick={() => pushParams({ page: String(page + 1) })}
              className="rounded border border-slate-200 px-2 py-1 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {filter === "templates" ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    No templates available.
                  </td>
                </tr>
              ) : (
                templates.map((t) => (
                  <tr key={t.id} className="border-b border-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{t.name}</td>
                    <td className="px-4 py-3 text-slate-600">{formatCategory(t.category)}</td>
                    <td className="px-4 py-3 text-slate-600">{t.description || "—"}</td>
                    <td className="px-4 py-3">
                      {canEdit ? (
                        <Link
                          href={`/dashboard/documents?create=1&template_id=${t.id}`}
                          className="text-brand-700 hover:underline"
                        >
                          Duplicate from template
                        </Link>
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
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Related Entity</th>
                <th className="px-4 py-3">School</th>
                <th className="px-4 py-3">Version</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Uploaded</th>
                <th className="px-4 py-3">Modified</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-500">
                    No documents match this view.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/documents/${row.id}`}
                        className="font-medium text-slate-900 hover:text-brand-700 hover:underline"
                      >
                        {row.title}
                      </Link>
                      {row.file_name ? (
                        <div className="text-xs text-slate-500">{row.file_name}</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatCategory(row.category)}</td>
                    <td className="px-4 py-3 text-slate-600">{row.relatedSummary}</td>
                    <td className="px-4 py-3 text-slate-600">{row.schoolName ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">v{row.current_version}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize text-slate-700">
                        {row.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{row.ownerName ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(row.created_at)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(row.updated_at)}</td>
                    <td className="px-4 py-3">
                      {canEdit ? (
                        <DocumentLifecycleActions
                          documentId={row.id}
                          title={row.title}
                          status={row.status}
                          auditId={row.audit_id}
                          policyLocked={row.policy_locked}
                          variant="menu"
                        />
                      ) : (
                        <Link
                          href={`/dashboard/documents/${row.id}`}
                          className="text-brand-700 hover:underline"
                        >
                          View
                        </Link>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
