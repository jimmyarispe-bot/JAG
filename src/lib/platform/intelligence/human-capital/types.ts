/**
 * Human Capital Intelligence — shared types / WorkforceModels DTOs (Sprint 032).
 *
 * Talent lifecycle intelligence: recruit, hire, develop, retain, coach, evaluate,
 * and grow exceptional people — composed on Organizational DNA + OIOS Core.
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
import type { GovernanceResult } from "@/lib/platform/intelligence/board-governance/types";

/** Semantic version of the Human Capital Intelligence pack. */
export const HUMAN_CAPITAL_INTELLIGENCE_VERSION = "0.1.0";

/** Opaque metadata — never use `any`. */
export type HumanCapitalMetadata = Record<string, unknown>;

/** Re-export graph scope for workforce records. */
export type { GraphScope };

/** Confidence bands. */
export const HUMAN_CAPITAL_CONFIDENCE_LEVELS = [
  "high",
  "medium",
  "low",
  "unknown",
] as const;
export type HumanCapitalConfidenceLevel =
  (typeof HUMAN_CAPITAL_CONFIDENCE_LEVELS)[number];

/** Priority / severity bands. */
export const HUMAN_CAPITAL_PRIORITY_BANDS = [
  "critical",
  "high",
  "medium",
  "low",
  "monitor",
] as const;
export type HumanCapitalPriorityBand =
  (typeof HUMAN_CAPITAL_PRIORITY_BANDS)[number];

/** Health status bands for workforce scores. */
export const WORKFORCE_HEALTH_STATUSES = [
  "excellent",
  "healthy",
  "warning",
  "critical",
] as const;
export type WorkforceHealthStatus = (typeof WORKFORCE_HEALTH_STATUSES)[number];

/** Candidate pipeline stages. */
export const CANDIDATE_PIPELINE_STAGES = [
  "sourced",
  "screened",
  "interviewing",
  "finalist",
  "offered",
  "hired",
  "rejected",
  "withdrawn",
] as const;
export type CandidatePipelineStage =
  (typeof CANDIDATE_PIPELINE_STAGES)[number];

/** Employment lifecycle statuses. */
export const EMPLOYMENT_STATUSES = [
  "active",
  "onboarding",
  "probation",
  "leave",
  "at_risk",
  "exiting",
  "alumni",
] as const;
export type EmploymentStatus = (typeof EMPLOYMENT_STATUSES)[number];

/** Performance rating bands. */
export const PERFORMANCE_RATINGS = [
  "exceptional",
  "exceeds",
  "meets",
  "developing",
  "underperforming",
] as const;
export type PerformanceRating = (typeof PERFORMANCE_RATINGS)[number];

/** Talent matrix boxes (9-box). */
export const TALENT_MATRIX_BOXES = [
  "star",
  "high_potential",
  "solid_contributor",
  "core_performer",
  "inconsistent",
  "underperformer",
  "new_role",
  "expert",
  "risk",
] as const;
export type TalentMatrixBox = (typeof TALENT_MATRIX_BOXES)[number];

/** Leadership readiness levels. */
export const LEADERSHIP_READINESS_LEVELS = [
  "ready_now",
  "ready_1_2_years",
  "ready_3_plus_years",
  "not_ready",
  "external_hire",
] as const;
export type LeadershipReadinessLevel =
  (typeof LEADERSHIP_READINESS_LEVELS)[number];

/** Burnout risk bands. */
export const BURNOUT_RISK_LEVELS = [
  "none",
  "low",
  "moderate",
  "high",
  "severe",
] as const;
export type BurnoutRiskLevel = (typeof BURNOUT_RISK_LEVELS)[number];

/** Artifact lifecycle. */
export const HUMAN_CAPITAL_ARTIFACT_STATUSES = [
  "draft",
  "generated",
  "reviewed",
  "distributed",
  "archived",
  "superseded",
] as const;
export type HumanCapitalArtifactStatus =
  (typeof HUMAN_CAPITAL_ARTIFACT_STATUSES)[number];

