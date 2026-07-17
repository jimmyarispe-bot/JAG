/**
 * Human Capital Intelligence — contracts / interfaces only (Sprint 032).
 *
 * Leaf module: no imports from engine implementations (avoids cycles).
 */

import type {
  BehaviorInsight,
  BenefitsAnalysisResult,
  BonusModel,
  BurnoutRiskDashboardResult,
  BurnoutSignal,
  CandidateRecord,
  CapacityPlanRow,
  CareerDevelopmentPlan,
  CareerPathRecord,
  CertificationRecord,
  CoachingRecommendation,
  CompensationAnalysisResult,
  CompetencyRecord,
  CultureHealthResult,
  DevelopmentRecommendation,
  EmployeeProfileRecord,
  EmployeeSentimentResult,
  EmployerBrandingInsight,
  EngagementAnalysisResult,
  ExecutiveWorkforceBrief,
  ExitAnalysisFinding,
  FeedbackRecord,
  FutureWorkforceModelResult,
  GoalRecord,
  HighPotentialRecord,
  HiringForecastRecord,
  HiringPriorityDashboard,
  HiringRecommendation,
  HumanCapitalBaseline,
  HumanCapitalConfidenceScore,
  HumanCapitalDashboardResult,
  HumanCapitalHistoryRecord,
  HumanCapitalProjectionResult,
  HumanCapitalQueryRequest,
  HumanCapitalQueryResult,
  HumanCapitalRequest,
  HumanCapitalResult,
  HumanCapitalScore,
  IncentiveModel,
  KnowledgeTransferRecord,
  LeadershipAssessmentRecord,
  LeadershipBenchStrength,
  LeadershipDevelopmentRecord,
  LearningPlanRecord,
  ManagerEffectivenessRecord,
  MentorshipMatch,
  OfferOptimization,
  OrgDesignRecommendation,
  OrganizationalCapabilityIndexResult,
  OrgScenarioPlan,
  PayEquityFinding,
  PerformanceRecord,
  ProductivityInsight,
  RecognitionRecord,
  RecruitingAnalyticsResult,
  ReferenceInsight,
  RetentionPredictionRecord,
  SalaryBenchmark,
  SkillInventoryItem,
  SkillsGapAnalysisResult,
  StayInterviewInsight,
  SuccessionPlanSlot,
  SuccessionReadinessSummary,
  TalentMatrixPlacement,
  TalentSourcingInsight,
  TrainingRecommendation,
  WorkforceForecastPoint,
  GraphScope,
} from "@/lib/platform/intelligence/human-capital/types";

/** Core orchestration engine. */
export interface HumanCapitalEngine {
  build(request: HumanCapitalRequest): HumanCapitalResult;
}

/** Workforce intelligence composer (scores + dashboards). */
export interface WorkforceIntelligence {
  composeScores(input: {
    baseline: HumanCapitalBaseline;
    engagement: EngagementAnalysisResult;
    benchStrength: LeadershipBenchStrength;
    retention: RetentionPredictionRecord[];
    burnout: BurnoutSignal[];
  }): {
    workforceHealthScore: HumanCapitalScore;
    leadershipHealthScore: HumanCapitalScore;
    employeeEngagementScore: HumanCapitalScore;
    talentRiskScore: HumanCapitalScore;
  };
  buildHiringDashboard(input: {
    baseline: HumanCapitalBaseline;
    recommendations: HiringRecommendation[];
    candidates: CandidateRecord[];
    now: Date;
  }): HiringPriorityDashboard;
}

/** Recruiting */
export interface CandidatePipeline {
  build(input: {
    request: HumanCapitalRequest;
    baseline: HumanCapitalBaseline;
    now: Date;
  }): CandidateRecord[];
}

export interface CandidateScoring {
  score(candidates: CandidateRecord[], baseline: HumanCapitalBaseline): CandidateRecord[];
}

export interface ResumeIntelligence {
  summarize(candidates: CandidateRecord[]): CandidateRecord[];
}

