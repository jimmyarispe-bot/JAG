import { redirect } from "next/navigation";
import { JagExecutiveIntelligence } from "@/components/jag-platform/JagExecutiveIntelligence";
import {
  listAccessibleEvidenceOrganizations,
  resolveEvidenceOrganization,
} from "@/lib/evidence-center";
import { buildExecutiveDashboard } from "@/lib/executive-intelligence";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

export default async function JagExecutivePage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string }>;
}) {
  const session = await getJagPlatformSession();
  if (!session) {
    redirect(JAG_PLATFORM_LOGIN_PATH);
  }

  const params = await searchParams;
  const org = resolveEvidenceOrganization(session, params.org);
  if (!org) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-600 shadow-sm">
        No organization is available for Executive Intelligence™.
      </div>
    );
  }

  const organizations = listAccessibleEvidenceOrganizations(session);
  const dashboard = buildExecutiveDashboard({
    organizationId: org.id,
    organizationName: org.name,
    organizationCount: organizations.length,
  });

  return (
    <JagExecutiveIntelligence
      organizations={organizations}
      organizationId={org.id}
      dashboard={dashboard}
    />
  );
}
