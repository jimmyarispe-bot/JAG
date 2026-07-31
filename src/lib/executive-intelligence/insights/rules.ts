/**
 * Deterministic insight rules — explicit conditions only (no AI).
 */

import {
  getQuickBooksInstallation,
  listInstallationsForOrganization,
  QBO_REPORT_LABELS,
  QBO_REPORT_TYPES,
} from "@/lib/connectors";
import {
  listEvidenceForOrganization,
  listGraphEdges,
  listGraphNodes,
  listJobsForOrganization,
  listRelationshipsForDocument,
} from "@/lib/evidence-center";
import {
  INSIGHT_ORG_REQUIREMENTS,
  INSIGHT_THRESHOLDS,
} from "@/lib/executive-intelligence/insights/config";
import {
  connectorLink,
  refsFromDocs,
} from "@/lib/executive-intelligence/insights/helpers";
import type {
  InsightRule,
  InsightRuleHit,
} from "@/lib/executive-intelligence/insights/types";

function staleMsForSchedule(frequency: string | null | undefined): number {
  if (frequency === "Daily") return INSIGHT_THRESHOLDS.dailySyncStaleMs;
  if (frequency === "Weekly") return INSIGHT_THRESHOLDS.weeklySyncStaleMs;
  return INSIGHT_THRESHOLDS.manualSyncStaleMs;
}

const financeQboSyncOverdue: InsightRule = {
  id: "finance.qbo_sync_overdue",
  domain: "Finance",
  title: "QuickBooks sync overdue",
  evaluate(ctx) {
    const qbo = getQuickBooksInstallation(ctx.organizationId);
    if (!qbo || qbo.status !== "Connected") return null;
    const windowMs = staleMsForSchedule(qbo.scheduleFrequency);
    const last = qbo.lastSyncAt ? Date.parse(qbo.lastSyncAt) : 0;
    if (last && ctx.now.getTime() - last <= windowMs) return null;

    const financial = listEvidenceForOrganization(ctx.organizationId).filter(
      (d) =>
        d.source === "QuickBooks" || d.domain === "Financial Intelligence"
    );
    const { ids, refs } = refsFromDocs(financial);
    const support =
      refs.length > 0
        ? refs
        : [
            connectorLink(
              ctx.organizationId,
              "quickbooks-online",
              "QuickBooks Online connector"
            ),
          ];

    return {
      severity: "Warning",
      title: "QuickBooks has not synchronized within the configured schedule",
      description: qbo.lastSyncAt
        ? `Last sync was ${qbo.lastSyncAt}. Schedule is ${qbo.scheduleFrequency}.`
        : `QuickBooks is connected (${qbo.scheduleFrequency} schedule) but has never synchronized.`,
      supportingEvidenceIds: ids,
      supportingEvidence: support,
      relatedConnectorIds: ["quickbooks-online"],
      relatedGraphNodeIds: [],
      suggestedNextStep:
        "Open Connectors™ and run Sync Now for QuickBooks Online, or confirm OAuth is still valid.",
    } satisfies InsightRuleHit;
  },
};

const financeAwaitingReview: InsightRule = {
  id: "finance.financial_awaiting_review",
  domain: "Finance",
  title: "Financial evidence awaiting review",
  evaluate(ctx) {
    const pending = listEvidenceForOrganization(ctx.organizationId).filter(
      (d) =>
        (d.source === "QuickBooks" ||
          d.domain === "Financial Intelligence") &&
        d.status === "awaiting_review"
    );
    if (pending.length <= INSIGHT_THRESHOLDS.financialAwaitingReview) {
      return null;
    }
    const { ids, refs } = refsFromDocs(pending);
    return {
      severity: pending.length >= 10 ? "Critical" : "Warning",
      title: "Financial evidence awaiting review exceeds threshold",
      description: `${pending.length} financial evidence record(s) await review (threshold ${INSIGHT_THRESHOLDS.financialAwaitingReview}).`,
      supportingEvidenceIds: ids,
      supportingEvidence: refs,
      relatedConnectorIds: ["quickbooks-online"],
      relatedGraphNodeIds: [],
      suggestedNextStep:
        "Review financial evidence in Evidence Catalog™ and approve or return items awaiting review.",
    };
  },
};

