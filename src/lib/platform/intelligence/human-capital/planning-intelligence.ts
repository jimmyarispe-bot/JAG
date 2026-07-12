/**
 * Human Capital Intelligence — Planning Intelligence (Sprint 032).
 */

import type {
  CapacityPlanning as CapacityPlanningContract,
  FutureWorkforceModel as FutureWorkforceModelContract,
  HiringForecast as HiringForecastContract,
  OrganizationalScenarioPlanning as OrganizationalScenarioPlanningContract,
  SkillsGapAnalysis as SkillsGapAnalysisContract,
  WorkforceForecast as WorkforceForecastContract,
} from "@/lib/platform/intelligence/human-capital/contracts";
import {
  clamp,
  priorityFromScore,
  statusFromScore,
} from "@/lib/platform/intelligence/human-capital/models";
import type {
  CapacityPlanRow,
  CompetencyRecord,
  EmployeeProfileRecord,
  FutureWorkforceModelResult,
  HiringForecastRecord,
  HiringRecommendation,
  HumanCapitalBaseline,
  OrgScenarioPlan,
  SkillInventoryItem,
  SkillsGapAnalysisResult,
  WorkforceForecastPoint,
} from "@/lib/platform/intelligence/human-capital/types";

export class WorkforceForecast implements WorkforceForecastContract {
  forecast(input: {
    baseline: HumanCapitalBaseline;
    now: Date;
  }): WorkforceForecastPoint[] {
    const points: WorkforceForecastPoint[] = [];
    let headcount = input.baseline.headcount;
    for (let i = 0; i < 4; i++) {
      const hires = Math.max(
        1,
        Math.round(input.baseline.hiringVelocity + input.baseline.openRoles * 0.15 - i * 0.2)
      );
      const attrition = Math.max(
        0,
        Math.round(headcount * input.baseline.attritionRate * 0.25)
      );
      const netChange = hires - attrition;
      headcount = Math.max(1, headcount + netChange);
      const d = new Date(input.now);
      d.setMonth(d.getMonth() + i + 1);
      points.push({
        period: d.toLocaleString("en-US", { month: "short", year: "numeric" }),
        headcount,
        hires,
        attrition,
        netChange,
      });
    }
    return points;
  }
}

export class CapacityPlanning implements CapacityPlanningContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  plan(input: {
    baseline: HumanCapitalBaseline;
    employees: EmployeeProfileRecord[];
    now: Date;
  }): CapacityPlanRow[] {
    const createId =
      this.deps.createId ??
      ((prefix) => `${prefix}-${Math.random().toString(36).slice(2, 7)}`);
    const teams = [...new Set(input.employees.map((e) => e.department))];

    return teams.map((team, i) => {
      const supplyFte = input.employees.filter((e) => e.department === team).length;
      const demandFte = Math.max(
        supplyFte,
        Math.round(supplyFte + (i % 3) + input.baseline.openRoles * 0.15)
      );
      const gapFte = Math.max(0, demandFte - supplyFte);
      return {
        id: createId("cap"),
        team,
        demandFte,
        supplyFte,
        gapFte,
        priority: priorityFromScore(100 - gapFte * 18),
        narrative: `${team} capacity gap ${gapFte} FTE.`,
      };
    });
  }
}

export class HiringForecast implements HiringForecastContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  forecast(input: {
    baseline: HumanCapitalBaseline;
    capacity: CapacityPlanRow[];
    recommendations: HiringRecommendation[];
    now: Date;
  }): HiringForecastRecord[] {
    const createId =
      this.deps.createId ??
      ((prefix) => `${prefix}-${Math.random().toString(36).slice(2, 7)}`);
    const quarter = `Q${Math.floor(input.now.getMonth() / 3) + 1} ${input.now.getFullYear()}`;

    if (input.recommendations.length > 0) {
      return input.recommendations.slice(0, 5).map((r) => ({
        id: createId("hf"),
        role: r.role,
        plannedHires: r.openSlots,
        quarter,
        priority: r.priority,
        rationale: r.rationale,
      }));
    }

    return input.capacity
      .filter((c) => c.gapFte > 0)
      .slice(0, 5)
      .map((c) => ({
        id: createId("hf"),
        role: c.team,
        plannedHires: Math.ceil(c.gapFte),
        quarter,
        priority: c.priority,
        rationale: c.narrative,
      }));
  }
}

