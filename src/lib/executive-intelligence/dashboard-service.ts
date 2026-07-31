import {
  createConnectorHealthService,
  getQuickBooksInstallation,
  listInstallationsForOrganization,
  listQuickBooksSyncHistory,
  QBO_REPORT_LABELS,
} from "@/lib/connectors";
import {
  catalogDashboardSummary,
  knowledgeGraphSummary,
  listBusinessUnitsForOrganization,
  listEvidenceForOrganization,
  listGraphEdges,
  listGraphNodes,
  listJobsForOrganization,
  pipelineDashboardMetrics,
} from "@/lib/evidence-center";
import { getPlatformHealthSnapshot } from "@/lib/jag-platform/health";
import { generateExecutiveAlerts } from "@/lib/executive-intelligence/alerts-service";
import { buildExecutiveBrief } from "@/lib/executive-intelligence/brief-service";
import { calculateExecutiveHealthScore } from "@/lib/executive-intelligence/health-service";
import {
  getDecisionService,
  getDecisionSummary,
} from "@/lib/executive-intelligence/decisions";
import { evaluateExecutiveInsights } from "@/lib/executive-intelligence/insights";
import { getExecutiveMetrics } from "@/lib/executive-intelligence/metrics-service";
import { buildExecutiveTimeline } from "@/lib/executive-intelligence/timeline-service";
import type {
  ExecutiveDashboard,
  ExecutiveDashboardCard,
  FinancialIntelligenceSection,
  KnowledgeIntelligenceSection,
  OperationalIntelligenceSection,
  OrganizationalIntelligenceSection,
} from "@/lib/executive-intelligence/types";
import { getStrategySummary } from "@/lib/goals";
import { getOrganizationalKnowledgeSummary } from "@/lib/memory";
import { getRiskSummary } from "@/lib/risk";
import { getExecutionSummary } from "@/lib/work";

function buildFinancial(organizationId: string): FinancialIntelligenceSection {
  const qbo = getQuickBooksInstallation(organizationId);
  const history = listQuickBooksSyncHistory(organizationId);
  const lastJob = history.jobs[0] ?? null;
  const docs = listEvidenceForOrganization(organizationId).filter(
    (d) => d.source === "QuickBooks" || d.domain === "Financial Intelligence"
  );
  const pending = docs.filter(
    (d) =>
      d.status === "queued" ||
      d.status === "processing" ||
      d.status === "awaiting_review"
  ).length;

  const reportNames = Object.values(QBO_REPORT_LABELS);

  return {
    latestSyncAt: qbo?.lastSyncAt ?? lastJob?.completedAt ?? null,
    lastImportedReports: lastJob?.status === "Completed" ? reportNames : [],
    financialDocumentsImported: docs.filter((d) => d.source === "QuickBooks")
      .length,
    pendingFinancialEvidence: pending,
    connectorStatus: qbo?.status ?? "Not Installed",
    companyName: qbo?.companyName ?? null,
  };
}

function buildOrganizational(
  organizationId: string
): OrganizationalIntelligenceSection {
  const catalog = catalogDashboardSummary(organizationId);
  const docs = [...listEvidenceForOrganization(organizationId)].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt)
  );
  const departments = [
    ...new Set(docs.map((d) => d.department).filter(Boolean)),
  ];
  const recentActivity = docs.slice(0, 8).map((d) => ({
    at: d.updatedAt,
    label: `${d.name} updated`,
  }));

  return {
    businessUnits: listBusinessUnitsForOrganization(organizationId),
    departments,
    evidenceByDomain: catalog.byDomain,
    recentActivity,
    recentlyUpdatedDocuments: docs.slice(0, 8).map((d) => ({
      id: d.id,
      name: d.name,
      updatedAt: d.updatedAt,
    })),
  };
}

function buildOperational(
  organizationId: string
): OperationalIntelligenceSection {
  const jobs = listJobsForOrganization(organizationId);
  const metrics = pipelineDashboardMetrics(organizationId);
  const connectorHealth = createConnectorHealthService().summarize(
    organizationId
  );
  const platform = getPlatformHealthSnapshot();
  const qbo = getQuickBooksInstallation(organizationId);
  const installations = listInstallationsForOrganization(organizationId);
  const syncing = installations.some((i) => i.status === "Syncing");

  return {
    processingJobs: jobs.length,
    failedJobs: metrics.jobsFailed,
    completedJobs: metrics.jobsCompleted,
    connectorHealth,
    platformHealthLabel: platform.systemHealth,
    syncStatus: syncing
      ? "Syncing"
      : qbo?.status === "Connected"
        ? "Idle"
        : qbo?.status ?? "No connector",
  };
}

function buildKnowledge(organizationId: string): KnowledgeIntelligenceSection {
  const kg = knowledgeGraphSummary(organizationId);
  const evidenceNodes = listGraphNodes(organizationId)
    .filter((n) => n.nodeType === "Evidence")
    .slice(0, 8);
  const edges = listGraphEdges(organizationId).slice(0, 8);

  return {
    totalGraphNodes: kg.nodeCount,
    relationships: kg.edgeCount,
    recentlyAddedEvidence: evidenceNodes.map((n) => ({
      id: n.id,
      label: n.label,
      createdAt: n.createdAt,
    })),
    recentlyUpdatedRelationships: edges.map((e) => ({
      id: e.id,
      relationshipType: e.relationshipType,
      updatedAt: e.updatedAt,
    })),
  };
}

