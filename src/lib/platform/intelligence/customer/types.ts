/**
 * Customer Intelligence — shared types / CustomerModels DTOs (Sprint 039).
 *
 * Continuously monitor and improve the family and student experience across
 * the school lifecycle — inquiry → enrollment → engagement → satisfaction →
 * retention → community belonging.
 *
 * Composed on Organizational DNA + OIOS Core; soft-reads Organization Health,
 * Revenue, and Operations. Hard DAG dependency on Operations only.
 *
 * Distinct from Revenue's customer-revenue suite, DNA personas, and JAG
 * Success Intelligence.
 */

import type { OrganizationDnaResult } from "@/lib/platform/intelligence/organization-dna/types";
import type { OrganizationDNA } from "@/lib/platform/intelligence/organization-dna/types";
import type { OiosResult } from "@/lib/platform/oios/types";
import type {
  Graph,
  GraphAnalysisResult,
  GraphBuildInput,
  GraphScope,
} from "@/lib/platform/intelligence/executive-graph/types";
import type { ExecutiveDecisionResult } from "@/lib/platform/intelligence/executive-decision/types";
import type { PredictionResult } from "@/lib/platform/intelligence/predictive-intelligence/types";

/** Semantic version of the Customer Intelligence pack. */
export const CUSTOMER_INTELLIGENCE_VERSION = "0.1.0";

/** Opaque metadata — never use `any`. */
export type CustomerMetadata = Record<string, unknown>;

/** Re-export graph scope for customer records. */
export type { GraphScope };

/** Confidence bands. */
export const CUSTOMER_CONFIDENCE_LEVELS = [
  "high",
  "medium",
  "low",
  "unknown",
] as const;
export type CustomerConfidenceLevel =
  (typeof CUSTOMER_CONFIDENCE_LEVELS)[number];

/** Priority / severity bands. */
export const CUSTOMER_PRIORITY_BANDS = [
  "critical",
  "high",
  "medium",
  "low",
  "monitor",
] as const;
export type CustomerPriorityBand = (typeof CUSTOMER_PRIORITY_BANDS)[number];

/** Health status bands. */
export const CUSTOMER_HEALTH_STATUSES = [
  "excellent",
  "healthy",
  "warning",
  "critical",
] as const;
export type CustomerHealthStatus = (typeof CUSTOMER_HEALTH_STATUSES)[number];

/** Artifact lifecycle. */
export const CUSTOMER_ARTIFACT_STATUSES = [
  "draft",
  "generated",
  "reviewed",
  "distributed",
  "archived",
  "superseded",
] as const;
export type CustomerArtifactStatus =
  (typeof CUSTOMER_ARTIFACT_STATUSES)[number];

/** Journey stages across the family/student lifecycle. */
export const JOURNEY_STAGES = [
  "inquiry",
  "enrollment",
  "onboarding",
  "active_care",
  "progression",
  "advocacy",
] as const;
export type JourneyStage = (typeof JOURNEY_STAGES)[number];

/** Engagement dimensions. */
export const ENGAGEMENT_DIMENSIONS = [
  "attendance",
  "participation",
  "communication_response",
  "portal_activity",
  "event_involvement",
  "learning_progress",
] as const;
export type EngagementDimension = (typeof ENGAGEMENT_DIMENSIONS)[number];

/** Satisfaction signals. */
export const SATISFACTION_SIGNALS = [
  "nps_proxy",
  "complaint_burden",
  "response_quality",
  "trust_index",
  "referral_likelihood",
  "issue_resolution",
] as const;
export type SatisfactionSignal = (typeof SATISFACTION_SIGNALS)[number];

/** Retention risk factors. */
export const RETENTION_RISK_FACTORS = [
  "withdrawal_signal",
  "engagement_drop",
  "satisfaction_decline",
  "communication_gap",
  "belonging_gap",
  "journey_friction",
] as const;
export type RetentionRiskFactor = (typeof RETENTION_RISK_FACTORS)[number];

/** Community belonging pillars. */
export const COMMUNITY_BELONGING_PILLARS = [
  "inclusion",
  "family_involvement",
  "mission_alignment",
  "peer_connection",
  "support_access",
] as const;
export type CommunityBelongingPillar =
  (typeof COMMUNITY_BELONGING_PILLARS)[number];

/**
 * Six-lens impact narrative — every recommendation must address:
 * family experience, student engagement, journey continuity,
 * satisfaction sentiment, retention risk, community belonging.
 */
export interface CustomerLensImpact {
  familyExperience: string;
  studentEngagement: string;
  journeyContinuity: string;
  satisfactionSentiment: string;
  retentionRisk: string;
  communityBelonging: string;
}

/** Calibrated confidence. */
export interface CustomerConfidenceScore {
  value: number;
  level: CustomerConfidenceLevel;
  factors: Array<{ key: string; label: string; contribution: number }>;
}

