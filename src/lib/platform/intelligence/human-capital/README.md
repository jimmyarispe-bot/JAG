# Human Capital Intelligence (Sprint 032)

Talent lifecycle intelligence for JAG OIOS — identify, recruit, hire, develop, retain, coach, evaluate, and grow exceptional people.

## Quick start

```ts
import {
  createHumanCapitalIntelligence,
  createIntelligenceService,
} from "@/lib/platform/intelligence";

const { service } = createHumanCapitalIntelligence({
  wireOrganizationDna: false,
  wireOios: false,
});

const result = service.build({
  requestId: "hc-1",
  scope: { organizationId: "org-1", schoolId: null },
});

// Or via the full intelligence service
const intelligence = createIntelligenceService();
const hc = intelligence.humanCapital.service.build({ requestId: "hc-2" });
```

## Capabilities

| Area | Components |
|------|------------|
| Core | `HumanCapitalService`, `HumanCapitalEngine`, `WorkforceIntelligence`, `WorkforceRepository`, `HumanCapitalDashboard`, WorkforceModels |
| Recruiting | `CandidatePipeline`, `CandidateScoring`, `ResumeIntelligence`, `InterviewIntelligence`, `ReferenceIntelligence`, `HiringRecommendations`, `OfferOptimization`, `TalentSourcing`, `EmployerBrandingInsights`, `RecruitingAnalytics` |
| Employee | `EmployeeProfile`, `SkillsInventory`, `CompetencyFramework`, `PerformanceEngine`, `GoalManagement`, `FeedbackEngine`, `CoachingEngine`, `RecognitionEngine`, `BehaviorInsights`, `ProductivityInsights` |
| Leadership | `LeadershipAssessment`, `LeadershipDevelopment`, `SuccessionPlanning`, `TalentMatrix`, `OrganizationalDesign`, `ManagerEffectiveness`, `HighPotentialIdentification`, `LeadershipBenchStrength` |
| Retention | `BurnoutDetection`, `RetentionPrediction`, `EngagementAnalysis`, `StayInterviewInsights`, `ExitAnalysis`, `EmployeeSentiment`, `CultureHealth` |
| Learning | `LearningPlans`, `CareerPathing`, `CertificationTracking`, `MentorshipMatching`, `TrainingRecommendations`, `KnowledgeTransfer`, `DevelopmentRecommendations` |
| Compensation | `SalaryBenchmarking`, `CompensationAnalysis`, `PayEquityAnalysis`, `BonusModeling`, `BenefitsAnalysis`, `IncentiveModeling` |
| Planning | `WorkforceForecast`, `CapacityPlanning`, `HiringForecast`, `OrganizationalScenarioPlanning`, `SkillsGapAnalysis`, `FutureWorkforceModel` |

## Outputs

- Workforce Health Score
- Leadership Health Score
- Employee Engagement Score
- Talent Risk Score
- Hiring Priority Dashboard
- Burnout Risk Dashboard
- Succession Readiness
- Organizational Capability Index
- Workforce Forecast
- Coaching Recommendations
- Career Development Plans
- Executive Workforce Brief
- Human Capital Dashboard

## Architecture position

```
organization-dna → oios-core → organization-health → financial → founder
  → executive → executive-graph → executive-decision → predictive
  → board-governance → human-capital
```

## DI / platform

| Surface | Value |
|---------|-------|
| DI entry | `createHumanCapitalIntelligence()` |
| Service attach | `createIntelligenceService().humanCapital` |
| Platform module id | `human-capital` |
| Context key | `humanCapital` |
| OIOS domain | `human-capital` (active) |

## Docs

- `docs/architecture/SPRINT032_HUMAN_CAPITAL_INTELLIGENCE.md`
- `docs/architecture/HUMAN_CAPITAL_INTELLIGENCE.md`
- `docs/architecture/HUMAN_CAPITAL_INTELLIGENCE_VERIFICATION.md`
