/**
 * Live Platform Health snapshot for administrators (GA readiness).
 */

import { listProvisionedOrganizations } from "@/lib/jag-business/store";
import { getConnectorFramework } from "@/lib/connectors";
import { listAllInstallations } from "@/lib/connectors/store";
import {
  knowledgeGraphSummary,
  listEvidenceForOrganization,
  listJobsForOrganization,
  pipelineDashboardMetrics,
} from "@/lib/evidence-center";
import { getAcademyWayOrganization } from "@/lib/jag-platform/organizations";
import {
  eventThroughputLastHour,
  listJagPlatformEvents,
} from "@/lib/jag-platform/events";
import { listRecentJagPlatformLogs } from "@/lib/jag-platform/logging";
import {
  formatPlatformVersionBanner,
  JAG_PLATFORM_VERSION,
  type JagPlatformVersionInfo,
} from "@/lib/jag-platform/versioning";

export type JagPlatformHealth = {
  readonly platformVersion: string;
  readonly testCountLabel: string;
  readonly marketplaceStatus: string;
  readonly providerStatus: string;
  readonly systemHealth: "operational" | "degraded" | "down";
  readonly installedPacks: number;
  readonly availableUpdates: number;
  readonly publishedPacks: number;
};

/** @deprecated Prefer getPlatformHealthSnapshot for admin dashboard. */
export const JAG_PLATFORM_HEALTH: JagPlatformHealth = Object.freeze({
  platformVersion: formatPlatformVersionBanner(),
  testCountLabel: "Vitest suite — see GA validation report",
  marketplaceStatus: "Foundation ready (not expanded in 004A)",
  providerStatus: "Reference provider available",
  systemHealth: "operational",
  installedPacks: 0,
  availableUpdates: 0,
  publishedPacks: 0,
});

export type PlatformModuleHealth = {
  readonly id: string;
  readonly name: string;
  readonly status: "operational" | "degraded" | "not_started";
  readonly detail: string;
};

export type PlatformHealthSnapshot = {
  readonly version: JagPlatformVersionInfo;
  readonly systemHealth: "operational" | "degraded" | "down";
  readonly modules: readonly PlatformModuleHealth[];
  readonly database: {
    readonly mode: "process-local + SQL schema";
    readonly schemaVersion: string;
    readonly status: "operational";
  };
  readonly evidenceQueue: {
    readonly waiting: number;
    readonly running: number;
    readonly failed: number;
  };
  readonly processingJobs: {
    readonly completed: number;
    readonly failed: number;
    readonly averageProcessingTimeMs: number;
  };
  readonly connectors: {
    readonly installed: number;
    readonly connected: number;
    readonly errored: number;
  };
  readonly failedJobs: number;
  readonly averageProcessingTimeMs: number;
  readonly eventThroughputLastHour: number;
  readonly recentErrors: readonly {
    readonly at: string;
    readonly module: string;
    readonly message: string;
    readonly correlationId?: string;
  }[];
  readonly organizationCount: number;
  readonly evidenceCount: number;
  readonly knowledgeGraphNodes: number;
  readonly knowledgeGraphEdges: number;
};

function listKnownOrganizationIds(): string[] {
  const ids = new Set<string>();
  ids.add(getAcademyWayOrganization().id);
  for (const org of listProvisionedOrganizations()) {
    ids.add(org.organizationId);
  }
  for (const installation of listAllInstallations()) {
    ids.add(installation.organizationId);
  }
  return [...ids];
}

export function getPlatformHealthSnapshot(): PlatformHealthSnapshot {
  const orgIds = listKnownOrganizationIds();
  let waiting = 0;
  let running = 0;
  let completed = 0;
  let failed = 0;
  let durationSum = 0;
  let durationCount = 0;
  let evidenceCount = 0;
  let kgNodes = 0;
  let kgEdges = 0;

  for (const organizationId of orgIds) {
    const metrics = pipelineDashboardMetrics(organizationId);
    waiting += metrics.jobsWaiting;
    running += metrics.jobsRunning;
    completed += metrics.jobsCompleted;
    failed += metrics.jobsFailed;
    if (metrics.averageProcessingTimeMs > 0) {
      durationSum += metrics.averageProcessingTimeMs;
      durationCount += 1;
    }
    evidenceCount += listEvidenceForOrganization(organizationId).length;
    const kg = knowledgeGraphSummary(organizationId);
    kgNodes += kg.nodeCount;
    kgEdges += kg.edgeCount;
    void listJobsForOrganization(organizationId);
  }

  const installations = listAllInstallations();
  const connected = installations.filter((i) => i.status === "Connected").length;
  const errored = installations.filter(
    (i) => i.status === "Error" || i.health === "Error"
  ).length;

  const catalogSize = getConnectorFramework().listCatalog().length;
  const avgMs =
    durationCount === 0 ? 0 : Math.round(durationSum / durationCount);

  const modules: PlatformModuleHealth[] = [
    {
      id: "organizations",
      name: "Organizations",
      status: "operational",
      detail: `${orgIds.length} organization(s)`,
    },
    {
      id: "identity",
      name: "Identity",
      status: "operational",
      detail: "Cookie session + demo/provisioned founders",
    },
    {
      id: "provisioning",
      name: "Customer Provisioning",
      status: "operational",
      detail: `${listProvisionedOrganizations().length} provisioned`,
    },
    {
      id: "evidence",
      name: "Evidence Center™",
      status: failed > 0 ? "degraded" : "operational",
      detail: `${evidenceCount} evidence record(s)`,
    },
    {
      id: "pipeline",
      name: "Evidence Processing Pipeline™",
      status: failed > 0 ? "degraded" : "operational",
      detail: `${completed} completed / ${failed} failed`,
    },
    {
      id: "connectors",
      name: "Connector Framework™",
      status: "operational",
      detail: `${catalogSize} catalog entries`,
    },
    {
      id: "quickbooks",
      name: "QuickBooks Online Connector™",
      status: errored > 0 ? "degraded" : "operational",
      detail: `${connected} connected installation(s)`,
    },
    {
      id: "knowledge-graph",
      name: "Evidence Knowledge Graph™",
      status: "operational",
      detail: `${kgNodes} nodes / ${kgEdges} edges`,
    },
  ];

  const systemHealth: PlatformHealthSnapshot["systemHealth"] =
    errored > 0 || failed > 5
      ? "degraded"
      : modules.every((m) => m.status !== "degraded")
        ? "operational"
        : "degraded";

  const recentErrors = listRecentJagPlatformLogs(100)
    .filter((l) => l.level === "error" || l.level === "security")
    .slice(-10)
    .reverse()
    .map((l) => ({
      at: l.at,
      module: l.module,
      message: l.message,
      correlationId: l.correlationId,
    }));

  void listJagPlatformEvents({ limit: 1 });

  return {
    version: JAG_PLATFORM_VERSION,
    systemHealth,
    modules,
    database: {
      mode: "process-local + SQL schema",
      schemaVersion: JAG_PLATFORM_VERSION.schemaVersion,
      status: "operational",
    },
    evidenceQueue: { waiting, running, failed },
    processingJobs: {
      completed,
      failed,
      averageProcessingTimeMs: avgMs,
    },
    connectors: {
      installed: installations.length,
      connected,
      errored,
    },
    failedJobs: failed,
    averageProcessingTimeMs: avgMs,
    eventThroughputLastHour: eventThroughputLastHour(),
    recentErrors,
    organizationCount: orgIds.length,
    evidenceCount,
    knowledgeGraphNodes: kgNodes,
    knowledgeGraphEdges: kgEdges,
  };
}