/** Shared score card. */
export interface CustomerScore {
  key: string;
  label: string;
  value: number;
  status: CustomerHealthStatus;
  band: CustomerPriorityBand;
  narrative: string;
}

/** Baseline signals when upstream modules are sparse. */
export interface CustomerBaseline {
  familyExperienceScore: number;
  studentEngagementScore: number;
  journeyContinuityScore: number;
  satisfactionScore: number;
  retentionHealthScore: number;
  communityBelongingScore: number;
  organizationHealthScore: number;
  enrollmentScore: number;
  enrollment: number;
  studentAttendance: number;
  admissions: number;
  personaCount: number;
  communicationQuality: number;
  complaintBurden: number;
  withdrawalRisk: number;
  belongingIndex: number;
  operationsSupportScore: number;
  revenueRetentionProxy: number;
  executionScore: number;
  journeyFriction: number;
}

/** Light upstream result attachments (avoid circular imports). */
export interface RevenueResultLight {
  requestId?: string;
  healthScore?: { value?: number };
  retentionScore?: { value?: number };
  baseline?: {
    customerCount?: number;
    retentionRate?: number;
  };
  recommendations?: string[];
}

export interface OperationsResultLight {
  requestId?: string;
  healthScore?: { value?: number };
  workflowScore?: { value?: number };
  baseline?: {
    operationsScore?: number;
    slaRisk?: number;
    backlogPressure?: number;
    studentAttendance?: number;
  };
  processMonitoring?: {
    overallScore?: number;
    hottestBottleneck?: string;
  };
  recommendations?: string[];
}

/** Shared recommendation shape. */
export interface CustomerRecommendationRecord {
  id: string;
  title: string;
  priority: CustomerPriorityBand;
  score: number;
  rationale: string;
  lenses: CustomerLensImpact;
  narrative: string;
  expectedLift: string;
  riskReduction: string;
}

/* -------------------------------------------------------------------------- */
/* Journey map                                                                 */
/* -------------------------------------------------------------------------- */

export interface JourneyStageRecord {
  stage: JourneyStage;
  label: string;
  score: number;
  status: CustomerHealthStatus;
  friction: number;
  signal: string;
  narrative: string;
}

export interface JourneyMapResult {
  stages: JourneyStageRecord[];
  overallScore: number;
  weakestStage: JourneyStage;
  status: CustomerHealthStatus;
  narrative: string;
}

/* -------------------------------------------------------------------------- */
/* Engagement                                                                  */
/* -------------------------------------------------------------------------- */

export interface EngagementDimensionRecord {
  dimension: EngagementDimension;
  label: string;
  score: number;
  status: CustomerHealthStatus;
  signal: string;
  narrative: string;
}

export interface EngagementResult {
  dimensions: EngagementDimensionRecord[];
  overallScore: number;
  status: CustomerHealthStatus;
  narrative: string;
}

/* -------------------------------------------------------------------------- */
/* Satisfaction                                                                */
/* -------------------------------------------------------------------------- */

export interface SatisfactionSignalRecord {
  signal: SatisfactionSignal;
  label: string;
  score: number;
  status: CustomerHealthStatus;
  weight: number;
  narrative: string;
}

export interface SatisfactionSuite {
  signals: SatisfactionSignalRecord[];
  overallScore: number;
  weakestSignal: SatisfactionSignal;
  narrative: string;
}

/* -------------------------------------------------------------------------- */
/* Retention watchlist                                                         */
/* -------------------------------------------------------------------------- */

export interface RetentionFactorRecord {
  factor: RetentionRiskFactor;
  label: string;
  riskScore: number;
  status: CustomerHealthStatus;
  signals: string[];
  narrative: string;
}

export interface RetentionWatchlistResult {
  factors: RetentionFactorRecord[];
  overallRisk: number;
  hottestFactor: RetentionRiskFactor;
  narrative: string;
}

/* -------------------------------------------------------------------------- */
/* Community belonging                                                         */
/* -------------------------------------------------------------------------- */

export interface CommunityPillarRecord {
  pillar: CommunityBelongingPillar;
  label: string;
  score: number;
  status: CustomerHealthStatus;
  signals: string[];
  narrative: string;
}

export interface CommunityHealthResult {
  pillars: CommunityPillarRecord[];
  overallScore: number;
  weakestPillar: CommunityBelongingPillar;
  narrative: string;
}

/* -------------------------------------------------------------------------- */
/* Outputs                                                                     */
/* -------------------------------------------------------------------------- */

export interface CustomerHealthResult {
  overallScore: number;
  status: CustomerHealthStatus;
  dimensions: Record<string, number>;
  lenses: CustomerLensImpact;
  narrative: string;
}