function buildCards(
  organizationId: string,
  organizationName: string,
  dashboard: Omit<ExecutiveDashboard, "cards" | "timeline">
): readonly ExecutiveDashboardCard[] {
  return Object.freeze([
    {
      id: "platform",
      title: "Platform",
      value: dashboard.brief.platformVersion,
      subtitle: organizationName,
      href: "/jag/dashboard",
    },
    {
      id: "organizations",
      title: "Organizations",
      value: dashboard.metrics.organizations,
      href: "/jag/organizations",
    },
    {
      id: "evidence",
      title: "Evidence",
      value: dashboard.metrics.evidenceDocuments,
      subtitle: `${dashboard.metrics.evidenceAwaitingReview} awaiting review`,
      href: "/jag/evidence",
    },
    {
      id: "connectors",
      title: "Connectors",
      value: dashboard.metrics.connectedSystems,
      subtitle: `Health ${dashboard.metrics.connectorHealthScore}%`,
      href: "/jag/connectors",
    },
    {
      id: "pipeline",
      title: "Pipeline",
      value: dashboard.metrics.processingJobs,
      subtitle: `${dashboard.metrics.failedJobs} failed`,
      href: "/jag/evidence?tab=pipeline",
    },
    {
      id: "knowledge-graph",
      title: "Knowledge Graph",
      value: dashboard.metrics.knowledgeNodes,
      subtitle: `${dashboard.metrics.knowledgeRelationships} relationships`,
      href: "/jag/evidence?tab=graph",
    },
    {
      id: "health",
      title: "Health",
      value: dashboard.health.score,
      subtitle: dashboard.health.label,
      href: "/jag/health",
    },
    {
      id: "recent-activity",
      title: "Recent Activity",
      value: dashboard.organizational.recentActivity.length,
      subtitle: "Recent document updates",
      href: `/jag/executive?org=${encodeURIComponent(organizationId)}`,
    },
    {
      id: "decisions",
      title: "Open Decisions",
      value: dashboard.decisionSummary.open,
      subtitle: `${dashboard.decisionSummary.critical} critical · ${dashboard.decisionSummary.overdue} overdue`,
      href: `/jag/decisions?org=${encodeURIComponent(organizationId)}`,
    },
    {
      id: "goals",
      title: "Active Goals",
      value: dashboard.strategySummary.activeGoals,
      subtitle: `${dashboard.strategySummary.goalsAtRisk} at risk · ${dashboard.strategySummary.averageProgress}% avg`,
      href: `/jag/goals?org=${encodeURIComponent(organizationId)}`,
    },
    {
      id: "risk",
      title: "Critical Risks",
      value: dashboard.riskSummary.criticalRisks,
      subtitle: `${dashboard.riskSummary.highRisks} high · ${dashboard.riskSummary.openMitigations} open mitigations`,
      href: `/jag/risk?org=${encodeURIComponent(organizationId)}`,
    },
    {
      id: "work",
      title: "Active Work",
      value: dashboard.executionSummary.activeWorkItems,
      subtitle: `${dashboard.executionSummary.blockedWork} blocked · ${dashboard.executionSummary.overdueWork} overdue`,
      href: `/jag/work?org=${encodeURIComponent(organizationId)}`,
    },
    {
      id: "memory",
      title: "Organizational Knowledge",
      value: dashboard.organizationalKnowledge.published,
      subtitle: `${dashboard.organizationalKnowledge.pendingValidation} pending · ${dashboard.organizationalKnowledge.newMemories} new`,
      href: `/jag/memory?org=${encodeURIComponent(organizationId)}`,
    },
  ]);
}

export function buildExecutiveDashboard(input: {
  organizationId: string;
  organizationName: string;
  organizationCount?: number;
}): ExecutiveDashboard {
  const brief = buildExecutiveBrief({
    organizationId: input.organizationId,
    organizationName: input.organizationName,
  });
  const metrics = getExecutiveMetrics({
    organizationId: input.organizationId,
    organizationCount: input.organizationCount,
  });
  const health = calculateExecutiveHealthScore(input.organizationId);
  const alerts = generateExecutiveAlerts(input.organizationId);
  const insights = evaluateExecutiveInsights(input.organizationId, "dashboard");
  getDecisionService().syncFromInsights(input.organizationId, "dashboard");
  const decisionSummary = getDecisionSummary(input.organizationId);
  const strategySummary = getStrategySummary(input.organizationId);
  const riskSummary = getRiskSummary(input.organizationId);
  const executionSummary = getExecutionSummary(input.organizationId);
  const organizationalKnowledge = getOrganizationalKnowledgeSummary(
    input.organizationId
  );
  const financial = buildFinancial(input.organizationId);
  const organizational = buildOrganizational(input.organizationId);
  const operational = buildOperational(input.organizationId);
  const knowledge = buildKnowledge(input.organizationId);
  const partial = {
    brief,
    financial,
    organizational,
    operational,
    knowledge,
    metrics,
    health,
    alerts,
    insights,
    decisionSummary,
    strategySummary,
    riskSummary,
    executionSummary,
    organizationalKnowledge,
  };
  const cards = buildCards(
    input.organizationId,
    input.organizationName,
    partial
  );
  const timeline = buildExecutiveTimeline(input.organizationId);

  return {
    ...partial,
    cards,
    timeline,
  };
}
