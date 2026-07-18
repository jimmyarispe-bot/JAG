import { ConfigStudioShell } from "@/components/configuration/ConfigStudioShell";
import { loadConfigPage } from "@/lib/configuration/page-data";
import { getOrganizationHierarchy } from "@/lib/platform/identity/org";
import Link from "next/link";

export default async function ProgramsConfigPage() {
  const [, hierarchy] = await Promise.all([loadConfigPage(), getOrganizationHierarchy()]);

  return (
    <ConfigStudioShell title="Programs" subtitle="Academic and operational programs">
      <ul className="space-y-2">
        {hierarchy.programs.map((p) => (
          <li key={p.id} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
            <span className="font-medium">{p.name}</span>
            <span className="ml-2 text-slate-500">
              {p.code} — {p.status}
            </span>
          </li>
        ))}
        {!hierarchy.programs.length && (
          <li className="text-slate-500">No programs yet. Add via organization hierarchy.</li>
        )}
      </ul>
      <Link href="/dashboard/admin/organization" className="inline-block text-sm text-brand-600 hover:underline">
        Manage programs →
      </Link>
    </ConfigStudioShell>
  );
}
