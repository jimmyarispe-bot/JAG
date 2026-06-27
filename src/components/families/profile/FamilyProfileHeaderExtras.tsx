import Link from "next/link";
import { buildFamilyProfileSectionHref } from "@/lib/families/profile/href";
import type { FamilyProfileEnvelope } from "@/lib/families/profile/types";

function formatStatus(status: string): string {
  return status.replace(/_/g, " ");
}

export function FamilyProfileAvatar({ envelope }: { envelope: FamilyProfileEnvelope }) {
  const initial = envelope.displayName[0]?.toUpperCase() ?? "H";
  return (
    <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-sky-50 text-lg font-bold text-sky-700">
      {initial}
    </div>
  );
}

export function FamilyProfileBadges({ envelope }: { envelope: FamilyProfileEnvelope }) {
  return (
    <>
      <span className="inline-flex rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-800">
        Household
      </span>
      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium capitalize text-slate-700">
        {formatStatus(envelope.status)}
      </span>
    </>
  );
}

export function FamilyProfileHeaderActions({ envelope }: { envelope: FamilyProfileEnvelope }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={buildFamilyProfileSectionHref(envelope.familyId, "notes")}
        className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
      >
        Notes
      </Link>
      <Link
        href={buildFamilyProfileSectionHref(envelope.familyId, "tuition")}
        className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
      >
        Tuition
      </Link>
    </div>
  );
}
