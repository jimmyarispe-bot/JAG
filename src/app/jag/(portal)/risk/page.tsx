import { redirect } from "next/navigation";
import { JagRiskCompliance } from "@/components/jag-platform/JagRiskCompliance";
import {
  listAccessibleEvidenceOrganizations,
  resolveEvidenceOrganization,
} from "@/lib/evidence-center";
import {
  createControlService,
  createMitigationService,
  createRiskService,
  listRiskTimeline,
} from "@/lib/risk";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

export default async function JagRiskPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string; risk?: string }>;
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
        No organization is available for Risk & Compliance™.
      </div>
    );
  }

  const organizations = listAccessibleEvidenceOrganizations(session);
  const service = createRiskService();
  const risks = service.list(org.id);
  const dashboard = service.dashboard(org.id);
  const controls = createControlService().list(org.id);
  const mitigations = createMitigationService().list(org.id);
  const history = listRiskTimeline(org.id);

  return (
    <JagRiskCompliance
      organizations={organizations}
      organizationId={org.id}
      organizationName={org.name}
      risks={risks}
      dashboard={dashboard}
      controls={controls}
      mitigations={mitigations}
      history={history}
      selectedId={params.risk ?? null}
    />
  );
}
