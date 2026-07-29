import { redirect } from "next/navigation";
import { JagConnectorOrchestrator } from "@/components/jag-platform/JagConnectorOrchestrator";
import {
  getConnectorOrchestrator,
  listAccessibleConnectorOrganizations,
  resolveConnectorOrganization,
} from "@/lib/connectors";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

export default async function JagConnectorOrchestratorPage({
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
        No organization is available for Connector Orchestrator™.
      </div>
    );
  }

  const organizations = listAccessibleConnectorOrganizations(session);
  const dashboard = getConnectorOrchestrator().getDashboard(org.id);

  return (
    <JagConnectorOrchestrator
      organizations={organizations}
      organizationId={org.id}
      organizationName={org.name}
      dashboard={dashboard}
    />
  );
}