export interface InterviewIntelligence {
  enrich(candidates: CandidateRecord[], baseline: HumanCapitalBaseline): CandidateRecord[];
}

export interface HiringRecommendations {
  recommend(input: {
    request: HumanCapitalRequest;
    baseline: HumanCapitalBaseline;
    candidates: CandidateRecord[];
    capacity: CapacityPlanRow[];
    now: Date;
  }): HiringRecommendation[];
}

export interface OfferOptimizationEngine {
  optimize(input: {
    candidates: CandidateRecord[];
    benchmarks: SalaryBenchmark[];
    now: Date;
  }): OfferOptimization[];
}

export interface ReferenceIntelligence {
  analyze(input: {
    candidates: CandidateRecord[];
    now: Date;
  }): ReferenceInsight[];
}

export interface TalentSourcing {
  analyze(input: {
    candidates: CandidateRecord[];
    baseline: HumanCapitalBaseline;
    now: Date;
  }): TalentSourcingInsight[];
}

export interface EmployerBrandingInsights {
  analyze(input: {
    baseline: HumanCapitalBaseline;
    candidates: CandidateRecord[];
    now: Date;
  }): EmployerBrandingInsight[];
}

export interface RecruitingAnalytics {
  analyze(input: {
    candidates: CandidateRecord[];
    baseline: HumanCapitalBaseline;
    recommendations: HiringRecommendation[];
  }): RecruitingAnalyticsResult;
}

/** Employee */
export interface EmployeeProfileEngine {
  build(input: {
    request: HumanCapitalRequest;
    baseline: HumanCapitalBaseline;
    now: Date;
  }): EmployeeProfileRecord[];
}

export interface SkillsInventory {
  inventory(input: {
    employees: EmployeeProfileRecord[];
    baseline: HumanCapitalBaseline;
    now: Date;
  }): SkillInventoryItem[];
}

export interface CompetencyFramework {
  assess(input: {
    employees: EmployeeProfileRecord[];
    baseline: HumanCapitalBaseline;
    now: Date;
  }): CompetencyRecord[];
}

export interface PerformanceEngine {
  evaluate(input: {
    employees: EmployeeProfileRecord[];
    baseline: HumanCapitalBaseline;
    now: Date;
  }): PerformanceRecord[];
}

export interface GoalManagement {
  track(input: {
    employees: EmployeeProfileRecord[];
    performance: PerformanceRecord[];
    now: Date;
  }): GoalRecord[];
}

export interface FeedbackEngine {
  collect(input: {
    employees: EmployeeProfileRecord[];
    now: Date;
  }): FeedbackRecord[];
}

export interface CoachingEngine {
  recommend(input: {
    employees: EmployeeProfileRecord[];
    performance: PerformanceRecord[];
    burnout: BurnoutSignal[];
    retention: RetentionPredictionRecord[];
    now: Date;
  }): CoachingRecommendation[];
}

export interface RecognitionEngine {
  recommend(input: {
    employees: EmployeeProfileRecord[];
    performance: PerformanceRecord[];
    now: Date;
  }): RecognitionRecord[];
}

export interface BehaviorInsights {
  analyze(input: {
    employees: EmployeeProfileRecord[];
    feedback: FeedbackRecord[];
    performance: PerformanceRecord[];
    now: Date;
  }): BehaviorInsight[];
}

export interface ProductivityInsights {
  analyze(input: {
    employees: EmployeeProfileRecord[];
    performance: PerformanceRecord[];
    goals: GoalRecord[];
    now: Date;
  }): ProductivityInsight[];
}

/** Leadership */
export interface LeadershipAssessment {
  assess(input: {
    employees: EmployeeProfileRecord[];
    performance: PerformanceRecord[];
    baseline: HumanCapitalBaseline;
    now: Date;
  }): LeadershipAssessmentRecord[];
}

