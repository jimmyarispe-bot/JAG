import Link from "next/link";
import { OrgAdminShell } from "@/components/organization-platform/OrgAdminShell";
import { getOrganizationPlatform } from "@/lib/platform/organization-platform";

export const metadata = {
  title: "Settings · Organization Platform · JAG",
};

export default async function SettingsPage() {
  const platform = getOrganizationPlatform();
  const orgs = platform.store.listOrganizations();
  const authMethods = platform.auth.supportedMethods();

  return (
    <OrgAdminShell
      title="Settings"
      subtitle="Company profile, branding, regional settings, auth methods"
      activeHref="/settings"
    >
      <section className="mb-8 rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Integrations</h2>
            <p className="mt-1 text-sm text-slate-500">
              Connect Google Workspace and other operational systems.
            </p>
          </div>
          <Link
            href="/settings/integrations"
            className="rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-800"
          >
            Open Integrations
          </Link>
        </div>
        <ul className="mt-4 space-y-2">
          <li>
            <Link
              href="/settings/integrations/google"
              className="text-sm font-medium text-teal-800 hover:underline"
            >
              Google Workspace →
            </Link>
          </li>
        </ul>
      </section>

      <section className="mb-8 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-800">Authentication</h2>
        <p className="mt-1 text-sm text-slate-500">
          Email/password, magic link, Google, Microsoft, and future SSO are supported at the
          platform layer.
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {authMethods.map((m) => (
            <li
              key={m}
              className="rounded-md border border-slate-200 px-2.5 py-1 text-xs text-slate-700"
            >
              {m}
              {m === "sso_future" ? " (reserved)" : ""}
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        {orgs.map((org) => {
          const settings = platform.store.settings.get(org.id);
          if (!settings) return null;
          return (
            <article
              key={org.id}
              className="rounded-lg border border-slate-200 bg-white p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-slate-900">{org.name}</h2>
                  <p className="text-xs text-slate-500">{settings.companyProfile.legalName}</p>
                </div>
                <span
                  className="h-8 w-8 shrink-0 rounded-md"
                  style={{ backgroundColor: settings.branding.primaryColor }}
                  title={settings.branding.primaryColor}
                />
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-slate-500">Timezone</dt>
                  <dd className="text-slate-800">{settings.timezone}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Currency</dt>
                  <dd className="text-slate-800">{settings.currency}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Fiscal year start</dt>
                  <dd className="text-slate-800">Month {settings.fiscalYearStartMonth}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Language / region</dt>
                  <dd className="text-slate-800">
                    {settings.language} · {settings.region}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Industry</dt>
                  <dd className="text-slate-800">{settings.industry}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Product name</dt>
                  <dd className="text-slate-800">{settings.branding.productName}</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-slate-400">
                Accent {settings.branding.accentColor}
                {settings.branding.logoUrl ? ` · logo ${settings.branding.logoUrl}` : " · no logo"}
              </p>
            </article>
          );
        })}
      </div>
    </OrgAdminShell>
  );
}