/** Calibrated confidence. */
export interface HumanCapitalConfidenceScore {
  value: number;
  level: HumanCapitalConfidenceLevel;
  factors: Array<{ key: string; label: string; contribution: number }>;
}

/** Shared score card for HC outputs. */
export interface HumanCapitalScore {
  key: string;
  label: string;
  value: number;
  status: WorkforceHealthStatus;
  band: HumanCapitalPriorityBand;
  narrative: string;
}

/** Baseline signals when upstream modules are sparse. */
export interface HumanCapitalBaseline {
  headcount: number;
  openRoles: number;
  hiringVelocity: number;
  attritionRate: number;
  engagementScore: number;
  performanceScore: number;
  leadershipCoverage: number;
  successionReadiness: number;
  skillsCoverage: number;
  learningParticipation: number;
  compensationCompetitiveness: number;
  payEquityIndex: number;
  burnoutRisk: number;
  retentionRisk: number;
  timeToFillDays: number;
  offerAcceptanceRate: number;
  organizationHealthScore: number;
  capabilityScore: number;
  teamSize: number;
}

/** Candidate in the recruiting pipeline. */
export interface CandidateRecord {
  id: string;
  name: string;
  role: string;
  stage: CandidatePipelineStage;
  score: number;
  fitScore: number;
  experienceYears: number;
  skills: string[];
  source: string;
  interviewScore: number | null;
  resumeSummary: string;
  recommendation: string;
  priority: HumanCapitalPriorityBand;
}

/** Hiring recommendation. */
export interface HiringRecommendation {
  id: string;
  role: string;
  priority: HumanCapitalPriorityBand;
  urgency: number;
  rationale: string;
  candidateIds: string[];
  openSlots: number;
  estimatedTimeToFillDays: number;
}

/** Offer optimization suggestion. */
export interface OfferOptimization {
  id: string;
  candidateId: string;
  role: string;
  baseSalary: number;
  marketPercentile: number;
  equityOrBonus: number | null;
  acceptanceProbability: number;
  recommendations: string[];
  narrative: string;
}

/** Employee profile snapshot. */
export interface EmployeeProfileRecord {
  id: string;
  name: string;
  role: string;
  department: string;
  status: EmploymentStatus;
  tenureMonths: number;
  performanceRating: PerformanceRating;
  engagementScore: number;
  skills: string[];
  competencies: string[];
  managerId: string | null;
  potentialScore: number;
  riskFlags: string[];
}

/** Skill inventory item. */
export interface SkillInventoryItem {
  id: string;
  skill: string;
  category: string;
  coveragePct: number;
  demand: HumanCapitalPriorityBand;
  gap: number;
  employeesWithSkill: number;
  narrative: string;
}

/** Competency framework entry. */
export interface CompetencyRecord {
  id: string;
  name: string;
  domain: string;
  requiredLevel: number;
  currentLevel: number;
  gap: number;
  roles: string[];
  narrative: string;
}

/** Performance review summary. */
export interface PerformanceRecord {
  id: string;
  employeeId: string;
  rating: PerformanceRating;
  score: number;
  goalsCompleted: number;
  goalsTotal: number;
  strengths: string[];
  developmentAreas: string[];
  narrative: string;
}

/** Goal record. */
export interface GoalRecord {
  id: string;
  employeeId: string;
  title: string;
  progressPct: number;
  dueAt: string | null;
  status: "on_track" | "at_risk" | "blocked" | "completed";
  priority: HumanCapitalPriorityBand;
  narrative: string;
}

/** Feedback item. */
export interface FeedbackRecord {
  id: string;
  employeeId: string;
  source: "manager" | "peer" | "self" | "upward" | "skip_level";
  sentiment: "positive" | "neutral" | "constructive";
  themes: string[];
  summary: string;
}