export interface SuccessionPlanning {
  plan(input: {
    employees: EmployeeProfileRecord[];
    assessments: LeadershipAssessmentRecord[];
    baseline: HumanCapitalBaseline;
    now: Date;
  }): SuccessionPlanSlot[];
  summarize(slots: SuccessionPlanSlot[], baseline: HumanCapitalBaseline): SuccessionReadinessSummary;
}

export interface TalentMatrix {
  place(input: {
    employees: EmployeeProfileRecord[];
    performance: PerformanceRecord[];
    now: Date;
  }): TalentMatrixPlacement[];
}

export interface OrganizationalDesign {
  recommend(input: {
    employees: EmployeeProfileRecord[];
    baseline: HumanCapitalBaseline;
    now: Date;
  }): OrgDesignRecommendation[];
}

export interface LeadershipBenchStrengthEngine {
  measure(input: {
    assessments: LeadershipAssessmentRecord[];
    succession: SuccessionPlanSlot[];
    baseline: HumanCapitalBaseline;
  }): LeadershipBenchStrength;
}

export interface LeadershipDevelopment {
  plan(input: {
    assessments: LeadershipAssessmentRecord[];
    employees: EmployeeProfileRecord[];
    now: Date;
  }): LeadershipDevelopmentRecord[];
}

export interface ManagerEffectiveness {
  assess(input: {
    employees: EmployeeProfileRecord[];
    engagement: EngagementAnalysisResult;
    retention: RetentionPredictionRecord[];
    now: Date;
  }): ManagerEffectivenessRecord[];
}

export interface HighPotentialIdentification {
  identify(input: {
    employees: EmployeeProfileRecord[];
    performance: PerformanceRecord[];
    talentMatrix: TalentMatrixPlacement[];
    assessments: LeadershipAssessmentRecord[];
    now: Date;
  }): HighPotentialRecord[];
}

/** Retention */
export interface BurnoutDetection {
  detect(input: {
    employees: EmployeeProfileRecord[];
    baseline: HumanCapitalBaseline;
    now: Date;
  }): BurnoutSignal[];
}

export interface RetentionPrediction {
  predict(input: {
    employees: EmployeeProfileRecord[];
    burnout: BurnoutSignal[];
    baseline: HumanCapitalBaseline;
    now: Date;
  }): RetentionPredictionRecord[];
}

export interface EngagementAnalysis {
  analyze(input: {
    employees: EmployeeProfileRecord[];
    baseline: HumanCapitalBaseline;
    feedback: FeedbackRecord[];
  }): EngagementAnalysisResult;
}

export interface StayInterviewInsights {
  derive(input: {
    employees: EmployeeProfileRecord[];
    retention: RetentionPredictionRecord[];
    now: Date;
  }): StayInterviewInsight[];
}

export interface ExitAnalysis {
  analyze(input: {
    baseline: HumanCapitalBaseline;
    retention: RetentionPredictionRecord[];
    now: Date;
  }): ExitAnalysisFinding[];
}

export interface EmployeeSentiment {
  analyze(input: {
    employees: EmployeeProfileRecord[];
    feedback: FeedbackRecord[];
    engagement: EngagementAnalysisResult;
    baseline: HumanCapitalBaseline;
  }): EmployeeSentimentResult;
}

export interface CultureHealth {
  assess(input: {
    baseline: HumanCapitalBaseline;
    engagement: EngagementAnalysisResult;
    sentiment: EmployeeSentimentResult;
    exitFindings: ExitAnalysisFinding[];
  }): CultureHealthResult;
}

/** Learning */
export interface LearningPlans {
  build(input: {
    employees: EmployeeProfileRecord[];
    skills: SkillInventoryItem[];
    competencies: CompetencyRecord[];
    now: Date;
  }): LearningPlanRecord[];
}

export interface CareerPathing {
  path(input: {
    employees: EmployeeProfileRecord[];
    assessments: LeadershipAssessmentRecord[];
    now: Date;
  }): CareerPathRecord[];
}

