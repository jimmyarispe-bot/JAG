import type { createAuthClient } from "@/lib/supabase/server-auth";
import type { NormalizedEvent, GraphEdge, GraphNode, GraphEntityType } from "./types";

type AuthClient = Awaited<ReturnType<typeof createAuthClient>>;

function node(
  type: GraphEntityType | string,
  id: string,
  label: string,
  domain?: string
): GraphNode {
  return { type, id, label, domain };
}

/**
 * Organizational Knowledge Graph — relationships among core entities.
 * Built from normalized EI events; supports traversal + explainability.
 */
export function buildKnowledgeGraph(events: NormalizedEvent[]): {
  nodes: GraphNode[];
  edges: GraphEdge[];
} {
  const nodeMap = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];

  const addNode = (n: GraphNode) => {
    nodeMap.set(`${n.type}:${n.id}`, n);
  };

  for (const e of events) {
    const eventNode = node("event", e.id, e.title, e.domain);
    addNode(eventNode);

    if (e.entityId && e.entityType) {
      const entityType = mapEntityType(e.entityType);
      const entity = node(entityType, e.entityId, `${e.entityType}:${e.entityId}`, e.domain);
      addNode(entity);
      edges.push({
        source: eventNode,
        target: entity,
        relationship: "references",
        weight: 1,
        explainability: `${e.eventType} references ${e.entityType}`,
        evidence: [e.eventType],
      });
    }

    // Domain hub nodes
    const domainHub = node("school", `domain:${e.domain}`, e.domain, e.domain);
    addNode(domainHub);
    edges.push({
      source: eventNode,
      target: domainHub,
      relationship: "in_domain",
      weight: 0.5,
      explainability: `Event belongs to ${e.domain} domain`,
      evidence: [e.moduleKey],
    });
  }

  // Cross-link finance ↔ admissions when both present
  const financeEvents = events.filter((e) => e.domain === "finance");
  const admissionsEvents = events.filter((e) => e.domain === "admissions");
  if (financeEvents[0] && admissionsEvents[0]) {
    edges.push({
      source: node("event", financeEvents[0].id, financeEvents[0].title, "finance"),
      target: node("event", admissionsEvents[0].id, admissionsEvents[0].title, "admissions"),
      relationship: "correlates_with",
      weight: 0.7,
      explainability: "Admissions ↔ Revenue co-activity in analysis window",
      evidence: ["cross_domain"],
    });
  }

  return { nodes: [...nodeMap.values()], edges };
}

function mapEntityType(raw: string): GraphEntityType {
  const t = raw.toLowerCase();
  if (t.includes("student")) return "student";
  if (t.includes("family")) return "family";
  if (t.includes("employee") || t.includes("teacher")) return "employee";
  if (t.includes("school")) return "school";
  if (t.includes("program")) return "program";
  if (t.includes("class")) return "class";
  if (t.includes("workflow")) return "workflow";
  if (t.includes("communication") || t.includes("message")) return "communication";
  if (t.includes("document")) return "document";
  if (t.includes("invoice") || t.includes("billing") || t.includes("account"))
    return "financial_account";
  if (t.includes("calendar") || t.includes("meeting")) return "calendar_event";
  if (t.includes("decision")) return "founder_decision";
  return "event";
}

export function traverseNeighbors(
  graph: { nodes: GraphNode[]; edges: GraphEdge[] },
  nodeKey: string,
  depth = 1
): { nodes: GraphNode[]; edges: GraphEdge[]; pathExplain: string[] } {
  const visited = new Set<string>([nodeKey]);
  let frontier = [nodeKey];
  const resultEdges: GraphEdge[] = [];
  const explain: string[] = [];

  for (let d = 0; d < depth; d++) {
    const next: string[] = [];
    for (const key of frontier) {
      for (const edge of graph.edges) {
        const src = `${edge.source.type}:${edge.source.id}`;
        const tgt = `${edge.target.type}:${edge.target.id}`;
        if (src === key && !visited.has(tgt)) {
          visited.add(tgt);
          next.push(tgt);
          resultEdges.push(edge);
          explain.push(edge.explainability);
        } else if (tgt === key && !visited.has(src)) {
          visited.add(src);
          next.push(src);
          resultEdges.push(edge);
          explain.push(edge.explainability);
        }
      }
    }
    frontier = next;
  }

  const nodes = graph.nodes.filter((n) => visited.has(`${n.type}:${n.id}`));
  return { nodes, edges: resultEdges, pathExplain: explain };
}

export async function persistKnowledgeEdges(
  supabase: AuthClient,
  organizationId: string | null | undefined,
  schoolId: string | null | undefined,
  edges: GraphEdge[]
): Promise<number> {
  if (!edges.length) return 0;
  const rows = edges.slice(0, 100).map((e) => ({
    organization_id: organizationId ?? null,
    school_id: schoolId ?? null,
    source_type: e.source.type,
    source_id: e.source.id,
    target_type: e.target.type,
    target_id: e.target.id,
    relationship: e.relationship,
    weight: e.weight,
    explainability: e.explainability,
    evidence: e.evidence,
  }));
  try {
    const { error } = await supabase.from("jag_knowledge_edges").upsert(rows, {
      onConflict:
        "organization_id,source_type,source_id,target_type,target_id,relationship",
    });
    if (error) return 0;
    return rows.length;
  } catch {
    return 0;
  }
}
