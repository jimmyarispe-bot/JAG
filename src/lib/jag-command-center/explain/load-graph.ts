/**
 * Intelligence Graph Explorer loaders — Sprint 208.
 */

import {
  ExplanationService,
  EXPLAIN_NODE_KINDS,
  listExplainObservations,
  nodeKindLabel,
  type Explanation,
  type ExplainGraph,
  type ExplainNodeKind,
  type GraphQuery,
} from "@/lib/platform/intelligence/explain/index";
import { listOrganizationsForSession } from "@/lib/jag-business/organizations-view";
import { resolveActiveWorkspaceOrganization } from "@/lib/jag-platform/active-organization";
import type { JagPlatformSession } from "@/lib/jag-platform/session";

export { listExplainObservations };

export type JagGraphWorkspaceModel = {
  readonly organizationId: string | null;
  readonly organizationName: string | null;
  readonly organizations: readonly { id: string; label: string }[];
  readonly graph: ExplainGraph | null;
  readonly selected: Explanation | null;
  readonly focusNodeId: string | null;
  readonly query: {
    readonly q: string;
    readonly kind: ExplainNodeKind | "all";
    readonly capabilityId: string;
    readonly fromDate: string;
    readonly toDate: string;
    readonly depth: number;
  };
  readonly nodeKinds: readonly ExplainNodeKind[];
  readonly advisoryNotice: string;
  readonly explanation: string;
};

function parseKind(raw?: string): ExplainNodeKind | "all" {
  if (!raw || raw === "all") return "all";
  return (EXPLAIN_NODE_KINDS as readonly string[]).includes(raw)
    ? (raw as ExplainNodeKind)
    : "all";
}

export function loadGraphWorkspace(
  session: JagPlatformSession,
  options?: {
    readonly organizationId?: string;
    readonly focus?: string;
    readonly q?: string;
    readonly kind?: string;
    readonly capability?: string;
    readonly from?: string;
    readonly to?: string;
    readonly depth?: string;
  }
): JagGraphWorkspaceModel {
  const orgs = listOrganizationsForSession(session);
  const org = resolveActiveWorkspaceOrganization(session, options?.organizationId);

  const advisoryNotice =
    "Intelligence Graph Explorer — executive reasoning map. Application-layer relationships, not a graph database.";

  const kind = parseKind(options?.kind);
  const depth = Math.max(1, Math.min(4, Number(options?.depth) || 2));
  const q = options?.q?.trim() ?? "";
  const capabilityId = options?.capability?.trim() ?? "";
  const fromDate = options?.from?.trim() ?? "";
  const toDate = options?.to?.trim() ?? "";
  const focusNodeId = options?.focus?.trim() || null;

  if (!org) {
    return {
      organizationId: null,
      organizationName: null,
      organizations: [],
      graph: null,
      selected: null,
      focusNodeId,
      query: {
        q,
        kind,
        capabilityId,
        fromDate,
        toDate,
        depth,
      },
      nodeKinds: EXPLAIN_NODE_KINDS,
      advisoryNotice,
      explanation: "Select an organization to explore the reasoning graph.",
    };
  }

  const query: GraphQuery = {
    organizationId: org.id,
    q: q || undefined,
    kinds: kind === "all" ? undefined : [kind],
    capabilityId: capabilityId || undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
    focusNodeId: focusNodeId ?? undefined,
    depth,
    limit: 60,
  };

  const graph = ExplanationService.queryGraph(org.id, org.name, query);
  const selected = focusNodeId
    ? ExplanationService.explainNode(org.id, org.name, focusNodeId)
    : null;

  return {
    organizationId: org.id,
    organizationName: org.name,
    organizations: orgs.map((o) => ({ id: o.id, label: o.name })),
    graph,
    selected,
    focusNodeId,
    query: {
      q,
      kind,
      capabilityId,
      fromDate,
      toDate,
      depth,
    },
    nodeKinds: EXPLAIN_NODE_KINDS,
    advisoryNotice: graph.advisoryNotice,
    explanation: `Showing ${graph.nodes.length} node(s)${
      graph.truncated ? " (lazy / truncated)" : ""
    }. Focus for detail; expand via depth.`,
  };
}

export function explainDecisionForDetail(input: {
  readonly organizationId: string;
  readonly decisionId: string;
  readonly title: string;
  readonly rationale: string;
  readonly confidence: number;
  readonly contributorId?: string;
  readonly goalTitles?: readonly string[];
  readonly memoryTitles?: readonly string[];
}): Explanation {
  return ExplanationService.explainDecision(input);
}

export function explainAlertForDetail(input: {
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
  return ExplanationService.explainAlert(input);
}

export function explainGoalForDetail(input: {
  readonly organizationId: string;
  readonly goalId: string;
  readonly title: string;
  readonly summary: string;
  readonly confidence: number;
  readonly health: string;
  readonly decisionTitles?: readonly string[];
  readonly initiativeTitles?: readonly string[];
}): Explanation {
  return ExplanationService.explainGoal(input);
}

export function explainBriefingSectionForDetail(input: {
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
  return ExplanationService.explainBriefingSection(input);
}

export { nodeKindLabel, ExplanationService };
