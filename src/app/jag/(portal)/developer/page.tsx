import { redirect } from "next/navigation";
import { JagDeveloperPortal } from "@/components/jag-platform/JagDeveloperPortal";
import {
  listAccessibleConnectorOrganizations,
  resolveConnectorOrganization,
} from "@/lib/connectors";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";
import { getPlatformSdk } from "@/lib/platform-sdk";

export default async function JagDeveloperPortalPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string }>;
}) {
  const session = await getJagPlatformSession();
  if (!session) {
    redirect(JAG_PLATFORM_LOGIN_PATH);
  }

  const params = await searchParams;
  const org = resolveConnectorOrganization(session, params.org);
  if (!org) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-600 shadow-sm">
        No organization is available for the Developer Portal.
      </div>
    );
  }

  const organizations = listAccessibleConnectorOrganizations(session);
  const snapshot = getPlatformSdk().getDeveloperSnapshot(org.id);

  return (
    <JagDeveloperPortal
      organizations={organizations}
      organizationId={org.id}
      organizationName={org.name}
      snapshot={snapshot}
    />
  );
}
