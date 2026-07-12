/**
 * Human Capital Intelligence — HumanCapitalEngine (Sprint 032).
 *
 * Orchestrates recruiting, employee, leadership, retention, learning,
 * compensation, and planning intelligence into a unified result.
 */

import type {
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
  EmployeeProfileEngine as EmployeeProfileContract,
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
  IncentiveModeling as IncentiveModelingContract,
  InterviewIntelligence as InterviewIntelligenceContract,
  KnowledgeTransfer as KnowledgeTransferContract,
  LeadershipAssessment as LeadershipAssessmentContract,
  LeadershipBenchStrengthEngine as LeadershipBenchStrengthContract,
  LeadershipDevelopment as LeadershipDevelopmentContract,
  LearningPlans as LearningPlansContract,
  ManagerEffectiveness as ManagerEffectivenessContract,
  MentorshipMatching as MentorshipMatchingContract,
  OfferOptimizationEngine as OfferOptimizationContract,
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
import {
  CandidatePipeline,
  CandidateScoring,
  EmployerBrandingInsights,
  HiringRecommendations,
  InterviewIntelligence,
  OfferOptimizationEngine,
  RecruitingAnalytics,
  ReferenceIntelligence,
  ResumeIntelligence,
  TalentSourcing,
} from "@/lib/platform/intelligence/human-capital/recruiting-intelligence";
import {
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
import {
  HighPotentialIdentification,
  LeadershipAssessment,
  LeadershipBenchStrengthEngine,
  LeadershipDevelopment,
  ManagerEffectiveness,
  OrganizationalDesign,
  SuccessionPlanning,
  TalentMatrix,
} from "@/lib/platform/intelligence/human-capital/leadership-intelligence";
import {
  BurnoutDetection,
  CultureHealth,
  EmployeeSentiment,
  EngagementAnalysis,
  ExitAnalysis,
  RetentionPrediction,
  StayInterviewInsights,
} from "@/lib/platform/intelligence/human-capital/retention-intelligence";
import {
  CareerPathing,
  CertificationTracking,
  DevelopmentRecommendations,
  KnowledgeTransfer,
  LearningPlans,
  MentorshipMatching,
  TrainingRecommendations,
} from "@/lib/platform/intelligence/human-capital/learning-intelligence";
import {
  BenefitsAnalysis,
  BonusModeling,
  CompensationAnalysis,
  IncentiveModeling,
  PayEquityAnalysis,
  SalaryBenchmarking,
} from "@/lib/platform/intelligence/human-capital/compensation-intelligence";
import {
  CapacityPlanning,
  FutureWorkforceModel,
  HiringForecast,
  OrganizationalScenarioPlanning,
  SkillsGapAnalysis,
  WorkforceForecast,
} from "@/lib/platform/intelligence/human-capital/planning-intelligence";
import {
  BurnoutRiskDashboard,
  CareerPlanComposer,
  defaultHumanCapitalConfidence,
  ExecutiveWorkforceBriefGenerator,
  HumanCapitalDashboard,
  OrganizationalCapabilityIndex,
  WorkforceIntelligence,
} from "@/lib/platform/intelligence/human-capital/workforce-intelligence";
import {
  HumanCapitalProjection,
  HumanCapitalQueries,
} from "@/lib/platform/intelligence/human-capital/projection";
import { WorkforceRepositoryStore } from "@/lib/platform/intelligence/human-capital/repository";
import {
  defaultPeriodLabel,
  deriveHumanCapitalBaseline,
  emptyHumanCapitalScope,
} from "@/lib/platform/intelligence/human-capital/models";
import {
  HUMAN_CAPITAL_INTELLIGENCE_VERSION,
  type HumanCapitalRequest,
  type HumanCapitalResult,
} from "@/lib/platform/intelligence/human-capital/types";

export interface HumanCapitalEngineDependencies extends HumanCapitalDependencies {}

/**
 * HumanCapitalEngine — core orchestrator for human capital outputs.
 */
export class HumanCapitalEngineImpl implements HumanCapitalEngineContract {
  private readonly workforceIntelligence: WorkforceIntelligenceContract;
  private readonly humanCapitalDashboard: HumanCapitalDashboardContract;
  private readonly burnoutRiskDashboard: BurnoutRiskDashboardContract;
  private readonly organizationalCapabilityIndex: OrganizationalCapabilityIndexContract;
  private readonly candidatePipeline: CandidatePipelineContract;
  private readonly candidateScoring: CandidateScoringContract;
  private readonly resumeIntelligence: ResumeIntelligenceContract;
  private readonly interviewIntelligence: InterviewIntelligenceContract;
  private readonly hiringRecommendations: HiringRecommendationsContract;
  private readonly offerOptimization: OfferOptimizationContract;
  private readonly referenceIntelligence: ReferenceIntelligenceContract;
  private readonly talentSourcing: TalentSourcingContract;
  private readonly employerBrandingInsights: EmployerBrandingInsightsContract;
  private readonly recruitingAnalytics: RecruitingAnalyticsContract;
  private readonly employeeProfile: EmployeeProfileContract;
  private readonly skillsInventory: SkillsInventoryContract;
  private readonly competencyFramework: CompetencyFrameworkContract;
  private readonly performanceEngine: PerformanceEngineContract;
  private readonly goalManagement: GoalManagementContract;
  private readonly feedbackEngine: FeedbackEngineContract;
  private readonly coachingEngine: CoachingEngineContract;
  private readonly recognitionEngine: RecognitionEngineContract;
  private readonly behaviorInsights: BehaviorInsightsContract;
  private readonly productivityInsights: ProductivityInsightsContract;
  private readonly leadershipAssessment: LeadershipAssessmentContract;
  private readonly successionPlanning: SuccessionPlanningContract;
  private readonly talentMatrix: TalentMatrixContract;
  private readonly organizationalDesign: OrganizationalDesignContract;
  private readonly leadershipBenchStrength: LeadershipBenchStrengthContract;
  private readonly leadershipDevelopment: LeadershipDevelopmentContract;
  private readonly managerEffectiveness: ManagerEffectivenessContract;
  private readonly highPotentialIdentification: HighPotentialIdentificationContract;
  private readonly burnoutDetection: BurnoutDetectionContract;
  private readonly retentionPrediction: RetentionPredictionContract;
  private readonly engagementAnalysis: EngagementAnalysisContract;
  private readonly stayInterviewInsights: StayInterviewInsightsContract;
  private readonly exitAnalysis: ExitAnalysisContract;
  private readonly employeeSentiment: EmployeeSentimentContract;
  private readonly cultureHealth: CultureHealthContract;
  private readonly learningPlans: LearningPlansContract;
  private readonly careerPathing: CareerPathingContract;
  private readonly certificationTracking: CertificationTrackingContract;
  private readonly mentorshipMatching: MentorshipMatchingContract;
  private readonly developmentRecommendations: DevelopmentRecommendationsContract;
  private readonly trainingRecommendations: TrainingRecommendationsContract;
  private readonly knowledgeTransfer: KnowledgeTransferContract;
  private readonly salaryBenchmarking: SalaryBenchmarkingContract;
  private readonly compensationAnalysis: CompensationAnalysisContract;
  private readonly payEquityAnalysis: PayEquityAnalysisContract;
  private readonly incentiveModeling: IncentiveModelingContract;
  private readonly bonusModeling: BonusModelingContract;
  private readonly benefitsAnalysis: BenefitsAnalysisContract;
  private readonly workforceForecast: WorkforceForecastContract;
  private readonly capacityPlanning: CapacityPlanningContract;
  private readonly hiringForecast: HiringForecastContract;
  private readonly organizationalScenarioPlanning: OrganizationalScenarioPlanningContract;
  private readonly skillsGapAnalysis: SkillsGapAnalysisContract;
  private readonly futureWorkforceModel: FutureWorkforceModelContract;
  private readonly projection: HumanCapitalProjectionContract;
  private readonly briefGenerator: ExecutiveWorkforceBriefGeneratorContract;
  private readonly careerPlanComposer: CareerPlanComposerContract;
  private readonly repositoryStore: WorkforceRepositoryContract;
  private readonly now: () => Date;
  private readonly createId: (prefix: string) => string;

  readonly queries: HumanCapitalQueriesContract;

  constructor(dependencies: HumanCapitalEngineDependencies = {}) {
    const now = dependencies.now ?? (() => new Date());
    const createId =
      dependencies.createId ??
      ((prefix) =>
        `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);

    this.now = now;
    this.createId = createId;

    this.workforceIntelligence =
      dependencies.workforceIntelligence ?? new WorkforceIntelligence();
    this.humanCapitalDashboard =
      dependencies.humanCapitalDashboard ?? new HumanCapitalDashboard();
    this.burnoutRiskDashboard =
      dependencies.burnoutRiskDashboard ?? new BurnoutRiskDashboard();
    this.organizationalCapabilityIndex =
      dependencies.organizationalCapabilityIndex ??
      new OrganizationalCapabilityIndex();
    this.candidatePipeline =
      dependencies.candidatePipeline ?? new CandidatePipeline({ createId });
    this.candidateScoring =
      dependencies.candidateScoring ?? new CandidateScoring();
    this.resumeIntelligence =
      dependencies.resumeIntelligence ?? new ResumeIntelligence();
    this.interviewIntelligence =
      dependencies.interviewIntelligence ?? new InterviewIntelligence();
    this.hiringRecommendations =
      dependencies.hiringRecommendations ??
      new HiringRecommendations({ createId });
    this.offerOptimization =
      dependencies.offerOptimization ??
      new OfferOptimizationEngine({ createId });
    this.referenceIntelligence =
      dependencies.referenceIntelligence ??
      new ReferenceIntelligence({ createId });
    this.talentSourcing =
      dependencies.talentSourcing ?? new TalentSourcing({ createId });
    this.employerBrandingInsights =
      dependencies.employerBrandingInsights ??
      new EmployerBrandingInsights({ createId });
    this.recruitingAnalytics =
      dependencies.recruitingAnalytics ?? new RecruitingAnalytics();
    this.employeeProfile =
      dependencies.employeeProfile ?? new EmployeeProfileEngine({ createId });
    this.skillsInventory =
      dependencies.skillsInventory ?? new SkillsInventory({ createId });
    this.competencyFramework =
      dependencies.competencyFramework ??
      new CompetencyFramework({ createId });
    this.performanceEngine =
      dependencies.performanceEngine ?? new PerformanceEngine({ createId });
    this.goalManagement =
      dependencies.goalManagement ?? new GoalManagement({ createId });
    this.feedbackEngine =
      dependencies.feedbackEngine ?? new FeedbackEngine({ createId });
    this.coachingEngine =
      dependencies.coachingEngine ?? new CoachingEngine({ createId });
    this.recognitionEngine =
      dependencies.recognitionEngine ?? new RecognitionEngine({ createId });
    this.behaviorInsights =
      dependencies.behaviorInsights ?? new BehaviorInsights({ createId });
    this.productivityInsights =
      dependencies.productivityInsights ??
      new ProductivityInsights({ createId });
    this.leadershipAssessment =
      dependencies.leadershipAssessment ??
      new LeadershipAssessment({ createId });
    this.successionPlanning =
      dependencies.successionPlanning ?? new SuccessionPlanning({ createId });
    this.talentMatrix =
      dependencies.talentMatrix ?? new TalentMatrix({ createId });
    this.organizationalDesign =
      dependencies.organizationalDesign ??
      new OrganizationalDesign({ createId });
    this.leadershipBenchStrength =
      dependencies.leadershipBenchStrength ??
      new LeadershipBenchStrengthEngine();
    this.leadershipDevelopment =
      dependencies.leadershipDevelopment ??
      new LeadershipDevelopment({ createId });
    this.managerEffectiveness =
      dependencies.managerEffectiveness ??
      new ManagerEffectiveness({ createId });
    this.highPotentialIdentification =
      dependencies.highPotentialIdentification ??
      new HighPotentialIdentification({ createId });
    this.burnoutDetection =
      dependencies.burnoutDetection ?? new BurnoutDetection({ createId });
    this.retentionPrediction =
      dependencies.retentionPrediction ??
      new RetentionPrediction({ createId });
    this.engagementAnalysis =
      dependencies.engagementAnalysis ?? new EngagementAnalysis();
    this.stayInterviewInsights =
      dependencies.stayInterviewInsights ??
      new StayInterviewInsights({ createId });
    this.exitAnalysis =
      dependencies.exitAnalysis ?? new ExitAnalysis({ createId });
    this.employeeSentiment =
      dependencies.employeeSentiment ?? new EmployeeSentiment();
    this.cultureHealth = dependencies.cultureHealth ?? new CultureHealth();
    this.learningPlans =
      dependencies.learningPlans ?? new LearningPlans({ createId });
    this.careerPathing =
      dependencies.careerPathing ?? new CareerPathing({ createId });
    this.certificationTracking =
      dependencies.certificationTracking ??
      new CertificationTracking({ createId });
    this.mentorshipMatching =
      dependencies.mentorshipMatching ??
      new MentorshipMatching({ createId });
    this.developmentRecommendations =
      dependencies.developmentRecommendations ??
      new DevelopmentRecommendations({ createId });
    this.trainingRecommendations =
      dependencies.trainingRecommendations ??
      new TrainingRecommendations({ createId });
    this.knowledgeTransfer =
      dependencies.knowledgeTransfer ?? new KnowledgeTransfer({ createId });
    this.salaryBenchmarking =
      dependencies.salaryBenchmarking ?? new SalaryBenchmarking({ createId });
    this.compensationAnalysis =
      dependencies.compensationAnalysis ?? new CompensationAnalysis();
    this.payEquityAnalysis =
      dependencies.payEquityAnalysis ?? new PayEquityAnalysis({ createId });
    this.incentiveModeling =
      dependencies.incentiveModeling ?? new IncentiveModeling({ createId });
    this.bonusModeling =
      dependencies.bonusModeling ?? new BonusModeling({ createId });
    this.benefitsAnalysis =
      dependencies.benefitsAnalysis ?? new BenefitsAnalysis();
    this.workforceForecast =
      dependencies.workforceForecast ?? new WorkforceForecast();
    this.capacityPlanning =
      dependencies.capacityPlanning ?? new CapacityPlanning({ createId });
    this.hiringForecast =
      dependencies.hiringForecast ?? new HiringForecast({ createId });
    this.organizationalScenarioPlanning =
      dependencies.organizationalScenarioPlanning ??
      new OrganizationalScenarioPlanning({ createId });
    this.skillsGapAnalysis =
      dependencies.skillsGapAnalysis ?? new SkillsGapAnalysis();
    this.futureWorkforceModel =
      dependencies.futureWorkforceModel ?? new FutureWorkforceModel();
    this.projection =
      dependencies.projection ?? new HumanCapitalProjection();
    this.briefGenerator =
      dependencies.briefGenerator ??
      new ExecutiveWorkforceBriefGenerator({ createId });
    this.careerPlanComposer =
      dependencies.careerPlanComposer ?? new CareerPlanComposer({ createId });
    this.repositoryStore =
      dependencies.repository ?? new WorkforceRepositoryStore();
    this.queries = dependencies.queries ?? new HumanCapitalQueries();
  }

  get repository(): WorkforceRepositoryContract {
    return this.repositoryStore;
  }

  build(request: HumanCapitalRequest): HumanCapitalResult {
    const now = this.now();
    const scope = request.scope ?? emptyHumanCapitalScope();
    const dna = request.dnaResult?.dna ?? request.dna ?? null;

    const baseline = deriveHumanCapitalBaseline(
      dna,
      request.oiosResult,
      request.analysis,
      request.graphInput,
      request.predictionResult,
      request.workforceHealth,
      request.baselineOverrides
    );

    const periodLabel = request.periodLabel ?? defaultPeriodLabel(now);

    // Employee core
    const employees = this.employeeProfile.build({ request, baseline, now });
    const skills = this.skillsInventory.inventory({ employees, baseline, now });
    const competencies = this.competencyFramework.assess({
      employees,
      baseline,
      now,
    });
    const performance = this.performanceEngine.evaluate({
      employees,
      baseline,
      now,
    });
    const goals = this.goalManagement.track({ employees, performance, now });
    const feedback = this.feedbackEngine.collect({ employees, now });
    const behaviorInsights = this.behaviorInsights.analyze({
      employees,
      feedback,
      performance,
      now,
    });
    const productivityInsights = this.productivityInsights.analyze({
      employees,
      performance,
      goals,
      now,
    });

    // Retention
    const burnout = this.burnoutDetection.detect({ employees, baseline, now });
    const retention = this.retentionPrediction.predict({
      employees,
      burnout,
      baseline,
      now,
    });
    const engagement = this.engagementAnalysis.analyze({
      employees,
      baseline,
      feedback,
    });
    const stayInterviews = this.stayInterviewInsights.derive({
      employees,
      retention,
      now,
    });
    const exitFindings = this.exitAnalysis.analyze({
      baseline,
      retention,
      now,
    });
    const sentiment = this.employeeSentiment.analyze({
      employees,
      feedback,
      engagement,
      baseline,
    });
    const cultureHealth = this.cultureHealth.assess({
      baseline,
      engagement,
      sentiment,
      exitFindings,
    });

    // Coaching / recognition
    const coaching = this.coachingEngine.recommend({
      employees,
      performance,
      burnout,
      retention,
      now,
    });
    const recognition = this.recognitionEngine.recommend({
      employees,
      performance,
      now,
    });

    // Leadership
    const leadershipAssessments = this.leadershipAssessment.assess({
      employees,
      performance,
      baseline,
      now,
    });
    const successionSlots = this.successionPlanning.plan({
      employees,
      assessments: leadershipAssessments,
      baseline,
      now,
    });
    const succession = this.successionPlanning.summarize(
      successionSlots,
      baseline
    );
    const talentMatrix = this.talentMatrix.place({
      employees,
      performance,
      now,
    });
    const orgDesign = this.organizationalDesign.recommend({
      employees,
      baseline,
      now,
    });
    const benchStrength = this.leadershipBenchStrength.measure({
      assessments: leadershipAssessments,
      succession: successionSlots,
      baseline,
    });
    const leadershipDevelopment = this.leadershipDevelopment.plan({
      assessments: leadershipAssessments,
      employees,
      now,
    });
    const managerEffectiveness = this.managerEffectiveness.assess({
      employees,
      engagement,
      retention,
      now,
    });
    const highPotentials = this.highPotentialIdentification.identify({
      employees,
      performance,
      talentMatrix,
      assessments: leadershipAssessments,
      now,
    });

    // Learning
    const learningPlans = this.learningPlans.build({
      employees,
      skills,
      competencies,
      now,
    });
    const careerPaths = this.careerPathing.path({
      employees,
      assessments: leadershipAssessments,
      now,
    });
    const certifications = this.certificationTracking.track({
      employees,
      now,
    });
    const mentorships = this.mentorshipMatching.match({
      employees,
      assessments: leadershipAssessments,
      now,
    });
    const development = this.developmentRecommendations.recommend({
      employees,
      skills,
      performance,
      now,
    });
    const trainingRecommendations = this.trainingRecommendations.recommend({
      employees,
      skills,
      competencies,
      development,
      now,
    });
    const knowledgeTransfer = this.knowledgeTransfer.plan({
      employees,
      skills,
      succession: successionSlots,
      now,
    });
    const careerPlans = this.careerPlanComposer.compose({
      paths: careerPaths,
      learning: learningPlans,
      coaching,
      development,
      now,
    });

    // Planning + recruiting
    const capacity = this.capacityPlanning.plan({
      baseline,
      employees,
      now,
    });
    let candidates = this.candidatePipeline.build({ request, baseline, now });
    candidates = this.resumeIntelligence.summarize(candidates);
    candidates = this.interviewIntelligence.enrich(candidates, baseline);
    candidates = this.candidateScoring.score(candidates, baseline);

    const hiringRecommendations = this.hiringRecommendations.recommend({
      request,
      baseline,
      candidates,
      capacity,
      now,
    });
    const referenceInsights = this.referenceIntelligence.analyze({
      candidates,
      now,
    });
    const talentSourcing = this.talentSourcing.analyze({
      candidates,
      baseline,
      now,
    });
    const employerBranding = this.employerBrandingInsights.analyze({
      baseline,
      candidates,
      now,
    });
    const recruitingAnalytics = this.recruitingAnalytics.analyze({
      candidates,
      baseline,
      recommendations: hiringRecommendations,
    });

    const salaryBenchmarks = this.salaryBenchmarking.benchmark({
      baseline,
      employees,
      now,
    });
    const offers = this.offerOptimization.optimize({
      candidates,
      benchmarks: salaryBenchmarks,
      now,
    });
    const compensation = this.compensationAnalysis.analyze({
      benchmarks: salaryBenchmarks,
      baseline,
    });
    const payEquity = this.payEquityAnalysis.analyze({
      employees,
      benchmarks: salaryBenchmarks,
      now,
    });
    const incentives = this.incentiveModeling.model({
      employees,
      baseline,
      now,
    });
    const bonusModels = this.bonusModeling.model({
      employees,
      baseline,
      incentives,
      now,
    });
    const benefits = this.benefitsAnalysis.analyze({
      baseline,
      employees,
      compensation,
    });

    const forecast = this.workforceForecast.forecast({ baseline, now });
    const hiringForecast = this.hiringForecast.forecast({
      baseline,
      capacity,
      recommendations: hiringRecommendations,
      now,
    });
    const scenarios = this.organizationalScenarioPlanning.scenarios({
      baseline,
      forecast,
      now,
    });
    const skillsGap = this.skillsGapAnalysis.analyze({
      skills,
      competencies,
      employees,
      baseline,
    });
    const futureWorkforce = this.futureWorkforceModel.model({
      baseline,
      forecast,
      skillsGap,
      scenarios,
    });

    const scores = this.workforceIntelligence.composeScores({
      baseline,
      engagement,
      benchStrength,
      retention,
      burnout,
    });
    const hiringDashboard = this.workforceIntelligence.buildHiringDashboard({
      baseline,
      recommendations: hiringRecommendations,
      candidates,
      now,
    });
    const burnoutDashboard = this.burnoutRiskDashboard.build({
      burnout,
      baseline,
      now,
    });
    const capabilityIndex = this.organizationalCapabilityIndex.build({
      baseline,
      skills,
      benchStrength,
      engagement,
      succession,
      learningPlans,
    });
    const dashboard = this.humanCapitalDashboard.compose({
      scores,
      hiringDashboard,
      succession,
      burnoutDashboard,
      capabilityIndex,
      now,
    });

    const confidence = defaultHumanCapitalConfidence(
      baseline,
      Boolean(dna),
      Boolean(request.oiosResult)
    );

    const brief = this.briefGenerator.generate({
      request,
      baseline,
      workforceHealthScore: scores.workforceHealthScore,
      leadershipHealthScore: scores.leadershipHealthScore,
      employeeEngagementScore: scores.employeeEngagementScore,
      talentRiskScore: scores.talentRiskScore,
      hiringDashboard,
      succession,
      retention,
      coaching,
      confidence,
      now,
    });

    const projection = this.projection.project({
      request,
      workforceHealthScore: scores.workforceHealthScore,
      leadershipHealthScore: scores.leadershipHealthScore,
      employeeEngagementScore: scores.employeeEngagementScore,
      talentRiskScore: scores.talentRiskScore,
      hiringDashboard,
      succession,
      forecast,
      coaching,
      careerPlans,
      brief,
      candidates,
      employees,
      retention,
      learningPlans,
      confidence,
      dashboard,
      burnoutDashboard,
      capabilityIndex,
    });

    const recommendations = [
      ...hiringRecommendations.slice(0, 2).map((r) => r.rationale),
      ...coaching.slice(0, 2).map((c) => c.narrative),
      succession.criticalRolesCovered < succession.criticalRolesTotal
        ? "Close succession gaps on uncovered critical roles"
        : "Maintain leadership bench strength rituals",
      scores.talentRiskScore.value >= 45
        ? "Prioritize stay actions for elevated flight-risk talent"
        : "Continue engagement and recognition cadence",
      capabilityIndex.narrative.summary,
    ];

    const historyRecord = {
      id: this.createId("hc-hist"),
      requestId: request.requestId,
      generatedAt: now.toISOString(),
      status: "generated" as const,
      summary: brief.headline,
      scope,
      confidence,
      scores: {
        workforceHealth: scores.workforceHealthScore.value,
        leadershipHealth: scores.leadershipHealthScore.value,
        engagement: scores.employeeEngagementScore.value,
        talentRisk: scores.talentRiskScore.value,
      },
    };

    const result: HumanCapitalResult = {
      requestId: request.requestId,
      version: HUMAN_CAPITAL_INTELLIGENCE_VERSION,
      generatedAt: now.toISOString(),
      periodLabel,
      scope,
      baseline,
      workforceHealthScore: scores.workforceHealthScore,
      leadershipHealthScore: scores.leadershipHealthScore,
      employeeEngagementScore: scores.employeeEngagementScore,
      talentRiskScore: scores.talentRiskScore,
      dashboard,
      candidates,
      hiringRecommendations,
      offers,
      hiringDashboard,
      referenceInsights,
      talentSourcing,
      employerBranding,
      recruitingAnalytics,
      employees,
      skills,
      competencies,
      performance,
      goals,
      feedback,
      coaching,
      recognition,
      behaviorInsights,
      productivityInsights,
      leadershipAssessments,
      succession,
      talentMatrix,
      orgDesign,
      benchStrength,
      leadershipDevelopment,
      managerEffectiveness,
      highPotentials,
      burnout,
      retention,
      engagement,
      stayInterviews,
      exitFindings,
      sentiment,
      cultureHealth,
      learningPlans,
      careerPaths,
      certifications,
      mentorships,
      development,
      careerPlans,
      trainingRecommendations,
      knowledgeTransfer,
      compensation,
      payEquity,
      incentives,
      bonusModels,
      benefits,
      forecast,
      capacity,
      hiringForecast,
      scenarios,
      skillsGap,
      futureWorkforce,
      burnoutDashboard,
      capabilityIndex,
      brief,
      projection,
      confidence,
      historyRecord,
      recommendations,
    };

    this.repositoryStore.save(result);
    this.repositoryStore.saveHistory(historyRecord);
    return result;
  }
}

/** Alias matching Sprint naming. */
export { HumanCapitalEngineImpl as HumanCapitalEngine };
