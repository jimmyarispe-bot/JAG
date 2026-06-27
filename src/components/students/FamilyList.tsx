import Link from "next/link";
import type { Family } from "@/lib/students/queries";

interface FamilyListProps {
  families: Family[];
}

export function FamilyList({ families }: FamilyListProps) {
  if (families.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-500">No families yet.</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {families.map((family) => (
        <Link
          key={family.id}
          href={`/dashboard/families/${family.id}?section=overview`}
          className="rounded-2xl border border-slate-200/80 bg-white p-5 transition-colors hover:border-brand-200 hover:bg-brand-50/30"
        >
          <h3 className="font-semibold text-slate-900">{family.family_name}</h3>
          <p className="mt-1 text-sm text-slate-500">{family.schools?.name}</p>
          {family.primary_address && (
            <p className="mt-2 text-sm text-slate-600">{family.primary_address}</p>
          )}
          {family.billing_email && (
            <p className="mt-1 text-xs text-slate-400">{family.billing_email}</p>
          )}
        </Link>
      ))}
    </div>
  );
}
