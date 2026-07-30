/**
 * ExplanationService — application façade — Sprint 208.
 */

import { CapabilityRegistry, ensureCapabilitiesRegistered } from "@/lib/platform/capabilities";
import { MemoryService } from "@/lib/platform/intelligence/memory/index";
import { StrategyService } from "@/lib/platform/intelligence/strategy/index";
import { WatcherService } from "@/lib/platform/intelligence/watchers/index";
import { generateExplanation, resetExplanationCacheForTests } from "./ExplanationEngine";
import type { ExplanationSubject } from "./ExplainabilityRegistry";
import {
  clearExplainObservationsForTests,
  listExplainObservations,
} from "./ExplainabilityObservability";
import { resetDependencyTraversalForTests } from "./DependencyExplorer";
import { buildExplainGraph, type GraphSeed } from "./GraphBuilder";
import type {
  Explanation,
  ExplainEdge,
  ExplainGraph,
  ExplainNode,
  ExplainNodeKind,
  GraphQuery,
} from "./types";
import { formatCapabilityVersion } from "@/lib/platform/capabilities";

export { listExplainObservations };

function edge(
  kind: ExplainEdge["kind"],
  fromId: string,
  toId: string,
  label: string
): ExplainEdge {
  return {
    id: `edge-${fromId}-${toId}-${kind}`,
    kind,
    fromId,
    toId,
    label,
  };
}

export function buildOrganizationGraphSeed(input: {
  readonly organizationId: string;
  readonly organizationName: string;
}): GraphSeed {
  ensureCapabilitiesRegistered();
  StrategyService.ensureOrganization(input.organizationId, input.organizationName);

  const nodes: ExplainNode[] = [];
  const edges: ExplainEdge[] = [];

  const orgId = `org:${input.organizationId}`;
  nodes.push({
    id: orgId,
    kind: "organization",
    label: input.organizationName,
    summary: `Organization scope for intelligence graph.`,
    organizationId: input.organizationId,
    href: `/jag/organizations?org=${encodeURIComponent(input.organizationId)}`,
  });

  const strategy = StrategyService.workspace(
    input.organizationId,
    input.organizationName
  );

  for (const g of strategy.goals) {
    const id = `goal:${g.id}`;
    nodes.push({
      id,
      kind: "goal",
      label: g.title,
      summary: `${g.health} · ${(g.progress * 100).toFixed(0)}% · ${g.description}`,
      description: g.description,
      organizationId: input.organizationId,
      createdBy: g.owner,
      createdAt: g.createdAt,
      confidence: g.confidence,
      href: `/jag/strategy?org=${encodeURIComponent(input.organizationId)}`,
      tags: [g.status, g.priority, g.health],
    });
    edges.push(edge("aligns_with", id, orgId, "belongs to"));
    for (const d of g.relatedDecisionIds) {
      edges.push(edge("influences", `decision:${d}`, id, "decision → goal"));
    }
  }

  for (const init of strategy.initiatives) {
    const id = `initiative:${init.id}`;
    nodes.push({
      id,
      kind: "initiative",
      label: init.title,
      summary: `${init.status} · impact ${init.impactScore.toFixed(2)}`,
      organizationId: input.organizationId,
      createdBy: init.owner,
      createdAt: init.createdAt,
      href: `/jag/strategy?org=${encodeURIComponent(input.organizationId)}`,
      tags: [init.status],
    });
    edges.push(edge("depends_on", id, `goal:${init.goalId}`, "initiative → goal"));
  }

  const memory = MemoryService.search(input.organizationId, {});
  for (const m of memory.records.slice(0, 40)) {
    const id = `memory:${m.id}`;
    nodes.push({
      id,
      kind: "memory",
      label: m.title,
      summary: m.outcomeSummary ?? m.description,
      organizationId: input.organizationId,
      createdBy: m.createdBy,
      createdAt: m.createdAt,
      confidence: m.confidence,
      href: `/jag/memory?org=${encodeURIComponent(input.organizationId)}&id=${encodeURIComponent(m.id)}`,
      tags: [m.type, m.outcome, ...m.tags],
    });
    edges.push(edge("related_to", id, orgId, "memory of"));
    for (const d of m.relatedDecisionIds) {
      edges.push(edge("supports", id, `decision:${d}`, "memory ↔ decision"));
    }
    for (const g of m.relatedGoalIds) {
      edges.push(edge("related_to", id, `goal:${g}`, "memory ↔ goal"));
    }
  }

  for (const alert of WatcherService.listOpen(input.organizationId)) {
    const id = `alert:${alert.id}`;
    nodes.push({
      id,
      kind: "watcher_alert",
      label: alert.title,
      summary: alert.summary,
      organizationId: input.organizationId,
      createdAt: alert.createdAt,
      confidence: alert.confidence,
      href: `/jag/inbox?org=${encodeURIComponent(input.organizationId)}&id=${encodeURIComponent(alert.id)}`,
      tags: [alert.type, alert.severity, alert.status],
    });
    edges.push(edge("triggered_by", id, orgId, "alert for"));
    for (const d of alert.relatedDecisionIds) {
      edges.push(edge("references", id, `decision:${d}`, "alert → decision"));
    }
    for (const g of alert.relatedGoalIds) {
      edges.push(edge("references", id, `goal:${g}`, "alert → goal"));
    }
    for (const m of alert.relatedMemoryIds) {
      edges.push(edge("references", id, `memory:${m}`, "alert → memory"));
    }
  }

  for (const cap of CapabilityRegistry.listEnabled()) {
    const id = `capability:${cap.manifest.id}`;
    nodes.push({
      id,
      kind: "capability",
      label: cap.manifest.name,
      summary: cap.manifest.description,
      organizationId: null,
      confidence: cap.health.status === "healthy" ? 0.9 : 0.5,
      href: `/jag/capabilities?id=${encodeURIComponent(cap.manifest.id)}`,
      tags: [cap.manifest.category, ...cap.manifest.metadata.tags],
      metadata: {
        capabilityId: cap.manifest.id,
        version: formatCapabilityVersion(cap.manifest.version),
      },
    });
  }

  // Deduplicate edges
  const edgeKeys = new Set<string>();
  const uniqueEdges = edges.filter((e) => {
    if (edgeKeys.has(e.id)) return false;
    // skip edges to missing nodes except org
    if (!nodes.some((n) => n.id === e.fromId) || !nodes.some((n) => n.id === e.toId)) {
      // allow decision stubs
      if (e.toId.startsWith("decision:") || e.fromId.startsWith("decision:")) {
        if (!nodes.some((n) => n.id === e.toId) && e.toId.startsWith("decision:")) {
          nodes.push({
            id: e.toId,
            kind: "decision",
            label: e.toId.replace("decision:", "Decision "),
            summary: "Linked decision reference",
            organizationId: input.organizationId,
            href: `/jag/decisions`,
          });
        }
        if (!nodes.some((n) => n.id === e.fromId) && e.fromId.startsWith("decision:")) {
          nodes.push({
            id: e.fromId,
            kind: "decision",
            label: e.fromId.replace("decision:", "Decision "),
            summary: "Linked decision reference",
            organizationId: input.organizationId,
            href: `/jag/decisions`,
          });
        }
      } else {
        return false;
      }
    }
    edgeKeys.add(e.id);
    return true;
  });

  return { nodes, edges: uniqueEdges };
}

