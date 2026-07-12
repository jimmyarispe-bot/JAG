/**
 * Human Capital Intelligence — public API (Sprint 032).
 *
 * Talent lifecycle intelligence that sits on Organizational DNA + OIOS Core
 * to identify, recruit, hire, develop, retain, coach, evaluate, and grow people.
 */

export {
  HUMAN_CAPITAL_INTELLIGENCE_VERSION,
  BURNOUT_RISK_LEVELS,
  CANDIDATE_PIPELINE_STAGES,
  EMPLOYMENT_STATUSES,
  HUMAN_CAPITAL_ARTIFACT_STATUSES,
  HUMAN_CAPITAL_CONFIDENCE_LEVELS,
  HUMAN_CAPITAL_PRIORITY_BANDS,
  LEADERSHIP_READINESS_LEVELS,
  PERFORMANCE_RATINGS,
  TALENT_MATRIX_BOXES,
  WORKFORCE_HEALTH_STATUSES,
  type BehaviorInsight,
  type BenefitsAnalysisResult,
  type BonusModel,
  type BurnoutRiskDashboardResult,
  type BurnoutRiskLevel,
  type BurnoutSignal,
  type CandidatePipelineStage,
  type CandidateRecord,
  type CapacityPlanRow,
  type CareerDevelopmentPlan,
  type CareerPathRecord,
  type CertificationRecord,
  type CoachingRecommendation,
  type CompensationAnalysisResult,
  type CompetencyRecord,
  type CultureHealthResult,
  type DevelopmentRecommendation,
  type EmployeeProfileRecord,
  type EmployeeSentimentResult,
  type EmployerBrandingInsight,
  type EmploymentStatus,
  type EngagementAnalysisResult,
  type ExecutiveWorkforceBrief,
  type ExitAnalysisFinding,
  type FeedbackRecord,
  type FutureWorkforceModelResult,
  type GoalRecord,
  type GraphScope,
  type HighPotentialRecord,
  type HiringForecastRecord,
  type HiringPriorityDashboard,
  type HiringRecommendation,
  type HumanCapitalArtifactStatus,
  type HumanCapitalBaseline,
  type HumanCapitalConfidenceLevel,
  type HumanCapitalConfidenceScore,
  type HumanCapitalDashboardResult,
  type HumanCapitalHistoryRecord,
  type HumanCapitalMetadata,
  type HumanCapitalPriorityBand,
  type HumanCapitalProjectionResult,
  type HumanCapitalQueryRequest,
  type HumanCapitalQueryResult,
  type HumanCapitalRequest,
  type HumanCapitalResult,
  type HumanCapitalScore,
  type IncentiveModel,
  type KnowledgeTransferRecord,
  type LeadershipAssessmentRecord,
  type LeadershipDevelopmentRecord,
  type LeadershipReadinessLevel,
  type LearningPlanRecord,
  type ManagerEffectivenessRecord,
  type MentorshipMatch,
  type OrgDesignRecommendation,
  type OrganizationalCapabilityIndexResult,
  type OrgScenarioPlan,
  type PayEquityFinding,
  type PerformanceRating,
  type PerformanceRecord,
  type ProductivityInsight,
  type RecognitionRecord,
  type RecruitingAnalyticsResult,
  type ReferenceInsight,
  type RetentionPredictionRecord,
  type SalaryBenchmark,
  type SkillInventoryItem,
  type SkillsGapAnalysisResult,
  type StayInterviewInsight,
  type SuccessionPlanSlot,
  type SuccessionReadinessSummary,
  type TalentMatrixBox,
  type TalentMatrixPlacement,
  type TalentSourcingInsight,
  type TrainingRecommendation,
  type WorkforceForecastPoint,
  type WorkforceHealthSignal,
  type WorkforceHealthStatus,
} from "@/lib/platform/intelligence/human-capital/types";

