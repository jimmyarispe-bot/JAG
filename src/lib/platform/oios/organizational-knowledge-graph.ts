import type { OrganizationalKnowledgeGraph as Contract } from "@/lib/platform/oios/contracts";
import type { KnowledgeEdge, KnowledgeNode } from "@/lib/platform/oios/types";
export class OrganizationalKnowledgeGraph implements Contract {
  private readonly nodeMap = new Map<string, KnowledgeNode>(); private readonly edgeMap = new Map<string, KnowledgeEdge>();
  addNode(node: KnowledgeNode): KnowledgeNode { const copy = { ...node, metadata: { ...node.metadata } }; this.nodeMap.set(copy.id, copy); return copy; }
  addEdge(edge: KnowledgeEdge): KnowledgeEdge { const copy = { ...edge }; this.edgeMap.set(copy.id, copy); return copy; }
  nodes(): KnowledgeNode[] { return [...this.nodeMap.values()].map((item) => ({ ...item, metadata: { ...item.metadata } })); }
  edges(): KnowledgeEdge[] { return [...this.edgeMap.values()].map((item) => ({ ...item })); }
}
