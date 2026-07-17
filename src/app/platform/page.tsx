import { OrgAdminShell } from "@/components/organization-platform/OrgAdminShell";
import { getOrganizationPlatform, ROLE_LABELS } from "@/lib/platform/organization-platform";
import Link from "next/link";

export const metadata = {
  title: "Platform · Organization Platform · JAG",
};

export default async function PlatformHubPage() {
  const platform = getOrganizationPlatform();
  const orgs = platform.store.listOrganizations();
  const users = platform.store.listUsers();
  const authMethods = platform.auth.supportedMethods();

  return (
    <OrgAdminShell
      title="Platform"
      subtitle="Multi-tenant control plane — organizations, users, and isolation"
      activeHref="/platform"
    >
      <div className="grid gap-6 md:grid-cols-3">
        <Stat label="Organizations" value={String(orgs.length)} href="/organizations" />
        <Stat label="Users" value={String(users.length)} href="/users" />
        <Stat label="Auth methods" value={String(authMethods.length)} href="/settings" />
      </div>

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Hierarchy
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Platform → Organizations → Locations → Departments → Teams → Users → Permissions →
          Integrations → Executive Command Center → Intelligence (tenant-scoped).
        </p>
        <ol className="mt-4 space-y-1 text-sm text-slate-700">
          {orgs.map((org) => (
            <li key={org.id}>
              <span className="font-medium">{org.name}</span>
              <span className="text-slate-400"> · {org.slug}</span>
              <span className="text-slate-400">
                {" "}
                · {platform.store.listLocations(org.id).length} locations ·{" "}
                {platform.store.listMemberships(org.id).length} members
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Roles
        </h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {Object.entries(ROLE_LABELS).map(([key, label]) => (
            <li
              key={key}
              className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700"
            >
              {label}
            </li>
          ))}
        </ul>
      </section>
    </OrgAdminShell>
  );
}

function Stat({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-lg border border-slate-200 bg-white p-5 transition hover:border-teal-600"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
    </Link>
  );
}
