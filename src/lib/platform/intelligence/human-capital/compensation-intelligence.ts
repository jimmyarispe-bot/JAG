/**
 * Human Capital Intelligence — Compensation Intelligence (Sprint 032).
 */

import type {
  BenefitsAnalysis as BenefitsAnalysisContract,
  BonusModeling as BonusModelingContract,
  CompensationAnalysis as CompensationAnalysisContract,
  IncentiveModeling as IncentiveModelingContract,
  PayEquityAnalysis as PayEquityAnalysisContract,
  SalaryBenchmarking as SalaryBenchmarkingContract,
} from "@/lib/platform/intelligence/human-capital/contracts";
import {
  clamp,
  priorityFromScore,
  statusFromScore,
} from "@/lib/platform/intelligence/human-capital/models";
import type {
  BenefitsAnalysisResult,
  BonusModel,
  CompensationAnalysisResult,
  EmployeeProfileRecord,
  HumanCapitalBaseline,
  IncentiveModel,
  PayEquityFinding,
  SalaryBenchmark,
} from "@/lib/platform/intelligence/human-capital/types";

const ROLE_MARKETS: Record<string, number> = {
  Teacher: 62000,
  Coordinator: 68000,
  Manager: 82000,
  Director: 105000,
  Specialist: 72000,
  Analyst: 70000,
};

export class SalaryBenchmarking implements SalaryBenchmarkingContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  benchmark(input: {
    baseline: HumanCapitalBaseline;
    employees: EmployeeProfileRecord[];
    now: Date;
  }): SalaryBenchmark[] {
    const createId =
      this.deps.createId ??
      ((prefix) => `${prefix}-${Math.random().toString(36).slice(2, 7)}`);
    const roles = [...new Set(input.employees.map((e) => e.role))];

    return roles.map((role) => {
      const marketMedian = ROLE_MARKETS[role] ?? 75000;
      const competitiveness = input.baseline.compensationCompetitiveness / 100;
      const internalMedian = Math.round(marketMedian * (0.88 + competitiveness * 0.2));
      const gap = marketMedian - internalMedian;
      const percentile = clamp(35 + competitiveness * 50 - Math.abs(gap) / 800);
      return {
        id: createId("sal"),
        role,
        internalMedian,
        marketMedian,
        percentile,
        gap,
        band: priorityFromScore(100 - Math.abs(gap) / 400),
        narrative: `${role}: internal ${internalMedian} vs market ${marketMedian}.`,
      };
    });
  }
}

export class CompensationAnalysis implements CompensationAnalysisContract {
  analyze(input: {
    benchmarks: SalaryBenchmark[];
    baseline: HumanCapitalBaseline;
  }): CompensationAnalysisResult {
    const overallCompetitiveness = clamp(
      input.benchmarks.length
        ? input.benchmarks.reduce((s, b) => s + b.percentile, 0) /
            input.benchmarks.length
        : input.baseline.compensationCompetitiveness
    );
    const totalCompSpend = input.benchmarks.reduce(
      (s, b) => s + b.internalMedian,
      0
    );
    return {
      overallCompetitiveness,
      status: statusFromScore(overallCompetitiveness),
      benchmarks: input.benchmarks,
      totalCompSpend,
      narrative: `Compensation competitiveness ${Math.round(overallCompetitiveness)}.`,
    };
  }
}

export class PayEquityAnalysis implements PayEquityAnalysisContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  analyze(input: {
    employees: EmployeeProfileRecord[];
    benchmarks: SalaryBenchmark[];
    now: Date;
  }): PayEquityFinding[] {
    const createId =
      this.deps.createId ??
      ((prefix) => `${prefix}-${Math.random().toString(36).slice(2, 7)}`);

    return DEPARTMENTS_SLICE(input.employees).map((cohort, i) => {
      const gapPct = Number((1.5 + i * 1.2).toFixed(1));
      return {
        id: createId("equity"),
        cohort,
        gapPct,
        severity: priorityFromScore(100 - gapPct * 8),
        affectedCount: Math.max(1, Math.round(input.employees.length / 8)),
        actions: [
          "Review cohort ranges",
          "Adjust outliers in next cycle",
          "Document equity rationale",
        ],
        narrative: `${cohort} pay equity gap ~${gapPct}%.`,
      };
    });
  }
}

function DEPARTMENTS_SLICE(employees: EmployeeProfileRecord[]): string[] {
  return [...new Set(employees.map((e) => e.department))].slice(0, 4);
}

