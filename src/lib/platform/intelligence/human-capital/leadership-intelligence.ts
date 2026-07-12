/**
 * Human Capital Intelligence — Leadership Intelligence (Sprint 032).
 */

import type {
  HighPotentialIdentification as HighPotentialIdentificationContract,
  LeadershipAssessment as LeadershipAssessmentContract,
  LeadershipBenchStrengthEngine as LeadershipBenchStrengthContract,
  LeadershipDevelopment as LeadershipDevelopmentContract,
  ManagerEffectiveness as ManagerEffectivenessContract,
  OrganizationalDesign as OrganizationalDesignContract,
  SuccessionPlanning as SuccessionPlanningContract,
  TalentMatrix as TalentMatrixContract,
} from "@/lib/platform/intelligence/human-capital/contracts";
import {
  clamp,
  priorityFromRisk,
  priorityFromScore,
  statusFromScore,
  talentBox,
} from "@/lib/platform/intelligence/human-capital/models";
import type {
  EmployeeProfileRecord,
  EngagementAnalysisResult,
  HighPotentialRecord,
  HumanCapitalBaseline,
  LeadershipAssessmentRecord,
  LeadershipBenchStrength,
  LeadershipDevelopmentRecord,
  LeadershipReadinessLevel,
  ManagerEffectivenessRecord,
  OrgDesignRecommendation,
  PerformanceRecord,
  RetentionPredictionRecord,
  SuccessionPlanSlot,
  SuccessionReadinessSummary,
  TalentMatrixPlacement,
} from "@/lib/platform/intelligence/human-capital/types";

function readinessFromScore(score: number): LeadershipReadinessLevel {
  if (score >= 85) return "ready_now";
  if (score >= 70) return "ready_1_2_years";
  if (score >= 55) return "ready_3_plus_years";
  return "not_ready";
}

export class LeadershipAssessment implements LeadershipAssessmentContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  assess(input: {
    employees: EmployeeProfileRecord[];
    performance: PerformanceRecord[];
    baseline: HumanCapitalBaseline;
    now: Date;
  }): LeadershipAssessmentRecord[] {
    const createId =
      this.deps.createId ??
      ((prefix) => `${prefix}-${Math.random().toString(36).slice(2, 7)}`);

    return input.employees
      .filter(
        (e) =>
          /manager|director|lead|coordinator/i.test(e.role) ||
          e.potentialScore >= 75
      )
      .slice(0, 10)
      .map((e) => {
        const perf = input.performance.find((p) => p.employeeId === e.id);
        const score = clamp(
          e.potentialScore * 0.5 +
            (perf?.score ?? input.baseline.performanceScore) * 0.35 +
            input.baseline.leadershipCoverage * 0.15
        );
        return {
          id: createId("lead"),
          employeeId: e.id,
          role: e.role,
          readiness: readinessFromScore(score),
          score,
          strengths: e.competencies.slice(0, 2),
          gaps: score < 75 ? ["enterprise judgment", "people systems"] : [],
          narrative: `${e.name} leadership readiness: ${readinessFromScore(score)}.`,
        };
      });
  }
}

export class SuccessionPlanning implements SuccessionPlanningContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  plan(input: {
    employees: EmployeeProfileRecord[];
    assessments: LeadershipAssessmentRecord[];
    baseline: HumanCapitalBaseline;
    now: Date;
  }): SuccessionPlanSlot[] {
    const createId =
      this.deps.createId ??
      ((prefix) => `${prefix}-${Math.random().toString(36).slice(2, 7)}`);

    const criticalRoles = [
      "Head of School",
      "Ops Director",
      "Academic Director",
      "Finance Lead",
      "People Lead",
    ];

    return criticalRoles.map((role, i) => {
      const successors = input.assessments
        .slice(i, i + 3)
        .map((a) => ({
          employeeId: a.employeeId,
          readiness: a.readiness,
          score: a.score,
        }));
      const top = successors[0];
      const readiness = top?.readiness ?? "external_hire";
      const riskScore =
        readiness === "ready_now"
          ? 0.2
          : readiness === "ready_1_2_years"
            ? 0.4
            : 0.7;
      return {
        id: createId("succ"),
        criticalRole: role,
        incumbentId: input.employees[i]?.id ?? null,
        readiness,
        successors,
        risk: priorityFromRisk(riskScore),
        narrative: `${role} succession coverage: ${successors.length} candidates.`,
      };
    });
  }

  summarize(
    slots: SuccessionPlanSlot[],
    baseline: HumanCapitalBaseline
  ): SuccessionReadinessSummary {
    const covered = slots.filter(
      (s) =>
        s.readiness === "ready_now" || s.readiness === "ready_1_2_years"
    ).length;
    const overallScore = clamp(
      (covered / Math.max(1, slots.length)) * 70 +
        baseline.successionReadiness * 0.3
    );
    return {
      overallScore,
      status: statusFromScore(overallScore),
      criticalRolesCovered: covered,
      criticalRolesTotal: slots.length,
      slots,
      narrative: `Succession readiness ${Math.round(overallScore)} with ${covered}/${slots.length} critical roles covered.`,
    };
  }
}