/** Coaching recommendation. */
export interface CoachingRecommendation {
  id: string;
  employeeId: string;
  focus: string;
  priority: HumanCapitalPriorityBand;
  actions: string[];
  expectedOutcome: string;
  narrative: string;
}

/** Recognition recommendation. */
export interface RecognitionRecord {
  id: string;
  employeeId: string;
  reason: string;
  type: "peer" | "manager" | "leadership" | "milestone";
  impact: string;
}

/** Leadership assessment. */
export interface LeadershipAssessmentRecord {
  id: string;
  employeeId: string;
  role: string;
  readiness: LeadershipReadinessLevel;
  score: number;
  strengths: string[];
  gaps: string[];
  narrative: string;
}

/** Succession plan slot. */
export interface SuccessionPlanSlot {
  id: string;
  criticalRole: string;
  incumbentId: string | null;
  readiness: LeadershipReadinessLevel;
  successors: Array<{
    employeeId: string;
    readiness: LeadershipReadinessLevel;
    score: number;
  }>;
  risk: HumanCapitalPriorityBand;
  narrative: string;
}

/** Talent matrix placement. */
export interface TalentMatrixPlacement {
  id: string;
  employeeId: string;
  performance: number;
  potential: number;
  box: TalentMatrixBox;
  actions: string[];
  narrative: string;
}

/** Org design recommendation. */
export interface OrgDesignRecommendation {
  id: string;
  area: string;
  currentSpan: number;
  recommendedSpan: number;
  change: string;
  priority: HumanCapitalPriorityBand;
  narrative: string;
}

/** Leadership bench strength summary. */
export interface LeadershipBenchStrength {
  overallScore: number;
  readyNowCount: number;
  readySoonCount: number;
  criticalGaps: string[];
  status: WorkforceHealthStatus;
  narrative: string;
}

/** Burnout signal. */
export interface BurnoutSignal {
  id: string;
  employeeId: string;
  level: BurnoutRiskLevel;
  score: number;
  drivers: string[];
  interventions: string[];
  narrative: string;
}

/** Retention prediction. */
export interface RetentionPredictionRecord {
  id: string;
  employeeId: string;
  flightRisk: number;
  band: HumanCapitalPriorityBand;
  drivers: string[];
  stayActions: string[];
  narrative: string;
}

/** Engagement analysis. */
export interface EngagementAnalysisResult {
  overallScore: number;
  status: WorkforceHealthStatus;
  dimensions: Array<{ key: string; label: string; score: number }>;
  hotspots: string[];
  strengths: string[];
  narrative: string;
}

/** Stay interview insight. */
export interface StayInterviewInsight {
  id: string;
  employeeId: string;
  motivators: string[];
  friction: string[];
  asks: string[];
  priority: HumanCapitalPriorityBand;
  narrative: string;
}

/** Exit analysis finding. */
export interface ExitAnalysisFinding {
  id: string;
  theme: string;
  frequency: number;
  severity: HumanCapitalPriorityBand;
  recommendations: string[];
  narrative: string;
}

/** Learning plan. */
export interface LearningPlanRecord {
  id: string;
  employeeId: string;
  title: string;
  skills: string[];
  progressPct: number;
  dueAt: string | null;
  priority: HumanCapitalPriorityBand;
  narrative: string;
}

/** Career path step. */
export interface CareerPathRecord {
  id: string;
  employeeId: string;
  currentRole: string;
  targetRole: string;
  steps: string[];
  readinessMonths: number;
  narrative: string;
}

/** Certification tracking. */
export interface CertificationRecord {
  id: string;
  employeeId: string;
  name: string;
  status: "current" | "expiring" | "expired" | "pursuing";
  expiresAt: string | null;
  required: boolean;
  narrative: string;
}

/** Mentorship match. */
export interface MentorshipMatch {
  id: string;
  menteeId: string;
  mentorId: string;
  focus: string;
  fitScore: number;
  narrative: string;
}

