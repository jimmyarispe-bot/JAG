"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { rerunExecutionAction } from "@/lib/workflows/server-actions";

interface ExecutionRow {
  id: string;
  workflow_id: string;
  workflowName?: string;
  trigger_key: string;
  status: string;
  started_at: string | null;
  finished_at: string | null;
  duration_ms: number | null;
  error_message: string | null;
  created_at: string;
  attempt: number;
}

interface ExecutionHistoryProps {
  rows: ExecutionRow[];
  total: number;
  page: number;
  pageSize: number;
  statusFilter: string;
  workflowId?: string;
  canEdit: boolean;
  workflows: Array<{ id: string; name: string }>;
}

export function ExecutionHistory({
  rows,
  total,
  page,
  pageSize,
  statusFilter,
  workflowId,
  canEdit,
  workflows,
}: ExecutionHistoryProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function pushParams(patch: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value == null || value === "") params.delete(key);
      else params.set(key, value);
    }
    startTransition(() => router.push(`/dashboard/workflows/history?${params.toString()}`));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <select
          value={workflowId ?? ""}
          onChange={(e) => pushParams({ workflowId: e.target.value || null, page: "1" })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All workflows</option>
          {workflows.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => pushParams({ status: e.target.value, page: "1" })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          {["all", "completed", "failed", "running", "skipped", "retrying", "dead_letter"].map(
            (s) => (
              <option key={s} value={s}>
                {s}
              </option>
            )
          )}
        </select>
        <input
          type="date"
          defaultValue={searchParams.get("from") ?? ""}
          onChange={(e) => pushParams({ from: e.target.value || null, page: "1" })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          type="date"
          defaultValue={searchParams.get("to") ?? ""}
          onChange={(e) => pushParams({ to: e.target.value || null, page: "1" })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">Workflow</th>
              <th className="px-3 py-2">Trigger</th>
              <th className="px-3 py-2">Started</th>
              <th className="px-3 py-2">Finished</th>
              <th className="px-3 py-2">Duration</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Error</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-slate-500">
                  No executions yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-slate-100">
                  <td className="px-3 py-2">
                    <Link
                      href={`/dashboard/workflows/${row.workflow_id}`}
                      className="font-medium text-brand-600 hover:underline"
                    >
                      {row.workflowName ?? "Workflow"}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-xs">{row.trigger_key}</td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {row.started_at ? new Date(row.started_at).toLocaleString() : "—"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {row.finished_at ? new Date(row.finished_at).toLocaleString() : "—"}
                  </td>
                  <td className="px-3 py-2">
                    {row.duration_ms != null ? `${row.duration_ms} ms` : "—"}
                  </td>
                  <td className="px-3 py-2 capitalize">
                    {row.status}
                    {row.attempt > 1 ? ` · try ${row.attempt}` : ""}
                  </td>
                  <td className="max-w-[200px] truncate px-3 py-2 text-xs text-red-600">
                    {row.error_message ?? "—"}
                  </td>
                  <td className="px-3 py-2">
                    {canEdit &&
                      (row.status === "failed" ||
                        row.status === "dead_letter" ||
                        row.status === "completed") && (
                        <button
                          type="button"
                          disabled={pending}
                          className="text-xs font-medium text-brand-600 hover:underline"
                          onClick={() => {
                            startTransition(async () => {
                              await rerunExecutionAction(row.id);
                              router.refresh();
                            });
                          }}
                        >
                          Re-run
                        </button>
                      )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-600">
        <span>
          {total === 0
            ? "0 executions"
            : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total}`}
        </span>
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
