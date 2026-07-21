import type { UnifiedRelationshipType } from "@/lib/platform/knowledge-graph/ontology/relationships";

export type UnifiedGraphEdge = {
  id: string;
  type: UnifiedRelationshipType;
  from: string;
  to: string;
  organizationId: string;
  /** Original domain edge type before aliasing. */
  originalType?: string;
  properties?: Record<string, unknown>;
  domain?: string;
};

export type ConnectorGraphEdgeInput = {
  relationshipId: string;
  type: string;
  fromNodeId: string;
  toNodeId: string;
  properties?: Record<string, unknown>;
};
