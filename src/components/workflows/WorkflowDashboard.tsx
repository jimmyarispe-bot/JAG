"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { WorkflowLifecycleActions } from "@/components/workflows/WorkflowLifecycleActions";
import { seedStarterWorkflowsAction } from "@/lib/workflows/server-actions";
import type { WorkflowListRow } from "@/lib/workflows/types";

interface WorkflowDashboardProps {
  rows: WorkflowListRow[];
  total: number;
  page: number;
  pageSize: number;
  search: string;
  statusFilter: string;
  canEdit: boolean;
}

export function WorkflowDashboard({
  rows,
  total,
  page,
  pageSize,
  search: initialSearch,
  statusFilter,
  canEdit,
}: WorkflowDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState(initialSearch);
  const [message, setMessage] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function pushParams(patch: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value == null || value === "") params.delete(key);
      else params.set(key, value);
    }
    startTransition(() => router.push(`/dashboard/workflows?${params.toString()}`));
  }

  const rangeLabel = useMemo(() => {
    if (total === 0) return "0 workflows";
    const from = (page - 1) * pageSize + 1;
    const to = Math.min(page * pageSize, total);
    return `${from}–${to} of ${total}`;
  }, [page, pageSize, total]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {[
            { value: "all", label: "All" },
            { value: "enabled", label: "Enabled" },
            { value: "disabled", label: "Disabled" },
            { value: "archived", label: "Archived" },
          ].map((f) => (
            <button
              key={f.value}
              type="button"
              disabled={pending}
              onClick={() => pushParams({ status: f.value, page: "1" })}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                statusFilter === f.value
                  ? "bg-brand-600 text-white"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {canEdit && (
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/workflows/new"
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              New workflow
            </Link>
            <Link
              href="/dashboard/workflows/history"
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              History
            </Link>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                startTransition(async () => {
                  const result = await seedStarterWorkflowsAction();
                  if ("error" in result && result.error) setMessage(result.error);
                  else if ("created" in result) {
                    setMessage(`Installed ${result.created} starter workflows (${result.skipped} skipped).`);
                    router.refresh();
                  }
                });
              }}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Install starters
            </button>
          </div>
        )}
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          pushParams({ search: search.trim() || null, page: "1" });
        }}
      >
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search workflows…"
          className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white">
          Search
        </button>
      </form>

      {message && <p className="text-sm text-slate-600">{message}</p>}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Trigger</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Last Run</th>
              <th className="px-3 py-2">Success Rate</th>
              <th className="px-3 py-2">Created By</th>
              <th className="px-3 py-2">Updated</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-slate-500">
                  No workflows yet. Install starters or create one.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                  <td className="px-3 py-2">
                    <Link
                      href={`/dashboard/workflows/${row.id}`}
                      className="font-medium text-brand-600 hover:underline"
                    >
                      {row.name}
                    </Link>
                    <p className="text-xs capitalize text-slate-400">{row.category}</p>
                  </td>
                  <td className="px-3 py-2">{row.triggerLabel}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        row.enabled && row.status === "active"
                          ? "bg-emerald-50 text-emerald-700"
                          : row.status === "archived"
                            ? "bg-slate-100 text-slate-600"
                            : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {row.status === "archived"
                        ? "Archived"
                        : row.enabled
                          ? "Enabled"
                          : "Disabled"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                    {row.last_run_at ? new Date(row.last_run_at).toLocaleString() : "—"}
                  </td>
                  <td className="px-3 py-2">
                    {row.successRate == null ? "—" : `${row.successRate}%`}
                    <span className="ml-1 text-xs text-slate-400">({row.run_count} runs)</span>
                  </td>
                  <td className="px-3 py-2">{row.createdByName ?? "—"}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                    {new Date(row.updated_at).toLocaleString()}
                  </td>
                  <td className="px-3 py-2">
                    {canEdit ? (
                      <WorkflowLifecycleActions
                        workflowId={row.id}
                        enabled={row.enabled}
                        status={row.status}
                        variant="menu"
                      />
                    ) : (
                      <Link
                        href={`/dashboard/workflows/${row.id}`}
                        className="text-xs font-medium text-brand-600"
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

      <div className="flex items-center justify-between text-sm text-slate-600">
        <span>{rangeLabel}</span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={pending || page <= 1}
            onClick={() => pushParams({ page: String(page - 1) })}
            className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40"
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={pending || page >= totalPages}
            onClick={() => pushParams({ page: String(page + 1) })}
            className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
