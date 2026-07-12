/**
 * Human Capital Intelligence — WorkforceIntelligence + brief + career plans (Sprint 032).
 */

import type {
  BurnoutRiskDashboard as BurnoutRiskDashboardContract,
  CareerPlanComposer as CareerPlanComposerContract,
  ExecutiveWorkforceBriefGenerator as ExecutiveWorkforceBriefGeneratorContract,
  HumanCapitalDashboard as HumanCapitalDashboardContract,
  OrganizationalCapabilityIndex as OrganizationalCapabilityIndexContract,
  WorkforceIntelligence as WorkforceIntelligenceContract,
} from "@/lib/platform/intelligence/human-capital/contracts";
import {
  buildConfidence,
  clamp,
  priorityFromRisk,
  priorityFromScore,
  scoreNarrative,
  statusFromScore,
} from "@/lib/platform/intelligence/human-capital/models";
import type {
  BurnoutRiskDashboardResult,
  BurnoutRiskLevel,
  BurnoutSignal,
  CandidateRecord,
  CareerDevelopmentPlan,
  CareerPathRecord,
  CoachingRecommendation,
  DevelopmentRecommendation,
  EngagementAnalysisResult,
  ExecutiveWorkforceBrief,
  HiringPriorityDashboard,
  HiringRecommendation,
  HumanCapitalBaseline,
  HumanCapitalConfidenceScore,
  HumanCapitalDashboardResult,
  HumanCapitalRequest,
  HumanCapitalScore,
  LeadershipBenchStrength,
  LearningPlanRecord,
  OrganizationalCapabilityIndexResult,
  RetentionPredictionRecord,
  SkillInventoryItem,
  SuccessionReadinessSummary,
} from "@/lib/platform/intelligence/human-capital/types";

export class WorkforceIntelligence implements WorkforceIntelligenceContract {
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
  } {
    const avgFlight =
      input.retention.length > 0
        ? input.retention.reduce((s, r) => s + r.flightRisk, 0) /
          input.retention.length
        : input.baseline.retentionRisk;
    const avgBurnout =
      input.burnout.length > 0
        ? input.burnout.reduce((s, b) => s + b.score, 0) / input.burnout.length
        : input.baseline.burnoutRisk;

    const workforceValue = clamp(
      input.engagement.overallScore * 0.35 +
        input.baseline.performanceScore * 0.25 +
        input.baseline.skillsCoverage * 0.2 +
        (100 - avgFlight * 100) * 0.2
    );
    const leadershipValue = clamp(input.benchStrength.overallScore);
    const engagementValue = clamp(input.engagement.overallScore);
    const talentRiskValue = clamp(avgFlight * 55 + avgBurnout * 45);

    return {
      workforceHealthScore: {
        key: "workforce_health",
        label: "Workforce Health Score",
        value: workforceValue,
        status: statusFromScore(workforceValue),
        band: priorityFromScore(workforceValue),
        narrative: scoreNarrative("Workforce health", workforceValue, statusFromScore(workforceValue)),
      },
      leadershipHealthScore: {
        key: "leadership_health",
        label: "Leadership Health Score",
        value: leadershipValue,
        status: statusFromScore(leadershipValue),
        band: priorityFromScore(leadershipValue),
        narrative: scoreNarrative("Leadership health", leadershipValue, statusFromScore(leadershipValue)),
      },
      employeeEngagementScore: {
        key: "employee_engagement",
        label: "Employee Engagement Score",
        value: engagementValue,
        status: statusFromScore(engagementValue),
        band: priorityFromScore(engagementValue),
        narrative: scoreNarrative("Employee engagement", engagementValue, statusFromScore(engagementValue)),
      },
      talentRiskScore: {
        key: "talent_risk",
        label: "Talent Risk Score",
        value: talentRiskValue,
        status: statusFromScore(100 - talentRiskValue),
        band: priorityFromRisk(talentRiskValue / 100),
        narrative: `Talent risk is ${priorityFromRisk(talentRiskValue / 100)} at ${Math.round(talentRiskValue)}.`,
      },
    };
  }

  buildHiringDashboard(input: {
    baseline: HumanCapitalBaseline;
    recommendations: HiringRecommendation[];
    candidates: CandidateRecord[];
    now: Date;
  }): HiringPriorityDashboard {
    const pipelineHealth = clamp(
      input.candidates.length * 8 +
        input.baseline.offerAcceptanceRate * 40 +
        (100 - input.baseline.timeToFillDays)
    );
    const criticalRoles = input.recommendations.filter(
      (r) => r.priority === "critical" || r.priority === "high"
    ).length;
    return {
      generatedAt: input.now.toISOString(),
      openRoles: input.baseline.openRoles,
      criticalRoles,
      averageTimeToFillDays: input.baseline.timeToFillDays,
      recommendations: input.recommendations,
      pipelineHealth,
      status: statusFromScore(pipelineHealth),
      narrative: `Hiring pipeline ${statusFromScore(pipelineHealth)} with ${input.baseline.openRoles} open roles.`,
    };
  }
}

