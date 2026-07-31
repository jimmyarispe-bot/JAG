/**
 * Executive Intelligence Foundation + Provider Abstraction + Evidence Graph
 *
 * Contracts and reasoning model for organizational intelligence.
 * Consumes Organization Blueprints, capability/reporting/analytics/policy/
 * decision/work/document concepts — not Platform engine internals.
 *
 * Evidence Graph curates organizational evidence before any provider runs.
 * Provider abstraction (`./providers`) is vendor-agnostic.
 * Orchestrator (`./orchestrator`) composes the pipeline via injection.
 * No concrete vendor provider implementations. No model SDK imports.
 *
 * Legacy namespace token retained for architecture pointers.
 */

export const JAG_INTELLIGENCE_NAMESPACE = "jag.intelligence" as const;

export { EXECUTIVE_INTELLIGENCE_VERSION } from "@/jag/intelligence/version";

export type {
  Confidence,
  ConfidenceLevel,
  Assumption,
  AssumptionStatus,
  Evidence,
  EvidenceReference,
  ExecutiveQuestion,
  ExecutiveQuestionIntent,
  IntelligenceContext,
  Finding,
  FindingSeverity,
  Recommendation,
  RecommendationPriority,
  DecisionTrace,
  DecisionTraceStep,
  DecisionTraceStepKind,
  Explanation,
  ExecutiveAnswer,
} from "@/jag/intelligence/contracts";

export {
  isConfidence,
  isAssumption,
  isEvidence,
  isEvidenceReference,
  isExecutiveQuestion,
  isIntelligenceContext,
  isFinding,
  isRecommendation,
  isDecisionTrace,
  isDecisionTraceStep,
  isExplanation,
  isExecutiveAnswer,
} from "@/jag/intelligence/contracts";

export {
  EVIDENCE_GRAPH_VERSION,
  ORGANIZATIONAL_EVIDENCE_KINDS,
  FORBIDDEN_EVIDENCE_KINDS,
  EVIDENCE_GRAPH_SOURCE_KINDS,
  EVIDENCE_PRIORITIES,
  defaultPriorityForKind,
  evidencePriorityRank,
  compareEvidencePriority,
  EVIDENCE_CORRELATION_RULES,
  listCorrelationRules,
  findCorrelationRule,
  correlateEvidenceNodes,
  nodeIdFor,
  compareEvidenceNodes,
  compareEvidenceEdges,
  sortGraphMembers,
  wouldCreateCycle,
  freezeGraph,
  collectEvidenceGraph,
  createEvidenceCollector,
  createEvidenceResolver,
  buildEvidenceBundle,
  traceFindingThroughGraph,
  validateEvidenceGraph,
  type OrganizationalEvidenceKind,
  type ForbiddenEvidenceKind,
  type EvidenceGraphSourceKind,
  type EvidencePriority,
  type EvidenceNodeId,
  type EvidenceNode,
  type EvidenceEdgeType,
  type EvidenceCorrelationSink,
  type EvidenceEdge,
  type EvidenceCorrelation,
  type EvidenceGraph,
  type EvidenceBundle,
  type DeclaredEvidenceLink,
  type EvidenceCollectorSeed,
  type EvidenceCollectorInput,
  type EvidenceCorrelationRule,
  type EvidenceCollector,
  type EvidenceCollectorResult,
  type EvidenceResolver,
  type EvidenceTracePath,
  type FindingEvidenceTrace,
} from "@/jag/intelligence/evidence";

export {
  REASONING_PIPELINE_STAGES,
  composeReasoningPipeline,
  listReasoningPipelineStageIds,
  type ReasoningPipelineStage,
  type ReasoningPipelineStageId,
  type ReasoningPipelinePlan,
} from "@/jag/intelligence/pipeline";

export {
  EXECUTIVE_QUESTION_TYPES,
  type ExecutiveQuestionTypeDefinition,
} from "@/jag/intelligence/questions";

export {
  validateExecutiveQuestion,
  validateIntelligenceContext,
  validateEvidenceSet,
  validateExecutiveAnswer,
  type IntelligenceValidationIssue,
  type IntelligenceValidationResult,
} from "@/jag/intelligence/validation";

export {
  INTELLIGENCE_PROVIDER_VERSION,
  PROVIDER_CAPABILITY_FLAGS,
  capabilitiesSatisfy,
  isProviderCapabilities,
  isIntelligenceProviderRequest,
  isIntelligenceProviderArtifacts,
  isIntelligenceProviderResponse,
  createProviderRegistry,
  emptyProviderCapabilities,
  collectInjectedEvidenceKindIssues,
  validateIntelligenceProvider,
  validateProviderArtifacts,
  validateProviderResponse,
  type ProviderCapabilityFlag,
  type ProviderCapabilities,
  type CapabilityRequirement,
  type IntelligenceProviderRequest,
  type IntelligenceProviderArtifacts,
  type IntelligenceProviderResponse,
  type ProviderDiagnostics,
  type IntelligenceProvider,
  type IntelligenceProviderDescriptor,
  type IntelligenceProviderKind,
  type CompletionProvider,
  type EmbeddingProvider,
  type EmbeddingVector,
  type ReasoningProvider,
  type ProviderRegistry,
} from "@/jag/intelligence/providers";

export {
  EXECUTIVE_INTELLIGENCE_ORCHESTRATOR_VERSION,
  ORCHESTRATOR_FAILURE_CODES,
  orchestratorFailure,
  createExecutionContext,
  noteExecution,
  recordStageDuration,
  assembleExecutiveAnswer,
  ORCHESTRATOR_STAGE_IDS,
  createDefaultOrchestratorStages,
  createPipelineExecutor,
  ExecutiveIntelligenceOrchestrator,
  createExecutiveIntelligenceOrchestrator,
  type OrchestratorFailureCode,
  type OrchestratorFailure,
  type StageDuration,
  type ExecutionDiagnostics,
  type ExecutionMetadata,
  type ExecutionContext,
  type CreateExecutionContextInput,
  type Question,
  type Answer,
  type OrchestratorSuccess,
  type OrchestratorErrorResult,
  type PipelineState,
  type PipelineStageResult,
  type PipelineStage,
  type OrchestratorHostBindings,
  type OrchestratorStageId,
  type PipelineExecutor,
  type ExecutiveIntelligenceOrchestratorApi,
} from "@/jag/intelligence/orchestrator";