export type {
  BehaviorInsights as BehaviorInsightsContract,
  BenefitsAnalysis as BenefitsAnalysisContract,
  BonusModeling as BonusModelingContract,
  BurnoutDetection as BurnoutDetectionContract,
  BurnoutRiskDashboard as BurnoutRiskDashboardContract,
  CandidatePipeline as CandidatePipelineContract,
  CandidateScoring as CandidateScoringContract,
  CapacityPlanning as CapacityPlanningContract,
  CareerPathing as CareerPathingContract,
  CareerPlanComposer as CareerPlanComposerContract,
  CertificationTracking as CertificationTrackingContract,
  CoachingEngine as CoachingEngineContract,
  CompensationAnalysis as CompensationAnalysisContract,
  CompetencyFramework as CompetencyFrameworkContract,
  CultureHealth as CultureHealthContract,
  DevelopmentRecommendations as DevelopmentRecommendationsContract,
  EmployeeProfileEngine as EmployeeProfileEngineContract,
  EmployeeSentiment as EmployeeSentimentContract,
  EmployerBrandingInsights as EmployerBrandingInsightsContract,
  EngagementAnalysis as EngagementAnalysisContract,
  ExecutiveWorkforceBriefGenerator as ExecutiveWorkforceBriefGeneratorContract,
  ExitAnalysis as ExitAnalysisContract,
  FeedbackEngine as FeedbackEngineContract,
  FutureWorkforceModel as FutureWorkforceModelContract,
  GoalManagement as GoalManagementContract,
  HighPotentialIdentification as HighPotentialIdentificationContract,
  HiringForecast as HiringForecastContract,
  HiringRecommendations as HiringRecommendationsContract,
  HumanCapitalDashboard as HumanCapitalDashboardContract,
  HumanCapitalDependencies,
  HumanCapitalEngine as HumanCapitalEngineContract,
  HumanCapitalProjection as HumanCapitalProjectionContract,
  HumanCapitalQueries as HumanCapitalQueriesContract,
  HumanCapitalService as HumanCapitalServiceContract,
  IncentiveModeling as IncentiveModelingContract,
  InterviewIntelligence as InterviewIntelligenceContract,
  KnowledgeTransfer as KnowledgeTransferContract,
  LeadershipAssessment as LeadershipAssessmentContract,
  LeadershipBenchStrengthEngine as LeadershipBenchStrengthEngineContract,
  LeadershipDevelopment as LeadershipDevelopmentContract,
  LearningPlans as LearningPlansContract,
  ManagerEffectiveness as ManagerEffectivenessContract,
  MentorshipMatching as MentorshipMatchingContract,
  OfferOptimizationEngine as OfferOptimizationEngineContract,
  OrganizationalCapabilityIndex as OrganizationalCapabilityIndexContract,
  OrganizationalDesign as OrganizationalDesignContract,
  OrganizationalScenarioPlanning as OrganizationalScenarioPlanningContract,
  PayEquityAnalysis as PayEquityAnalysisContract,
  PerformanceEngine as PerformanceEngineContract,
  ProductivityInsights as ProductivityInsightsContract,
  RecognitionEngine as RecognitionEngineContract,
  RecruitingAnalytics as RecruitingAnalyticsContract,
  ReferenceIntelligence as ReferenceIntelligenceContract,
  RetentionPrediction as RetentionPredictionContract,
  ResumeIntelligence as ResumeIntelligenceContract,
  SalaryBenchmarking as SalaryBenchmarkingContract,
  SkillsGapAnalysis as SkillsGapAnalysisContract,
  SkillsInventory as SkillsInventoryContract,
  StayInterviewInsights as StayInterviewInsightsContract,
  SuccessionPlanning as SuccessionPlanningContract,
  TalentMatrix as TalentMatrixContract,
  TalentSourcing as TalentSourcingContract,
  TrainingRecommendations as TrainingRecommendationsContract,
  WorkforceForecast as WorkforceForecastContract,
  WorkforceIntelligence as WorkforceIntelligenceContract,
  WorkforceRepository as WorkforceRepositoryContract,
} from "@/lib/platform/intelligence/human-capital/contracts";

export {
  buildConfidence,
  clamp,
  clamp01,
  defaultHumanCapitalBaseline,
  defaultPeriodLabel,
  deriveHumanCapitalBaseline,
  emptyHumanCapitalScope,
  levelFromValue,
  priorityFromRisk,
  priorityFromScore,
  scoreNarrative,
  statusFromScore,
  talentBox,
  workforceModels,
} from "@/lib/platform/intelligence/human-capital/models";

export {
  CandidatePipeline,
  CandidateScoring,
  EmployerBrandingInsights,
  HiringRecommendationEngine,
  HiringRecommendations,
  InterviewIntelligence,
  OfferOptimization,
  OfferOptimizationEngine,
  RecruitingAnalytics,
  ReferenceIntelligence,
  ResumeIntelligence,
  TalentSourcing,
} from "@/lib/platform/intelligence/human-capital/recruiting-intelligence";

export {
  BehaviorInsights,
  CoachingEngine,
  CompetencyFramework,
  EmployeeProfileEngine,
  FeedbackEngine,
  GoalManagement,
  PerformanceEngine,
  ProductivityInsights,
  RecognitionEngine,
  SkillsInventory,
} from "@/lib/platform/intelligence/human-capital/employee-intelligence";

export {
  HighPotentialIdentification,
  LeadershipAssessment,
  LeadershipBenchStrength,
  LeadershipBenchStrengthEngine,
  LeadershipDevelopment,
  ManagerEffectiveness,
  OrganizationalDesign,
  SuccessionPlanning,
  TalentMatrix,
} from "@/lib/platform/intelligence/human-capital/leadership-intelligence";

