export type PipelineStage =
  | "event_ingestion"
  | "normalization"
  | "context_enrichment"
  | "cross_domain_correlation"
  | "pattern_detection"
  | "anomaly_detection"
  | "prediction"
  | "recommendation"
  | "confidence_scoring"
  | "insight_generation";

export const PIPELINE_STAGES: PipelineStage[] = [
  "event_ingestion",
  "normalization",
  "context_enrichment",
  "cross_domain_correlation",
  "pattern_detection",
  "anomaly_detection",
  "prediction",
  "recommendation",
  "confidence_scoring",
  "insight_generation",
];

export type InsightCategory =
  | "risk"
  | "opportunity"
  | "anomaly"
  | "prediction"
  | "recommendation"
  | "correlation"
  | "health"
  | "brief"
  | "context";

export type InsightStatus =
  | "open"
  | "acknowledged"
  | "accepted"
  | "rejected"
  | "delegated"
  | "completed"
  | "resolved"
  | "expired";

export type GraphEntityType =
  | "student"
  | "family"
  | "employee"
  | "school"
  | "program"
  | "class"
  | "workflow"
  | "communication"
  | "document"
  | "financial_account"
  | "calendar_event"
  | "founder_decision"
  | "event"
  | "insight";

export interface NormalizedEvent {
  id: string;
  eventType: string;
  moduleKey: string;
  domain: string;
  title: string;
  summary: string | null;
  occurredAt: string;
  entityType: string | null;
  entityId: string | null;
  classification: string | null;
  severityRank: number;
  payload: Record<string, unknown> | null;
}

export interface ConfidenceBreakdown {
  confidence: number;
  dataQuality: number;
  evidenceCount: number;
  freshness: number;
  explainability: number;
}

export interface GraphNode {
  type: GraphEntityType | string;
  id: string;
  label: string;
  domain?: string;
}

export interface GraphEdge {
  source: GraphNode;
  target: GraphNode;
  relationship: string;
  weight: number;
  explainability: string;
  evidence: string[];
}

export interface OrganizationalContext {
  capturedAt: string;
  activeEnrollmentSignals: number;
  staffingSignals: number;
  financialHealthScore: number;
  openRiskCount: number;
  recentCommunicationCount: number;
  pendingWorkflowSignals: number;
  complianceAlertCount: number;
  domains: Record<string, number>;
  factors: string[];
}

export interface Anomaly {
  id: string;
  title: string;
  summary: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  confidence: number;
  evidence: string[];
  relatedEntities: Array<{ type: string; id: string; label?: string }>;
  relatedEventIds: string[];
  domain: string;
}

export interface PersistedInsight {
  id: string;
  auditId: string;
  category: InsightCategory;
  title: string;
  summary: string;
  priority: number;
  severity: string;
  confidence: number;
  dataQuality: number;
  evidenceCount: number;
  freshnessScore: number;
  explainabilityScore: number;
  explanation: string;
  sourceEventIds: string[];
  relatedEntities: Array<{ type: string; id: string; label?: string }>;
  recommendation: string | null;
  suggestedActions: string[];
  status: InsightStatus;
  resolution: string | null;
  pipelineRunId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StageMetric {
  stage: PipelineStage | string;
  durationMs: number;
  errorCount: number;
  queueDepth?: number;
}

export interface PipelineResult {
  pipelineRunId: string;
  generatedAt: string;
  events: NormalizedEvent[];
  context: OrganizationalContext;
  graph: { nodes: GraphNode[]; edges: GraphEdge[] };
  correlations: Array<{
    id: string;
    title: string;
    summary: string;
    domains: string[];
    confidence: number;
    evidence: string[];
  }>;
  patterns: Array<{ id: string; title: string; summary: string; domain: string }>;
  anomalies: Anomaly[];
  predictions: Array<{
    id: string;
    title: string;
    domain: string;
    low: number;
    mid: number;
    high: number;
    unit: string;
    confidence: number;
    factors: string[];
  }>;
  recommendations: Array<{
    id: string;
    title: string;
    summary: string;
    domain: string;
    priority: number;
    impact: string;
    confidence: ConfidenceBreakdown;
    suggestedActions: string[];
    explanation: string;
    relatedEventIds: string[];
  }>;
  insights: PersistedInsight[];
  metrics: StageMetric[];
  /** Founder-compatible analysis payload for dashboard mapping */
  founderAnalysis: {
    domainHealth: import("@/lib/founder-intelligence/types").DomainHealthScore[];
    overallHealth: import("@/lib/founder-intelligence/types").DomainHealthScore;
    risks: import("@/lib/founder-intelligence/types").FounderRisk[];
    opportunities: import("@/lib/founder-intelligence/types").FounderOpportunity[];
    predictions: import("@/lib/founder-intelligence/types").FounderPrediction[];
    recommendations: import("@/lib/founder-intelligence/types").FounderRecommendation[];
    correlations: import("@/lib/founder-intelligence/types").CorrelationInsight[];
  };
}

export type ModelProviderId = "openai" | "anthropic" | "google" | "local";

export interface ModelProviderAdapter {
  id: ModelProviderId;
  name: string;
  isConfigured: () => boolean;
  chat: (input: {
    messages: Array<{ role: string; content: string }>;
    options?: Record<string, unknown>;
  }) => Promise<{ ok: boolean; deferred: boolean; text?: string; message: string }>;
  embed: (input: {
    texts: string[];
  }) => Promise<{ ok: boolean; deferred: boolean; vectors?: number[][]; message: string }>;
  reason: (input: {
    prompt: string;
  }) => Promise<{ ok: boolean; deferred: boolean; text?: string; message: string }>;
}
