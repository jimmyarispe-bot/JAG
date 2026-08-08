/**
 * Executive Overview assembler — real services only, never fabricates metrics.
 */

import {
  EDUCATION_CAPABILITY_PACK_IDS,
  EDUCATION_DEFAULT_GRAPH_EDGES,
  EDUCATION_GRAPH_NODE_KINDS,
  EDUCATION_KNOWLEDGE_MODEL,
  createEducationPlanner,
  createEducationPolicyEngine,
  listCapabilityPacks,
  validateEducationCapabilityRegistry,
  validateEducationKnowledgeModel,
  validateEducationPolicyRegistry,
} from "@/lib/domains/education";
import { getDecisionService } from "@/lib/executive-intelligence";
import { resolveActiveWorkspaceOrganization } from "@/lib/jag-platform/active-organization";
import type { JagPlatformSession } from "@/lib/jag-platform/session";
import { loadDecisionCenter } from "./decision-center/query";
import { projectDecisionId } from "./decision-center/project";
import { listLoadedDomains } from "./domains";
import {
  getStoredExecutiveBrief,
  getStoredSchoolHealth,
  listStoredActionProposals,
  listStoredExecutions,
} from "./intelligence-store";
import { loadForecastsView } from "./predictive/load-forecasts";
import type {
  JagCapabilityPackView,
  JagDecisionExecutionDashboard,
  JagDecisionGroupId,
  JagExecutiveBriefView,
  JagExecutiveOverviewModel,
  JagForecastsOverviewView,
  JagOrgHealthView,
  JagPriorityItem,
  JagRecommendedDecisionGroup,
  JagRecommendedDecisionItem,
  JagRuntimeServiceView,
} from "./types";

const PACK_NAME_BY_ID: Readonly<Record<string, string>> = {
  [EDUCATION_CAPABILITY_PACK_IDS.studentLifecycle]: "Student Lifecycle",
  [EDUCATION_CAPABILITY_PACK_IDS.studentSupport]: "Student Support",
  [EDUCATION_CAPABILITY_PACK_IDS.academicOperations]: "Academic Operations",
  [EDUCATION_CAPABILITY_PACK_IDS.fundingCompliance]: "Funding & Compliance",
  [EDUCATION_CAPABILITY_PACK_IDS.executiveIntelligence]:
    "Executive Intelligence",
};

export function loadExecutiveOverview(
  session: JagPlatformSession,
  options?: { organizationId?: string }
): JagExecutiveOverviewModel {
  const organization = resolveActiveWorkspaceOrganization(
    session,
    options?.organizationId
  );
  const organizationId = organization?.id ?? null;

  return {
    organizationId,
    organizationName: organization?.name ?? null,
    organizationHealth: loadOrgHealth(organizationId),
    forecasts: loadForecastsForOverview(session, organizationId),
    decisionExecution: loadDecisionExecutionDashboard(session),
    priorities: loadPriorities(organizationId),
    executiveBrief: loadExecutiveBrief(organizationId),
    capabilityPacks: loadCapabilityPacks(),
    domains: listLoadedDomains(),
    runtimeStatus: loadRuntimeStatus(organizationId),
    recentIntelligence: organizationId
      ? listStoredExecutions(organizationId, 10).map((e) => ({
          id: e.id,
          contributorId: e.contributorId,
          label: e.label,
          confidence: e.confidence,
          durationMs: e.durationMs,
          resultSummary: e.resultSummary,
          analyzedAt: e.analyzedAt,
        }))
      : [],
    recommendedDecisions: loadRecommendedDecisions(organizationId),
  };
}

function loadForecastsForOverview(
  session: JagPlatformSession,
  organizationId: string | null
): JagForecastsOverviewView {
  if (!organizationId) {
    return {
      status: "empty",
      advisoryNotice: "Advisory forecasts only — never facts.",
      cards: [],
      explanation:
        "Select an organization to load predictive intelligence forecasts.",
    };
  }
  const view = loadForecastsView(session, { organizationId });
  return {
    status: view.status,
    advisoryNotice: view.advisoryNotice,
    explanation: view.explanation,
    cards: view.cards.map((c) => ({
      id: c.id,
      title: c.title,
      horizonLabel: c.horizonLabel,
      trend: c.trend,
      confidence: c.confidence,
      riskLevel: c.riskLevel,
      drivers: c.drivers,
      actions: c.actions,
      predictedSummary: c.predictedSummary,
      insufficientData: c.insufficientData,
    })),
  };
}

