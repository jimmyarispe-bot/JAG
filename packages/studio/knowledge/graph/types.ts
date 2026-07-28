import type { KnowledgeEdge } from "../edges/types";
import type { KnowledgeNode, KnowledgeNodeKind } from "../nodes/types";
import type { KnowledgeEdgeKind } from "../edges/types";

export type KnowledgeGraph = {
  readonly root: string;
  readonly builtAt: string;
  readonly version: string;
  readonly catalogVersion: string | null;
  readonly nodes: readonly KnowledgeNode[];
  readonly edges: readonly KnowledgeEdge[];
  readonly countsByKind: Readonly<Record<KnowledgeNodeKind, number>>;
  readonly edgeCountsByKind: Readonly<Partial<Record<KnowledgeEdgeKind, number>>>;
};

export type KnowledgeGraphHealth = {
  readonly generatedAt: string;
  readonly nodeCount: number;
  readonly relationshipCount: number;
  readonly orphanNodes: readonly string[];
  readonly disconnectedPackages: readonly string[];
  readonly documentationCoverage: number;
  readonly testCoverage: number;
  readonly knowledgeFreshness: string;
  readonly healthScore: number;
  readonly countsByKind: Readonly<Record<string, number>>;
  readonly edgeCountsByKind: Readonly<Record<string, number>>;
};