export class ExecutiveWorkforceBriefGenerator
  implements ExecutiveWorkforceBriefGeneratorContract
{
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

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
  }): ExecutiveWorkforceBrief {
    const createId =
      this.deps.createId ??
      ((prefix) => `${prefix}-${Math.random().toString(36).slice(2, 7)}`);
    const atRisk = input.retention.filter((r) => r.flightRisk >= 0.5).length;

    return {
      id: createId("brief"),
      title: "Executive Workforce Brief",
      generatedAt: input.now.toISOString(),
      periodLabel:
        input.request.periodLabel ??
        input.now.toLocaleString("en-US", { month: "long", year: "numeric" }),
      headline: `Workforce ${input.workforceHealthScore.status}; talent risk ${input.talentRiskScore.band}`,
      workforceSummary: input.workforceHealthScore.narrative,
      talentRiskSummary: `${atRisk} elevated flight-risk employees; overall talent risk ${Math.round(input.talentRiskScore.value)}.`,
      leadershipSummary: `${input.leadershipHealthScore.narrative} Succession ${Math.round(input.succession.overallScore)}.`,
      hiringSummary: input.hiringDashboard.narrative,
      retentionSummary: `Engagement ${Math.round(input.employeeEngagementScore.value)}; ${input.coaching.length} coaching priorities.`,
      decisionsNeeded: [
        input.hiringDashboard.criticalRoles > 0
          ? "Approve critical role hiring plan"
          : "Confirm hiring capacity for next quarter",
        input.succession.criticalRolesCovered < input.succession.criticalRolesTotal
          ? "Close succession gaps on uncovered critical roles"
          : "Review ready-now leadership slate",
        atRisk > 0 ? "Authorize stay actions for high flight-risk talent" : "Maintain retention rituals",
      ],
      watchItems: [
        `Time-to-fill ${input.baseline.timeToFillDays} days`,
        `Attrition ${(input.baseline.attritionRate * 100).toFixed(1)}%`,
        `Burnout baseline ${(input.baseline.burnoutRisk * 100).toFixed(0)}%`,
      ],
      confidence: input.confidence,
    };
  }
}

export class CareerPlanComposer implements CareerPlanComposerContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  compose(input: {
    paths: CareerPathRecord[];
    learning: LearningPlanRecord[];
    coaching: CoachingRecommendation[];
    development: DevelopmentRecommendation[];
    now: Date;
  }): CareerDevelopmentPlan[] {
    const createId =
      this.deps.createId ??
      ((prefix) => `${prefix}-${Math.random().toString(36).slice(2, 7)}`);

    return input.paths.map((path) => ({
      id: createId("cdp"),
      employeeId: path.employeeId,
      path,
      learning: input.learning.filter((l) => l.employeeId === path.employeeId),
      coaching: input.coaching.filter((c) => c.employeeId === path.employeeId),
      development: input.development.filter((d) => d.employeeId === path.employeeId),
      narrative: `Career development plan for ${path.currentRole} → ${path.targetRole}.`,
    }));
  }
}

export function defaultHumanCapitalConfidence(
  baseline: HumanCapitalBaseline,
  hasDna: boolean,
  hasOios: boolean
): HumanCapitalConfidenceScore {
  return buildConfidence([
    {
      key: "baseline",
      label: "Workforce baseline coverage",
      contribution: 0.55,
    },
    {
      key: "dna",
      label: "Organizational DNA signal",
      contribution: hasDna ? 0.85 : 0.35,
    },
    {
      key: "oios",
      label: "OIOS operating system signal",
      contribution: hasOios ? 0.85 : 0.35,
    },
    {
      key: "engagement",
      label: "Engagement coverage",
      contribution: clamp(baseline.engagementScore / 100, 0, 1),
    },
  ]);
}

