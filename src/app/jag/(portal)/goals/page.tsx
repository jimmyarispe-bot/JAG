import { redirect } from "next/navigation";
import { JagGoalsStrategy } from "@/components/jag-platform/JagGoalsStrategy";
import {
  listAccessibleEvidenceOrganizations,
  resolveEvidenceOrganization,
} from "@/lib/evidence-center";
import {
  createGoalService,
  listGoalTimeline,
} from "@/lib/goals";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

export default async function JagGoalsPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string; goal?: string }>;
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
        No organization is available for Goals & Strategy™.
      </div>
    );
  }

  const organizations = listAccessibleEvidenceOrganizations(session);
  const service = createGoalService();
  const goals = service.list(org.id);
  const dashboard = service.dashboard(org.id);
  const history = listGoalTimeline(org.id);

  return (
    <JagGoalsStrategy
      organizations={organizations}
      organizationId={org.id}
      organizationName={org.name}
      goals={goals}
      dashboard={dashboard}
      history={history}
      selectedId={params.goal ?? null}
    />
  );
}
