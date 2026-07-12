/**
 * Human Capital Intelligence — Employee Intelligence (Sprint 032).
 */

import type {
  BehaviorInsights as BehaviorInsightsContract,
  CoachingEngine as CoachingEngineContract,
  CompetencyFramework as CompetencyFrameworkContract,
  EmployeeProfileEngine as EmployeeProfileContract,
  FeedbackEngine as FeedbackEngineContract,
  GoalManagement as GoalManagementContract,
  PerformanceEngine as PerformanceEngineContract,
  ProductivityInsights as ProductivityInsightsContract,
  RecognitionEngine as RecognitionEngineContract,
  SkillsInventory as SkillsInventoryContract,
} from "@/lib/platform/intelligence/human-capital/contracts";
import {
  clamp,
  priorityFromScore,
} from "@/lib/platform/intelligence/human-capital/models";
import type {
  BehaviorInsight,
  BurnoutSignal,
  CoachingRecommendation,
  CompetencyRecord,
  EmployeeProfileRecord,
  FeedbackRecord,
  GoalRecord,
  HumanCapitalBaseline,
  HumanCapitalRequest,
  PerformanceRecord,
  PerformanceRating,
  ProductivityInsight,
  RecognitionRecord,
  RetentionPredictionRecord,
  SkillInventoryItem,
} from "@/lib/platform/intelligence/human-capital/types";

const DEPARTMENTS = [
  "Academic",
  "Operations",
  "Enrollment",
  "Finance",
  "People",
  "Leadership",
];

function ratingFromScore(score: number): PerformanceRating {
  if (score >= 90) return "exceptional";
  if (score >= 80) return "exceeds";
  if (score >= 65) return "meets";
  if (score >= 50) return "developing";
  return "underperforming";
}

export class EmployeeProfileEngine implements EmployeeProfileContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  build(input: {
    request: HumanCapitalRequest;
    baseline: HumanCapitalBaseline;
    now: Date;
  }): EmployeeProfileRecord[] {
    if (input.request.employees?.length) {
      return input.request.employees.map((e) => ({ ...e }));
    }

    const createId =
      this.deps.createId ??
      ((prefix) => `${prefix}-${Math.random().toString(36).slice(2, 7)}`);
    const count = Math.min(24, Math.max(8, Math.round(input.baseline.headcount / 2)));

    return Array.from({ length: count }, (_, i) => {
      const performanceScore = clamp(
        input.baseline.performanceScore - 12 + ((i * 7) % 28)
      );
      const engagementScore = clamp(
        input.baseline.engagementScore - 10 + ((i * 5) % 24)
      );
      const potentialScore = clamp(50 + ((i * 11) % 45));
      const atRisk =
        engagementScore < 55 || performanceScore < 55 || i % 9 === 0;
      return {
        id: createId("emp"),
        name: `Employee ${i + 1}`,
        role: [
          "Teacher",
          "Coordinator",
          "Manager",
          "Director",
          "Specialist",
          "Analyst",
        ][i % 6]!,
        department: DEPARTMENTS[i % DEPARTMENTS.length]!,
        status: atRisk ? "at_risk" : i % 11 === 0 ? "onboarding" : "active",
        tenureMonths: 6 + ((i * 13) % 84),
        performanceRating: ratingFromScore(performanceScore),
        engagementScore,
        skills: ["instruction", "operations", "leadership", "data"].slice(
          0,
          1 + (i % 4)
        ),
        competencies: ["execution", "collaboration", "judgment"].slice(
          0,
          1 + (i % 3)
        ),
        managerId: i > 2 ? `emp-mgr-${(i % 4) + 1}` : null,
        potentialScore,
        riskFlags: atRisk
          ? ["engagement", i % 2 === 0 ? "workload" : "career_growth"]
          : [],
      };
    });
  }
}

export class SkillsInventory implements SkillsInventoryContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  inventory(input: {
    employees: EmployeeProfileRecord[];
    baseline: HumanCapitalBaseline;
    now: Date;
  }): SkillInventoryItem[] {
    const createId =
      this.deps.createId ??
      ((prefix) => `${prefix}-${Math.random().toString(36).slice(2, 7)}`);
    const skillSet = [
      "instructional design",
      "people leadership",
      "data literacy",
      "compliance",
      "enrollment ops",
      "financial acumen",
    ];

    return skillSet.map((skill, i) => {
      const employeesWithSkill = input.employees.filter((e) =>
        e.skills.some((s) => skill.includes(s) || s.includes(skill.split(" ")[0]!))
      ).length;
      const coveragePct = clamp(
        (employeesWithSkill / Math.max(1, input.employees.length)) * 100 +
          input.baseline.skillsCoverage * 0.25
      );
      const gap = clamp(100 - coveragePct);
      return {
        id: createId("skill"),
        skill,
        category: i < 3 ? "core" : "specialized",
        coveragePct,
        demand: priorityFromScore(100 - gap),
        gap,
        employeesWithSkill,
        narrative: `${skill} coverage is ${Math.round(coveragePct)}% with gap ${Math.round(gap)}.`,
      };
    });
  }
}

