/**
 * RC-4 — Unified Knowledge Graph
 *
 * Everything becomes one organizational graph.
 * Connectors write canonical entities only; intelligence soft-reads this package.
 */

export {
  UNIFIED_ENTITY_TYPES,
  UNIFIED_RELATIONSHIPS,
  resolveUnifiedEntityType,
  type UnifiedEntityType,
  type UnifiedRelationshipType,
} from "./ontology";

export type { UnifiedGraphNode } from "./entities";
export type { UnifiedGraphEdge } from "./relationships";
export { normalizeRelationshipType } from "./relationships";

export {
  unifiedGraphStore,
  type UnifiedGraphSnapshot,
  type DomainGraphBundle,
} from "./graph-store";

export {
  rebuildUnifiedKnowledgeGraph,
  ingestConnectorGraph,
} from "./services";

export { searchUnifiedGraph, type GraphSearchQuery } from "./search";
export { buildGraphTimeline, type TimelineEntry } from "./timeline";
export { buildGraphLineage, type LineageSlice } from "./lineage";

export {
  softReadOrganizationalGraph,
  softReadNeighborhood,
  softReadSearch,
  softReadTimeline,
  softReadLineage,
  type OrganizationalGraphSoftRead,
} from "./api";

export {
  buildKnowledgeGraphEccWidgets,
  buildCrmEccWidgets,
  buildHrEccWidgets,
  buildFinanceEccWidgets,
  buildEducationEccWidgets,
  buildEnterpriseEccWidgets,
  buildCollaborationEccWidgets,
  buildGoogleWorkspaceEccWidgets,
  buildMicrosoft365EccWidgets,
  type KnowledgeGraphEccWidgets,
  type OrganizationalGraphWidget,
} from "./widgets";
