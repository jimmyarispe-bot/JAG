/** JS-002 — Live architecture graph. */

export type GraphNodeKind =
  | "package"
  | "service"
  | "api"
  | "entity"
  | "event"
  | "connector"
  | "insight_provider"
  | "twin_mapping"
  | "per"
  | "test"
  | "doc";

export type GraphRelationKind =
  | "depends_on"
  | "imports"
  | "exposes"
  | "tested_by"
  | "documented_by"
  | "emits"
  | "maps_to"
  | "references"
  | "consumes";

export type GraphNode = {
  readonly id: string;
  readonly kind: GraphNodeKind;
  readonly label: string;
  readonly path: string | null;
  readonly ownerPackage: string | null;
  readonly metadata: Readonly<Record<string, string>>;
};

export type GraphEdge = {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly kind: GraphRelationKind;
  readonly evidence: string;
};

export type ArchitectureGraph = {
  readonly root: string;
  readonly builtAt: string;
  readonly catalogVersion: string;
  readonly nodes: readonly GraphNode[];
  readonly edges: readonly GraphEdge[];
};
