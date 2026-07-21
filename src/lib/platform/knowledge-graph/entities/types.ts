import type { UnifiedEntityType } from "@/lib/platform/knowledge-graph/ontology/kinds";

export type UnifiedGraphNode = {
  id: string;
  kind: UnifiedEntityType;
  label: string;
  organizationId: string;
  sourceSystem?: string;
  connectorId?: string;
  externalId?: string;
  canonicalType?: string;
  properties: Record<string, unknown>;
  syncedAt?: string;
  /** Domain package that contributed the node (crm, hr, finance, …). */
  domain?: string;
};

export type ConnectorGraphNodeInput = {
  nodeId: string;
  entityType: string;
  label: string;
  properties?: Record<string, unknown>;
  sourceEntityId?: string;
};
