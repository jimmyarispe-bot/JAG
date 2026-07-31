export {
  KNOWLEDGE_GRAPH_NODE_TYPES,
  KNOWLEDGE_GRAPH_RELATIONSHIP_TYPES,
  PLACEHOLDER_NODE_TYPES,
  type KnowledgeGraphNodeType,
  type KnowledgeGraphRelationshipType,
  type KnowledgeGraphNode,
  type KnowledgeGraphEdge,
  type KnowledgeGraphSummary,
  type KnowledgeGraphQuery,
  type ConnectedEvidenceResult,
} from "@/lib/evidence-center/knowledge-graph/types";

export { knowledgeGraphNodeId } from "@/lib/evidence-center/knowledge-graph/ids";

export {
  resetKnowledgeGraphStoreForTests,
  listGraphNodes,
  listGraphEdges,
  getGraphNode,
  getGraphEdge,
} from "@/lib/evidence-center/knowledge-graph/store";

export {
  upsertKnowledgeGraphNode,
  createKnowledgeGraphEdge,
  updateKnowledgeGraphEdge,
  removeKnowledgeGraphEdge,
  queryKnowledgeGraph,
  knowledgeGraphSummary,
  queryConnectedEvidence,
  ensureOrganizationScaffold,
  isKnowledgeGraphNodeType,
  isKnowledgeGraphRelationshipType,
} from "@/lib/evidence-center/knowledge-graph/service";

export {
  syncEvidenceDocumentToGraph,
  syncEvidenceRelationshipToGraph,
  registerConnectorEvidenceInGraph,
} from "@/lib/evidence-center/knowledge-graph/sync";