export interface CustomerDashboardResult {
  generatedAt: string;
  headline: string;
  healthScore: number;
  engagementScore: number;
  journeyScore: number;
  satisfactionScore: number;
  retentionScore: number;
  communityScore: number;
  topRisks: string[];
  topOpportunities: string[];
  narrative: string;
}

export interface CustomerRiskRecord {
  id: string;
  title: string;
  severity: CustomerPriorityBand;
  score: number;
  dimension:
    | JourneyStage
    | EngagementDimension
    | SatisfactionSignal
    | RetentionRiskFactor
    | CommunityBelongingPillar
    | "experience"
    | "retention"
    | "belonging";
  mitigation: string;
  lenses: CustomerLensImpact;
  narrative: string;
}

export interface CustomerOpportunityRecord {
  id: string;
  title: string;
  priority: CustomerPriorityBand;
  score: number;
  expectedValue: number;
  lenses: CustomerLensImpact;
  narrative: string;
}

export interface ExecutiveCustomerBrief {
  generatedAt: string;
  headline: string;
  summary: string;
  healthScore: number;
  engagementScore: number;
  journeyScore: number;
  satisfactionScore: number;
  retentionScore: number;
  communityScore: number;
  topRecommendations: string[];
  topRisks: string[];
  topOpportunities: string[];
  weakestJourneyStage: string;
  lenses: CustomerLensImpact;
  narrative: string;
}

export interface CustomerProjectionResult {
  generatedAt: string;
  headline: string;
  healthScore: number;
  engagementScore: number;
  journeyScore: number;
  satisfactionScore: number;
  retentionScore: number;
  communityScore: number;
  journeyMap: JourneyMapResult;
  engagement: EngagementResult;
  satisfaction: SatisfactionSuite;
  retentionWatchlist: RetentionWatchlistResult;
  communityHealth: CommunityHealthResult;
  brief: ExecutiveCustomerBrief;
  dashboard: CustomerDashboardResult;
  metrics: {
    enrollment: number;
    admissions: number;
    studentAttendance: number;
    personaCount: number;
    withdrawalRisk: number;
    belongingIndex: number;
    complaintBurden: number;
  };
  overallConfidence: CustomerConfidenceScore;
}

export interface CustomerHistoryRecord {
  id: string;
  requestId: string;
  scope: GraphScope;
  status: CustomerArtifactStatus;
  healthScore: number;
  generatedAt: string;
  summary: string;
  metadata: CustomerMetadata;
}

export interface CustomerQueryRequest {
  question: string;
  focus?:
    | "general"
    | "journey"
    | "engagement"
    | "satisfaction"
    | "retention"
    | "community"
    | "risk"
    | "opportunity";
  maxResults?: number;
}

export interface CustomerQueryResult {
  question: string;
  focus: string;
  answer: string;
  references: string[];
  confidence: CustomerConfidenceScore;
}

/** Registry publisher descriptor. */
export interface CustomerPublisher {
  domain: string;
  capability: string;
}

/* -------------------------------------------------------------------------- */
/* Request / Result                                                            */
/* -------------------------------------------------------------------------- */

export interface CustomerRequest {
  requestId: string;
  question?: string;
  periodLabel?: string;
  scope?: GraphScope;
  dnaResult?: OrganizationDnaResult;
  dna?: OrganizationDNA;
  oiosResult?: OiosResult;
  graph?: Graph;
  analysis?: GraphAnalysisResult;
  graphInput?: GraphBuildInput;
  decisionResult?: ExecutiveDecisionResult;
  predictionResult?: PredictionResult;
  revenueResult?: RevenueResultLight;
  operationsResult?: OperationsResultLight;
  baselineOverrides?: Partial<CustomerBaseline>;
  metadata?: CustomerMetadata;
}

/** Full customer generation result. */
export interface CustomerResult {
  requestId: string;
  version: string;
  generatedAt: string;
  periodLabel: string;
  scope: GraphScope;
  baseline: CustomerBaseline;
  /** Core scores */
  healthScore: CustomerScore;
  engagementScore: CustomerScore;
  journeyScore: CustomerScore;
  satisfactionScore: CustomerScore;
  retentionScore: CustomerScore;
  communityScore: CustomerScore;
  riskScore: CustomerScore;
  customerHealth: CustomerHealthResult;
  /** Domain suites */
  journeyMap: JourneyMapResult;
  engagement: EngagementResult;
  satisfaction: SatisfactionSuite;
  retentionWatchlist: RetentionWatchlistResult;
  communityHealth: CommunityHealthResult;
  /** Outputs */
  dashboard: CustomerDashboardResult;
  risks: CustomerRiskRecord[];
  opportunities: CustomerOpportunityRecord[];
  brief: ExecutiveCustomerBrief;
  projection: CustomerProjectionResult;
  confidence: CustomerConfidenceScore;
  recommendations: CustomerRecommendationRecord[];
  historyRecord: CustomerHistoryRecord;
  metadata: CustomerMetadata;
}