const financeMissingReports: InsightRule = {
  id: "finance.missing_required_reports",
  domain: "Finance",
  title: "Required financial reports missing",
  evaluate(ctx) {
    const qbo = getQuickBooksInstallation(ctx.organizationId);
    if (!qbo || qbo.status !== "Connected") return null;

    const docs = listEvidenceForOrganization(ctx.organizationId).filter(
      (d) => d.source === "QuickBooks"
    );
    const year = String(ctx.now.getUTCFullYear());
    const periodDocs = docs.filter(
      (d) =>
        d.reportingPeriodLabel.includes(year) ||
        d.reportingPeriodLabel.includes("FY") ||
        d.reportingPeriodLabel.length > 0
    );
    const corpus = periodDocs.length > 0 ? periodDocs : docs;
    const missing = QBO_REPORT_TYPES.filter((type) => {
      const label = QBO_REPORT_LABELS[type];
      return !corpus.some((d) => d.name.includes(label));
    });
    if (missing.length === 0) return null;

    const { ids, refs } = refsFromDocs(corpus);
    const support =
      refs.length > 0
        ? refs
        : [
            connectorLink(
              ctx.organizationId,
              "quickbooks-online",
              "QuickBooks Online connector"
            ),
          ];

    return {
      severity: missing.length >= 3 ? "Critical" : "Warning",
      title: "Required financial reports are missing for the current reporting period",
      description: `Missing: ${missing.map((t) => QBO_REPORT_LABELS[t]).join(", ")}.`,
      supportingEvidenceIds: ids,
      supportingEvidence: support,
      relatedConnectorIds: ["quickbooks-online"],
      relatedGraphNodeIds: [],
      suggestedNextStep:
        "Run an Initial Sync for QuickBooks Online to import Profit & Loss, Balance Sheet, Cash Flow, Trial Balance, and Chart of Accounts.",
    };
  },
};

const opsQueue: InsightRule = {
  id: "ops.processing_queue_threshold",
  domain: "Operations",
  title: "Processing queue exceeds threshold",
  evaluate(ctx) {
    const jobs = listJobsForOrganization(ctx.organizationId);
    const waiting = jobs.filter(
      (j) =>
        j.status === "Pending" ||
        j.status === "Queued" ||
        j.status === "Running"
    );
    if (waiting.length <= INSIGHT_THRESHOLDS.processingQueue) return null;

    const docs = listEvidenceForOrganization(ctx.organizationId).filter((d) =>
      waiting.some((j) => j.evidenceId === d.id)
    );
    const { ids, refs } = refsFromDocs(
      docs.length > 0 ? docs : listEvidenceForOrganization(ctx.organizationId)
    );
    if (refs.length === 0) return null;

    return {
      severity: waiting.length >= 25 ? "Critical" : "Warning",
      title: "Processing queue exceeds threshold",
      description: `${waiting.length} jobs are waiting or running (threshold ${INSIGHT_THRESHOLDS.processingQueue}).`,
      supportingEvidenceIds: ids,
      supportingEvidence: refs,
      relatedConnectorIds: [],
      relatedGraphNodeIds: [],
      suggestedNextStep:
        "Open Evidence Pipeline™, inspect queued jobs, and resolve blockers or retry failed stages.",
    };
  },
};

const opsFailures: InsightRule = {
  id: "ops.processing_failures_threshold",
  domain: "Operations",
  title: "Processing failures exceed threshold",
  evaluate(ctx) {
    const failed = listJobsForOrganization(ctx.organizationId).filter(
      (j) => j.status === "Failed"
    );
    if (failed.length <= INSIGHT_THRESHOLDS.processingFailures) return null;

    const docs = listEvidenceForOrganization(ctx.organizationId).filter((d) =>
      failed.some((j) => j.evidenceId === d.id)
    );
    const { ids, refs } = refsFromDocs(
      docs.length > 0 ? docs : listEvidenceForOrganization(ctx.organizationId)
    );
    if (refs.length === 0) return null;

    return {
      severity: failed.length >= 5 ? "Critical" : "Warning",
      title: "Processing failures exceed threshold",
      description: `${failed.length} processing job(s) failed (threshold ${INSIGHT_THRESHOLDS.processingFailures}).`,
      supportingEvidenceIds: ids,
      supportingEvidence: refs,
      relatedConnectorIds: [],
      relatedGraphNodeIds: [],
      suggestedNextStep:
        "Review failed pipeline jobs, fix validation issues, and retry from Evidence Pipeline™.",
    };
  },
};

