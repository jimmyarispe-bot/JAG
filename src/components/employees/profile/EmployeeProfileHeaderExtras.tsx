import Link from "next/link";
import { buildEmployeeProfileSectionHref } from "@/lib/employees/profile/href";
import type { EmployeeProfileEnvelope } from "@/lib/employees/profile/types";

function formatEmploymentStatus(status: string): string {
  return status.replace(/_/g, " ");
}

function formatEmployeeType(type: string): string {
  return type.replace(/_/g, " ");
}

export function EmployeeProfileAvatar({ envelope }: { envelope: EmployeeProfileEnvelope }) {
  const initial = envelope.displayName[0]?.toUpperCase() ?? "?";
  return (
    <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-brand-50 text-lg font-bold text-brand-700">
      {initial}
    </div>
  );
}

export function EmployeeProfileBadges({ envelope }: { envelope: EmployeeProfileEnvelope }) {
  return (
    <>
      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium capitalize text-slate-700">
        {formatEmploymentStatus(envelope.employmentStatus)}
      </span>
      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium capitalize text-slate-700">
        {formatEmployeeType(envelope.employeeType)}
      </span>
      {envelope.department && (
        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
          {envelope.department}
        </span>
      )}
      {envelope.hireDate && (
        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
          Hired {envelope.hireDate}
        </span>
      )}
    </>
  );
}

export function EmployeeProfileHeaderActions({
  envelope,
}: {
  envelope: EmployeeProfileEnvelope;
}) {
  return (
    <>
      <Link
        href={buildEmployeeProfileSectionHref(envelope.employeeId, "notes")}
        className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Notes
      </Link>
      <Link
        href={buildEmployeeProfileSectionHref(envelope.employeeId, "activity")}
        className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Activity
      </Link>
      {envelope.userId && (
        <Link
          href="/dashboard/employee"
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50"
        >
          Self-service portal
        </Link>
      )}
    </>
  );
}
