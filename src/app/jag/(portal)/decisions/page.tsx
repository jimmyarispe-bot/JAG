import { redirect } from "next/navigation";
import { JagDecisionCenter } from "@/components/jag-platform/JagDecisionCenter";
import {
  listAccessibleEvidenceOrganizations,
  resolveEvidenceOrganization,
} from "@/lib/evidence-center";
import {
  createDecisionHistoryService,
  createDecisionService,
  getDecisionSummary,
} from "@/lib/executive-intelligence";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

export default async function JagDecisionsPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string; decision?: string }>;
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
        No organization is available for Decision Center™.
      </div>
    );
  }

  const organizations = listAccessibleEvidenceOrganizations(session);
  const service = createDecisionService();
  service.syncFromInsights(org.id, session.userId);
  const decisions = service.list(org.id);
  const summary = getDecisionSummary(org.id);
  const mergedTimeline = createDecisionHistoryService().listMergedTimeline(
    org.id
  );

  return (
    <JagDecisionCenter
      organizations={organizations}
      organizationId={org.id}
      decisions={decisions}
      summary={summary}
      mergedTimeline={mergedTimeline}
      selectedId={params.decision ?? null}
    />
  );
}