const opsConnectorHealth: InsightRule = {
  id: "ops.connector_health_degraded",
  domain: "Operations",
  title: "Connector health degraded",
  evaluate(ctx) {
    const degraded = listInstallationsForOrganization(ctx.organizationId).filter(
      (i) =>
        i.health === "Warning" ||
        i.health === "Error" ||
        i.status === "Error" ||
        i.status === "Disconnected"
    );
    if (degraded.length === 0) return null;

    const docs = listEvidenceForOrganization(ctx.organizationId);
    const { ids, refs } = refsFromDocs(docs);
    const connectorIds = degraded.map((i) => i.connectorId);
    const support =
      refs.length > 0
        ? refs
        : degraded.map((i) =>
            connectorLink(ctx.organizationId, i.connectorId, i.connectorId)
          );

    return {
      severity: degraded.some(
        (i) => i.health === "Error" || i.status === "Error"
      )
        ? "Critical"
        : "Warning",
      title: "Connector health is degraded",
      description: `${degraded.length} connector installation(s) report Warning/Error health or Disconnected/Error status.`,
      supportingEvidenceIds: ids,
      supportingEvidence: support,
      relatedConnectorIds: connectorIds,
      relatedGraphNodeIds: [],
      suggestedNextStep:
        "Open Connectors™, review health errors, and reconnect or retry sync for affected systems.",
    };
  },
};

const knowledgeNoRelationships: InsightRule = {
  id: "knowledge.evidence_no_relationships",
  domain: "Knowledge",
  title: "New evidence has no relationships",
  evaluate(ctx) {
    const cutoff = ctx.now.getTime() - INSIGHT_THRESHOLDS.newEvidenceMs;
    const orphaned = listEvidenceForOrganization(ctx.organizationId).filter(
      (d) => {
        if (Date.parse(d.createdAt) < cutoff) return false;
        return (
          listRelationshipsForDocument(ctx.organizationId, d.id).length === 0
        );
      }
    );
    if (orphaned.length === 0) return null;

    const { ids, refs } = refsFromDocs(orphaned);
    const nodes = listGraphNodes(ctx.organizationId)
      .filter(
        (n) =>
          n.nodeType === "Evidence" &&
          n.externalId != null &&
          ids.includes(n.externalId)
      )
      .map((n) => n.id);

    return {
      severity: orphaned.length >= 5 ? "Warning" : "Info",
      title: "New evidence has no relationships",
      description: `${orphaned.length} recently added evidence record(s) have no catalog relationships.`,
      supportingEvidenceIds: ids,
      supportingEvidence: refs,
      relatedConnectorIds: [],
      relatedGraphNodeIds: nodes,
      suggestedNextStep:
        "Open Evidence Catalog™ and link related documents (SUPPORTED_BY, REFERENCES, etc.).",
    };
  },
};

const knowledgeAwaitingClassification: InsightRule = {
  id: "knowledge.awaiting_classification",
  domain: "Knowledge",
  title: "Evidence awaiting classification",
  evaluate(ctx) {
    const pending = listEvidenceForOrganization(ctx.organizationId).filter(
      (d) => d.status === "queued" || d.status === "processing"
    );
    if (pending.length === 0) return null;

    const { ids, refs } = refsFromDocs(pending);
    return {
      severity: pending.length >= 10 ? "Warning" : "Info",
      title: "Evidence awaiting classification",
      description: `${pending.length} evidence record(s) are still queued or processing (classification stage pending).`,
      supportingEvidenceIds: ids,
      supportingEvidence: refs,
      relatedConnectorIds: [],
      relatedGraphNodeIds: [],
      suggestedNextStep:
        "Monitor Evidence Pipeline™ until classification completes, then review items awaiting review.",
    };
  },
};

