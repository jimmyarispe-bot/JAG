import { redirect } from "next/navigation";
import { JagWorkExecution } from "@/components/jag-platform/JagWorkExecution";
import {
  listAccessibleEvidenceOrganizations,
  resolveEvidenceOrganization,
} from "@/lib/evidence-center";
import {
  createMilestoneService,
  createProjectService,
  createWorkService,
  listWorkTimeline,
} from "@/lib/work";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

export default async function JagWorkPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string; work?: string }>;
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
        No organization is available for Work & Execution™.
      </div>
    );
  }

  const organizations = listAccessibleEvidenceOrganizations(session);
  const work = createWorkService();
  const projects = createProjectService().list(org.id);
  const workItems = work.list(org.id);
  const milestones = createMilestoneService().list(org.id);
  const dashboard = work.dashboard(org.id);
  const history = listWorkTimeline(org.id);

  return (
    <JagWorkExecution
      organizations={organizations}
      organizationId={org.id}
      organizationName={org.name}
      workItems={workItems}
      projects={projects}
      milestones={milestones}
      dashboard={dashboard}
      history={history}
      selectedId={params.work ?? null}
    />
  );
}
