# Changelog — Human Capital Intelligence

## 0.1.0 — Sprint 032 (2026-07-12)

### Added

- Human Capital Intelligence domain package under `src/lib/platform/intelligence/human-capital/`
- Core: `HumanCapitalService`, `HumanCapitalEngine`, `WorkforceIntelligence`, `WorkforceRepository`, `HumanCapitalDashboard`, WorkforceModels
- Recruiting Intelligence: CandidatePipeline, CandidateScoring, ResumeIntelligence, InterviewIntelligence, ReferenceIntelligence, HiringRecommendations, OfferOptimization, TalentSourcing, EmployerBrandingInsights, RecruitingAnalytics
- Employee Intelligence: EmployeeProfile, SkillsInventory, CompetencyFramework, PerformanceEngine, GoalManagement, FeedbackEngine, CoachingEngine, RecognitionEngine, BehaviorInsights, ProductivityInsights
- Leadership Intelligence: LeadershipAssessment, LeadershipDevelopment, SuccessionPlanning, TalentMatrix, OrganizationalDesign, ManagerEffectiveness, HighPotentialIdentification, LeadershipBenchStrength
- Retention Intelligence: BurnoutDetection, RetentionPrediction, EngagementAnalysis, StayInterviewInsights, ExitAnalysis, EmployeeSentiment, CultureHealth
- Learning Intelligence: LearningPlans, CareerPathing, CertificationTracking, MentorshipMatching, TrainingRecommendations, KnowledgeTransfer, DevelopmentRecommendations
- Compensation Intelligence: SalaryBenchmarking, CompensationAnalysis, PayEquityAnalysis, BonusModeling, BenefitsAnalysis, IncentiveModeling
- Planning Intelligence: WorkforceForecast, CapacityPlanning, HiringForecast, OrganizationalScenarioPlanning, SkillsGapAnalysis, FutureWorkforceModel
- Outputs: workforce/leadership/engagement/talent-risk scores, hiring dashboard, burnout dashboard, succession readiness, capability index, forecast, coaching, career plans, executive workforce brief, human capital dashboard
- DI factory: `createHumanCapitalIntelligence()`
- Platform adapter module id: `human-capital` (depends on `board-governance`, context key `humanCapital`)
- OIOS domain registry activation for `human-capital`
- Integration with Organizational DNA, OIOS Core, Organization Health, Executive Graph, Executive Decision, Predictive Intelligence, Board Governance, Continuous Improvement Loop
