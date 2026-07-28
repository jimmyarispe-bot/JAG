/** JAG Knowledge Graph™ — node type system (extensible). */

export const KNOWLEDGE_NODE_KINDS = [
  "product",
  "package",
  "module",
  "service",
  "api",
  "entity",
  "event",
  "workflow",
  "notification",
  "insight_provider",
  "document",
  "test",
  "test_suite",
  "per",
  "release",
  "role",
  "connector",
  "twin_mapping",
] as const;

export type KnowledgeNodeKind = (typeof KNOWLEDGE_NODE_KINDS)[number];

export type KnowledgeNode = {
  readonly id: string;
  readonly kind: KnowledgeNodeKind;
  readonly label: string;
  readonly path: string | null;
  readonly ownerPackage: string | null;
  readonly productId: string | null;
  readonly metadata: Readonly<Record<string, string>>;
  readonly keywords: readonly string[];
  readonly updatedAt: string;
};