export interface CertificationTracking {
  track(input: {
    employees: EmployeeProfileRecord[];
    now: Date;
  }): CertificationRecord[];
}

export interface MentorshipMatching {
  match(input: {
    employees: EmployeeProfileRecord[];
    assessments: LeadershipAssessmentRecord[];
    now: Date;
  }): MentorshipMatch[];
}

export interface DevelopmentRecommendations {
  recommend(input: {
    employees: EmployeeProfileRecord[];
    skills: SkillInventoryItem[];
    performance: PerformanceRecord[];
    now: Date;
  }): DevelopmentRecommendation[];
}

export interface TrainingRecommendations {
  recommend(input: {
    employees: EmployeeProfileRecord[];
    skills: SkillInventoryItem[];
    competencies: CompetencyRecord[];
    development: DevelopmentRecommendation[];
    now: Date;
  }): TrainingRecommendation[];
}

export interface KnowledgeTransfer {
  plan(input: {
    employees: EmployeeProfileRecord[];
    skills: SkillInventoryItem[];
    succession: SuccessionPlanSlot[];
    now: Date;
  }): KnowledgeTransferRecord[];
}

/** Compensation */
export interface SalaryBenchmarking {
  benchmark(input: {
    baseline: HumanCapitalBaseline;
    employees: EmployeeProfileRecord[];
    now: Date;
  }): SalaryBenchmark[];
}

export interface CompensationAnalysis {
  analyze(input: {
    benchmarks: SalaryBenchmark[];
    baseline: HumanCapitalBaseline;
  }): CompensationAnalysisResult;
}

export interface PayEquityAnalysis {
  analyze(input: {
    employees: EmployeeProfileRecord[];
    benchmarks: SalaryBenchmark[];
    now: Date;
  }): PayEquityFinding[];
}

export interface IncentiveModeling {
  model(input: {
    employees: EmployeeProfileRecord[];
    baseline: HumanCapitalBaseline;
    now: Date;
  }): IncentiveModel[];
}

export interface BonusModeling {
  model(input: {
    employees: EmployeeProfileRecord[];
    baseline: HumanCapitalBaseline;
    incentives: IncentiveModel[];
    now: Date;
  }): BonusModel[];
}

export interface BenefitsAnalysis {
  analyze(input: {
    baseline: HumanCapitalBaseline;
    employees: EmployeeProfileRecord[];
    compensation: CompensationAnalysisResult;
  }): BenefitsAnalysisResult;
}

/** Planning */
export interface WorkforceForecast {
  forecast(input: {
    baseline: HumanCapitalBaseline;
    now: Date;
  }): WorkforceForecastPoint[];
}

export interface CapacityPlanning {
  plan(input: {
    baseline: HumanCapitalBaseline;
    employees: EmployeeProfileRecord[];
    now: Date;
  }): CapacityPlanRow[];
}

export interface HiringForecast {
  forecast(input: {
    baseline: HumanCapitalBaseline;
    capacity: CapacityPlanRow[];
    recommendations: HiringRecommendation[];
    now: Date;
  }): HiringForecastRecord[];
}

export interface OrganizationalScenarioPlanning {
  scenarios(input: {
    baseline: HumanCapitalBaseline;
    forecast: WorkforceForecastPoint[];
    now: Date;
  }): OrgScenarioPlan[];
}

export interface SkillsGapAnalysis {
  analyze(input: {
    skills: SkillInventoryItem[];
    competencies: CompetencyRecord[];
    employees: EmployeeProfileRecord[];
    baseline: HumanCapitalBaseline;
  }): SkillsGapAnalysisResult;
}

export interface FutureWorkforceModel {
  model(input: {
    baseline: HumanCapitalBaseline;
    forecast: WorkforceForecastPoint[];
    skillsGap: SkillsGapAnalysisResult;
    scenarios: OrgScenarioPlan[];
  }): FutureWorkforceModelResult;
}

