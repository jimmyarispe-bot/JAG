export {
  STUDIO_MODULES,
  STUDIO_PACK_DESCRIPTOR,
  STUDIO_PACK_ID,
  STUDIO_PACK_VERSION,
  STUDIO_EXTENSION_MANIFEST,
} from "./manifest";
export {
  ARCHITECTURE_LAYERS,
  RELEASE_STATUSES,
  STUDIO_PRODUCT_IDS,
  type ArchitectureView,
  type DocumentationIntelligence,
  type PerStatus,
  type ReleaseStatus,
  type RepositoryIndexKind,
  type RepositoryScanResult,
  type StudioDashboard,
  type StudioInsightsSummary,
  type StudioPer,
  type StudioProduct,
  type StudioProductId,
  type StudioRelease,
  type TestingWorkspaceView,
} from "./types";
export { resetStudioStoreForTests } from "./store";
export { installJagStudio, getStudioInstallRecord } from "./install";
export {
  createArchitectureService,
  buildArchitectureView,
} from "./architecture/analyzer";
export {
  clearRepositoryScanCache,
  createRepositoryService,
  scanRepository,
  buildRepositoryIntelligence,
  createRepositoryIntelligenceService,
  type RepositoryIntelligenceReport,
  type RepositorySymbol,
} from "./repository";
export { createProductRegistryService } from "./products/registry";
export { createReleaseManager } from "./release/manager";
export { createPerEngine, syncPersFromRepository } from "./per/engine";
export {
  createTestingWorkspaceService,
  buildTestingWorkspace,
} from "./testing/workspace";
export {
  createDocumentationService,
  buildDocumentationIntelligence,
} from "./documentation/intelligence";
export {
  buildStudioDashboard,
  buildStudioInsightsSummary,
} from "./insights/dashboard";
export { createStudioInsightProvider } from "./insights/provider";
export { createStudioWorkspaces } from "./workspaces";
export {
  createCatalogService,
  indexRepositoryCatalog,
  type CatalogEntry,
  type CatalogEntryKind,
  type CatalogSnapshot,
} from "./catalog";
export {
  buildArchitectureGraph,
  buildArchitectureDashboard,
  createArchitectureDashboardService,
  createGraphService,
  type ArchitectureDashboard,
  type ArchitectureGraph,
  type GraphEdge,
  type GraphNode,
} from "./graph";
export {
  analyzeDependencies,
  createDependencyEngine,
  type DependencyIssue,
  type DependencyReport,
} from "./dependencies";
export {
  createRecommendationEngine,
  generateRecommendations,
  type RecommendationReport,
  type StudioRecommendation,
} from "./recommendations";
export {
  createSearchService,
  semanticSearch,
  type SearchHit,
  type SearchResult,
} from "./search";
export {
  analyzeImpact,
  createImpactService,
  type ImpactChangeKind,
  type ImpactReport,
} from "./impact";
export {
  APPROVAL_ROLES,
  RELEASE_STAGE_ORDER,
  type ApprovalDecision,
  type ApprovalRole,
} from "./types";
export {
  createCertificationEngine,
  ensureCertificationRecord,
  listCertifications,
  refreshCertification,
  signCertificationArtifact,
  type CertificationRecord,
  type SignedArtifact,
} from "./certification";
export {
  buildGovernanceDashboard,
  createApprovalService,
  createGovernanceService,
  getApprovalWorkflow,
  listApprovals,
  recordApproval,
  type ApprovalRecord,
  type ApprovalWorkflowState,
  type GovernanceDashboard,
} from "./governance";
export {
  canAdvanceStage,
  createGateService,
  createReleaseArtifactService,
  evaluateReleaseGates,
  generateReleaseArtifacts,
  stageRank,
  type GateEvaluationReport,
  type GateResult,
  type ReleaseArtifactPackage,
} from "./releases";
export {
  DEFAULT_QUALITY_WEIGHTS,
  computeProductQualityScore,
  createQualityService,
  getQualityWeights,
  setQualityWeights,
  type ProductQualityScore,
  type QualityWeights,
} from "./quality";
export {
  DEFAULT_POLICIES,
  createPolicyEngine,
  evaluatePolicies,
  listPolicies,
  upsertPolicy,
  type GovernancePolicy,
  type PolicyComplianceReport,
} from "./policies";
export {
  KNOWLEDGE_EDGE_KINDS,
  KNOWLEDGE_NODE_KINDS,
  analyzeKnowledgeImpact,
  buildGraphHealthReport,
  buildKnowledgeCoverage,
  buildKnowledgeDashboard,
  buildKnowledgeGraph,
  createGraphHealthService,
  createKnowledgeCoverageService,
  createKnowledgeDashboardService,
  createKnowledgeGraphService,
  createKnowledgeImpactService,
  createKnowledgeQueryEngine,
  createKnowledgeReasoningService,
  createKnowledgeRecommendationService,
  createReleaseReadinessService,
  evaluateReleaseReadiness,
  generateKnowledgeRecommendations,
  getKnowledgeGraph,
  findDependencies,
  findDependents,
  findDocumentation,
  findNeighbors,
  findNode,
  findPath,
  findPERs,
  findProducts,
  findTests,
  reasonOverGraph,
  searchGraph,
  type EngineeringRecommendation,
  type GraphHealthReport,
  type KnowledgeCoverageReport,
  type KnowledgeEdge,
  type KnowledgeEdgeKind,
  type KnowledgeGraph,
  type KnowledgeGraphHealth,
  type KnowledgeImpactReport,
  type KnowledgeNode,
  type KnowledgeNodeKind,
  type KnowledgeStudioDashboard,
  type ReasoningAnswer,
  type ReleaseReadinessReport,
} from "./knowledge";
export {
  buildActivityFeed,
  buildDecisionCenter,
  buildDecisionOverview,
  buildDecisionRecommendations,
  buildEngineeringTimeline,
  buildPerCenter,
  buildProductDecisionCards,
  buildReleaseDecisionViews,
  buildRiskCenter,
  createDecisionCenterService,
  type ActivityItem,
  type DecisionCenterDashboard,
  type DecisionOverview,
  type DecisionRecommendation,
  type PerCenterView,
  type ProductDecisionCard,
  type RecommendationSort,
  type ReleaseDecisionView,
  type RiskCenterView,
  type TimelineEvent,
} from "./decision-center";
export {
  evaluateAcademyOsRc3WithStudio,
  type AcademyOsRc3StudioEvaluation,
} from "./integrations/academyos-rc3";
