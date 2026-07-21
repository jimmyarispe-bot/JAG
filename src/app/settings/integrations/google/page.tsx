import Link from "next/link";
import { OrgAdminShell } from "@/components/organization-platform/OrgAdminShell";
import { GoogleWorkspaceCard } from "@/components/integrations/GoogleWorkspaceCard";
import { createAuthClient } from "@/lib/supabase/server-auth";
import { getPrimaryOrganizationId } from "@/lib/configuration/context";
import { getGoogleWorkspaceStatus } from "@/lib/platform/integrations/connections";

export const metadata = {
  title: "Google Workspace · Integrations · Settings · JAG",
};

export default async function SettingsGoogleWorkspacePage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createAuthClient();
  const organizationId = await getPrimaryOrganizationId(supabase);
  const status = organizationId
    ? await getGoogleWorkspaceStatus(supabase, organizationId)
    : {
        provider: "google_workspace" as const,
        status: "disconnected" as const,
        connected: false,
        health: "disconnected" as const,
        healthLabel: "Disconnected",
        lastSyncAt: null,
        expiresAt: null,
        connectedAt: null,
        connectionId: null,
        currentSyncStatus: "idle" as const,
        recordsImported: 0,
        recordsChanged: 0,
        lastSyncDurationMs: null,
        nextScheduledSyncAt: null,
        nextFullSyncAt: null,
        consecutiveFailures: 0,
        errorDetails: null,
        providerVersion: null,
      };

  return (
    <OrgAdminShell
      title="Google Workspace"
      subtitle="Connect and synchronize Google Workspace organizational data"
      activeHref="/settings"
    >
      <nav className="mb-6 text-sm text-slate-500">
        <Link href="/settings" className="hover:text-slate-800">
          Settings
        </Link>
        <span className="mx-2">/</span>
        <Link href="/settings/integrations" className="hover:text-slate-800">
          Integrations
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-800">Google Workspace</span>
      </nav>

      {params.connected === "1" ? (
        <p
          className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          role="status"
        >
          Google Workspace connected successfully.
        </p>
      ) : null}
      {params.error ? (
        <p
          className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
          role="alert"
        >
          Connection failed: {params.error}
        </p>
      ) : null}

      <GoogleWorkspaceCard initialStatus={status} />
    </OrgAdminShell>
  );
}
