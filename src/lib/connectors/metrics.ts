import {
  listInstallationsForOrganization,
  listSyncJobsForOrganization,
} from "@/lib/connectors/store";
import type { ConnectorDashboardMetrics } from "@/lib/connectors/types";

export function getConnectorDashboardMetrics(
  organizationId: string
): ConnectorDashboardMetrics {
  const installations = listInstallationsForOrganization(organizationId);
  const jobs = listSyncJobsForOrganization(organizationId);

  const lastInstall = installations[0]?.updatedAt ?? null;
  const lastJob = [...jobs].sort((a, b) =>
    (b.completedAt ?? b.createdAt).localeCompare(a.completedAt ?? a.createdAt)
  )[0];
  const lastJobAt = lastJob
    ? lastJob.completedAt ?? lastJob.createdAt
    : null;

  let lastActivity: string | null = lastInstall;
  if (lastJobAt && (!lastActivity || lastJobAt > lastActivity)) {
    lastActivity = lastJobAt;
  }

  return {
    installedConnectors: installations.length,
    connectedSystems: installations.filter((i) => i.status === "Connected")
      .length,
    healthyConnectors: installations.filter(
      (i) => i.health === "Healthy" && i.enabled
    ).length,
    failedSyncs: jobs.filter((j) => j.status === "Failed").length,
    pendingSyncs: jobs.filter(
      (j) => j.status === "Pending" || j.status === "Running"
    ).length,
    lastActivity,
  };
}