/** Development recommendation. */
export interface DevelopmentRecommendation {
  id: string;
  employeeId: string;
  focus: string;
  actions: string[];
  priority: HumanCapitalPriorityBand;
  relatedSkills: string[];
  narrative: string;
}

/** Salary benchmark. */
export interface SalaryBenchmark {
  id: string;
  role: string;
  internalMedian: number;
  marketMedian: number;
  percentile: number;
  gap: number;
  band: HumanCapitalPriorityBand;
  narrative: string;
}

/** Compensation analysis summary. */
export interface CompensationAnalysisResult {
  overallCompetitiveness: number;
  status: WorkforceHealthStatus;
  benchmarks: SalaryBenchmark[];
  totalCompSpend: number;
  narrative: string;
}

/** Pay equity finding. */
export interface PayEquityFinding {
  id: string;
  cohort: string;
  gapPct: number;
  severity: HumanCapitalPriorityBand;
  affectedCount: number;
  actions: string[];
  narrative: string;
}

/** Incentive model recommendation. */
export interface IncentiveModel {
  id: string;
  roleFamily: string;
  basePct: number;
  variablePct: number;
  metrics: string[];
  expectedImpact: string;
  narrative: string;
}

/** Workforce forecast point. */
export interface WorkforceForecastPoint {
  period: string;
  headcount: number;
  hires: number;
  attrition: number;
  netChange: number;
}

/** Capacity planning row. */
export interface CapacityPlanRow {
  id: string;
  team: string;
  demandFte: number;
  supplyFte: number;
  gapFte: number;
  priority: HumanCapitalPriorityBand;
  narrative: string;
}

/** Hiring forecast. */
export interface HiringForecastRecord {
  id: string;
  role: string;
  plannedHires: number;
  quarter: string;
  priority: HumanCapitalPriorityBand;
  rationale: string;
}

/** Organizational scenario. */
export interface OrgScenarioPlan {
  id: string;
  name: string;
  description: string;
  headcountDelta: number;
  costImpact: number;
  risk: HumanCapitalPriorityBand;
  outcomes: string[];
  narrative: string;
}

/** Hiring priority dashboard. */
export interface HiringPriorityDashboard {
  generatedAt: string;
  openRoles: number;
  criticalRoles: number;
  averageTimeToFillDays: number;
  recommendations: HiringRecommendation[];
  pipelineHealth: number;
  status: WorkforceHealthStatus;
  narrative: string;
}

/** Succession readiness summary. */
export interface SuccessionReadinessSummary {
  overallScore: number;
  status: WorkforceHealthStatus;
  criticalRolesCovered: number;
  criticalRolesTotal: number;
  slots: SuccessionPlanSlot[];
  narrative: string;
}

/** Career development plan aggregate. */
export interface CareerDevelopmentPlan {
  id: string;
  employeeId: string;
  path: CareerPathRecord;
  learning: LearningPlanRecord[];
  coaching: CoachingRecommendation[];
  development: DevelopmentRecommendation[];
  narrative: string;
}

/** Executive workforce brief. */
export interface ExecutiveWorkforceBrief {
  id: string;
  title: string;
  generatedAt: string;
  periodLabel: string;
  headline: string;
  workforceSummary: string;
  talentRiskSummary: string;
  leadershipSummary: string;
  hiringSummary: string;
  retentionSummary: string;
  decisionsNeeded: string[];
  watchItems: string[];
  confidence: HumanCapitalConfidenceScore;
}

/** Projection for UI / dashboards. */
export interface HumanCapitalProjectionResult {
  generatedAt: string;
  headline: string;
  workforceHealthScore: number;
  leadershipHealthScore: number;
  employeeEngagementScore: number;
  talentRiskScore: number;
  hiringDashboard: HiringPriorityDashboard;
  successionReadiness: SuccessionReadinessSummary;
  forecast: WorkforceForecastPoint[];
  coachingRecommendations: CoachingRecommendation[];
  careerPlans: CareerDevelopmentPlan[];
  brief: ExecutiveWorkforceBrief;
  dashboard: HumanCapitalDashboardResult;
  burnoutDashboard: BurnoutRiskDashboardResult;
  capabilityIndex: OrganizationalCapabilityIndexResult;
  metrics: {
    headcount: number;
    openRoles: number;
    candidateCount: number;
    atRiskCount: number;
    successionSlots: number;
    learningPlans: number;
  };
  overallConfidence: HumanCapitalConfidenceScore;
}

