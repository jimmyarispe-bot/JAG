import {
  createConnectorHealthService,
  getConnectorFramework,
  listInstallationsForOrganization,
} from "@/lib/connectors";
import {
  knowledgeGraphSummary,
  listEvidenceForOrganization,
  listJobsForOrganization,
  queueSummary,
} from "@/lib/evidence-center";
import type { ExecutiveMetrics } from "@/lib/executive-intelligence/types";

export function getExecutiveMetrics(input: {
  organizationId: string;
  organizationCount?: number;
}): ExecutiveMetrics {
  const docs = listEvidenceForOrganization(input.organizationId);
  const queue = queueSummary(input.organizationId);
  const jobs = listJobsForOrganization(input.organizationId);
  const kg = knowledgeGraphSummary(input.organizationId);
  const installations = listInstallationsForOrganization(input.organizationId);
  const health = createConnectorHealthService().summarize(input.organizationId);
  const connected = installations.filter((i) => i.status === "Connected").length;
  const connectorHealthScore =
    installations.length === 0
      ? 100
      : Math.round((health.healthy / installations.length) * 100);

  return {
    organizations: input.organizationCount ?? 1,
    connectedSystems: connected,
    evidenceDocuments: docs.length,
    evidenceAwaitingReview: queue.awaiting_review,
    processingJobs: jobs.length,
    completedJobs: jobs.filter((j) => j.status === "Completed").length,
    failedJobs: jobs.filter((j) => j.status === "Failed").length,
    knowledgeNodes: kg.nodeCount,
    knowledgeRelationships: kg.edgeCount,
    connectorHealthScore,
  };
}

export function countConnectedCatalogSystems(organizationId: string): number {
  return listInstallationsForOrganization(organizationId).filter(
    (i) => i.status === "Connected"
  ).length;
}

export function catalogConnectorCount(): number {
  return getConnectorFramework().listCatalog().length;
}
