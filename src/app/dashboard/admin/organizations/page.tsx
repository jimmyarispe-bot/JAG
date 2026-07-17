import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { requirePagePermission } from "@/lib/platform/identity/page-guard";
import { listOrganizations } from "@/lib/platform/identity/organizations";
import { createAuthClient } from "@/lib/supabase/server-auth";

export default async function OrganizationsAdminPage() {
  await requirePagePermission("org.view");
  const supabase = await createAuthClient();
  const organizations = await listOrganizations(supabase);

  const orgIds = organizations.map((o) => o.id);
  const [{ data: schoolRows }, { data: membershipRows }] = await Promise.all([
    orgIds.length
      ? supabase.from("schools").select("id, organization_id").in("organization_id", orgIds)
      : Promise.resolve({ data: [] as Array<{ id: string; organization_id: string | null }> }),
    orgIds.length
      ? supabase
          .from("user_organization_memberships")
          .select("organization_id")
          .in("organization_id", orgIds)
          .eq("status", "active")
      : Promise.resolve({ data: [] as Array<{ organization_id: string }> }),
  ]);

  const schoolCount = new Map<string, number>();
  for (const row of schoolRows ?? []) {
    if (!row.organization_id) continue;
    schoolCount.set(row.organization_id, (schoolCount.get(row.organization_id) ?? 0) + 1);
  }

  const userCount = new Map<string, number>();
  for (const row of membershipRows ?? []) {
    userCount.set(row.organization_id, (userCount.get(row.organization_id) ?? 0) + 1);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Organizations"
        subtitle="First-class tenants with type, owner, subscription, branding, schools, and users"
        backHref="/dashboard/admin"
      />

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Subscription</th>
              <th className="px-4 py-3 font-semibold">Timezone</th>
              <th className="px-4 py-3 font-semibold">Schools</th>
              <th className="px-4 py-3 font-semibold">Users</th>
              <th className="px-4 py-3 font-semibold" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {organizations.map((org) => (
              <tr key={org.id} className="hover:bg-slate-50/80">
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{org.name}</p>
                  <p className="text-xs text-slate-500">{org.slug}</p>
                </td>
                <td className="px-4 py-3 text-slate-600">{org.orgType.replaceAll("_", " ")}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                    {org.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {org.subscriptionPlanKey ?? "—"}
                  <span className="ml-1 text-xs text-slate-400">({org.subscriptionStatus})</span>
                </td>
                <td className="px-4 py-3 text-slate-600">{org.timezone}</td>
                <td className="px-4 py-3 text-slate-600">{schoolCount.get(org.id) ?? 0}</td>
                <td className="px-4 py-3 text-slate-600">{userCount.get(org.id) ?? 0}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/dashboard/admin/organizations/${org.id}`}
                    className="text-sm font-medium text-brand-600 hover:text-brand-700"
                  >
                    Open →
                  </Link>
                </td>
              </tr>
            ))}
            {organizations.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                  No organizations yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-slate-500">
        Legacy hierarchy &amp; profile editor remains at{" "}
        <Link href="/dashboard/admin/organization" className="font-medium text-brand-600">
          /dashboard/admin/organization
        </Link>
        .
      </p>
    </div>
  );
}