/** Query request. */
export interface HumanCapitalQueryRequest {
  question: string;
  focus?:
    | "workforce"
    | "hiring"
    | "retention"
    | "leadership"
    | "learning"
    | "compensation"
    | "planning"
    | "coaching"
    | "general";
  maxResults?: number;
}

/** Query answer. */
export interface HumanCapitalQueryResult {
  question: string;
  focus: NonNullable<HumanCapitalQueryRequest["focus"]>;
  answer: string;
  references: string[];
  confidence: HumanCapitalConfidenceScore;
}

/** History / audit record. */
export interface HumanCapitalHistoryRecord {
  id: string;
  requestId: string;
  generatedAt: string;
  status: HumanCapitalArtifactStatus;
  summary: string;
  scope: GraphScope;
  confidence: HumanCapitalConfidenceScore;
  scores: {
    workforceHealth: number;
    leadershipHealth: number;
    engagement: number;
    talentRisk: number;
  };
}

/** Optional workforce health stub from organization-health. */
export interface WorkforceHealthSignal {
  score: number;
  status?: string;
}

/** Reference-check intelligence for a candidate. */
export interface ReferenceInsight {
  id: string;
  candidateId: string;
  strengthSignals: string[];
  riskSignals: string[];
  overallScore: number;
  recommendation: string;
  narrative: string;
}

/** Talent sourcing channel insight. */
export interface TalentSourcingInsight {
  id: string;
  channel: string;
  yieldScore: number;
  qualityScore: number;
  volume: number;
  costEfficiency: number;
  priority: HumanCapitalPriorityBand;
  narrative: string;
}

/** Employer branding insight. */
export interface EmployerBrandingInsight {
  id: string;
  theme: string;
  score: number;
  strengths: string[];
  gaps: string[];
  actions: string[];
  narrative: string;
}

/** Recruiting analytics summary. */
export interface RecruitingAnalyticsResult {
  pipelineConversionRate: number;
  averageTimeToFillDays: number;
  offerAcceptanceRate: number;
  sourceQualityScore: number;
  stageFunnel: Array<{ stage: CandidatePipelineStage; count: number }>;
  status: WorkforceHealthStatus;
  narrative: string;
}

/** Behavior pattern insight. */
export interface BehaviorInsight {
  id: string;
  employeeId: string;
  patterns: string[];
  collaborationScore: number;
  reliabilityScore: number;
  flags: string[];
  narrative: string;
}

/** Productivity insight. */
export interface ProductivityInsight {
  id: string;
  employeeId: string;
  productivityScore: number;
  outputTrend: "up" | "stable" | "down";
  blockers: string[];
  enablers: string[];
  narrative: string;
}

/** Leadership development plan item. */
export interface LeadershipDevelopmentRecord {
  id: string;
  employeeId: string;
  focus: string;
  readiness: LeadershipReadinessLevel;
  actions: string[];
  timelineMonths: number;
  priority: HumanCapitalPriorityBand;
  narrative: string;
}

/** Manager effectiveness assessment. */
export interface ManagerEffectivenessRecord {
  id: string;
  managerId: string;
  teamSize: number;
  effectivenessScore: number;
  engagementDelta: number;
  retentionRisk: number;
  strengths: string[];
  developmentAreas: string[];
  narrative: string;
}

/** High-potential identification record. */
export interface HighPotentialRecord {
  id: string;
  employeeId: string;
  potentialScore: number;
  performanceScore: number;
  readiness: LeadershipReadinessLevel;
  indicators: string[];
  recommendedTrack: string;
  narrative: string;
}