/** Outputs */
export interface BurnoutRiskDashboard {
  build(input: {
    burnout: BurnoutSignal[];
    baseline: HumanCapitalBaseline;
    now: Date;
  }): BurnoutRiskDashboardResult;
}

export interface OrganizationalCapabilityIndex {
  build(input: {
    baseline: HumanCapitalBaseline;
    skills: SkillInventoryItem[];
    benchStrength: LeadershipBenchStrength;
    engagement: EngagementAnalysisResult;
    succession: SuccessionReadinessSummary;
    learningPlans: LearningPlanRecord[];
  }): OrganizationalCapabilityIndexResult;
}

export interface HumanCapitalDashboard {
  compose(input: {
    scores: {
      workforceHealthScore: HumanCapitalScore;
      leadershipHealthScore: HumanCapitalScore;
      employeeEngagementScore: HumanCapitalScore;
      talentRiskScore: HumanCapitalScore;
    };
    hiringDashboard: HiringPriorityDashboard;
    succession: SuccessionReadinessSummary;
    burnoutDashboard: BurnoutRiskDashboardResult;
    capabilityIndex: OrganizationalCapabilityIndexResult;
    now: Date;
  }): HumanCapitalDashboardResult;
}

export interface HumanCapitalProjection {
  project(input: {
    request: HumanCapitalRequest;
    workforceHealthScore: HumanCapitalScore;
    leadershipHealthScore: HumanCapitalScore;
    employeeEngagementScore: HumanCapitalScore;
    talentRiskScore: HumanCapitalScore;
    hiringDashboard: HiringPriorityDashboard;
    succession: SuccessionReadinessSummary;
    forecast: WorkforceForecastPoint[];
    coaching: CoachingRecommendation[];
    careerPlans: CareerDevelopmentPlan[];
    brief: ExecutiveWorkforceBrief;
    candidates: CandidateRecord[];
    employees: EmployeeProfileRecord[];
    retention: RetentionPredictionRecord[];
    learningPlans: LearningPlanRecord[];
    confidence: HumanCapitalConfidenceScore;
    dashboard: HumanCapitalDashboardResult;
    burnoutDashboard: BurnoutRiskDashboardResult;
    capabilityIndex: OrganizationalCapabilityIndexResult;
  }): HumanCapitalProjectionResult;
}

export interface HumanCapitalQueries {
  ask(
    result: HumanCapitalResult,
    request: HumanCapitalQueryRequest
  ): HumanCapitalQueryResult;
}

export interface ExecutiveWorkforceBriefGenerator {
  generate(input: {
    request: HumanCapitalRequest;
    baseline: HumanCapitalBaseline;
    workforceHealthScore: HumanCapitalScore;
    leadershipHealthScore: HumanCapitalScore;
    employeeEngagementScore: HumanCapitalScore;
    talentRiskScore: HumanCapitalScore;
    hiringDashboard: HiringPriorityDashboard;
    succession: SuccessionReadinessSummary;
    retention: RetentionPredictionRecord[];
    coaching: CoachingRecommendation[];
    confidence: HumanCapitalConfidenceScore;
    now: Date;
  }): ExecutiveWorkforceBrief;
}

export interface CareerPlanComposer {
  compose(input: {
    paths: CareerPathRecord[];
    learning: LearningPlanRecord[];
    coaching: CoachingRecommendation[];
    development: DevelopmentRecommendation[];
    now: Date;
  }): CareerDevelopmentPlan[];
}

/** Repository */
/** Legacy public name (Sprint 032); domain package is human-capital. */
export interface WorkforceRepository {
  save(result: HumanCapitalResult): HumanCapitalResult;
  get(requestId: string): HumanCapitalResult | null;
  list(scope?: Partial<GraphScope>): HumanCapitalResult[];
  remove(requestId: string): boolean;
  saveHistory(record: HumanCapitalHistoryRecord): HumanCapitalHistoryRecord;
  listHistory(scope?: Partial<GraphScope>): HumanCapitalHistoryRecord[];
  clear(): void;
}

