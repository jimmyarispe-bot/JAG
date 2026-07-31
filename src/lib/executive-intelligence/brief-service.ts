import { listInstallationsForOrganization } from "@/lib/connectors";
import {
  listEvidenceForOrganization,
  listJobsForOrganization,
  queueSummary,
} from "@/lib/evidence-center";
import { JAG_PLATFORM_VERSION } from "@/lib/jag-platform/versioning";
import type { ExecutiveBrief } from "@/lib/executive-intelligence/types";

export function buildExecutiveBrief(input: {
  organizationId: string;
  organizationName: string;
  now?: Date;
}): ExecutiveBrief {
  const docs = listEvidenceForOrganization(input.organizationId);
  const queue = queueSummary(input.organizationId);
  const jobs = listJobsForOrganization(input.organizationId);
  const waiting = jobs.filter(
    (j) => j.status === "Pending" || j.status === "Queued"
  ).length;
  const running = jobs.filter((j) => j.status === "Running").length;
  const failed = jobs.filter((j) => j.status === "Failed").length;
  const connected = listInstallationsForOrganization(input.organizationId).filter(
    (i) => i.status === "Connected"
  ).length;

  let label = "Clear";
  if (failed > 0) label = "Attention — failed jobs";
  else if (waiting + running > 0) label = "Active";
  else if (queue.awaiting_review > 0) label = "Review backlog";

  const now = input.now ?? new Date();

  return {
    organizationId: input.organizationId,
    organizationName: input.organizationName,
    currentDate: now.toISOString().slice(0, 10),
    platformVersion: JAG_PLATFORM_VERSION.platformVersion,
    connectedSystems: connected,
    totalEvidence: docs.length,
    evidenceAwaitingReview: queue.awaiting_review,
    processingQueueStatus: {
      waiting,
      running,
      failed,
      label,
    },
  };
}