/** Aggregate employee sentiment. */
export interface EmployeeSentimentResult {
  overallScore: number;
  status: WorkforceHealthStatus;
  themes: Array<{
    theme: string;
    sentiment: "positive" | "neutral" | "negative";
    weight: number;
  }>;
  polarity: { positive: number; neutral: number; negative: number };
  narrative: string;
}

/** Culture health summary. */
export interface CultureHealthResult {
  overallScore: number;
  status: WorkforceHealthStatus;
  dimensions: Array<{ key: string; label: string; score: number }>;
  risks: string[];
  strengths: string[];
  narrative: string;
}

/** Training recommendation. */
export interface TrainingRecommendation {
  id: string;
  employeeId: string;
  title: string;
  skills: string[];
  priority: HumanCapitalPriorityBand;
  estimatedHours: number;
  rationale: string;
  narrative: string;
}

/** Knowledge transfer plan. */
export interface KnowledgeTransferRecord {
  id: string;
  fromEmployeeId: string;
  toEmployeeId: string;
  topic: string;
  urgency: HumanCapitalPriorityBand;
  method: string;
  narrative: string;
}

/** Bonus model recommendation. */
export interface BonusModel {
  id: string;
  roleFamily: string;
  targetBonusPct: number;
  maxBonusPct: number;
  metrics: string[];
  eligibility: string;
  expectedCost: number;
  narrative: string;
}

/** Benefits analysis summary. */
export interface BenefitsAnalysisResult {
  overallCompetitiveness: number;
  status: WorkforceHealthStatus;
  offerings: Array<{
    key: string;
    label: string;
    score: number;
    gap: string | null;
  }>;
  utilizationScore: number;
  recommendations: string[];
  narrative: string;
}

/** Skills gap analysis summary. */
export interface SkillsGapAnalysisResult {
  overallGapScore: number;
  status: WorkforceHealthStatus;
  criticalGaps: SkillInventoryItem[];
  roleGaps: Array<{
    role: string;
    gaps: string[];
    severity: HumanCapitalPriorityBand;
  }>;
  recommendations: string[];
  narrative: string;
}

/** Future workforce model. */
export interface FutureWorkforceModelResult {
  horizonYears: number;
  projectedHeadcount: number;
  capabilityShifts: Array<{
    capability: string;
    demandDelta: number;
    narrative: string;
  }>;
  scenarios: string[];
  investmentPriorities: string[];
  status: WorkforceHealthStatus;
  narrative: string;
}

/** Burnout risk dashboard. */
export interface BurnoutRiskDashboardResult {
  generatedAt: string;
  countsByLevel: Record<BurnoutRiskLevel, number>;
  averageScore: number;
  topInterventions: string[];
  atRiskEmployeeIds: string[];
  status: WorkforceHealthStatus;
  narrative: string;
}

/** Organizational capability index. */
export interface OrganizationalCapabilityIndexResult {
  overallScore: number;
  status: WorkforceHealthStatus;
  dimensions: {
    skills: number;
    leadership: number;
    learning: number;
    engagement: number;
    succession: number;
  };
  narrative: {
    organization: string;
    employees: string;
    leaders: string;
    mission: string;
    finance: string;
    summary: string;
  };
}

/** Unified human capital dashboard. */
export interface HumanCapitalDashboardResult {
  generatedAt: string;
  workforceHealthScore: number;
  leadershipHealthScore: number;
  employeeEngagementScore: number;
  talentRiskScore: number;
  hiringDashboard: HiringPriorityDashboard;
  successionReadiness: SuccessionReadinessSummary;
  burnoutDashboard: BurnoutRiskDashboardResult;
  capabilityIndex: OrganizationalCapabilityIndexResult;
  status: WorkforceHealthStatus;
  headline: string;
  narrative: string;
}

