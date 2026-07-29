/** Universal reasoning graph — no domain semantics. */

export type ReasoningNodeKind =
  | "observation"
  | "evidence"
  | "finding"
  | "risk"
  | "opportunity"
  | "recommendation"
  | "decision_candidate";

export type ReasoningEdgeKind =
  | "supports"
  | "contradicts"
  | "depends_on"
  | "causes"
  | "blocks"
  | "strengthens"
  | "weakens";

export interface ReasoningNode {
  id: string;
  kind: ReasoningNodeKind;
  label?: string;
  confidence?: number;
  providerId?: string;
  refId?: string;
  attributes?: Readonly<Record<string, unknown>>;
}

export interface ReasoningEdge {
  id: string;
  from: string;
  to: string;
  kind: ReasoningEdgeKind;
  weight?: number;
  attributes?: Readonly<Record<string, unknown>>;
}

export class ReasoningGraph {
  private readonly nodes = new Map<string, ReasoningNode>();
  private readonly edges = new Map<string, ReasoningEdge>();
  private edgeSeq = 0;

  addNode(node: ReasoningNode): ReasoningNode {
    this.nodes.set(node.id, node);
    return node;
  }

  addEdge(
    from: string,
    to: string,
    kind: ReasoningEdgeKind,
    weight?: number
  ): ReasoningEdge {
    const id = `edge_${++this.edgeSeq}_${kind}`;
    const edge: ReasoningEdge = { id, from, to, kind, weight };
    this.edges.set(id, edge);
    return edge;
  }

  getNode(id: string): ReasoningNode | undefined {
    return this.nodes.get(id);
  }

  listNodes(): ReasoningNode[] {
    return [...this.nodes.values()];
  }

  listEdges(): ReasoningEdge[] {
    return [...this.edges.values()];
  }

  neighbors(nodeId: string, kind?: ReasoningEdgeKind): ReasoningNode[] {
    const out: ReasoningNode[] = [];
    for (const edge of this.edges.values()) {
      if (edge.from !== nodeId && edge.to !== nodeId) continue;
      if (kind && edge.kind !== kind) continue;
      const otherId = edge.from === nodeId ? edge.to : edge.from;
      const node = this.nodes.get(otherId);
      if (node) out.push(node);
    }
    return out;
  }

  contradictions(): ReasoningEdge[] {
    return this.listEdges().filter((e) => e.kind === "contradicts");
  }

  snapshot(): { nodes: ReasoningNode[]; edges: ReasoningEdge[] } {
    return { nodes: this.listNodes(), edges: this.listEdges() };
  }

  clear(): void {
    this.nodes.clear();
    this.edges.clear();
    this.edgeSeq = 0;
  }
}

export function createReasoningGraph(): ReasoningGraph {
  return new ReasoningGraph();
}