const knowledgeOrphanedNodes: InsightRule = {
  id: "knowledge.orphaned_graph_nodes",
  domain: "Knowledge",
  title: "Orphaned graph nodes",
  evaluate(ctx) {
    const nodes = listGraphNodes(ctx.organizationId);
    const edges = listGraphEdges(ctx.organizationId);
    const linked = new Set<string>();
    for (const e of edges) {
      linked.add(e.fromNodeId);
      linked.add(e.toNodeId);
    }
    const orphaned = nodes.filter(
      (n) => n.nodeType === "Evidence" && !linked.has(n.id)
    );
    if (orphaned.length === 0) return null;

    const evidenceIds = orphaned
      .map((n) => n.externalId)
      .filter((id): id is string => Boolean(id));
    const docs = listEvidenceForOrganization(ctx.organizationId).filter((d) =>
      evidenceIds.includes(d.id)
    );
    const { ids, refs } = refsFromDocs(
      docs.length > 0 ? docs : listEvidenceForOrganization(ctx.organizationId)
    );
    if (refs.length === 0) return null;

    return {
      severity: orphaned.length >= 5 ? "Warning" : "Info",
      title: "Orphaned graph nodes",
      description: `${orphaned.length} Evidence node(s) in the Knowledge Graph™ have no relationships.`,
      supportingEvidenceIds: ids,
      supportingEvidence: refs,
      relatedConnectorIds: [],
      relatedGraphNodeIds: orphaned.map((n) => n.id),
      suggestedNextStep:
        "Inspect Evidence Knowledge Graph™ and create relationships for isolated Evidence nodes.",
    };
  },
};

const orgNoActivity: InsightRule = {
  id: "org.no_recent_activity",
  domain: "Organization",
  title: "No recent organizational activity",
  evaluate(ctx) {
    const docs = listEvidenceForOrganization(ctx.organizationId);
    if (docs.length === 0) return null;
    const latest = Math.max(...docs.map((d) => Date.parse(d.updatedAt)));
    if (ctx.now.getTime() - latest <= INSIGHT_THRESHOLDS.orgActivityStaleMs) {
      return null;
    }
    const sorted = [...docs].sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt)
    );
    const { ids, refs } = refsFromDocs(sorted);
    return {
      severity: "Info",
      title: "No recent organizational activity",
      description: `No evidence updates in the last ${Math.round(INSIGHT_THRESHOLDS.orgActivityStaleMs / (24 * 60 * 60 * 1000))} days. Latest update: ${sorted[0]?.updatedAt ?? "—"}.`,
      supportingEvidenceIds: ids,
      supportingEvidence: refs,
      relatedConnectorIds: [],
      relatedGraphNodeIds: [],
      suggestedNextStep:
        "Upload new evidence or run connector syncs so organizational activity continues to accumulate.",
    };
  },
};

const orgMissingCoverage: InsightRule = {
  id: "org.missing_required_coverage",
  domain: "Organization",
  title: "Missing required business units or departments",
  evaluate(ctx) {
    const docs = listEvidenceForOrganization(ctx.organizationId);
    if (docs.length === 0) return null;

    const missingUnits = INSIGHT_ORG_REQUIREMENTS.requiredBusinessUnits.filter(
      (unit) =>
        !docs.some(
          (d) => d.businessUnit.toLowerCase() === unit.toLowerCase()
        )
    );
    const missingDepartments =
      INSIGHT_ORG_REQUIREMENTS.requiredDepartments.filter(
        (dept) =>
          !docs.some(
            (d) => d.department.toLowerCase() === dept.toLowerCase()
          )
      );

    if (missingUnits.length === 0 && missingDepartments.length === 0) {
      return null;
    }

    const { ids, refs } = refsFromDocs(docs);
    const parts: string[] = [];
    if (missingUnits.length > 0) {
      parts.push(`business units: ${missingUnits.join(", ")}`);
    }
    if (missingDepartments.length > 0) {
      parts.push(`departments: ${missingDepartments.join(", ")}`);
    }

    return {
      severity: "Warning",
      title: "Missing required business units or departments",
      description: `Configured coverage is incomplete — ${parts.join("; ")}.`,
      supportingEvidenceIds: ids,
      supportingEvidence: refs,
      relatedConnectorIds: [],
      relatedGraphNodeIds: [],
      suggestedNextStep:
        "Tag evidence with the required business units/departments or adjust organizational requirements configuration.",
    };
  },
};

export const DEFAULT_INSIGHT_RULES: readonly InsightRule[] = Object.freeze([
  financeQboSyncOverdue,
  financeAwaitingReview,
  financeMissingReports,
  opsQueue,
  opsFailures,
  opsConnectorHealth,
  knowledgeNoRelationships,
  knowledgeAwaitingClassification,
  knowledgeOrphanedNodes,
  orgNoActivity,
  orgMissingCoverage,
]);