export class BurnoutRiskDashboard implements BurnoutRiskDashboardContract {
  build(input: {
    burnout: BurnoutSignal[];
    baseline: HumanCapitalBaseline;
    now: Date;
  }): BurnoutRiskDashboardResult {
    const levels: BurnoutRiskLevel[] = [
      "none",
      "low",
      "moderate",
      "high",
      "severe",
    ];
    const countsByLevel = Object.fromEntries(
      levels.map((level) => [
        level,
        input.burnout.filter((b) => b.level === level).length,
      ])
    ) as Record<BurnoutRiskLevel, number>;
    const averageScore =
      input.burnout.length > 0
        ? input.burnout.reduce((s, b) => s + b.score, 0) / input.burnout.length
        : input.baseline.burnoutRisk;
    const atRisk = input.burnout.filter(
      (b) =>
        b.level === "moderate" ||
        b.level === "high" ||
        b.level === "severe"
    );
    const interventionCounts = new Map<string, number>();
    for (const signal of atRisk) {
      for (const intervention of signal.interventions) {
        interventionCounts.set(
          intervention,
          (interventionCounts.get(intervention) ?? 0) + 1
        );
      }
    }
    const topInterventions = [...interventionCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([text]) => text);
    if (topInterventions.length === 0) {
      topInterventions.push(
        "Protect focus time",
        "Manager workload check-ins",
        "Rebalance priority portfolios"
      );
    }
    const healthProxy = clamp(100 - averageScore * 100);
    return {
      generatedAt: input.now.toISOString(),
      countsByLevel,
      averageScore: Number(averageScore.toFixed(3)),
      topInterventions,
      atRiskEmployeeIds: atRisk.map((b) => b.employeeId),
      status: statusFromScore(healthProxy),
      narrative: `Burnout dashboard: ${atRisk.length} elevated cases; average risk ${(averageScore * 100).toFixed(0)}%.`,
    };
  }
}

export class OrganizationalCapabilityIndex
  implements OrganizationalCapabilityIndexContract
{
  build(input: {
    baseline: HumanCapitalBaseline;
    skills: SkillInventoryItem[];
    benchStrength: LeadershipBenchStrength;
    engagement: EngagementAnalysisResult;
    succession: SuccessionReadinessSummary;
    learningPlans: LearningPlanRecord[];
  }): OrganizationalCapabilityIndexResult {
    const skills = clamp(
      input.skills.length
        ? input.skills.reduce((s, i) => s + i.coveragePct, 0) /
            input.skills.length
        : input.baseline.skillsCoverage
    );
    const leadership = clamp(input.benchStrength.overallScore);
    const learning = clamp(
      input.baseline.learningParticipation * 0.6 +
        Math.min(100, input.learningPlans.length * 8) * 0.4
    );
    const engagement = clamp(input.engagement.overallScore);
    const succession = clamp(input.succession.overallScore);
    const overallScore = clamp(
      skills * 0.22 +
        leadership * 0.22 +
        learning * 0.18 +
        engagement * 0.2 +
        succession * 0.18
    );
    const status = statusFromScore(overallScore);
    return {
      overallScore,
      status,
      dimensions: { skills, leadership, learning, engagement, succession },
      narrative: {
        organization: `Org capability is ${status} at ${Math.round(overallScore)}; prioritize closing skill and succession gaps.`,
        employees: `Employees benefit most from targeted learning (${Math.round(learning)}) tied to skill coverage ${Math.round(skills)}.`,
        leaders: `Leaders should deepen bench strength (${Math.round(leadership)}) and succession readiness (${Math.round(succession)}).`,
        mission: `Mission delivery improves when engagement (${Math.round(engagement)}) and critical skills move in tandem.`,
        finance: `Capability investment reduces attrition and hiring waste while protecting delivery throughput.`,
        summary: `Organizational Capability Index ${Math.round(overallScore)} (${status}).`,
      },
    };
  }
}

export class HumanCapitalDashboard implements HumanCapitalDashboardContract {
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
  }): HumanCapitalDashboardResult {
    const composite = clamp(
      input.scores.workforceHealthScore.value * 0.3 +
        input.scores.leadershipHealthScore.value * 0.2 +
        input.scores.employeeEngagementScore.value * 0.2 +
        (100 - input.scores.talentRiskScore.value) * 0.15 +
        input.capabilityIndex.overallScore * 0.15
    );
    const status = statusFromScore(composite);
    return {
      generatedAt: input.now.toISOString(),
      workforceHealthScore: input.scores.workforceHealthScore.value,
      leadershipHealthScore: input.scores.leadershipHealthScore.value,
      employeeEngagementScore: input.scores.employeeEngagementScore.value,
      talentRiskScore: input.scores.talentRiskScore.value,
      hiringDashboard: input.hiringDashboard,
      successionReadiness: input.succession,
      burnoutDashboard: input.burnoutDashboard,
      capabilityIndex: input.capabilityIndex,
      status,
      headline: `Human capital ${status}: capability ${Math.round(input.capabilityIndex.overallScore)}, talent risk ${Math.round(input.scores.talentRiskScore.value)}`,
      narrative: `Unified dashboard combines workforce health, hiring (${input.hiringDashboard.status}), succession (${input.succession.status}), burnout (${input.burnoutDashboard.status}), and capability index.`,
    };
  }
}
