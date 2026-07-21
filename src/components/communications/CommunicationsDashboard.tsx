"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { CommunicationLifecycleActions } from "@/components/communications/CommunicationLifecycleActions";
import type { CommunicationFilter, CommunicationListRow } from "@/lib/communications/types";

const FILTERS: Array<{ value: CommunicationFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "today", label: "Today" },
  { value: "unread", label: "Unread" },
  { value: "scheduled", label: "Scheduled" },
  { value: "failed", label: "Failed" },
  { value: "sent", label: "Sent" },
  { value: "draft", label: "Draft" },
];

interface CommunicationsDashboardProps {
  rows: CommunicationListRow[];
  total: number;
  page: number;
  pageSize: number;
  filter: CommunicationFilter;
  search: string;
  typeFilter: string;
  canCompose: boolean;
}

function formatType(type: string) {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function CommunicationsDashboard({
  rows,
  total,
  page,
  pageSize,
  filter,
  search: initialSearch,
  typeFilter,
  canCompose,
}: CommunicationsDashboardProps) {
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
      router.push(`/dashboard/communications?${params.toString()}`);
    });
  }

  const rangeLabel = useMemo(() => {
    if (total === 0) return "0 communications";
    const from = (page - 1) * pageSize + 1;
    const to = Math.min(page * pageSize, total);
    return `${from}–${to} of ${total}`;
  }, [page, pageSize, total]);

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
        <div className="flex flex-wrap gap-2">
          {canCompose && (
            <>
              <Link
                href="/dashboard/communications/compose"
                className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                Compose
              </Link>
              <Link
                href="/dashboard/communications/templates"
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Templates
              </Link>
              <Link
                href="/dashboard/communications/announcements"
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Announcements
              </Link>
            </>
          )}
        </div>
      </div>

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
          placeholder="Search subject, body, sender…"
          className="w-full min-w-[220px] rounded-lg border border-slate-300 px-3 py-2 text-sm lg:w-96"
        />
        <select
          value={typeFilter}
          onChange={(e) => pushParams({ type: e.target.value === "all" ? null : e.target.value, page: "1" })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="all">All types</option>
          <option value="email">Email</option>
          <option value="sms">SMS</option>
          <option value="portal">Portal</option>
          <option value="call">Call</option>
          <option value="meeting">Meeting</option>
          <option value="announcement">Announcement</option>
        </select>
        <button
          type="submit"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Search
        </button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-3 py-2">Date/Time</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Direction</th>
              <th className="px-3 py-2">Recipient(s)</th>
              <th className="px-3 py-2">Student</th>
              <th className="px-3 py-2">Family</th>
              <th className="px-3 py-2">School</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Sender</th>
              <th className="px-3 py-2">Subject</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-3 py-8 text-center text-slate-500">
                  No communications found.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                  <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                    {new Date(row.created_at).toLocaleString()}
                  </td>
                  <td className="px-3 py-2">{formatType(row.type)}</td>
                  <td className="px-3 py-2 capitalize">{row.direction}</td>
                  <td className="max-w-[140px] truncate px-3 py-2">{row.recipientSummary}</td>
                  <td className="px-3 py-2">
                    {row.student_id ? (
                      <Link
                        href={`/dashboard/students/${row.student_id}`}
                        className="text-brand-600 hover:underline"
                      >
                        {row.studentName ?? "Student"}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {row.family_id ? (
                      <Link
                        href={`/dashboard/families/${row.family_id}`}
                        className="text-brand-600 hover:underline"
                      >
                        {row.familyName ?? "Family"}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2">{row.schoolName ?? "—"}</td>
                  <td className="px-3 py-2 capitalize">{row.status}</td>
                  <td className="px-3 py-2">{row.sender_display_name ?? "—"}</td>
                  <td className="max-w-[180px] truncate px-3 py-2 font-medium text-slate-900">
                    {row.subject || "(no subject)"}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/communications/${row.id}`}
                        className="text-sm font-medium text-brand-600 hover:underline"
                      >
                        Open
                      </Link>
                      {canCompose ? (
                        <CommunicationLifecycleActions
                          communicationId={row.id}
                          status={row.status}
                          subject={row.subject}
                          auditId={row.audit_id}
                          variant="menu"
                        />
                      ) : null}
                    </div>
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
