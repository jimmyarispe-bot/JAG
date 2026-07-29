/**
 * Decision Center query — filter, search, group projected proposals.
 */

import { listOrganizationsForSession } from "@/lib/jag-business/organizations-view";
import type { JagPlatformSession } from "@/lib/jag-platform/session";
import {
  getStoredExecution,
  listStoredExecutionsForOrganizations,
} from "../intelligence-store";
import { decisionGroupLabel, resolveContributorCatalog } from "./catalog";
import { projectDecisionCard, projectDecisionsFromExecutions } from "./project";
import { getDecisionTimeline } from "./status-store";
import type {
  JagDecisionCard,
  JagDecisionCenterModel,
  JagDecisionDetail,
  JagDecisionFilters,
  JagDecisionGroup,
  JagDecisionPriorityLabel,
  JagDecisionStatus,
} from "./types";
import { JAG_DECISION_GROUPS, JAG_DECISION_STATUSES } from "./types";

export function loadDecisionCenter(
  session: JagPlatformSession,
  filters: JagDecisionFilters = {}
): JagDecisionCenterModel {
  const organizations = listOrganizationsForSession(session);
  const orgIds = organizations.map((o) => o.id);
  const orgNames = Object.fromEntries(
    organizations.map((o) => [o.id, o.name] as const)
  );

  const executions = listStoredExecutionsForOrganizations(orgIds, 500);
  const all = projectDecisionsFromExecutions({
    executions,
    organizationNames: orgNames,
  });
  const decisions = applyFilters(all, filters);

  const grouped = emptyGroups();
  for (const d of decisions) {
    grouped[d.category] = [...grouped[d.category], d];
  }

  const byStatus = Object.fromEntries(
    JAG_DECISION_STATUSES.map((s) => [s, 0])
  ) as Record<JagDecisionStatus, number>;
  const byGroup = Object.fromEntries(
    JAG_DECISION_GROUPS.map((g) => [g, 0])
  ) as Record<JagDecisionGroup, number>;
  for (const d of all) {
    byStatus[d.status] += 1;
    byGroup[d.category] += 1;
  }

  const packOpts = uniqueOptions(
    all.map((d) => ({ id: d.capabilityPackId, label: d.capabilityPackName }))
  );
  const contributorOpts = uniqueOptions(
    all.map((d) => ({ id: d.contributorId, label: d.contributorLabel }))
  );
  const domainOpts = uniqueOptions(
    all.map((d) => ({ id: d.domainId, label: d.domainName }))
  );

  return {
    decisions,
    grouped,
    filters,
    filterOptions: {
      organizations: organizations.map((o) => ({ id: o.id, label: o.name })),
      domains: domainOpts,
      packs: packOpts,
      contributors: contributorOpts,
      statuses: JAG_DECISION_STATUSES,
      priorities: ["P1", "P2", "P3"],
    },
    counts: {
      total: all.length,
      byStatus,
      byGroup,
    },
  };
}

export function getDecisionCenterDetail(
  session: JagPlatformSession,
  decisionId: string
): JagDecisionDetail | null {
  const model = loadDecisionCenter(session, {});
  const card = model.decisions.find((d) => d.id === decisionId);
  if (!card) {
    // May be filtered out of empty org set — scan all stored executions.
    return findDetailAcrossOrgs(session, decisionId);
  }
  return buildDetail(card);
}

function findDetailAcrossOrgs(
  session: JagPlatformSession,
  decisionId: string
): JagDecisionDetail | null {
  const organizations = listOrganizationsForSession(session);
  const orgNames = Object.fromEntries(
    organizations.map((o) => [o.id, o.name] as const)
  );
  const executions = listStoredExecutionsForOrganizations(
    organizations.map((o) => o.id),
    500
  );
  for (const execution of executions) {
    for (const proposal of execution.suggestedActions) {
      const card = projectDecisionCard({
        execution,
        proposal,
        organizationName:
          orgNames[execution.organizationId] ?? execution.organizationId,
      });
      if (card.id === decisionId) return buildDetail(card);
    }
  }
  return null;
}