export class CompetencyFramework implements CompetencyFrameworkContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  assess(input: {
    employees: EmployeeProfileRecord[];
    baseline: HumanCapitalBaseline;
    now: Date;
  }): CompetencyRecord[] {
    const createId =
      this.deps.createId ??
      ((prefix) => `${prefix}-${Math.random().toString(36).slice(2, 7)}`);
    const comps = [
      { name: "People Leadership", domain: "leadership" },
      { name: "Operational Excellence", domain: "operations" },
      { name: "Mission Stewardship", domain: "culture" },
      { name: "Decision Quality", domain: "judgment" },
    ];

    return comps.map((c, i) => {
      const requiredLevel = 4;
      const currentLevel = clamp(
        2 + input.baseline.capabilityScore / 40 - i * 0.15,
        1,
        5
      );
      return {
        id: createId("comp"),
        name: c.name,
        domain: c.domain,
        requiredLevel,
        currentLevel: Number(currentLevel.toFixed(1)),
        gap: Number((requiredLevel - currentLevel).toFixed(1)),
        roles: ["Manager", "Director", "Lead"],
        narrative: `${c.name} sits at ${currentLevel.toFixed(1)} vs required ${requiredLevel}.`,
      };
    });
  }
}

export class PerformanceEngine implements PerformanceEngineContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  evaluate(input: {
    employees: EmployeeProfileRecord[];
    baseline: HumanCapitalBaseline;
    now: Date;
  }): PerformanceRecord[] {
    const createId =
      this.deps.createId ??
      ((prefix) => `${prefix}-${Math.random().toString(36).slice(2, 7)}`);

    return input.employees.map((e, i) => {
      const score = clamp(
        e.engagementScore * 0.35 +
          e.potentialScore * 0.25 +
          input.baseline.performanceScore * 0.4 -
          (e.status === "at_risk" ? 12 : 0)
      );
      const goalsTotal = 4;
      const goalsCompleted = Math.max(0, Math.min(goalsTotal, Math.round(score / 25)));
      return {
        id: createId("perf"),
        employeeId: e.id,
        rating: ratingFromScore(score),
        score,
        goalsCompleted,
        goalsTotal,
        strengths: e.competencies.slice(0, 2),
        developmentAreas:
          score < 70 ? ["consistency", "priority management"] : ["stretch scope"],
        narrative: `${e.name} is ${ratingFromScore(score)} (${Math.round(score)}).`,
      };
    });
  }
}

export class GoalManagement implements GoalManagementContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  track(input: {
    employees: EmployeeProfileRecord[];
    performance: PerformanceRecord[];
    now: Date;
  }): GoalRecord[] {
    const createId =
      this.deps.createId ??
      ((prefix) => `${prefix}-${Math.random().toString(36).slice(2, 7)}`);

    return input.employees.slice(0, 12).flatMap((e, i) => {
      const perf = input.performance.find((p) => p.employeeId === e.id);
      const progressPct = clamp((perf?.goalsCompleted ?? 1) * 25 + (i % 20));
      return [
        {
          id: createId("goal"),
          employeeId: e.id,
          title: `Advance ${e.role} outcomes`,
          progressPct,
          dueAt: new Date(input.now.getTime() + 45 * 86400000).toISOString(),
          status:
            progressPct >= 80
              ? ("on_track" as const)
              : progressPct >= 50
                ? ("at_risk" as const)
                : ("blocked" as const),
          priority: priorityFromScore(progressPct),
          narrative: `Goal progress for ${e.name} at ${Math.round(progressPct)}%.`,
        },
      ];
    });
  }
}

export class FeedbackEngine implements FeedbackEngineContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  collect(input: {
    employees: EmployeeProfileRecord[];
    now: Date;
  }): FeedbackRecord[] {
    const createId =
      this.deps.createId ??
      ((prefix) => `${prefix}-${Math.random().toString(36).slice(2, 7)}`);

    return input.employees.slice(0, 10).map((e, i) => ({
      id: createId("fb"),
      employeeId: e.id,
      source: (["manager", "peer", "self", "upward"] as const)[i % 4]!,
      sentiment:
        e.engagementScore >= 70
          ? ("positive" as const)
          : e.engagementScore >= 55
            ? ("neutral" as const)
            : ("constructive" as const),
      themes:
        e.engagementScore >= 70
          ? ["impact", "collaboration"]
          : ["workload", "clarity"],
      summary: `Feedback for ${e.name} highlights ${
        e.engagementScore >= 70 ? "strong contribution" : "support needs"
      }.`,
    }));
  }
}