function subjectFromNode(node: ExplainNode): ExplanationSubject {
  return {
    id: node.id,
    kind: node.kind,
    organizationId: node.organizationId,
    title: node.label,
    summary: node.summary,
    confidence: node.confidence,
    createdBy: node.createdBy,
    createdAt: node.createdAt,
    href: node.href,
    tags: node.tags,
    metadata: node.metadata,
    evidence: [
      {
        id: `ev-${node.id}`,
        source: node.kind,
        summary: node.summary,
      },
    ],
    contributors: node.createdBy ? [node.createdBy] : ["jag.explainability"],
    assumptions: [],
    drivers: node.tags?.slice(0, 3) ?? [],
    timeline: node.createdAt
      ? [{ at: node.createdAt.slice(0, 10), message: node.label }]
      : [],
  };
}

export const ExplanationService = {
  explainSubject(subject: ExplanationSubject): Explanation {
    return generateExplanation(subject);
  },

  explainNode(
    organizationId: string,
    organizationName: string,
    nodeId: string
  ): Explanation | null {
    const seed = buildOrganizationGraphSeed({ organizationId, organizationName });
    const node = seed.nodes.find((n) => n.id === nodeId);
    if (!node) return null;

    // Enrich from related edges
    const related = seed.edges.filter(
      (e) => e.fromId === nodeId || e.toId === nodeId
    );
    const goals = related
      .map((e) => (e.fromId.startsWith("goal:") ? e.fromId : e.toId.startsWith("goal:") ? e.toId : null))
      .filter((x): x is string => Boolean(x));
    const decisions = related
      .map((e) =>
        e.fromId.startsWith("decision:")
          ? e.fromId
          : e.toId.startsWith("decision:")
            ? e.toId
            : null
      )
      .filter((x): x is string => Boolean(x));
    const memory = related
      .map((e) =>
        e.fromId.startsWith("memory:")
          ? e.fromId
          : e.toId.startsWith("memory:")
            ? e.toId
            : null
      )
      .filter((x): x is string => Boolean(x));

    return generateExplanation({
      ...subjectFromNode(node),
      goals: goals.map((g) => g.replace("goal:", "")),
      decisions: decisions.map((d) => d.replace("decision:", "")),
      memory: memory.map((m) => m.replace("memory:", "")),
    });
  },

  queryGraph(
    organizationId: string,
    organizationName: string,
    query: GraphQuery = {}
  ): ExplainGraph {
    const seed = buildOrganizationGraphSeed({ organizationId, organizationName });
    return buildExplainGraph(seed, {
      ...query,
      organizationId: query.organizationId ?? organizationId,
    });
  },

  explainDecision(input: {
    readonly organizationId: string;
    readonly decisionId: string;
    readonly title: string;
    readonly rationale: string;
    readonly confidence: number;
    readonly contributorId?: string;
    readonly goalTitles?: readonly string[];
    readonly memoryTitles?: readonly string[];
  }): Explanation {
    return generateExplanation({
      id: `decision:${input.decisionId}`,
      kind: "decision",
      organizationId: input.organizationId,
      title: input.title,
      summary: input.rationale,
      confidence: input.confidence,
      contributors: input.contributorId
        ? [input.contributorId]
        : ["jag.decision_center"],
      goals: input.goalTitles ?? [],
      memory: input.memoryTitles ?? [],
      decisions: [input.decisionId],
      evidence: [
        {
          id: `ev-dec-${input.decisionId}`,
          source: "Decision Center",
          summary: input.rationale,
        },
      ],
      assumptions: [
        "Contributor recommendation remains valid until new evidence arrives.",
      ],
      drivers: input.goalTitles?.slice(0, 2) ?? [],
      href: `/jag/decisions/${input.decisionId}`,
    });
  },

  explainAlert(input: {
    readonly organizationId: string;
    readonly alertId: string;
    readonly title: string;
    readonly summary: string;
    readonly confidence: number;
    readonly type: string;
    readonly drivers: readonly string[];
    readonly evidence: readonly { id: string; source: string; summary: string }[];
    readonly memory: readonly string[];
    readonly goals: readonly string[];
    readonly decisions: readonly string[];
    readonly rulesFired?: readonly string[];
  }): Explanation {
    return generateExplanation({
      id: `alert:${input.alertId}`,
      kind: "watcher_alert",
      organizationId: input.organizationId,
      title: input.title,
      summary: input.summary,
      confidence: input.confidence,
      evidence: input.evidence,
      drivers: input.drivers,
      memory: input.memory,
      goals: input.goals,
      decisions: input.decisions,
      assumptions: [
        `Watcher type ${input.type} threshold cleared.`,
        ...(input.rulesFired ?? []).map((r) => `Rule fired: ${r}`),
      ],
      contributors: ["jag.autonomous_executive_intelligence"],
      tags: [input.type],
      href: `/jag/inbox?id=${encodeURIComponent(input.alertId)}`,
    });
  },

  explainGoal(input: {
    readonly organizationId: string;
    readonly goalId: string;
    readonly title: string;
    readonly summary: string;
    readonly confidence: number;
    readonly health: string;
    readonly decisionTitles?: readonly string[];
    readonly initiativeTitles?: readonly string[];
  }): Explanation {
    return generateExplanation({
      id: `goal:${input.goalId}`,
      kind: "goal",
      organizationId: input.organizationId,
      title: input.title,
      summary: input.summary,
      confidence: input.confidence,
      goals: [input.title],
      decisions: input.decisionTitles ?? [],
      drivers: [
        `Health: ${input.health}`,
        ...(input.initiativeTitles ?? []).slice(0, 3),
      ],
      assumptions: ["Progress and health evaluated from current strategic seed/state."],
      evidence: [
        {
          id: `ev-goal-${input.goalId}`,
          source: "Strategic Intelligence",
          summary: input.summary,
        },
      ],
      contributors: ["jag.strategic_intelligence"],
      href: `/jag/strategy?org=${encodeURIComponent(input.organizationId)}`,
    });
  },

  explainBriefingSection(input: {
    readonly organizationId: string;
    readonly briefingId: string;
    readonly sectionId: string;
    readonly title: string;
    readonly narrative: string;
    readonly confidence: number;
    readonly evidence: readonly { id: string; source: string; summary: string }[];
    readonly contributors?: readonly string[];
    readonly policies?: readonly string[];
  }): Explanation {
    return generateExplanation({
      id: `briefing:${input.briefingId}:${input.sectionId}`,
      kind: "briefing",
      organizationId: input.organizationId,
      title: input.title,
      summary: input.narrative,
      confidence: input.confidence,
      evidence: input.evidence,
      contributors: input.contributors ?? ["jag.briefing_engine"],
      policies: input.policies ?? [],
      assumptions: ["Briefing section synthesized from bound Command Center stores."],
      href: `/jag/briefings/${input.briefingId}`,
    });
  },
} as const;

export function resetExplainabilityForTests(): void {
  resetExplanationCacheForTests();
  resetDependencyTraversalForTests();
  clearExplainObservationsForTests();
}

export type { ExplainNodeKind, GraphQuery, Explanation, ExplainGraph };