export class TalentMatrix implements TalentMatrixContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  place(input: {
    employees: EmployeeProfileRecord[];
    performance: PerformanceRecord[];
    now: Date;
  }): TalentMatrixPlacement[] {
    const createId =
      this.deps.createId ??
      ((prefix) => `${prefix}-${Math.random().toString(36).slice(2, 7)}`);

    return input.employees.slice(0, 16).map((e) => {
      const perf =
        input.performance.find((p) => p.employeeId === e.id)?.score ??
        e.engagementScore;
      const box = talentBox(perf, e.potentialScore);
      return {
        id: createId("tm"),
        employeeId: e.id,
        performance: perf,
        potential: e.potentialScore,
        box,
        actions:
          box === "star"
            ? ["Accelerate stretch role"]
            : box === "risk" || box === "underperformer"
              ? ["Performance plan", "Manager coaching"]
              : ["Development plan"],
        narrative: `${e.name} placed in ${box} box.`,
      };
    });
  }
}

export class OrganizationalDesign implements OrganizationalDesignContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  recommend(input: {
    employees: EmployeeProfileRecord[];
    baseline: HumanCapitalBaseline;
    now: Date;
  }): OrgDesignRecommendation[] {
    const createId =
      this.deps.createId ??
      ((prefix) => `${prefix}-${Math.random().toString(36).slice(2, 7)}`);

    const byDept = new Map<string, number>();
    for (const e of input.employees) {
      byDept.set(e.department, (byDept.get(e.department) ?? 0) + 1);
    }

    return [...byDept.entries()].slice(0, 5).map(([area, count], i) => {
      const currentSpan = Math.max(3, Math.round(count / Math.max(1, count / 5)));
      const recommendedSpan = clamp(5 + (i % 3), 4, 8);
      return {
        id: createId("orgd"),
        area,
        currentSpan,
        recommendedSpan,
        change:
          currentSpan > recommendedSpan
            ? "Reduce span / add lead layer"
            : "Consolidate reporting lines",
        priority: priorityFromScore(100 - Math.abs(currentSpan - recommendedSpan) * 12),
        narrative: `${area}: span ${currentSpan} → ${recommendedSpan}.`,
      };
    });
  }
}

export class LeadershipBenchStrengthEngine
  implements LeadershipBenchStrengthContract
{
  measure(input: {
    assessments: LeadershipAssessmentRecord[];
    succession: SuccessionPlanSlot[];
    baseline: HumanCapitalBaseline;
  }): LeadershipBenchStrength {
    const readyNowCount = input.assessments.filter(
      (a) => a.readiness === "ready_now"
    ).length;
    const readySoonCount = input.assessments.filter(
      (a) => a.readiness === "ready_1_2_years"
    ).length;
    const criticalGaps = input.succession
      .filter(
        (s) =>
          s.readiness === "not_ready" || s.readiness === "external_hire"
      )
      .map((s) => s.criticalRole);
    const overallScore = clamp(
      readyNowCount * 12 +
        readySoonCount * 8 +
        input.baseline.leadershipCoverage * 0.45
    );
    return {
      overallScore,
      readyNowCount,
      readySoonCount,
      criticalGaps,
      status: statusFromScore(overallScore),
      narrative: `Bench strength ${Math.round(overallScore)} with ${readyNowCount} ready-now leaders.`,
    };
  }
}

/** Alias matching Sprint naming. */
export { LeadershipBenchStrengthEngine as LeadershipBenchStrength };

export class LeadershipDevelopment implements LeadershipDevelopmentContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  plan(input: {
    assessments: LeadershipAssessmentRecord[];
    employees: EmployeeProfileRecord[];
    now: Date;
  }): LeadershipDevelopmentRecord[] {
    const createId =
      this.deps.createId ??
      ((prefix) => `${prefix}-${Math.random().toString(36).slice(2, 7)}`);

    return input.assessments.slice(0, 8).map((a) => {
      const emp = input.employees.find((e) => e.id === a.employeeId);
      const timelineMonths =
        a.readiness === "ready_now"
          ? 3
          : a.readiness === "ready_1_2_years"
            ? 12
            : a.readiness === "ready_3_plus_years"
              ? 24
              : 36;
      return {
        id: createId("ldev"),
        employeeId: a.employeeId,
        focus: a.gaps[0] ?? "Executive presence",
        readiness: a.readiness,
        actions: [
          "Assign stretch leadership project",
          "Pair with senior mentor",
          ...(a.gaps.slice(0, 2).map((g) => `Close gap: ${g}`)),
        ],
        timelineMonths,
        priority: priorityFromScore(a.score),
        narrative: `Leadership development for ${emp?.name ?? a.employeeId} over ${timelineMonths} months.`,
      };
    });
  }
}

