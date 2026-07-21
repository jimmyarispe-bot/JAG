import Link from "next/link";
import { OrgAdminShell } from "@/components/organization-platform/OrgAdminShell";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { getPrimaryOrganizationId } from "@/lib/configuration/context";
import { getGoogleWorkspaceStatus } from "@/lib/platform/integrations/connections";

export const metadata = {
  title: "Integrations · Settings · JAG",
};

export default async function SettingsIntegrationsPage() {
  const supabase = await createAuthClient();
  const organizationId = await getPrimaryOrganizationId(supabase);
  const google = organizationId
    ? await getGoogleWorkspaceStatus(supabase, organizationId)
    : null;

  return (
    <OrgAdminShell
      title="Integrations"
      subtitle="Connect operational systems for your organization"
      activeHref="/settings"
    >
      <nav className="mb-6 text-sm text-slate-500">
        <Link href="/settings" className="hover:text-slate-800">
          Settings
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-800">Integrations</span>
      </nav>

      <ul className="grid gap-4 md:grid-cols-2">
        <li>
          <Link
            href="/settings/integrations/google"
            className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-teal-300 hover:shadow"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Google Workspace
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Gmail, Calendar, Drive, Docs, and Directory
                </p>
              </div>
              {google?.connected ? (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Connected
                </span>
              ) : (
                <span className="inline-flex rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                  Disconnected
                </span>
              )}
            </div>
          </Link>
        </li>
      </ul>
    </OrgAdminShell>
  );
}