export class CoachingEngine implements CoachingEngineContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  recommend(input: {
    employees: EmployeeProfileRecord[];
    performance: PerformanceRecord[];
    burnout: BurnoutSignal[];
    retention: RetentionPredictionRecord[];
    now: Date;
  }): CoachingRecommendation[] {
    const createId =
      this.deps.createId ??
      ((prefix) => `${prefix}-${Math.random().toString(36).slice(2, 7)}`);

    const priorityIds = new Set([
      ...input.burnout.filter((b) => b.score >= 0.45).map((b) => b.employeeId),
      ...input.retention.filter((r) => r.flightRisk >= 0.45).map((r) => r.employeeId),
      ...input.performance
        .filter((p) => p.score < 65)
        .map((p) => p.employeeId),
    ]);

    return input.employees
      .filter((e) => priorityIds.has(e.id) || e.status === "at_risk")
      .slice(0, 8)
      .map((e) => {
        const perf = input.performance.find((p) => p.employeeId === e.id);
        return {
          id: createId("coach"),
          employeeId: e.id,
          focus:
            e.riskFlags[0] === "workload"
              ? "Sustainable performance"
              : perf && perf.score < 65
                ? "Capability uplift"
                : "Career engagement",
          priority: priorityFromScore(100 - e.engagementScore),
          actions: [
            "Schedule biweekly coaching",
            "Clarify 90-day success metrics",
            "Pair with peer mentor",
          ],
          expectedOutcome: "Improved engagement and reduced flight risk within 90 days",
          narrative: `Coach ${e.name} on ${e.riskFlags[0] ?? "growth"} priorities.`,
        };
      });
  }
}

export class RecognitionEngine implements RecognitionEngineContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  recommend(input: {
    employees: EmployeeProfileRecord[];
    performance: PerformanceRecord[];
    now: Date;
  }): RecognitionRecord[] {
    const createId =
      this.deps.createId ??
      ((prefix) => `${prefix}-${Math.random().toString(36).slice(2, 7)}`);

    return input.performance
      .filter((p) => p.score >= 80)
      .slice(0, 6)
      .map((p) => {
        const emp = input.employees.find((e) => e.id === p.employeeId);
        return {
          id: createId("recog"),
          employeeId: p.employeeId,
          reason: `${emp?.name ?? "Team member"} ${p.rating} performance`,
          type: p.score >= 90 ? ("leadership" as const) : ("manager" as const),
          impact: "Reinforce high performance culture and retention",
        };
      });
  }
}

export class BehaviorInsights implements BehaviorInsightsContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  analyze(input: {
    employees: EmployeeProfileRecord[];
    feedback: FeedbackRecord[];
    performance: PerformanceRecord[];
    now: Date;
  }): BehaviorInsight[] {
    const createId =
      this.deps.createId ??
      ((prefix) => `${prefix}-${Math.random().toString(36).slice(2, 7)}`);

    return input.employees.slice(0, 10).map((e) => {
      const fb = input.feedback.filter((f) => f.employeeId === e.id);
      const perf = input.performance.find((p) => p.employeeId === e.id);
      const collaborationScore = clamp(
        e.engagementScore * 0.55 +
          (fb.filter((f) => f.sentiment === "positive").length > 0 ? 18 : 8) +
          (perf?.score ?? 60) * 0.2
      );
      const reliabilityScore = clamp(
        (perf?.score ?? e.engagementScore) * 0.7 +
          (e.status === "active" ? 15 : 5)
      );
      const flags = [
        ...e.riskFlags,
        ...(collaborationScore < 60 ? ["collaboration_drag"] : []),
        ...(reliabilityScore < 60 ? ["consistency_risk"] : []),
      ];
      return {
        id: createId("beh"),
        employeeId: e.id,
        patterns:
          collaborationScore >= 75
            ? ["proactive peer support", "steady contribution"]
            : ["needs clearer norms", "variable follow-through"],
        collaborationScore,
        reliabilityScore,
        flags,
        narrative: `Behavior profile for ${e.name}: collaboration ${Math.round(collaborationScore)}.`,
      };
    });
  }
}

export class ProductivityInsights implements ProductivityInsightsContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  analyze(input: {
    employees: EmployeeProfileRecord[];
    performance: PerformanceRecord[];
    goals: GoalRecord[];
    now: Date;
  }): ProductivityInsight[] {
    const createId =
      this.deps.createId ??
      ((prefix) => `${prefix}-${Math.random().toString(36).slice(2, 7)}`);

    return input.employees.slice(0, 10).map((e) => {
      const perf = input.performance.find((p) => p.employeeId === e.id);
      const goals = input.goals.filter((g) => g.employeeId === e.id);
      const goalPct =
        goals.length > 0
          ? goals.reduce((s, g) => s + g.progressPct, 0) / goals.length
          : 55;
      const productivityScore = clamp(
        (perf?.score ?? e.engagementScore) * 0.65 + goalPct * 0.35
      );
      const outputTrend: ProductivityInsight["outputTrend"] =
        productivityScore >= 78
          ? "up"
          : productivityScore >= 60
            ? "stable"
            : "down";
      return {
        id: createId("prod"),
        employeeId: e.id,
        productivityScore,
        outputTrend,
        blockers:
          outputTrend === "down"
            ? ["unclear priorities", "context switching"]
            : goals.some((g) => g.status === "at_risk")
              ? ["at-risk goals"]
              : [],
        enablers:
          productivityScore >= 70
            ? ["clear goals", "manager support"]
            : ["peer collaboration"],
        narrative: `Productivity for ${e.name} is ${outputTrend} at ${Math.round(productivityScore)}.`,
      };
    });
  }
}