export class IncentiveModeling implements IncentiveModelingContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  model(input: {
    employees: EmployeeProfileRecord[];
    baseline: HumanCapitalBaseline;
    now: Date;
  }): IncentiveModel[] {
    const createId =
      this.deps.createId ??
      ((prefix) => `${prefix}-${Math.random().toString(36).slice(2, 7)}`);
    const families = [...new Set(input.employees.map((e) => e.role))].slice(0, 4);

    return families.map((roleFamily) => ({
      id: createId("inc"),
      roleFamily,
      basePct: 85,
      variablePct: 15,
      metrics: ["goal attainment", "engagement contribution", "team outcomes"],
      expectedImpact: "Improve retention and goal completion",
      narrative: `Incentive model for ${roleFamily}: 85/15 base/variable.`,
    }));
  }
}

export class BonusModeling implements BonusModelingContract {
  constructor(
    private readonly deps: { createId?: (prefix: string) => string } = {}
  ) {}

  model(input: {
    employees: EmployeeProfileRecord[];
    baseline: HumanCapitalBaseline;
    incentives: IncentiveModel[];
    now: Date;
  }): BonusModel[] {
    const createId =
      this.deps.createId ??
      ((prefix) => `${prefix}-${Math.random().toString(36).slice(2, 7)}`);
    const families =
      input.incentives.length > 0
        ? input.incentives.map((i) => i.roleFamily)
        : [...new Set(input.employees.map((e) => e.role))].slice(0, 4);

    return families.map((roleFamily, i) => {
      const incentive = input.incentives.find((x) => x.roleFamily === roleFamily);
      const targetBonusPct = incentive?.variablePct ?? 10 + (i % 3) * 2;
      const headcount = Math.max(
        1,
        input.employees.filter((e) => e.role === roleFamily).length
      );
      return {
        id: createId("bonus"),
        roleFamily,
        targetBonusPct,
        maxBonusPct: targetBonusPct + 5,
        metrics: incentive?.metrics ?? ["goal attainment", "team outcomes"],
        eligibility: "Active employees meeting goal threshold",
        expectedCost: Math.round(
          headcount * 75000 * (targetBonusPct / 100) *
            (input.baseline.compensationCompetitiveness / 100)
        ),
        narrative: `Bonus model for ${roleFamily}: target ${targetBonusPct}%.`,
      };
    });
  }
}

export class BenefitsAnalysis implements BenefitsAnalysisContract {
  analyze(input: {
    baseline: HumanCapitalBaseline;
    employees: EmployeeProfileRecord[];
    compensation: CompensationAnalysisResult;
  }): BenefitsAnalysisResult {
    const overallCompetitiveness = clamp(
      input.compensation.overallCompetitiveness * 0.45 +
        input.baseline.compensationCompetitiveness * 0.35 +
        input.baseline.engagementScore * 0.2
    );
    const offerings = [
      {
        key: "health",
        label: "Health coverage",
        score: clamp(overallCompetitiveness + 4),
        gap: overallCompetitiveness < 70 ? "Consider richer dependent coverage" : null,
      },
      {
        key: "retirement",
        label: "Retirement match",
        score: clamp(overallCompetitiveness - 2),
        gap: overallCompetitiveness < 65 ? "Match lagging market" : null,
      },
      {
        key: "wellbeing",
        label: "Wellbeing stipend",
        score: clamp(100 - input.baseline.burnoutRisk * 80),
        gap: input.baseline.burnoutRisk >= 0.45 ? "Expand wellbeing supports" : null,
      },
      {
        key: "leave",
        label: "Leave flexibility",
        score: clamp(input.baseline.engagementScore - 3),
        gap: null,
      },
    ];
    return {
      overallCompetitiveness,
      status: statusFromScore(overallCompetitiveness),
      offerings,
      utilizationScore: clamp(
        input.baseline.engagementScore * 0.6 + overallCompetitiveness * 0.4
      ),
      recommendations: offerings
        .filter((o) => o.gap)
        .map((o) => o.gap!)
        .concat(
          offerings.every((o) => !o.gap)
            ? ["Maintain benefits communication cadence"]
            : []
        ),
      narrative: `Benefits competitiveness ${Math.round(overallCompetitiveness)} for ${input.employees.length} employees.`,
    };
  }
}

/** Alias matching Sprint naming. */
export { CompensationAnalysis as CompensationModeling };
