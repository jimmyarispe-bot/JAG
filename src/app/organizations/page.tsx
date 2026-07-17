import { OrgAdminShell, RoleBadge } from "@/components/organization-platform/OrgAdminShell";
import { getOrganizationPlatform } from "@/lib/platform/organization-platform";

export const metadata = {
  title: "Organizations · JAG",
};

export default async function OrganizationsPage() {
  const platform = getOrganizationPlatform();
  const orgs = platform.store.listOrganizations();

  return (
    <OrgAdminShell
      title="Organizations"
      subtitle="Isolated tenants sharing the same intelligence engine"
      activeHref="/organizations"
    >
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Organization</th>
              <th className="px-4 py-3 font-medium">Industry</th>
              <th className="px-4 py-3 font-medium">Locations</th>
              <th className="px-4 py-3 font-medium">Members</th>
              <th className="px-4 py-3 font-medium">Integrations</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {orgs.map((org) => {
              const settings = platform.store.settings.get(org.id);
              const locs = platform.store.listLocations(org.id);
              const members = platform.store.listMemberships(org.id);
              const connectors = platform.integrationBridge.instanceIdsForOrganization(org.id);
              return (
                <tr key={org.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{org.name}</p>
                    <p className="text-xs text-slate-500">{org.slug}</p>
                    {settings ? (
                      <p className="mt-1 text-xs text-slate-400">
                        {settings.timezone} · {settings.currency} · FY start m
                        {settings.fiscalYearStartMonth}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{org.industry}</td>
                  <td className="px-4 py-3 text-slate-600">{locs.length}</td>
                  <td className="px-4 py-3 text-slate-600">{members.length}</td>
                  <td className="px-4 py-3 text-slate-600">{connectors.length}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-800">
                      {org.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-slate-800">Member roles by organization</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {orgs.map((org) => (
            <div key={org.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="font-medium text-slate-900">{org.name}</p>
              <ul className="mt-3 space-y-2">
                {platform.store.listMemberships(org.id).map((m) => {
                  const user = platform.store.users.get(m.userId);
                  return (
                    <li key={m.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-slate-700">{user?.fullName ?? m.userId}</span>
                      <RoleBadge role={m.role} />
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </OrgAdminShell>
  );
}