export {
  BurnoutDetection,
  CultureHealth,
  EmployeeSentiment,
  EngagementAnalysis,
  ExitAnalysis,
  RetentionPrediction,
  StayInterviewInsights,
} from "@/lib/platform/intelligence/human-capital/retention-intelligence";

export {
  CareerPathing,
  CertificationTracking,
  DevelopmentRecommendations,
  KnowledgeTransfer,
  LearningPlans,
  MentorshipMatching,
  TrainingRecommendations,
} from "@/lib/platform/intelligence/human-capital/learning-intelligence";

export {
  BenefitsAnalysis,
  BonusModeling,
  CompensationAnalysis,
  CompensationModeling,
  IncentiveModeling,
  PayEquityAnalysis,
  SalaryBenchmarking,
} from "@/lib/platform/intelligence/human-capital/compensation-intelligence";

export {
  CapacityPlanning,
  FutureWorkforceModel,
  HiringForecast,
  OrganizationalScenarioPlanning,
  SkillsGapAnalysis,
  WorkforceForecast,
} from "@/lib/platform/intelligence/human-capital/planning-intelligence";

export {
  BurnoutRiskDashboard,
  CareerPlanComposer,
  defaultHumanCapitalConfidence,
  ExecutiveWorkforceBriefGenerator,
  HumanCapitalDashboard,
  OrganizationalCapabilityIndex,
  WorkforceIntelligence,
} from "@/lib/platform/intelligence/human-capital/workforce-intelligence";

export {
  HumanCapitalProjection,
  HumanCapitalQueries,
} from "@/lib/platform/intelligence/human-capital/projection";

export {
  WorkforceRepository,
  WorkforceRepositoryStore,
} from "@/lib/platform/intelligence/human-capital/repository";

export {
  HumanCapitalEngine,
  HumanCapitalEngineImpl,
} from "@/lib/platform/intelligence/human-capital/human-capital-engine";

export {
  HumanCapitalService,
  HumanCapitalServiceImpl,
} from "@/lib/platform/intelligence/human-capital/service";

import { HumanCapitalEngine } from "@/lib/platform/intelligence/human-capital/human-capital-engine";
import type { HumanCapitalDependencies } from "@/lib/platform/intelligence/human-capital/contracts";
import { HumanCapitalService } from "@/lib/platform/intelligence/human-capital/service";
import {
  createOiosOperatingSystem,
  type CreateOiosOptions,
  type OiosStack,
} from "@/lib/platform/oios";
import {
  createOrganizationDnaIntelligence,
  type CreateOrganizationDnaOptions,
  type OrganizationDnaStack,
} from "@/lib/platform/intelligence/organization-dna";

/** Wired Human Capital Intelligence stack. */
export interface HumanCapitalStack {
  service: HumanCapitalService;
  engine: HumanCapitalEngine;
  organizationDna: OrganizationDnaStack | null;
  oios: OiosStack | null;
}

export interface CreateHumanCapitalOptions extends HumanCapitalDependencies {
  /** Attach / create Organizational DNA stack. */
  organizationDna?: OrganizationDnaStack;
  organizationDnaOptions?: CreateOrganizationDnaOptions;
  /** When true (default), auto-wire createOrganizationDnaIntelligence if not provided. */
  wireOrganizationDna?: boolean;
  /** Attach / create OIOS Core stack. */
  oios?: OiosStack;
  oiosOptions?: CreateOiosOptions;
  /** When true (default), auto-wire createOiosOperatingSystem if not provided. */
  wireOios?: boolean;
}

/**
 * Create a fully wired Human Capital Intelligence stack (DI entry point).
 */
export function createHumanCapitalIntelligence(
  options: CreateHumanCapitalOptions = {}
): HumanCapitalStack {
  const wireDna = options.wireOrganizationDna !== false;
  const wireOios = options.wireOios !== false;

  const organizationDna =
    options.organizationDna ??
    (wireDna
      ? createOrganizationDnaIntelligence({
          ...(options.organizationDnaOptions ?? {}),
          wireGraphAnalyzer: false,
          wireDecision: false,
          wirePredictive: false,
          wireBoardGovernance: false,
        })
      : null);

  const oios =
    options.oios ??
    (wireOios
      ? createOiosOperatingSystem({
          ...(options.oiosOptions ?? {}),
          organizationDnaStack:
            options.oiosOptions?.organizationDnaStack ??
            organizationDna ??
            undefined,
          wireOrganizationDna: false,
        })
      : null);

  const engine = new HumanCapitalEngine(options);
  const service = new HumanCapitalService({
    ...options,
    engine,
  });

  return {
    service,
    engine,
    organizationDna,
    oios,
  };
}
