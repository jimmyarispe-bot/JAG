"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { gradeLabel } from "@/lib/constants/grades";
import { programLabel } from "@/lib/constants/programs";
import { FundingSourceBadges } from "@/components/ui/FundingSourceBadges";
import { StudentLifecycleActions } from "@/components/students/StudentLifecycleActions";
import type { StudentRecord } from "@/lib/students/queries";
import type { StudentListStatusFilter } from "@/lib/students/queries";

interface StudentListProps {
  students: StudentRecord[];
  statusFilter?: StudentListStatusFilter;
  canManageLifecycle?: boolean;
}

const FILTERS: Array<{ value: StudentListStatusFilter; label: string }> = [
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
  { value: "all", label: "All" },
];

export function StudentList({
  students,
  statusFilter = "active",
  canManageLifecycle = false,
}: StudentListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setFilter(next: StudentListStatusFilter) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", "students");
    params.set("status", next);
    params.delete("work");
    router.push(`/dashboard/students?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Show
        </span>
        {FILTERS.map((filter) => {
          const active = statusFilter === filter.value;
          return (
            <button
              key={filter.value}
              type="button"
              onClick={() => setFilter(filter.value)}
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

      {students.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">
          {statusFilter === "archived"
            ? "No archived students."
            : statusFilter === "all"
              ? "No students yet."
              : "No active students."}
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  Grade
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  Program
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  Funding
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                  Family
                </th>
                {canManageLifecycle && (
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((s) => {
                const archived = s.status === "archived";
                return (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/students/${s.id}`}
                        className="font-medium text-brand-600 hover:text-brand-700"
                      >
                        {s.first_name} {s.last_name}
                      </Link>
                      {archived && (
                        <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
                          Archived
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {gradeLabel(s.grade_level)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {programLabel(s.program)}
                    </td>
                    <td className="px-4 py-3">
                      <FundingSourceBadges codes={s.funding_sources} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs capitalize text-slate-700">
                        {archived ? "archived" : s.enrollment_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {s.families?.family_name ?? "—"}
                    </td>
                    {canManageLifecycle && (
                      <td className="px-4 py-3 text-right">
                        <StudentLifecycleActions
                          studentId={s.id}
                          isArchived={archived}
                          variant="menu"
                        />
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
