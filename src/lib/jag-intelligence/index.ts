export { PIPELINE_STAGES } from "./types";
export type * from "./types";

export { runJagIntelligencePipeline, listPipelineStages } from "./pipeline";
export { scoreConfidence, scoreDataQuality, scoreFreshness, scoreExplainability } from "./confidence";
export { buildKnowledgeGraph, traverseNeighbors, persistKnowledgeEdges } from "./graph";
export {
  queryInsights,
  searchInsights,
  resolveInsight,
  getInsightTimeline,
  persistPipelineInsights,
} from "./insight-registry";
export { insightApi, getOrganizationalContext, syncFounderDecisionFeedback } from "./api";
export {
  recordDecisionFeedback,
  listDecisionFeedback,
  outcomeFromFounderDecisionStatus,
} from "./feedback";
export { recordLearningOutcome, getLearningSummary } from "./learning";
export {
  ensureModelProvidersRegistered,
  getModelProvider,
  listModelProviders,
  invokeModelReasoning,
} from "./providers";
export { listPrompts, getPrompt, createPromptVersion } from "./prompts";
export {
  recordStageMetric,
  timeStage,
  timeStageAsync,
  getPipelineObservability,
} from "./observability";
export { initiateWorkflowFromInsight } from "./workflows";
export { recordJagActivity } from "./activity";

// Independently testable stages
export { stageEventIngestion } from "./stages/ingest";
export { stageNormalization } from "./stages/normalize";
export { stageContextEnrichment, queryContextField } from "./stages/context";
export { stageCrossDomainCorrelation } from "./stages/correlate";
export { stagePatternDetection } from "./stages/patterns";
export { stageAnomalyDetection } from "./stages/anomaly";
export { stagePrediction } from "./stages/predict";
export { stageRecommendationWithConfidence } from "./stages/recommend";