export class OrganizationalScenarioPlanning
  implements OrganizationalScenarioPlanningContract
{
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  scenarios(input: {
    baseline: HumanCapitalBaseline;
    forecast: WorkforceForecastPoint[];
    now: Date;
  }): OrgScenarioPlan[] {
    const createId =
      this.deps.createId ??
      ((prefix) => `${prefix}-${Math.random().toString(36).slice(2, 7)}`);
    const endHeadcount =
      input.forecast[input.forecast.length - 1]?.headcount ??
      input.baseline.headcount;

    return [
      {
        id: createId("scen"),
        name: "Steady growth",
        description: "Hire to plan and hold attrition steady",
        headcountDelta: endHeadcount - input.baseline.headcount,
        costImpact: (endHeadcount - input.baseline.headcount) * 75000,
        risk: "low",
        outcomes: ["Stable coverage", "Predictable payroll"],
        narrative: "Base-case workforce trajectory.",
      },
      {
        id: createId("scen"),
        name: "Accelerated hiring",
        description: "Close all capacity gaps in two quarters",
        headcountDelta: input.baseline.openRoles + 3,
        costImpact: (input.baseline.openRoles + 3) * 78000,
        risk: "medium",
        outcomes: ["Faster delivery", "Onboarding load"],
        narrative: "Aggressive fill of open roles.",
      },
      {
        id: createId("scen"),
        name: "Efficiency redesign",
        description: "Hold headcount flat; redesign spans and roles",
        headcountDelta: 0,
        costImpact: -input.baseline.headcount * 2000,
        risk: priorityFromScore(clamp(input.baseline.engagementScore)),
        outcomes: ["Lower cost", "Change management risk"],
        narrative: "Org design over headcount expansion.",
      },
    ];
  }
}

export class SkillsGapAnalysis implements SkillsGapAnalysisContract {
  analyze(input: {
    skills: SkillInventoryItem[];
    competencies: CompetencyRecord[];
    employees: EmployeeProfileRecord[];
    baseline: HumanCapitalBaseline;
  }): SkillsGapAnalysisResult {
    const criticalGaps = [...input.skills]
      .filter((s) => s.gap >= 15 || s.demand === "critical" || s.demand === "high")
      .sort((a, b) => b.gap - a.gap)
      .slice(0, 6);
    const overallGapScore = clamp(
      criticalGaps.length
        ? criticalGaps.reduce((s, g) => s + g.gap, 0) / criticalGaps.length
        : Math.max(0, 100 - input.baseline.skillsCoverage)
    );
    const roles = [...new Set(input.employees.map((e) => e.role))].slice(0, 5);
    const roleGaps = roles.map((role) => {
      const gaps = criticalGaps.slice(0, 2).map((g) => g.skill);
      const competency = input.competencies.find((c) => c.roles.includes(role));
      if (competency && competency.gap > 0) {
        gaps.push(competency.name);
      }
      return {
        role,
        gaps: [...new Set(gaps)].slice(0, 3),
        severity: priorityFromScore(100 - overallGapScore),
      };
    });
    return {
      overallGapScore,
      status: statusFromScore(100 - overallGapScore),
      criticalGaps,
      roleGaps,
      recommendations: [
        criticalGaps[0]
          ? `Prioritize training/hiring for ${criticalGaps[0].skill}`
          : "Maintain skills inventory cadence",
        "Align learning plans to critical competency gaps",
        "Pair succession plans with knowledge transfer",
      ],
      narrative: `Skills gap pressure ${Math.round(overallGapScore)} across ${criticalGaps.length} critical skills.`,
    };
  }
}

export class FutureWorkforceModel implements FutureWorkforceModelContract {
  model(input: {
    baseline: HumanCapitalBaseline;
    forecast: WorkforceForecastPoint[];
    skillsGap: SkillsGapAnalysisResult;
    scenarios: OrgScenarioPlan[];
  }): FutureWorkforceModelResult {
    const projectedHeadcount =
      input.forecast[input.forecast.length - 1]?.headcount ??
      input.baseline.headcount;
    const capabilityShifts = input.skillsGap.criticalGaps.slice(0, 4).map((g) => ({
      capability: g.skill,
      demandDelta: Number((g.gap / 10).toFixed(1)),
      narrative: `Demand for ${g.skill} rises as coverage sits at ${Math.round(g.coveragePct)}%.`,
    }));
    const overall = clamp(
      input.baseline.capabilityScore * 0.5 +
        (100 - input.skillsGap.overallGapScore) * 0.3 +
        input.baseline.leadershipCoverage * 0.2
    );
    return {
      horizonYears: 3,
      projectedHeadcount,
      capabilityShifts:
        capabilityShifts.length > 0
          ? capabilityShifts
          : [
              {
                capability: "digital fluency",
                demandDelta: 1.5,
                narrative: "Baseline digital capability uplift expected.",
              },
            ],
      scenarios: input.scenarios.map((s) => s.name),
      investmentPriorities: [
        ...input.skillsGap.recommendations.slice(0, 2),
        "Build leadership bench for projected growth",
      ],
      status: statusFromScore(overall),
      narrative: `3-year workforce model projects ${projectedHeadcount} headcount with capability shifts in ${capabilityShifts.length || 1} domains.`,
    };
  }
}