/** Primary generation request. */
export interface HumanCapitalRequest {
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
  governanceResult?: GovernanceResult;
  workforceHealth?: WorkforceHealthSignal;
  baselineOverrides?: Partial<HumanCapitalBaseline>;
  employees?: EmployeeProfileRecord[];
  candidates?: CandidateRecord[];
  metadata?: HumanCapitalMetadata;
}

/** Full human capital generation result. */
export interface HumanCapitalResult {
  requestId: string;
  version: string;
  generatedAt: string;
  periodLabel: string;
  scope: GraphScope;
  baseline: HumanCapitalBaseline;
  /** Core output scores */
  workforceHealthScore: HumanCapitalScore;
  leadershipHealthScore: HumanCapitalScore;
  employeeEngagementScore: HumanCapitalScore;
  talentRiskScore: HumanCapitalScore;
  /** Core dashboard */
  dashboard: HumanCapitalDashboardResult;
  /** Recruiting */
  candidates: CandidateRecord[];
  hiringRecommendations: HiringRecommendation[];
  offers: OfferOptimization[];
  hiringDashboard: HiringPriorityDashboard;
  referenceInsights: ReferenceInsight[];
  talentSourcing: TalentSourcingInsight[];
  employerBranding: EmployerBrandingInsight[];
  recruitingAnalytics: RecruitingAnalyticsResult;
  /** Employee */
  employees: EmployeeProfileRecord[];
  skills: SkillInventoryItem[];
  competencies: CompetencyRecord[];
  performance: PerformanceRecord[];
  goals: GoalRecord[];
  feedback: FeedbackRecord[];
  coaching: CoachingRecommendation[];
  recognition: RecognitionRecord[];
  behaviorInsights: BehaviorInsight[];
  productivityInsights: ProductivityInsight[];
  /** Leadership */
  leadershipAssessments: LeadershipAssessmentRecord[];
  succession: SuccessionReadinessSummary;
  talentMatrix: TalentMatrixPlacement[];
  orgDesign: OrgDesignRecommendation[];
  benchStrength: LeadershipBenchStrength;
  leadershipDevelopment: LeadershipDevelopmentRecord[];
  managerEffectiveness: ManagerEffectivenessRecord[];
  highPotentials: HighPotentialRecord[];
  /** Retention */
  burnout: BurnoutSignal[];
  retention: RetentionPredictionRecord[];
  engagement: EngagementAnalysisResult;
  stayInterviews: StayInterviewInsight[];
  exitFindings: ExitAnalysisFinding[];
  sentiment: EmployeeSentimentResult;
  cultureHealth: CultureHealthResult;
  /** Learning */
  learningPlans: LearningPlanRecord[];
  careerPaths: CareerPathRecord[];
  certifications: CertificationRecord[];
  mentorships: MentorshipMatch[];
  development: DevelopmentRecommendation[];
  careerPlans: CareerDevelopmentPlan[];
  trainingRecommendations: TrainingRecommendation[];
  knowledgeTransfer: KnowledgeTransferRecord[];
  /** Compensation */
  compensation: CompensationAnalysisResult;
  payEquity: PayEquityFinding[];
  incentives: IncentiveModel[];
  bonusModels: BonusModel[];
  benefits: BenefitsAnalysisResult;
  /** Planning */
  forecast: WorkforceForecastPoint[];
  capacity: CapacityPlanRow[];
  hiringForecast: HiringForecastRecord[];
  scenarios: OrgScenarioPlan[];
  skillsGap: SkillsGapAnalysisResult;
  futureWorkforce: FutureWorkforceModelResult;
  /** Outputs */
  burnoutDashboard: BurnoutRiskDashboardResult;
  capabilityIndex: OrganizationalCapabilityIndexResult;
  brief: ExecutiveWorkforceBrief;
  projection: HumanCapitalProjectionResult;
  confidence: HumanCapitalConfidenceScore;
  historyRecord: HumanCapitalHistoryRecord;
  recommendations: string[];
}