/** Public service façade */
export interface HumanCapitalService {
  build(request: HumanCapitalRequest): HumanCapitalResult;
  query(
    result: HumanCapitalResult,
    request: HumanCapitalQueryRequest
  ): HumanCapitalQueryResult;
  repository(): WorkforceRepository;
}

/** DI bag for the full Human Capital Intelligence stack. */
export interface HumanCapitalDependencies {
  engine?: HumanCapitalEngine;
  workforceIntelligence?: WorkforceIntelligence;
  humanCapitalDashboard?: HumanCapitalDashboard;
  burnoutRiskDashboard?: BurnoutRiskDashboard;
  organizationalCapabilityIndex?: OrganizationalCapabilityIndex;
  candidatePipeline?: CandidatePipeline;
  candidateScoring?: CandidateScoring;
  resumeIntelligence?: ResumeIntelligence;
  interviewIntelligence?: InterviewIntelligence;
  hiringRecommendations?: HiringRecommendations;
  offerOptimization?: OfferOptimizationEngine;
  referenceIntelligence?: ReferenceIntelligence;
  talentSourcing?: TalentSourcing;
  employerBrandingInsights?: EmployerBrandingInsights;
  recruitingAnalytics?: RecruitingAnalytics;
  employeeProfile?: EmployeeProfileEngine;
  skillsInventory?: SkillsInventory;
  competencyFramework?: CompetencyFramework;
  performanceEngine?: PerformanceEngine;
  goalManagement?: GoalManagement;
  feedbackEngine?: FeedbackEngine;
  coachingEngine?: CoachingEngine;
  recognitionEngine?: RecognitionEngine;
  behaviorInsights?: BehaviorInsights;
  productivityInsights?: ProductivityInsights;
  leadershipAssessment?: LeadershipAssessment;
  successionPlanning?: SuccessionPlanning;
  talentMatrix?: TalentMatrix;
  organizationalDesign?: OrganizationalDesign;
  leadershipBenchStrength?: LeadershipBenchStrengthEngine;
  leadershipDevelopment?: LeadershipDevelopment;
  managerEffectiveness?: ManagerEffectiveness;
  highPotentialIdentification?: HighPotentialIdentification;
  burnoutDetection?: BurnoutDetection;
  retentionPrediction?: RetentionPrediction;
  engagementAnalysis?: EngagementAnalysis;
  stayInterviewInsights?: StayInterviewInsights;
  exitAnalysis?: ExitAnalysis;
  employeeSentiment?: EmployeeSentiment;
  cultureHealth?: CultureHealth;
  learningPlans?: LearningPlans;
  careerPathing?: CareerPathing;
  certificationTracking?: CertificationTracking;
  mentorshipMatching?: MentorshipMatching;
  developmentRecommendations?: DevelopmentRecommendations;
  trainingRecommendations?: TrainingRecommendations;
  knowledgeTransfer?: KnowledgeTransfer;
  salaryBenchmarking?: SalaryBenchmarking;
  compensationAnalysis?: CompensationAnalysis;
  payEquityAnalysis?: PayEquityAnalysis;
  incentiveModeling?: IncentiveModeling;
  bonusModeling?: BonusModeling;
  benefitsAnalysis?: BenefitsAnalysis;
  workforceForecast?: WorkforceForecast;
  capacityPlanning?: CapacityPlanning;
  hiringForecast?: HiringForecast;
  organizationalScenarioPlanning?: OrganizationalScenarioPlanning;
  skillsGapAnalysis?: SkillsGapAnalysis;
  futureWorkforceModel?: FutureWorkforceModel;
  projection?: HumanCapitalProjection;
  queries?: HumanCapitalQueries;
  briefGenerator?: ExecutiveWorkforceBriefGenerator;
  careerPlanComposer?: CareerPlanComposer;
  repository?: WorkforceRepository;
  now?: () => Date;
  createId?: (prefix: string) => string;
}