function buildDetail(card: JagDecisionCard): JagDecisionDetail {
  const execution = getStoredExecution(card.organizationId, card.executionId);
  const detail = execution?.detail;
  const catalog = resolveContributorCatalog(card.contributorId);

  const evidence = (detail?.evidence ?? []).map((e) => ({
    id: e.id,
    source: e.source,
    code:
      typeof e.attributes?.code === "string" ? e.attributes.code : undefined,
    summary:
      typeof e.attributes?.summary === "string"
        ? e.attributes.summary
        : typeof e.attributes?.message === "string"
          ? e.attributes.message
          : undefined,
  }));

  const recommendations = (detail?.recommendations ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    explanation: r.explanation,
    confidence: r.confidence,
    priority: r.priority,
  }));

  const policyTrace = evidence
    .filter((e) => e.code?.includes("policy") || e.source.includes("policy"))
    .map((e) => e.summary || e.code || e.id);

  const knowledgeReferences = [
    ...new Set(
      [
        catalog.domainId,
        catalog.capabilityPackId,
        ...(detail?.attributes?.entityIds &&
        Array.isArray(detail.attributes.entityIds)
          ? detail.attributes.entityIds.filter(
              (x): x is string => typeof x === "string"
            )
          : []),
        ...(typeof detail?.attributes?.capabilityId === "string"
          ? [detail.attributes.capabilityId]
          : []),
      ].filter(Boolean)
    ),
  ];

  const laws = [
    ...new Set(
      (detail?.recommendations ?? []).flatMap(
        (r) => r.constitutionalTrace?.laws ?? []
      )
    ),
  ];
  const rationale =
    detail?.recommendations[0]?.constitutionalTrace?.rationale ||
    execution?.resultSummary ||
    card.rationale;

  return {
    card,
    evidence,
    recommendations,
    policyTrace:
      policyTrace.length > 0
        ? policyTrace
        : ["No policy evaluation traces were attached to this proposal."],
    knowledgeReferences,
    contributorTrace: {
      contributorId: card.contributorId,
      readiness: detail?.readiness ?? "unknown",
      explanation: execution?.resultSummary ?? card.rationale,
      blockingIssues: detail?.blockingIssues ?? [],
      warnings: detail?.warnings ?? [],
      laws,
      rationale,
    },
    dependencies: detail?.dependsOn ?? [],
    timeline: getDecisionTimeline(card.id),
    observability: {
      analyzedAt: card.analyzedAt,
      durationMs: execution?.durationMs,
      evidenceCount: card.evidenceCount,
      recommendationCount: recommendations.length,
      confidence: card.confidence,
    },
  };
}

function applyFilters(
  decisions: readonly JagDecisionCard[],
  filters: JagDecisionFilters
): JagDecisionCard[] {
  const q = filters.q?.trim().toLowerCase();
  return decisions.filter((d) => {
    if (
      filters.priority &&
      filters.priority !== "all" &&
      d.priority !== filters.priority
    ) {
      return false;
    }
    if (
      filters.organizationId &&
      filters.organizationId !== "all" &&
      d.organizationId !== filters.organizationId
    ) {
      return false;
    }
    if (
      filters.domainId &&
      filters.domainId !== "all" &&
      d.domainId !== filters.domainId
    ) {
      return false;
    }
    if (
      filters.capabilityPackId &&
      filters.capabilityPackId !== "all" &&
      d.capabilityPackId !== filters.capabilityPackId
    ) {
      return false;
    }
    if (
      filters.status &&
      filters.status !== "all" &&
      d.status !== filters.status
    ) {
      return false;
    }
    if (
      filters.contributorId &&
      filters.contributorId !== "all" &&
      d.contributorId !== filters.contributorId
    ) {
      return false;
    }
    if (filters.group && filters.group !== "all" && d.category !== filters.group) {
      return false;
    }
    if (q) {
      const haystack = [
        d.title,
        d.recommendedAction,
        d.rationale,
        d.contributorLabel,
        d.capabilityPackName,
      ]
        .join(" ")
        .toLowerCase();
      // Evidence search via execution detail codes/summaries when present
      const execution = getStoredExecution(d.organizationId, d.executionId);
      const evidenceText = (execution?.detail?.evidence ?? [])
        .map((e) =>
          [e.attributes?.code, e.attributes?.summary, e.attributes?.message]
            .filter(Boolean)
            .join(" ")
        )
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q) && !evidenceText.includes(q)) return false;
    }
    return true;
  });
}

function emptyGroups(): Record<JagDecisionGroup, JagDecisionCard[]> {
  return {
    students: [],
    operations: [],
    funding: [],
    executive: [],
  };
}

function uniqueOptions(
  items: readonly { id: string; label: string }[]
): { id: string; label: string }[] {
  const map = new Map<string, string>();
  for (const item of items) {
    if (!map.has(item.id)) map.set(item.id, item.label);
  }
  return [...map.entries()].map(([id, label]) => ({ id, label }));
}

export function listDecisionGroupLabels(): readonly {
  id: JagDecisionGroup;
  label: string;
}[] {
  return JAG_DECISION_GROUPS.map((id) => ({
    id,
    label: decisionGroupLabel(id),
  }));
}

export type { JagDecisionPriorityLabel };
