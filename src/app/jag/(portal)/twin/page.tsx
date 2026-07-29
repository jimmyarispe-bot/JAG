import { redirect } from "next/navigation";
import { JagTwinExplorer } from "@/components/jag-platform/JagTwinExplorer";
import {
  listAccessibleEvidenceOrganizations,
  resolveEvidenceOrganization,
} from "@/lib/evidence-center";
import {
  buildTwinExplorerView,
  createTwinTimelineService,
} from "@/lib/digital-twin";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

export default async function JagTwinPage({
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
        No organization is available for Digital Twin™.
      </div>
    );
  }

  const organizations = listAccessibleEvidenceOrganizations(session);
  const view = buildTwinExplorerView({
    organizationId: org.id,
    organizationName: org.name,
    actor: session.userId,
  });
  const timeline = createTwinTimelineService().list(org.id);

  return (
    <JagTwinExplorer
      organizations={organizations}
      organizationId={org.id}
      view={view}
      timeline={timeline}
    />
  );
}
