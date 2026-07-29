import { redirect } from "next/navigation";
import { JagOrganizationalMemory } from "@/components/jag-platform/JagOrganizationalMemory";
import {
  listAccessibleEvidenceOrganizations,
  resolveEvidenceOrganization,
} from "@/lib/evidence-center";
import {
  createMemoryService,
  listMemoryTimeline,
} from "@/lib/memory";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

export default async function JagMemoryPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string; memory?: string }>;
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
        No organization is available for Organizational Memory™.
      </div>
    );
  }

  const organizations = listAccessibleEvidenceOrganizations(session);
  const memory = createMemoryService();
  const memories = memory.list(org.id);
  const dashboard = memory.dashboard(org.id);
  const history = listMemoryTimeline(org.id);

  return (
    <JagOrganizationalMemory
      organizations={organizations}
      organizationId={org.id}
      organizationName={org.name}
      memories={memories}
      dashboard={dashboard}
      history={history}
      selectedId={params.memory ?? null}
    />
  );
}