function loadDecisionExecutionDashboard(
  session: JagPlatformSession
): JagDecisionExecutionDashboard {
  const { metrics } = loadDecisionCenter(session, {});
  return {
    openDecisions: metrics.openDecisions,
    assigned: metrics.assigned,
    overdue: metrics.overdue,
    completedThisWeek: metrics.completedThisWeek,
    outcomeSuccessRate: metrics.outcomeSuccessRate,
    outcomeReviewedCount: metrics.outcomeReviewedCount,
    href: "/jag/decisions",
  };
}

function loadOrgHealth(organizationId: string | null): JagOrgHealthView {
  if (!organizationId) {
    return {
      status: "empty",
      primaryDrivers: [],
      explanation:
        "No organization is selected for this session. Select or provision an organization to assess health.",
    };
  }

  const stored = getStoredSchoolHealth(organizationId);
  if (!stored) {
    return {
      status: "empty",
      primaryDrivers: [],
      explanation:
        "No School Health assessment is bound to this organization yet. Run Education Executive Intelligence (School Health contributor) for an organization, then bind the execution snapshot to the Command Center store. Overall Health, Trend, Risk Level, Confidence, and Primary Drivers will appear here from that result — nothing is estimated.",
    };
  }

  return {
    status: "ready",
    overallHealth: String(stored.stance),
    healthScore: stored.healthScore,
    trend: stored.trend,
    riskLevel: stored.riskLevel,
    confidence: stored.confidence,
    primaryDrivers: stored.primaryDrivers,
    explanation: stored.explanation,
    capturedAt: stored.capturedAt,
    source: "education.cognition.school_health",
  };
}

function loadPriorities(organizationId: string | null): JagPriorityItem[] {
  if (!organizationId) return [];

  const decisions = getDecisionService()
    .listOpen(organizationId)
    .slice()
    .sort((a, b) => {
      const pr = priorityRank(a.priority) - priorityRank(b.priority);
      if (pr !== 0) return pr;
      return severityRank(b.severity) - severityRank(a.severity);
    })
    .slice(0, 5);

  return decisions.map((d) => ({
    id: d.id,
    title: d.title,
    priority: d.priority,
    severity: d.severity,
    recommendedDecision: d.recommendedProcess,
    evidenceCount: d.relatedEvidenceIds.length + d.relatedInsightIds.length,
    href: `/jag/priorities/${d.id}`,
    category: d.category,
  }));
}

function loadExecutiveBrief(
  organizationId: string | null
): JagExecutiveBriefView {
  const href = "/jag/briefings";
  if (!organizationId) {
    return {
      status: "empty",
      strategicPriorities: [],
      criticalRisks: [],
      recommendedActions: [],
      explanation:
        "Select an organization to load an Executive Education Brief.",
      href,
    };
  }

  const stored = getStoredExecutiveBrief(organizationId);
  if (!stored) {
    return {
      status: "empty",
      strategicPriorities: [],
      criticalRisks: [],
      recommendedActions: [],
      explanation:
        "No Executive Education Brief is bound yet. Bind an Education Intelligence snapshot (education.cognition.executive_briefing), or generate a narrative briefing from the Executive Briefing Engine at /jag/briefings (Organization Health, Decision Queue, readiness, and outcomes).",
      href,
    };
  }

  return {
    status: "ready",
    summary: stored.summary,
    stance: stored.stance,
    confidence: stored.confidence,
    strategicPriorities: stored.strategicPriorities,
    criticalRisks: stored.criticalRisks,
    recommendedActions: stored.recommendedActions,
    capturedAt: stored.capturedAt,
    explanation: "Latest bound Executive Education Briefing result.",
    href,
  };
}

function loadCapabilityPacks(): JagCapabilityPackView[] {
  const packs = listCapabilityPacks();
  const validation = validateEducationCapabilityRegistry();
  return packs.map((pack) => ({
    id: pack.id,
    name: pack.name,
    version: pack.version,
    status: validation.ok ? pack.maturity : "validation_error",
    contributorCount: pack.metadata.contributors.length,
    dependencies: pack.metadata.dependencies.map(
      (id) => PACK_NAME_BY_ID[id] ?? id
    ),
    description: pack.metadata.description,
  }));
}

