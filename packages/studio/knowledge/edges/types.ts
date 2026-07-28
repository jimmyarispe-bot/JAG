/** JAG Knowledge Graph™ — relationship types (extensible). */

export const KNOWLEDGE_EDGE_KINDS = [
  "CONTAINS",
  "USES",
  "EXPOSES",
  "RETURNS",
  "EMITS",
  "TRIGGERS",
  "GENERATES",
  "REFERENCES",
  "CERTIFIES",
  "VALIDATES",
  "DESCRIBES",
  "DEPENDS_ON",
  "OWNED_BY",
  "DOCUMENTS",
  "MAPS_TO",
  "IMPLEMENTS",
  "CONSUMES",
  "PART_OF",
] as const;

export type KnowledgeEdgeKind = (typeof KNOWLEDGE_EDGE_KINDS)[number];

export type KnowledgeEdge = {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly kind: KnowledgeEdgeKind;
  readonly evidence: string;
  readonly weight: number;
};
