"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type { FamilyListRow, FamilyStatusFilter, FamilySortKey } from "@/lib/families/queries";
import { FamilyLifecycleActions } from "@/components/families/FamilyLifecycleActions";

const FILTERS: Array<{ value: FamilyStatusFilter; label: string }> = [
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
  { value: "incomplete", label: "Incomplete" },
  { value: "prospective", label: "Prospective" },
  { value: "all", label: "All" },
];

interface FamilyDashboardProps {
  rows: FamilyListRow[];
  total: number;
  page: number;
  pageSize: number;
  statusFilter: FamilyStatusFilter;
  search: string;
  sort: FamilySortKey;
  sortDir: "asc" | "desc";
  canManageLifecycle: boolean;
}

export function FamilyDashboard({
  rows,
  total,
  page,
  pageSize,
  statusFilter,
  search: initialSearch,
  sort,
  sortDir,
  canManageLifecycle,
}: FamilyDashboardProps) {
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
      router.push(`/dashboard/families?${params.toString()}`);
    });
  }

  const rangeLabel = useMemo(() => {
    if (total === 0) return "0 families";
    const from = (page - 1) * pageSize + 1;
    const to = Math.min(page * pageSize, total);
    return `${from}–${to} of ${total}`;
  }, [page, pageSize, total]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map((filter) => {
            const active = statusFilter === filter.value;
            return (
              <button
                key={filter.value}
                type="button"
                disabled={pending}
                onClick={() => pushParams({ status: filter.value, page: "1" })}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  active
                    ? "bg-brand-600 text-white"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {filter.label}
              </button>
            );
          })}
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
            placeholder="Search family, email, phone…"
            className="w-full min-w-[220px] rounded-lg border border-slate-300 px-3 py-2 text-sm lg:w-80"
          />
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white"
          >
            Search
          </button>
        </form>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
        <span>{rangeLabel}</span>
        <label className="flex items-center gap-2">
          Sort
          <select
            className="rounded-lg border border-slate-300 px-2 py-1"
            value={`${sort}:${sortDir}`}
            onChange={(e) => {
              const [nextSort, nextDir] = e.target.value.split(":") as [
                FamilySortKey,
                "asc" | "desc",
              ];
              pushParams({ sort: nextSort, dir: nextDir, page: "1" });
            }}
          >
            <option value="family_name:asc">Name A–Z</option>
            <option value="family_name:desc">Name Z–A</option>
            <option value="status:asc">Status</option>
            <option value="student_count:desc">Most students</option>
            <option value="last_activity:desc">Recent activity</option>
          </select>
        </label>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Family Name</th>
                <th className="px-4 py-3">Primary Guardian</th>
                <th className="px-4 py-3">Students</th>
                <th className="px-4 py-3">School(s)</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last Activity</th>
                {canManageLifecycle && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={canManageLifecycle ? 9 : 8} className="px-4 py-10 text-center text-slate-500">
                    No families match this filter.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/families/${row.id}?section=overview`}
                        className="font-medium text-brand-600 hover:text-brand-700"
                      >
                        {row.preferred_name || row.family_name}
                      </Link>
                      {row.household_name && row.household_name !== row.family_name && (
                        <p className="text-xs text-slate-500">{row.household_name}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {row.primaryGuardianName ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <span className="font-medium">{row.studentCount}</span>
                      {row.studentNames.length > 0 && (
                        <p className="max-w-[180px] truncate text-xs text-slate-500">
                          {row.studentNames.join(", ")}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{row.schoolName ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {row.primaryGuardianEmail ?? row.billing_email ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {row.primaryGuardianPhone ?? row.billing_phone ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs capitalize text-slate-700">
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                      {row.lastActivityAt
                        ? new Date(row.lastActivityAt).toLocaleDateString()
                        : "—"}
                    </td>
                    {canManageLifecycle && (
                      <td className="px-4 py-3 text-right">
                        <FamilyLifecycleActions
                          familyId={row.id}
                          isArchived={row.status === "archived"}
                          variant="menu"
                        />
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          disabled={pending || page <= 1}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-40"
          onClick={() => pushParams({ page: String(page - 1) })}
        >
          Previous
        </button>
        <span className="text-sm text-slate-600">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          disabled={pending || page >= totalPages}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-40"
          onClick={() => pushParams({ page: String(page + 1) })}
        >
          Next
        </button>
      </div>
    </div>
  );
}