function loadRuntimeStatus(
  organizationId: string | null
): JagRuntimeServiceView[] {
  const planner = createEducationPlanner();
  const catalog = planner.catalog();
  const policyEngine = createEducationPolicyEngine();
  const policies = policyEngine.registry().list();
  const policyIssues = validateEducationPolicyRegistry(policies).filter(
    (i) => i.severity === "error"
  );
  const knowledgeValidation = validateEducationKnowledgeModel(
    EDUCATION_KNOWLEDGE_MODEL
  );
  const hasSnapshots = organizationId
    ? listStoredExecutions(organizationId, 1).length > 0
    : false;

  return [
    {
      id: "planner",
      label: "Planner",
      health: catalog.length > 0 ? "healthy" : "unavailable",
      detail:
        catalog.length > 0
          ? `${catalog.length} Education contributors in catalog`
          : "Education planner catalog is empty",
    },
    {
      id: "graph",
      label: "Graph",
      health:
        EDUCATION_GRAPH_NODE_KINDS.length > 0 &&
        EDUCATION_DEFAULT_GRAPH_EDGES.length > 0
          ? "healthy"
          : "unavailable",
      detail: `${EDUCATION_GRAPH_NODE_KINDS.length} node kinds · ${EDUCATION_DEFAULT_GRAPH_EDGES.length} edges`,
    },
    {
      id: "policy-engine",
      label: "Policy Engine",
      health:
        policies.length > 0 && policyIssues.length === 0
          ? "healthy"
          : "unavailable",
      detail:
        policyIssues.length === 0
          ? `${policies.length} Education policies registered`
          : `Policy registry validation failed (${policyIssues.length})`,
    },
    {
      id: "knowledge-model",
      label: "Knowledge Model",
      health: knowledgeValidation.ok ? "healthy" : "unavailable",
      detail: knowledgeValidation.ok
        ? `${EDUCATION_KNOWLEDGE_MODEL.entities.length} entities · v${EDUCATION_KNOWLEDGE_MODEL.version}`
        : `Knowledge validation failed (${knowledgeValidation.errors.length})`,
    },
    {
      id: "observability",
      label: "Observability",
      health: hasSnapshots ? "healthy" : "unavailable",
      detail: hasSnapshots
        ? "Execution snapshots bound to this organization"
        : "No execution traces or snapshots bound to this session",
    },
  ];
}

function loadRecommendedDecisions(
  organizationId: string | null
): JagRecommendedDecisionGroup[] {
  const groups: Record<JagDecisionGroupId, JagRecommendedDecisionItem[]> = {
    students: [],
    operations: [],
    funding: [],
    executive: [],
  };

  if (!organizationId) {
    return emptyDecisionGroups(groups);
  }

  for (const { execution, proposal } of listStoredActionProposals(
    organizationId
  )) {
    if (proposal.priority > 2) continue;
    const group = groupForContributor(execution.contributorId);
    const decisionId = projectDecisionId({
      organizationId,
      executionId: execution.id,
      actionId: proposal.actionId,
    });
    groups[group].push({
      id: `${execution.id}:${proposal.actionId}`,
      title: proposal.label || proposal.kind,
      rationale: proposal.rationale,
      priority: proposal.priority,
      href: `/jag/decisions/${decisionId}`,
      source: execution.label,
    });
  }

  for (const decision of getDecisionService().listOpen(organizationId)) {
    if (decision.priority === "P3" && decision.severity === "Info") continue;
    const group = groupForDecisionCategory(decision.category);
    groups[group].push({
      id: `decision:${decision.id}`,
      title: decision.title,
      rationale: decision.recommendedProcess,
      priority: decision.priority,
      href: `/jag/priorities/${decision.id}`,
      source: `Decision · ${decision.category}`,
    });
  }

  for (const key of Object.keys(groups) as JagDecisionGroupId[]) {
    groups[key] = groups[key].slice(0, 6);
  }

  return emptyDecisionGroups(groups);
}

function emptyDecisionGroups(
  groups: Record<JagDecisionGroupId, JagRecommendedDecisionItem[]>
): JagRecommendedDecisionGroup[] {
  return [
    { id: "students", label: "Students", items: groups.students },
    { id: "operations", label: "Operations", items: groups.operations },
    { id: "funding", label: "Funding", items: groups.funding },
    { id: "executive", label: "Executive", items: groups.executive },
  ];
}

function groupForContributor(contributorId: string): JagDecisionGroupId {
  const id = contributorId.toLowerCase();
  if (
    id.includes("funding") ||
    id.includes("scholarship") ||
    id.includes("compliance")
  ) {
    return "funding";
  }
  if (
    id.includes("scheduling") ||
    id.includes("staffing") ||
    id.includes("capacity") ||
    id.includes("operational")
  ) {
    return "operations";
  }
  if (
    id.includes("school_health") ||
    id.includes("campus_performance") ||
    id.includes("executive")
  ) {
    return "executive";
  }
  return "students";
}

function groupForDecisionCategory(category: string): JagDecisionGroupId {
  switch (category) {
    case "Finance":
    case "Compliance":
      return "funding";
    case "Operations":
      return "operations";
    case "Organization":
    case "Knowledge":
    case "Manual":
      return "executive";
    default:
      return "executive";
  }
}

function priorityRank(priority: string): number {
  if (priority === "P1") return 0;
  if (priority === "P2") return 1;
  return 2;
}

function severityRank(severity: string): number {
  if (severity === "Critical") return 2;
  if (severity === "Warning") return 1;
  return 0;
}
