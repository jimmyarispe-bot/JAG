import { redirect } from "next/navigation";
import { JagEvidenceCenter } from "@/components/jag-platform/JagEvidenceCenter";
import {
  catalogDashboardSummary,
  knowledgeGraphSummary,
  listAccessibleEvidenceOrganizations,
  listBusinessUnitsForOrganization,
  listJobsForOrganization,
  pipelineDashboardMetrics,
  queryKnowledgeGraph,
  queueSummary,
  resolveEvidenceOrganization,
  searchEvidence,
} from "@/lib/evidence-center";
import { JAG_PLATFORM_LOGIN_PATH } from "@/lib/jag-platform/auth";
import { getJagPlatformSession } from "@/lib/jag-platform/server-session";

export default async function JagEvidencePage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string; q?: string; tab?: string }>;
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
        No organization is available for Evidence Center™. Provision an
        organization or sign in with a seeded platform account.
      </div>
    );
  }

  const documents = searchEvidence({
    organizationId: org.id,
    query: params.q,
  });
  const queue = queueSummary(org.id);
  const dashboard = catalogDashboardSummary(org.id);
  const businessUnits = listBusinessUnitsForOrganization(org.id);
  const organizations = listAccessibleEvidenceOrganizations(session);
  const pipelineJobs = listJobsForOrganization(org.id);
  const pipelineMetrics = pipelineDashboardMetrics(org.id);
  const graph = queryKnowledgeGraph({ organizationId: org.id });
  const graphSummary = knowledgeGraphSummary(org.id);
  const initialTab =
    params.tab === "pipeline"
      ? "pipeline"
      : params.tab === "graph"
        ? "graph"
        : "catalog";

  return (
    <JagEvidenceCenter
      organizations={organizations}
      organizationId={org.id}
      organizationName={org.name}
      documents={documents}
      queue={queue}
      dashboard={dashboard}
      businessUnits={businessUnits}
      initialQuery={params.q ?? ""}
      initialTab={initialTab}
      pipelineJobs={pipelineJobs}
      pipelineMetrics={pipelineMetrics}
      graphNodes={graph.nodes}
      graphEdges={graph.edges}
      graphSummary={graphSummary}
    />
  );
}