export class ManagerEffectiveness implements ManagerEffectivenessContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  assess(input: {
    employees: EmployeeProfileRecord[];
    engagement: EngagementAnalysisResult;
    retention: RetentionPredictionRecord[];
    now: Date;
  }): ManagerEffectivenessRecord[] {
    const createId =
      this.deps.createId ??
      ((prefix) => `${prefix}-${Math.random().toString(36).slice(2, 7)}`);
    const managerIds = [
      ...new Set(
        input.employees
          .map((e) => e.managerId)
          .filter((id): id is string => Boolean(id))
      ),
    ];

    const ids =
      managerIds.length > 0
        ? managerIds
        : input.employees.slice(0, 3).map((e) => e.id);

    return ids.slice(0, 6).map((managerId) => {
      const team = input.employees.filter(
        (e) => e.managerId === managerId || e.id === managerId
      );
      const teamEng =
        team.length > 0
          ? team.reduce((s, e) => s + e.engagementScore, 0) / team.length
          : input.engagement.overallScore;
      const flight =
        team.length > 0
          ? input.retention
              .filter((r) => team.some((t) => t.id === r.employeeId))
              .reduce((s, r, _, arr) => s + r.flightRisk / Math.max(1, arr.length), 0)
          : 0.3;
      const effectivenessScore = clamp(
        teamEng * 0.55 +
          (100 - flight * 100) * 0.3 +
          input.engagement.overallScore * 0.15
      );
      return {
        id: createId("mgr"),
        managerId,
        teamSize: Math.max(1, team.length),
        effectivenessScore,
        engagementDelta: Number((teamEng - input.engagement.overallScore).toFixed(1)),
        retentionRisk: Number(flight.toFixed(2)),
        strengths:
          effectivenessScore >= 70
            ? ["team engagement", "clear expectations"]
            : ["individual contributor coaching"],
        developmentAreas:
          effectivenessScore < 70
            ? ["delegation", "feedback cadence"]
            : ["succession depth"],
        narrative: `Manager ${managerId} effectiveness ${Math.round(effectivenessScore)}.`,
      };
    });
  }
}

export class HighPotentialIdentification
  implements HighPotentialIdentificationContract
{
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  identify(input: {
    employees: EmployeeProfileRecord[];
    performance: PerformanceRecord[];
    talentMatrix: TalentMatrixPlacement[];
    assessments: LeadershipAssessmentRecord[];
    now: Date;
  }): HighPotentialRecord[] {
    const createId =
      this.deps.createId ??
      ((prefix) => `${prefix}-${Math.random().toString(36).slice(2, 7)}`);

    return input.employees
      .map((e) => {
        const perf = input.performance.find((p) => p.employeeId === e.id);
        const matrix = input.talentMatrix.find((t) => t.employeeId === e.id);
        const assessment = input.assessments.find((a) => a.employeeId === e.id);
        const potentialScore = clamp(
          e.potentialScore * 0.5 +
            (matrix?.potential ?? e.potentialScore) * 0.3 +
            (assessment?.score ?? 60) * 0.2
        );
        const performanceScore = clamp(perf?.score ?? e.engagementScore);
        return { e, potentialScore, performanceScore, assessment, matrix };
      })
      .filter(
        (row) =>
          row.potentialScore >= 72 ||
          row.matrix?.box === "star" ||
          row.matrix?.box === "high_potential"
      )
      .sort((a, b) => b.potentialScore - a.potentialScore)
      .slice(0, 8)
      .map((row) => ({
        id: createId("hipo"),
        employeeId: row.e.id,
        potentialScore: row.potentialScore,
        performanceScore: row.performanceScore,
        readiness: row.assessment?.readiness ?? readinessFromScore(row.potentialScore),
        indicators: [
          "learning agility",
          "influence without authority",
          ...(row.matrix ? [`matrix:${row.matrix.box}`] : []),
        ],
        recommendedTrack:
          row.potentialScore >= 85 ? "executive track" : "people-leader track",
        narrative: `High-potential signal for ${row.e.name} at ${Math.round(row.potentialScore)}.`,
      }));
  }
}
